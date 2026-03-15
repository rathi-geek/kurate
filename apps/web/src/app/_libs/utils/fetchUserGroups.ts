import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export interface GroupRow {
  id: string;
  name: string;
}

export async function fetchUserGroups(): Promise<GroupRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("group_members")
    .select("groups!group_members_group_id_fkey(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return [];
  return (data ?? [])
    .map((row) => row.groups)
    .filter(Boolean) as GroupRow[];
}
