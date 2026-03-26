import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    ANALYZE: z.enum(["true", "false"]).default("false"),
    /** When "true" in development, skip auth redirect for protected routes. */
    BYPASS_AUTH: z.enum(["true", "false"]).optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1, "Sentry auth token is required").optional(),
    // Supabase server-only key
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required").optional(),
    // AI provider
    AI_PROVIDER: z.enum(["anthropic", "openai"]).default("anthropic"),
    ANTHROPIC_API_KEY: z.string().min(1, "Anthropic API key is required").optional(),
  },
  client: {
    NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
    NEXT_PUBLIC_APP_TITLE: z.string().min(1, "App title is required").default("Kurate"),
    NEXT_PUBLIC_APP_NAME: z.string().min(1, "App name is required").default("Kurate"),
    NEXT_PUBLIC_APP_URL: z.url("App URL is required").default("http://localhost:3000"),
    NEXT_PUBLIC_APP_DESCRIPTION: z
      .string()
      .min(1, "App description is required")
      .default("Chat-based content discovery and curation"),
    NEXT_PUBLIC_APP_CATEGORY: z.string().min(1, "App category is required").default("app"),
    NEXT_PUBLIC_APP_KEYWORDS: z
      .string()
      .min(1, "App keywords are required")
      .default("kurate,content,curation,discovery"),
    // Analytics - optional for development
    NEXT_PUBLIC_GTM_KEY: z.string().optional(),
    NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().min(1).optional(),
    // Supabase (required for auth)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("Supabase URL is required"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  },
  runtimeEnv: {
    // Private
    NODE_ENV: process.env.NODE_ENV,
    ANALYZE: process.env.ANALYZE,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    BYPASS_AUTH: process.env.BYPASS_AUTH,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    // Public
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_TITLE: process.env.NEXT_PUBLIC_APP_TITLE,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
    NEXT_PUBLIC_APP_CATEGORY: process.env.NEXT_PUBLIC_APP_CATEGORY,
    NEXT_PUBLIC_APP_KEYWORDS: process.env.NEXT_PUBLIC_APP_KEYWORDS,
    NEXT_PUBLIC_GTM_KEY: process.env.NEXT_PUBLIC_GTM_KEY,
    NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});
