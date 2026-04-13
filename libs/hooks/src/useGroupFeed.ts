"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { Database, GroupDrop, GroupProfile } from "@kurate/types";

type ContentType = Database["public"]["Enums"]["content_type_enum"];

const PAGE_SIZE = 20;

export async function fetchGroupFeedPage(
  supabase: SupabaseClient<Database>,
  groupId: string,
  currentUserId: string,
  cursor: string | null,
): Promise<GroupDrop[]> {
  const { data, error } = await supabase.rpc("get_group_feed_page", {
    p_group_id: groupId,
    p_user_id: currentUserId,
    p_cursor: cursor ?? undefined,
    p_limit: PAGE_SIZE,
  });

  if (error) throw new Error(error.message);

  // Fetch reactor profiles for the returned posts (max 3 per reaction type)
  const postIds = (data ?? []).map((r) => r.id);
  const [likeReactors, mustReadReactors] = postIds.length
    ? await Promise.all([
        fetchReactors(supabase, "group_posts_likes", postIds),
        fetchReactors(supabase, "group_posts_must_reads", postIds),
      ])
    : [new Map<string, GroupProfile[]>(), new Map<string, GroupProfile[]>()];

  return (data ?? []).map((row) => ({
    id: row.id,
    convo_id: row.convo_id,
    logged_item_id: row.logged_item_id,
    shared_by: row.shared_by,
    note: row.note,
    content: row.content ?? null,
    shared_at: row.shared_at,
    sharer: {
      id: row.sharer_id ?? row.shared_by,
      display_name: row.sharer_display_name ?? null,
      avatar_path: row.sharer_avatar_path,
      handle: row.sharer_handle ?? null,
    },
    item: row.item_url != null
      ? {
          url: row.item_url ?? "",
          title: row.item_title ?? null,
          preview_image_url: row.item_preview_image ?? null,
          content_type: (row.item_content_type ?? "article") as ContentType,
          raw_metadata: row.item_raw_metadata ?? null,
          description: row.item_description ?? null,
        }
      : null,
    engagement: {
      like: {
        count: Number(row.like_count),
        didReact: row.did_like ?? false,
        reactors: likeReactors.get(row.id) ?? [],
      },
      mustRead: {
        count: Number(row.must_read_count),
        didReact: row.did_must_read ?? false,
        reactors: mustReadReactors.get(row.id) ?? [],
      },
      readBy: { count: 0, didReact: false, reactors: [] },
    },
    commentCount: Number(row.comment_count),
    seenAt: row.seen_at ?? null,
    latestCommentAt: null,
    latestComment: null,
  } satisfies GroupDrop));
}

async function fetchReactors(
  supabase: SupabaseClient<Database>,
  table: "group_posts_likes" | "group_posts_must_reads",
  postIds: string[],
): Promise<Map<string, GroupProfile[]>> {
  const fk = table === "group_posts_likes"
    ? "profiles!group_posts_likes_user_id_fkey"
    : "profiles!group_posts_must_reads_user_id_fkey";

  const { data } = await supabase
    .from(table)
    .select(`group_post_id, user_id, reactor:${fk}(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)`)
    .in("group_post_id", postIds);

  const map = new Map<string, GroupProfile[]>();
  for (const row of data ?? []) {
    const raw = Array.isArray(row.reactor) ? row.reactor[0] : row.reactor;
    if (!raw) continue;
    const avatar = raw.avatar
      ? (Array.isArray(raw.avatar) ? raw.avatar[0] : raw.avatar) as { file_path: string; bucket_name: string } | undefined
      : null;
    const profile: GroupProfile = {
      id: raw.id,
      display_name: [raw.first_name, raw.last_name].filter(Boolean).join(" ") || raw.handle || null,
      avatar_path: avatar ? `${avatar.bucket_name}/${avatar.file_path}` : null,
      handle: raw.handle ?? null,
    };
    const list = map.get(row.group_post_id) ?? [];
    list.push(profile);
    map.set(row.group_post_id, list);
  }
  return map;
}

export async function fetchFeedCommentPreviews(
  supabase: SupabaseClient<Database>,
  postIds: string[],
): Promise<Map<string, { text: string; authorName: string | null; authorAvatarPath: string | null; createdAt: string }>> {
  if (!postIds.length) return new Map();

  const { data, error } = await supabase.rpc("get_feed_comment_previews", {
    p_post_ids: postIds,
  });

  if (error || !data) return new Map();

  const map = new Map<string, { text: string; authorName: string | null; authorAvatarPath: string | null; createdAt: string }>();
  for (const row of data) {
    if (!map.has(row.group_post_id)) {
      map.set(row.group_post_id, {
        text: row.comment_text,
        createdAt: row.created_at,
        authorName: row.author_display_name ?? null,
        authorAvatarPath: row.author_avatar_path,
      });
    }
  }
  return map;
}

export function useGroupFeed(
  supabase: SupabaseClient<Database>,
  groupId: string,
  currentUserId: string,
) {
  const queryClient = useQueryClient();
  const [resubscribeKey, setResubscribeKey] = useState(0);

  // Re-subscribe when tab becomes visible again (Supabase channels can go stale).
  // Web-only; guard for React Native where `document` is undefined.
  useEffect(() => {
    if (typeof document === "undefined") return;
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
      fetchGroupFeedPage(supabase, groupId, currentUserId, pageParam as string | null),
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
    queryFn: () => fetchFeedCommentPreviews(supabase, postIds),
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
        latestComment: preview ? { text: preview.text, authorName: preview.authorName, authorAvatarPath: preview.authorAvatarPath } : null,
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
  }, [groupId, queryClient, resubscribeKey, currentUserId, supabase]);

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
    [groupId, currentUserId, queryClient, supabase],
  );

  const deleteDrop = useCallback(
    async (dropId: string) => {
      await supabase.from("group_posts").delete().eq("id", dropId);
      void query.refetch();
    },
    [query, supabase],
  );

  return {
    drops,
    markPostSeen,
    deleteDrop,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
}
