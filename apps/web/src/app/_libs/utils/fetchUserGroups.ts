import { createClient } from "@/app/_libs/supabase/client";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

const supabase = createClient();

export interface GroupRow {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export async function fetchUserGroups(): Promise<GroupRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("conversation_members")
    .select("conversations!conversation_members_convo_id_fkey(id, group_name, avatar:group_avatar_id(file_path, bucket_name))")
    .eq("user_id", user.id);

  if (error) return [];
  return (data ?? [])
    .map((row) => {
      const convo = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      if (!convo || convo.group_name === null) return null;
      const avatar = Array.isArray(convo.avatar) ? convo.avatar[0] : convo.avatar;
      return {
        id: convo.id,
        name: convo.group_name,
        avatarUrl: avatar ? mediaToUrl(avatar as { file_path: string; bucket_name: string }) : null,
      };
    })
    .filter(Boolean) as GroupRow[];
}
