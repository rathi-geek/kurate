import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/_libs/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Fetch the thought to verify ownership and get media_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: thought, error: thoughtError } = await (supabase as any)
      .from("thoughts")
      .select("media_id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (thoughtError || !thought) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = thought as Record<string, any>;
    if (!t.media_id) {
      return NextResponse.json({ error: "NO_MEDIA" }, { status: 400 });
    }

    // Fetch media_metadata to get file_path
    const { data: media, error: mediaError } = await supabase
      .from("media_metadata")
      .select("file_path")
      .eq("id", t.media_id as string)
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: "MEDIA_NOT_FOUND" }, { status: 404 });
    }

    // Generate 1-hour signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from("thoughts")
      .createSignedUrl(media.file_path, 3600);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "SIGN_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
