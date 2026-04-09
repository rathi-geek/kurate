import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/app/_libs/supabase/server";
import { classifyThought, type ThoughtBucket } from "@kurate/utils";

// Support both cookie auth (web) and Bearer token auth (mobile)
async function getAuthenticatedClient(req: NextRequest): Promise<{ supabase: SupabaseClient; userId: string } | null> {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (bearerToken) {
    const { createClient: createSupabase } = await import("@supabase/supabase-js");
    const supabase = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${bearerToken}` } } },
    );
    const { data } = await supabase.auth.getUser(bearerToken);
    if (!data.user) return null;
    return { supabase, userId: data.user.id };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { supabase, userId: data.user.id };
}

async function classifyWithGemini(text: string): Promise<ThoughtBucket | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Classify this thought into exactly one bucket.
Buckets:
- tasks: things to do, buy, errands, reminders, deadlines
- notes: personal reflections, ideas, observations, opinions, media to consume, things to learn (default catch-all for anything else)

Thought: "${text}"

Reply with exactly one word: tasks or notes.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() ?? "";
    const valid: ThoughtBucket[] = ["tasks", "notes"];
    return valid.includes(rawText as ThoughtBucket) ? (rawText as ThoughtBucket) : null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThoughtRow = Record<string, any>;

function toThoughtMessage(row: ThoughtRow) {
  return {
    id: row.id as string,
    bucket: row.bucket as ThoughtBucket,
    text: (row.text as string | null) ?? "",
    createdAt: row.created_at as string,
    media_id: (row.media_id as string | null) ?? null,
    content_type: row.content_type as string,
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedClient(req);
    if (!auth) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { supabase } = auth;
    const user = { id: auth.userId };

    const body = (await req.json()) as {
      content_type?: string;
      text?: string;
      media_id?: string;
      bucket?: ThoughtBucket;
    };

    const content_type = body.content_type ?? "text";
    const text = body.text ?? null;
    const media_id = body.media_id ?? null;

    if (!text && !media_id) {
      return NextResponse.json(
        { error: "INVALID_CONTENT", message: "text or media_id required" },
        { status: 400 },
      );
    }

    let bucket: ThoughtBucket;
    let bucket_source: "auto" | "ai" | "user";

    if (body.bucket) {
      bucket = body.bucket;
      bucket_source = "user";
    } else {
      bucket = classifyThought(text ?? "");
      bucket_source = "auto";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("thoughts")
      .insert({ user_id: user.id, content_type, text, media_id, bucket, bucket_source })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "DB_ERROR", message: (error as { message: string }).message }, { status: 500 });
    }

    const row = data as ThoughtRow;

    // Async Gemini reclassification for notes (catch-all) with sufficient text
    if (bucket === "notes" && bucket_source === "auto" && text && text.length > 10) {
      void (async () => {
        const aiBucket = await classifyWithGemini(text);
        if (aiBucket && aiBucket !== "notes") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("thoughts")
            .update({ bucket: aiBucket, bucket_source: "ai" })
            .eq("id", row.id);
        }
      })();
    }

    return NextResponse.json(toThoughtMessage(row), { status: 201 });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedClient(req);
    if (!auth) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { supabase } = auth;
    const user = { id: auth.userId };

    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get("bucket") as ThoughtBucket | null;
    const q = searchParams.get("q");

    // Search mode: ILIKE query, no pagination, up to 200 results
    if (q) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let searchQuery = (supabase as any)
        .from("thoughts")
        .select("*")
        .eq("user_id", user.id)
        .ilike("text", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (bucket) searchQuery = searchQuery.eq("bucket", bucket);

      const { data: sData, error: sError } = (await searchQuery) as { data: ThoughtRow[] | null; error: { message: string } | null };
      if (sError) return NextResponse.json({ error: "DB_ERROR", message: sError.message }, { status: 500 });
      return NextResponse.json({ items: (sData ?? []).map(toThoughtMessage), nextCursor: null });
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const cursor = searchParams.get("cursor");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("thoughts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (bucket) query = query.eq("bucket", bucket);
    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = (await query) as { data: ThoughtRow[] | null; error: { message: string } | null };

    if (error) {
      return NextResponse.json({ error: "DB_ERROR", message: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1].created_at as string) : null;

    return NextResponse.json({ items: items.map(toThoughtMessage), nextCursor });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
