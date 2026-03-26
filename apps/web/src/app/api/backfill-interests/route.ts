import { NextResponse } from "next/server";

import { createClient as createServerClient } from "@supabase/supabase-js";
import { env } from "env";

/**
 * GET /api/backfill-interests
 *
 * One-time backfill: classifies all existing logged_items that have no entry
 * in logged_item_interests yet. Fire from the browser or curl once.
 *
 * Processes in batches of 20 to stay within Gemini rate limits.
 */
export async function GET() {
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SERVICE_KEY_MISSING" }, { status: 503 });
  }

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  // Find logged_items with no classification yet
  const { data: items } = await supabase
    .from("logged_items")
    .select("id, title, tags, content_type")
    .not(
      "id",
      "in",
      `(select logged_item_id from logged_item_interests)`,
    )
    .limit(100);

  if (!items || items.length === 0) {
    return NextResponse.json({ message: "Nothing to backfill" });
  }

  let classified = 0;
  // Process sequentially to avoid overwhelming Gemini
  for (const item of items) {
    try {
      const res = await fetch(`${appUrl}/api/classify-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logged_item_id: item.id,
          title: (item.title as string | null) ?? "",
          tags: (item.tags as string[] | null) ?? [],
          content_type: (item.content_type as string | null) ?? "article",
        }),
      });
      if (res.ok) classified++;
    } catch {
      // continue on error
    }
  }

  return NextResponse.json({ total: items.length, classified });
}
