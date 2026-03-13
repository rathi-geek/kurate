import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export interface GroupRow {
  id: string;
  name: string;
}

// TODO: Once RLS policy on group_members is fixed (infinite recursion),
// replace this with a user-scoped query:
//   supabase.from("group_members")
//     .select("groups!group_members_group_id_fkey(id, name)")
//     .eq("user_id", user.id)
export async function fetchUserGroups(): Promise<GroupRow[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
