import { redirect } from "next/navigation";

import { createClient } from "@/app/_libs/supabase/server";
import { DmChatView } from "@/app/_components/people/dm-chat-view";

interface DmPageProps {
  params: Promise<{ convoId: string }>;
}

export default async function DmPage({ params }: DmPageProps) {
  const { convoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify the user is a member of this conversation
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("convo_id")
    .eq("convo_id", convoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/people");

  // Get the other member's profile for the header
  const { data: otherMember } = await supabase
    .from("conversation_members")
    .select(
      "user_id, profile:profiles!conversation_members_user_id_fkey(first_name, last_name, handle)",
    )
    .eq("convo_id", convoId)
    .neq("user_id", user.id)
    .maybeSingle();

  const rawProfile = Array.isArray(otherMember?.profile)
    ? otherMember.profile[0]
    : otherMember?.profile;

  const otherUserName =
    (rawProfile
      ? [
          (rawProfile as { first_name?: string | null }).first_name,
          (rawProfile as { last_name?: string | null }).last_name,
        ]
          .filter(Boolean)
          .join(" ") || (rawProfile as { handle?: string | null }).handle
      : null) ??
    "Unknown";

  return (
    <div className="flex h-full flex-col">
      <DmChatView
        convoId={convoId}
        currentUserId={user.id}
        otherUserName={otherUserName}
      />
    </div>
  );
}
