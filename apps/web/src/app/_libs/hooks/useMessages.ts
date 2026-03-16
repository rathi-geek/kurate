"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { DMMessage } from "@/app/_libs/types/people";

const supabase = createClient();
const PAGE_SIZE = 30;

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avtar_url: string | null;
  handle: string | null;
};

function mapRow(row: {
  id: string;
  convo_id: string;
  sender_id: string;
  message_text: string | null;
  message_type: string | null;
  message_parent_id: string | null;
  created_at: string;
  sender: unknown;
  item: unknown;
  reactions: unknown;
}): DMMessage {
  const rawSender = Array.isArray(row.sender)
    ? (row.sender[0] as ProfileRow | undefined)
    : (row.sender as ProfileRow | undefined);
  const rawItem = Array.isArray(row.item) ? row.item[0] : row.item;
  const reactions = (row.reactions ?? []) as Array<{
    id: string;
    emoji: string;
    user_id: string;
  }>;

  return {
    id: row.id,
    convo_id: row.convo_id,
    sender_id: row.sender_id,
    message_text: row.message_text,
    message_type: ((row.message_type ?? "text") as "text" | "logged_item"),
    message_parent_id: (row.message_parent_id as string | null) ?? null,
    created_at: row.created_at,
    sender: {
      id: rawSender?.id ?? row.sender_id,
      display_name: rawSender
        ? [rawSender.first_name, rawSender.last_name].filter(Boolean).join(" ") ||
          rawSender.handle ||
          null
        : null,
      avatar_url: rawSender?.avtar_url ?? null,
      handle: rawSender?.handle ?? "",
    },
    item: rawItem
      ? {
          url: (rawItem as { url: string }).url,
          title: (rawItem as { title: string | null }).title ?? null,
          preview_image_url:
            (rawItem as { preview_image_url: string | null }).preview_image_url ?? null,
          description: (rawItem as { description: string | null }).description ?? null,
        }
      : null,
    reactions: reactions.map((r) => ({ emoji: r.emoji, user_id: r.user_id })),
  };
}

async function fetchMessages(convoId: string, before?: string): Promise<DMMessage[]> {
  let query = supabase
    .from("messages")
    .select(
      `
      id,
      convo_id,
      sender_id,
      message_text,
      message_type,
      message_parent_id,
      created_at,
      logged_item_id,
      sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avtar_url, handle),
      item:logged_items!messages_logged_item_id_fkey(url, title, preview_image_url, description),
      reactions:message_reactions(id, emoji, user_id)
    `,
    )
    .eq("convo_id", convoId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Reverse so each page is chronological (oldest → newest)
  return ((data ?? []) as Parameters<typeof mapRow>[0][]).reverse().map(mapRow);
}

export function useMessages(convoId: string | null) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.people.messages(convoId ?? ""),
    queryFn: ({ pageParam }) => fetchMessages(convoId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    // Each page is chronological; page[0] is the oldest in that page → cursor for next older batch
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[0]?.created_at;
    },
    enabled: !!convoId,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  // pages[0] = most recent batch, pages[N] = oldest batch
  // Reverse so display order is oldest (top) → newest (bottom)
  const messages = (query.data?.pages ?? []).slice().reverse().flat();

  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
