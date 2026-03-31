import { redirect } from "next/navigation";

import { createClient } from "@/app/_libs/supabase/server";

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

  return <GroupPageClient groupId={id} currentUserId={user.id} />;
}
