import { redirect } from "next/navigation";

import { createClient } from "@/app/_libs/supabase/server";
import { slugify } from "@/app/_libs/utils/slugify";
import type { GroupRole } from "@/app/_libs/types/groups";

import { InfoPageClient } from "./InfoPageClient";

interface InfoPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GroupInfoPage({ params }: InfoPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: allGroups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  const group = (allGroups ?? []).find((g) => slugify(g.name) === slug);

  if (!group) redirect("/home");

  const userRole: GroupRole =
    group.created_by === user.id ? "owner" : "member";

  return (
    <InfoPageClient
      group={group}
      currentUserId={user.id}
      userRole={userRole}
      groupSlug={slug}
    />
  );
}
