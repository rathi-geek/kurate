import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export interface ShareableConversation {
  id: string;
  name: string;
  type: "group" | "dm";
  avatar_url: string | null;
  updated_at: string;
}

export async function fetchShareableConversations(): Promise<ShareableConversation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all conversations for current user with type and recency info
  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select(
      "conversations!conversation_members_convo_id_fkey(id, group_name, is_group, updated_at)",
    )
    .eq("user_id", user.id);

  if (error || !memberships) return [];

  const groupConvos: Array<{ id: string; group_name: string | null; updated_at: string }> = [];
  const dmConvoIds: string[] = [];
  const dmUpdatedAt: Record<string, string> = {};

  for (const row of memberships) {
    const convo = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
    if (!convo) continue;
    if (convo.is_group) {
      groupConvos.push({ id: convo.id, group_name: convo.group_name, updated_at: convo.updated_at });
    } else {
      dmConvoIds.push(convo.id);
      dmUpdatedAt[convo.id] = convo.updated_at;
    }
  }

  // Map groups to unified shape
  const groupItems: ShareableConversation[] = groupConvos.map((g) => ({
    id: g.id,
    name: g.group_name ?? "",
    type: "group",
    avatar_url: null,
    updated_at: g.updated_at,
  }));

  // Fetch other-user profiles for DMs in one query
  let dmItems: ShareableConversation[] = [];
  if (dmConvoIds.length > 0) {
    const { data: otherMembers } = await supabase
      .from("conversation_members")
      .select(
        "convo_id, profile:profiles!conversation_members_user_id_fkey(first_name, last_name, avtar_url, handle)",
      )
      .in("convo_id", dmConvoIds)
      .neq("user_id", user.id);

    dmItems = (otherMembers ?? []).map((m) => {
      const rawProfile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
      const displayName = rawProfile
        ? [rawProfile.first_name, rawProfile.last_name].filter(Boolean).join(" ") ||
          rawProfile.handle ||
          "DM"
        : "DM";
      return {
        id: m.convo_id,
        name: displayName,
        type: "dm" as const,
        avatar_url: rawProfile?.avtar_url ?? null,
        updated_at: dmUpdatedAt[m.convo_id] ?? "",
      };
    });
  }

  return [...groupItems, ...dmItems].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}
