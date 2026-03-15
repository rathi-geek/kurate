"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { GroupDrop } from "@/app/_libs/types/groups";

const supabase = createClient();
const PAGE_SIZE = 20;

async function fetchGroupFeedPage(
  groupId: string,
  currentUserId: string,
  cursor: string | null,
): Promise<GroupDrop[]> {
  let query = supabase
    .from("group_shares")
    .select(
      `
      id,
      group_id,
      logged_item_id,
      shared_by,
      note,
      shared_at,
      sharer:profiles!group_shares_shared_by_fkey(id, first_name, last_name, avtar_url, handle),
      item:logged_items!group_shares_logged_item_id_fkey(url, title, preview_image, source, content_type, read_time),
      reactions(id, user_id, type, user:profiles!reactions_user_id_fkey(id, first_name, last_name, avtar_url, handle)),
      comments(id)
      `,
      // After DB migration (group_shares.content + nullable logged_item_id), add "content" to select above
    )
    .eq("group_id", groupId)
    .order("shared_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("shared_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const rawReactions = (row.reactions ?? []) as Array<{
      id: string;
      user_id: string;
      type: string;
      user: { id: string; first_name: string | null; last_name: string | null; avtar_url: string | null; handle: string | null } | null;
    }>;
    const rawItem = Array.isArray(row.item) ? row.item[0] : row.item;
    const rawSharer = Array.isArray(row.sharer) ? row.sharer[0] : row.sharer;

    const getReactors = (type: string) =>
      rawReactions
        .filter((r) => r.type === type && r.user)
        .map((r) => ({
          id: r.user!.id,
          display_name:
            [r.user!.first_name, r.user!.last_name].filter(Boolean).join(" ") ||
            r.user!.handle ||
            null,
          avatar_url: r.user!.avtar_url ?? null,
          handle: r.user!.handle ?? null,
        }));

    const engagement = {
      like: {
        count: rawReactions.filter((r) => r.type === "like").length,
        didReact: rawReactions.some(
          (r) => r.type === "like" && r.user_id === currentUserId,
        ),
        reactors: getReactors("like"),
      },
      mustRead: {
        count: rawReactions.filter((r) => r.type === "must_read").length,
        didReact: rawReactions.some(
          (r) => r.type === "must_read" && r.user_id === currentUserId,
        ),
        reactors: getReactors("must_read"),
      },
      readBy: {
        count: rawReactions.filter((r) => r.type === "read_by").length,
        didReact: rawReactions.some(
          (r) => r.type === "read_by" && r.user_id === currentUserId,
        ),
        reactors: getReactors("read_by"),
      },
    };

    return {
      id: row.id,
      group_id: row.group_id,
      logged_item_id: row.logged_item_id,
      shared_by: row.shared_by,
      note: row.note,
      shared_at: row.shared_at,
      // After DB migration, map content: (row as any).content ?? null
      content: null,
      sharer: {
        id: rawSharer?.id ?? row.shared_by,
        display_name: rawSharer
          ? [rawSharer.first_name, rawSharer.last_name].filter(Boolean).join(" ") || rawSharer.handle || null
          : null,
        avatar_url: rawSharer?.avtar_url ?? null,
        handle: rawSharer?.handle ?? "",
      },
      item: rawItem
        ? {
            url: rawItem.url ?? "",
            title: rawItem.title ?? null,
            preview_image: rawItem.preview_image ?? null,
            source: rawItem.source ?? null,
            content_type: rawItem.content_type ?? "article",
            read_time: rawItem.read_time ?? null,
            description: null,
          }
        : null,
      engagement,
      commentCount: Array.isArray(row.comments) ? row.comments.length : 0,
    } satisfies GroupDrop;
  });
}

export function useGroupFeed(groupId: string, currentUserId: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.groups.feed(groupId),
    queryFn: ({ pageParam }) =>
      fetchGroupFeedPage(groupId, currentUserId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE
        ? lastPage[lastPage.length - 1].shared_at
        : undefined,
    staleTime: 1000 * 30,
    enabled: !!groupId && !!currentUserId,
  });

  return {
    drops: query.data?.pages.flat() ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
}
