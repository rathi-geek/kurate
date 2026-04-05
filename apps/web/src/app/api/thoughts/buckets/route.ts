import { NextResponse } from "next/server";

import { createClient } from "@/app/_libs/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_thought_bucket_summaries");

  if (error) {
    return NextResponse.json({ error: "DB_ERROR", message: error.message }, { status: 500 });
  }

  const buckets = (data ?? []).map((row) => ({
    bucket: row.bucket,
    latestText: row.latest_text,
    latestCreatedAt: row.latest_created_at,
    totalCount: Number(row.total_count),
    unreadCount: Number(row.unread_count),
  }));

  return NextResponse.json(buckets);
}
