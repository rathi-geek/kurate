"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useInfiniteQuery, useQuery, useQueryClient ,type  InfiniteData } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";
import type { GroupDrop } from "@kurate/types";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

const supabase = createClient();
const PAGE_SIZE = 20;

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar: { file_path: string; bucket_name: string } | null;
  handle: string | null;
};

function toProfile(p: ProfileRow | null) {
  if (!p) return null;
  return {
    id: p.id,
    display_name:
      [p.first_name, p.last_name].filter(Boolean).join(" ") || p.handle || null,
    avatar_url: p.avatar ? mediaToUrl(p.avatar) : null,
    handle: p.handle ?? null,
  };
}

export async function fetchGroupFeedPage(
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
      content,
      shared_at,
      sharer:profiles!group_posts_shared_by_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle),
      item:logged_items!group_posts_logged_item_id_fkey(url, title, preview_image_url, content_type, raw_metadata, description),
      likes:group_posts_likes(id, user_id, liker:profiles!group_posts_likes_user_id_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)),
      must_reads:group_posts_must_reads(id, user_id, reader:profiles!group_posts_must_reads_user_id_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)),
      comment_count:group_posts_comments(count),
      my_seen:group_post_last_seen!left(seen_at)
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
    const rawSeen = Array.isArray(row.my_seen) ? row.my_seen[0] : row.my_seen as { seen_at: string } | null | undefined;

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
      content: (row as { content?: string | null }).content ?? null,
      shared_at: row.shared_at,
      sharer: {
        id: rawSharer?.id ?? row.shared_by,
        display_name: rawSharer
          ? [rawSharer.first_name, rawSharer.last_name].filter(Boolean).join(" ") || rawSharer.handle || null
          : null,
        avatar_url: rawSharer?.avatar ? mediaToUrl(rawSharer.avatar as { file_path: string; bucket_name: string }) : null,
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
      commentCount: (row.comment_count as { count: number }[])[0]?.count ?? 0,
      seenAt: rawSeen?.seen_at ?? null,
      latestCommentAt: null,
      latestComment: null,
    } satisfies GroupDrop;
  });
}

export async function fetchFeedCommentPreviews(
  postIds: string[],
): Promise<Map<string, { text: string; authorName: string | null; authorAvatarUrl: string | null; createdAt: string }>> {
  if (!postIds.length) return new Map();

  const { data, error } = await supabase
    .from("group_posts_comments")
    .select(
      "group_post_id, comment_text, created_at, author:profiles!group_posts_comments_user_id_fkey(first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)",
    )
    .in("group_post_id", postIds)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return new Map();

  const map = new Map<string, { text: string; authorName: string | null; authorAvatarUrl: string | null; createdAt: string }>();
  for (const row of data) {
    if (!map.has(row.group_post_id)) {
      const rawAuthor = Array.isArray(row.author) ? row.author[0] : row.author;
      map.set(row.group_post_id, {
        text: row.comment_text,
        createdAt: row.created_at,
        authorName: rawAuthor
          ? [rawAuthor.first_name, rawAuthor.last_name].filter(Boolean).join(" ") ||
            rawAuthor.handle ||
            null
          : null,
        authorAvatarUrl: rawAuthor?.avatar
          ? mediaToUrl(rawAuthor.avatar as { file_path: string; bucket_name: string })
          : null,
      });
    }
  }
  return map;
}

export function useGroupFeed(groupId: string, currentUserId: string) {
  const queryClient = useQueryClient();
  const [resubscribeKey, setResubscribeKey] = useState(0);

  // Re-subscribe when tab becomes visible again (Supabase channels can go stale)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setResubscribeKey((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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
    refetchOnMount: "always",
    enabled: !!groupId && !!currentUserId,
  });

  const rawDrops = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  const postIds = useMemo(() => rawDrops.map((d) => d.id), [rawDrops]);
  const postIdsRef = useRef(postIds);
  useEffect(() => { postIdsRef.current = postIds; }, [postIds]);

  const previewQuery = useQuery({
    queryKey: ["feed-comment-previews", groupId, postIds],
    queryFn: () => fetchFeedCommentPreviews(postIds),
    enabled: postIds.length > 0,
    staleTime: 1000 * 30,
    refetchOnMount: "always",
  });

  const drops = useMemo(() => {
    if (!previewQuery.data) return rawDrops;
    return rawDrops.map((drop) => {
      const preview = previewQuery.data.get(drop.id);
      return {
        ...drop,
        latestComment: preview ? { text: preview.text, authorName: preview.authorName, authorAvatarUrl: preview.authorAvatarUrl } : null,
        latestCommentAt: preview?.createdAt ?? null,
      };
    });
  }, [rawDrops, previewQuery.data]);

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
      // Likes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_posts_likes" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { group_post_id?: string };
          if (!row?.group_post_id) return;
          if (new Set(postIdsRef.current).has(row.group_post_id))
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
        },
      )
      // Must-reads
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_posts_must_reads" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { group_post_id?: string };
          if (!row?.group_post_id) return;
          if (new Set(postIdsRef.current).has(row.group_post_id))
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
        },
      )
      // Comments (covers thread-closed case — nobody else is watching)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_posts_comments" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { group_post_id?: string; user_id?: string };

          // DELETE from another user: payload.old is empty (Supabase RLS doesn't
          // expose the old row to non-owners). We can't know which post was affected,
          // so refetch the entire feed + previews.
          if (payload.eventType === "DELETE" && !row?.group_post_id) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
            void queryClient.invalidateQueries({ queryKey: ["feed-comment-previews", groupId] });
            return;
          }

          if (!row?.group_post_id) return;
          if (!new Set(postIdsRef.current).has(row.group_post_id)) return;

          // Own comment DELETE: decrement count optimistically and refresh latest preview.
          if (payload.eventType === "DELETE") {
            const postId = row.group_post_id;
            queryClient.setQueryData(
              queryKeys.groups.feed(groupId),
              (old: InfiniteData<GroupDrop[]> | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) =>
                    page.map((drop) =>
                      drop.id === postId
                        ? { ...drop, commentCount: Math.max(0, drop.commentCount - 1) }
                        : drop,
                    ),
                  ),
                };
              },
            );
            void queryClient.invalidateQueries({ queryKey: ["feed-comment-previews", groupId] });
            return;
          }

          // Own comment insert: skip feed refetch to avoid a timing race where
          // the markPostSeen DB upsert hasn't completed yet, producing a false-positive green dot.
          // Use the server-assigned created_at so seenAt is identical to latestCommentAt.
          if (payload.eventType === "INSERT" && row.user_id === currentUserId) {
            const postId = row.group_post_id;
            const serverAt = (payload.new as { created_at: string }).created_at;
            queryClient.setQueryData(
              queryKeys.groups.feed(groupId),
              (old: InfiniteData<GroupDrop[]> | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) =>
                    page.map((drop) =>
                      drop.id === postId
                        ? { ...drop, commentCount: drop.commentCount + 1, seenAt: serverAt, latestCommentAt: serverAt }
                        : drop,
                    ),
                  ),
                };
              },
            );
            void queryClient.invalidateQueries({ queryKey: ["feed-comment-previews", groupId] });
            // Persist serverAt to DB directly — don't rely on the useEffect + stale preview
            void supabase
              .from("group_post_last_seen")
              .upsert(
                { user_id: currentUserId, group_post_id: postId, seen_at: serverAt },
                { onConflict: "user_id,group_post_id" },
              )
              .then(({ error }) => {
                if (error) console.error("[SEEN] realtime own INSERT upsert failed:", error);
              });
            return;
          }

          void queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
          void queryClient.invalidateQueries({ queryKey: ["feed-comment-previews", groupId] });
        },
      )
      .subscribe((_status, err) => {
        if (err) console.error("[useGroupFeed] subscription error:", err);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, queryClient, resubscribeKey, currentUserId]);

  const markPostSeen = useCallback(
    (postId: string, seenAt: string) => {
      // Optimistically update seenAt in the feed cache
      queryClient.setQueryData(
        queryKeys.groups.feed(groupId),
        (old: InfiniteData<GroupDrop[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((drop) =>
                drop.id === postId ? { ...drop, seenAt } : drop,
              ),
            ),
          };
        },
      );
      // Persist to DB
      void supabase
        .from("group_post_last_seen")
        .upsert(
          { user_id: currentUserId, group_post_id: postId, seen_at: seenAt },
          { onConflict: "user_id,group_post_id" },
        )
        .then(({ error }) => {
          if (error) console.error("[SEEN] markPostSeen upsert failed:", error);
        });
    },
    [groupId, currentUserId, queryClient],
  );

  return {
    drops,
    markPostSeen,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
}
