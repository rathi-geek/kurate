"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { DMConversation } from "@/app/_libs/types/people";

const supabase = createClient();

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avtar_url: string | null;
  handle: string | null;
};

async function fetchDMConversations(userId: string): Promise<DMConversation[]> {
  // Step 1: Get all convo IDs where user is a member
  const { data: myMemberships } = await supabase
    .from("conversation_members")
    .select("convo_id")
    .eq("user_id", userId);

  const convoIds = (myMemberships ?? []).map((m) => m.convo_id);
  if (!convoIds.length) return [];

  // Step 2: Filter to DM conversations only (is_group=false)
  const { data: dmConvos } = await supabase
    .from("conversations")
    .select("id, updated_at")
    .in("id", convoIds)
    .eq("is_group", false)
    .order("updated_at", { ascending: false })
    .limit(20);

  const dmConvoIds = (dmConvos ?? []).map((c) => c.id);
  if (!dmConvoIds.length) return [];

  // Step 3: Get all members for these conversations (to find the "other" user)
  const { data: allMembers } = await supabase
    .from("conversation_members")
    .select(
      `
      convo_id,
      user_id,
      profile:profiles!conversation_members_user_id_fkey(id, first_name, last_name, avtar_url, handle)
    `,
    )
    .in("convo_id", dmConvoIds);

  // Step 4: Get last message for each conversation (newest first, then group by convo)
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("id, convo_id, message_text, message_type, created_at")
    .in("convo_id", dmConvoIds)
    .order("created_at", { ascending: false })
    .limit(dmConvoIds.length * 5);

  // Build last message map (first occurrence per convo = most recent)
  const lastMessageMap = new Map<string, { text: string; sentAt: string }>();
  for (const msg of recentMessages ?? []) {
    if (!lastMessageMap.has(msg.convo_id)) {
      const text =
        msg.message_type === "logged_item" ? "Shared a link" : (msg.message_text ?? "");
      lastMessageMap.set(msg.convo_id, { text, sentAt: msg.created_at });
    }
  }

  return (dmConvos ?? []).map((convo) => {
    const convoMembers = (allMembers ?? []).filter((m) => m.convo_id === convo.id);
    const otherMember = convoMembers.find((m) => m.user_id !== userId);
    const rawProfile = Array.isArray(otherMember?.profile)
      ? (otherMember.profile[0] as ProfileRow | undefined)
      : (otherMember?.profile as ProfileRow | undefined);

    return {
      id: convo.id,
      otherUser: {
        id: rawProfile?.id ?? otherMember?.user_id ?? "",
        display_name: rawProfile
          ? [rawProfile.first_name, rawProfile.last_name].filter(Boolean).join(" ") ||
            rawProfile.handle ||
            null
          : null,
        avatar_url: rawProfile?.avtar_url ?? null,
        handle: rawProfile?.handle ?? "",
      },
      lastMessage: lastMessageMap.get(convo.id) ?? null,
    };
  });
}

export function useDMConversations(userId: string | null) {
  const query = useQuery({
    queryKey: queryKeys.people.conversations(),
    queryFn: () => fetchDMConversations(userId!),
    enabled: !!userId,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
