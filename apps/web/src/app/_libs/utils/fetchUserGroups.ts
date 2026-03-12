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

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name)")
    .eq("user_id", user.id);

  const list: GroupRow[] = [];
  const seen = new Set<string>();
  for (const row of memberships ?? []) {
    const g = (row as { groups: GroupRow | null }).groups;
    if (g?.id && !seen.has(g.id)) {
      seen.add(g.id);
      list.push({ id: g.id, name: g.name });
    }
  }
  return list;
}
