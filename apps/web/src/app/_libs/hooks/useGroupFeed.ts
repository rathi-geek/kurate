"use client";

import { useEffect } from "react";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { GroupDrop } from "@/app/_libs/types/groups";

const supabase = createClient();
const PAGE_SIZE = 20;

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avtar_url: string | null;
  handle: string | null;
};

function toProfile(p: ProfileRow | null) {
  if (!p) return null;
  return {
    id: p.id,
    display_name:
      [p.first_name, p.last_name].filter(Boolean).join(" ") || p.handle || null,
    avatar_url: p.avtar_url ?? null,
    handle: p.handle ?? null,
  };
}

async function fetchGroupFeedPage(
  groupId: string,
  currentUserId: string,
  cursor: string | null,
): Promise<GroupDrop[]> {
  let query = supabase
    .from("group_posts")
    .select(
      `
      id,
      convo_id,
      logged_item_id,
      shared_by,
      note,
      shared_at,
      sharer:profiles!group_posts_shared_by_fkey(id, first_name, last_name, avtar_url, handle),
      item:logged_items!group_posts_logged_item_id_fkey(url, title, preview_image_url, content_type, raw_metadata, description),
      likes:group_posts_likes(id, user_id, liker:profiles!group_posts_likes_user_id_fkey(id, first_name, last_name, avtar_url, handle)),
      must_reads:group_posts_must_reads(id, user_id, reader:profiles!group_posts_must_reads_user_id_fkey(id, first_name, last_name, avtar_url, handle)),
      comments:group_posts_comments(id, comment_text, created_at, user_id, author:profiles!group_posts_comments_user_id_fkey(id, first_name, last_name, avtar_url, handle))
      `,
    )
    .eq("convo_id", groupId)
    .order("shared_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("shared_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const rawLikes = (row.likes ?? []) as Array<{
      id: string;
      user_id: string;
      liker: ProfileRow | null;
    }>;
    const rawMustReads = (row.must_reads ?? []) as Array<{
      id: string;
      user_id: string;
      reader: ProfileRow | null;
    }>;
    const rawItem = Array.isArray(row.item) ? row.item[0] : row.item;
    const rawSharer = Array.isArray(row.sharer) ? row.sharer[0] : row.sharer;

    const engagement = {
      like: {
        count: rawLikes.length,
        didReact: rawLikes.some((r) => r.user_id === currentUserId),
        reactors: rawLikes.map((r) => toProfile(r.liker)).filter(Boolean) as GroupDrop["engagement"]["like"]["reactors"],
      },
      mustRead: {
        count: rawMustReads.length,
        didReact: rawMustReads.some((r) => r.user_id === currentUserId),
        reactors: rawMustReads.map((r) => toProfile(r.reader)).filter(Boolean) as GroupDrop["engagement"]["mustRead"]["reactors"],
      },
      readBy: {
        count: 0,
        didReact: false,
        reactors: [],
      },
    };

    return {
      id: row.id,
      convo_id: row.convo_id,
      logged_item_id: row.logged_item_id,
      shared_by: row.shared_by,
      note: row.note,
      shared_at: row.shared_at,
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
            preview_image_url: rawItem.preview_image_url ?? null,
            content_type: rawItem.content_type ?? "article",
            raw_metadata: rawItem.raw_metadata ?? null,
            description: rawItem.description ?? null,
          }
        : null,
      engagement,
      commentCount: Array.isArray(row.comments) ? row.comments.length : 0,
      latestComment: (() => {
        const allComments = Array.isArray(row.comments) ? row.comments as Array<{
          id: string; comment_text: string; created_at: string; user_id: string;
          author: ProfileRow | ProfileRow[] | null;
        }> : [];
        if (!allComments.length) return null;
        const latest = [...allComments].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]!;
        const rawAuthor = Array.isArray(latest.author) ? latest.author[0] : latest.author;
        return {
          text: latest.comment_text,
          authorName: rawAuthor
            ? [rawAuthor.first_name, rawAuthor.last_name].filter(Boolean).join(" ") || rawAuthor.handle || null
            : null,
        };
      })(),
    } satisfies GroupDrop;
  });
}

export function useGroupFeed(groupId: string, currentUserId: string) {
  const queryClient = useQueryClient();

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

  // Realtime subscription: invalidate on new group post
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-feed:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_posts" },
        (payload) => {
          const post = payload.new as { convo_id: string };
          if (post.convo_id !== groupId) return;
          void queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
        },
      )
      .subscribe((_status, err) => {
        if (err) console.error("[useGroupFeed] subscription error:", err);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

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
