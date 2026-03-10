#!/usr/bin/env node
/**
 * Generates Supabase TypeScript types from the live schema.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL from .env and extracts the project ID
 * automatically — no hardcoded IDs anywhere in the codebase.
 *
 * Usage: pnpm db:types
 */

const { execSync } = require("child_process");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const envPath = resolve(process.cwd(), ".env");

let envContent;
try {
  envContent = readFileSync(envPath, "utf8");
} catch {
  console.error("❌  .env file not found. Copy .env.example to .env first.");
  process.exit(1);
}

const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
if (!urlMatch) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL not found in .env");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectId) {
  console.error("❌  Could not extract project ID from NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  process.exit(1);
}

const outFile = "src/app/_libs/types/database.types.ts";

console.log(`Generating types for project: ${projectId}`);
console.log(`Output: ${outFile}\n`);

const tokenMatch = envContent.match(/SUPABASE_ACCESS_TOKEN=(.+)/);
const accessToken = tokenMatch?.[1]?.trim();

execSync(
  `npx --yes supabase gen types typescript --project-id ${projectId} --schema public > ${outFile}`,
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...(accessToken ? { SUPABASE_ACCESS_TOKEN: accessToken } : {}),
    },
  },
);

console.log("\n✅  database.types.ts updated successfully.");
