import { redirect } from "next/navigation";

import { createClient } from "@/app/_libs/supabase/server";
import type { GroupRole } from "@kurate/types";

import { GroupPageClient } from "./GroupPageClient";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: group } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("is_group", true)
    .maybeSingle();

  if (!group) redirect("/home");

  // Fetch the user's actual role from conversation_members
  const { data: memberRow } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("convo_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const userRole: GroupRole = (memberRow?.role as GroupRole) ?? "member";

  return (
    <GroupPageClient
      group={group}
      currentUserId={user.id}
      userRole={userRole}
      groupId={id}
    />
  );
}
