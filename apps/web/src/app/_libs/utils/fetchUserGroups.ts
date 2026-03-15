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
    .from("conversation_members")
    .select("conversations!conversation_members_convo_id_fkey(id, group_name)")
    .eq("user_id", user.id);

  if (error) return [];
  return (data ?? [])
    .map((row) => {
      const convo = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      if (!convo) return null;
      return { id: convo.id, name: convo.group_name ?? "" };
    })
    .filter(Boolean) as GroupRow[];
}
