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

  // Fetch all groups and match by slugified name
  // TODO: Once RLS on group_members is fully fixed, add a join to verify membership
  const { data: allGroups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  const group = (allGroups ?? []).find(
    (g) => slugify(g.name) === slug,
  );

  if (!group) redirect("/home");

  // Fetch the user's actual role from group_members
  const { data: memberRow } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Fall back to owner inference if member row is missing (e.g. RLS issue)
  const userRole: GroupRole =
    (memberRow?.role as GroupRole) ??
    (group.created_by === user.id ? "owner" : "member");

  return (
    <GroupPageClient
      group={group}
      currentUserId={user.id}
      userRole={userRole}
      groupSlug={slug}
    />
  );
}
