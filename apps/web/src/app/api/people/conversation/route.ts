import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/app/_libs/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { targetUserId } = body as { targetUserId: string };
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  }
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });
  }

  // Step 1: Get all convo IDs where current user is a member
  const { data: myMemberships } = await supabase
    .from("conversation_members")
    .select("convo_id")
    .eq("user_id", user.id);

  const myConvoIds = (myMemberships ?? []).map((m) => m.convo_id);

  if (myConvoIds.length > 0) {
    // Step 2: Find convo IDs shared with the target user
    const { data: targetMemberships } = await supabase
      .from("conversation_members")
      .select("convo_id")
      .eq("user_id", targetUserId)
      .in("convo_id", myConvoIds);

    const sharedConvoIds = (targetMemberships ?? []).map((m) => m.convo_id);

    if (sharedConvoIds.length > 0) {
      // Step 3: Filter to only DM conversations (is_group=false)
      const { data: dmConvo } = await supabase
        .from("conversations")
        .select("id")
        .in("id", sharedConvoIds)
        .eq("is_group", false)
        .limit(1)
        .maybeSingle();

      if (dmConvo) {
        return NextResponse.json({ convoId: dmConvo.id });
      }
    }
  }

  // Create a new DM conversation
  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .insert({ is_group: false })
    .select("id")
    .single();

  if (convoError) {
    return NextResponse.json({ error: convoError.message }, { status: 500 });
  }

  const { error: membersError } = await supabase.from("conversation_members").insert([
    { convo_id: convo.id, user_id: user.id, role: "member" },
    { convo_id: convo.id, user_id: targetUserId, role: "member" },
  ]);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  return NextResponse.json({ convoId: convo.id });
}
