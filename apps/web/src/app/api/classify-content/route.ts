import { NextRequest, NextResponse } from "next/server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { env } from "env";

async function classifyWithClaude(
  title: string,
  tags: string[],
  content_type: string,
  interestNames: string[],
): Promise<string[]> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey || interestNames.length === 0) return [];

  const prompt = `You are a content classifier. Map this content to 1-3 categories ONLY from this list:
${interestNames.join(", ")}

Content:
Title: "${title}"
Type: ${content_type}
Tags: ${tags.join(", ")}

Reply with ONLY a JSON array of matching category names from the list above.
Example: ["Business", "Technology"]
If nothing fits, return [].`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });
    const rawText =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    const match = rawText.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch (e) {
    console.error("[classify-content] Claude error:", e);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      logged_item_id?: string;
      title?: string;
      description?: string | null;
      tags?: string[];
      content_type?: string;
    };

    const { logged_item_id, title, tags = [], content_type = "article" } = body;
    if (!logged_item_id || !title) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    // Use service role client — no user auth needed for content classification
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "SERVICE_KEY_MISSING" }, { status: 503 });
    }
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

    // Fetch all interests from DB (source of truth)
    const { data: interestRows } = await supabase
      .from("interests")
      .select("id, name")
      .order("name");

    const interests = (interestRows ?? []) as { id: string; name: string }[];
    console.log("[classify-content] interests from DB:", interests.map((i) => i.name));
    if (interests.length === 0) {
      return NextResponse.json({ classified: [] });
    }

    const interestNames = interests.map((i) => i.name);
    const classifiedNames = await classifyWithClaude(title, tags, content_type, interestNames);

    // Validate: only keep names that exist in the DB
    const nameToId = new Map(interests.map((i) => [i.name, i.id]));
    const validRows = classifiedNames
      .filter((name) => nameToId.has(name))
      .map((name) => ({ logged_item_id, interest_id: nameToId.get(name)! }));

    if (validRows.length > 0) {
      await supabase.from("logged_item_interests").upsert(validRows, { onConflict: "logged_item_id,interest_id" });
    }

    return NextResponse.json({ classified: classifiedNames });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
