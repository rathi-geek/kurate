import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/_libs/supabase/server";

type ThoughtBucket = "media" | "tasks" | "learning" | "notes" | "misc";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = (await req.json()) as { text?: string; bucket?: ThoughtBucket };
    const updates: Record<string, unknown> = {};
    if (body.text !== undefined) updates.text = body.text;
    if (body.bucket !== undefined) {
      updates.bucket = body.bucket;
      updates.bucket_source = "user";
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "NO_UPDATES" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("thoughts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "DB_ERROR", message: (error as { message: string }).message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as Record<string, any>;
    return NextResponse.json({
      id: row.id,
      bucket: row.bucket as ThoughtBucket,
      text: (row.text as string | null) ?? "",
      createdAt: row.created_at as string,
      media_id: row.media_id as string | null,
      content_type: row.content_type as string,
    });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("thoughts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "DB_ERROR", message: (error as { message: string }).message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
