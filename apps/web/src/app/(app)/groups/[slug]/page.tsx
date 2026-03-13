import { redirect } from "next/navigation";

import { createClient } from "@/app/_libs/supabase/server";
import type { GroupRole } from "@/app/_libs/types/groups";
import { slugify } from "@/app/_libs/utils/slugify";

import { GroupPageClient } from "./GroupPageClient";

interface GroupPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // TODO: Once RLS on group_members is fixed, scope this to the user's groups
  // and verify membership before rendering.
  // For now: fetch all groups and match by slugified name for UI testing.
  const { data: allGroups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  const group = (allGroups ?? []).find(
    (g) => slugify(g.name) === slug,
  );

  if (!group) redirect("/home");

  // TODO: Once RLS is fixed, read real role from group_members.
  // Default to "member" for UI testing so all controls are visible.
  const userRole: GroupRole = group.created_by === user.id ? "owner" : "member";

  return (
    <GroupPageClient
      group={group}
      currentUserId={user.id}
      userRole={userRole}
      groupSlug={slug}
    />
  );
}
