import { createClient } from "@/app/_libs/supabase/client";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

const supabase = createClient();

export interface GroupRow {
  id: string;
  name: string;
  avatarUrl: string | null;
  description: string | null;
  role: string;
  joined_at: string;
}

export async function fetchUserGroups(): Promise<GroupRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("conversation_members")
    .select("role, joined_at, conversations!conversation_members_convo_id_fkey(id, group_name, group_description, is_group, avatar:group_avatar_id(file_path, bucket_name))")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) return [];
  return (data ?? [])
    .map((row) => {
      const convo = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      if (!convo || !convo.is_group || convo.group_name === null) return null;
      const avatar = Array.isArray(convo.avatar) ? convo.avatar[0] : convo.avatar;
      return {
        id: convo.id,
        name: convo.group_name,
        avatarUrl: avatar ? mediaToUrl(avatar as { file_path: string; bucket_name: string }) : null,
        description: convo.group_description ?? null,
        role: row.role as string,
        joined_at: row.joined_at,
      };
    })
    .filter(Boolean) as GroupRow[];
}
