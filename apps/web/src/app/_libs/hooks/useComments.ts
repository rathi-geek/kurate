"use client";

import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";
import type { DropComment } from "@kurate/types";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

const supabase = createClient();
const PAGE_SIZE = 30;

export async function fetchComments(groupPostId: string, cursor: string | null): Promise<DropComment[]> {
  let query = supabase
    .from("group_posts_comments")
    .select(
      `
      id,
      group_post_id,
      user_id,
      comment_text,
      parent_comment_id,
      created_at,
      author:profiles!group_posts_comments_user_id_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)
      `,
    )
    .eq("group_post_id", groupPostId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const flat = (data ?? []).map((row) => {
    const rawAuthor = Array.isArray(row.author) ? row.author[0] : row.author;
    return {
      ...row,
      author: {
        id: rawAuthor?.id ?? row.user_id,
        display_name: rawAuthor
          ? [rawAuthor.first_name, rawAuthor.last_name].filter(Boolean).join(" ") || rawAuthor.handle || null
          : null,
        avatar_url: rawAuthor?.avatar ? mediaToUrl(rawAuthor.avatar as { file_path: string; bucket_name: string }) : null,
        handle: rawAuthor?.handle ?? "",
      },
      replies: [] as DropComment["replies"],
    };
  });

  // Build reply tree
  const topLevel: DropComment[] = [];
  const byId = new Map<string, DropComment>();
  for (const c of flat) byId.set(c.id, c as DropComment);
  for (const c of flat) {
    if (c.parent_comment_id && byId.has(c.parent_comment_id)) {
      byId.get(c.parent_comment_id)!.replies.push(c as DropComment["replies"][0]);
    } else {
      topLevel.push(c as DropComment);
    }
  }

  return topLevel;
}

export function useComments(
  groupPostId: string,
  groupId?: string,
  currentUserProfile?: { id: string; display_name: string | null; avatar_url: string | null; handle: string },
) {
  const queryClient = useQueryClient();
  const key = queryKeys.groups.comments(groupPostId);

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchComments(groupPostId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].created_at : undefined,
    staleTime: 1000 * 30,
    enabled: !!groupPostId,
  });

  // currentUserId extracted as a stable primitive so the subscription closure is always fresh.
  const currentUserId = currentUserProfile?.id;

  useEffect(() => {
    if (!groupPostId) return;
    const channel = supabase
      .channel(`comments:${groupPostId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_posts_comments",
          filter: `group_post_id=eq.${groupPostId}` },
        (payload) => {
          const isOwnEvent =
            (payload.eventType === "INSERT" &&
              (payload.new as { user_id?: string })?.user_id === currentUserId) ||
            (payload.eventType === "DELETE" &&
              (payload.old as { user_id?: string })?.user_id === currentUserId);

          // Own events are fully handled by the mutation's onSuccess — skip here to avoid
          // double-invalidation, which causes the count to increment twice and the
          // hasNewMessage indicator to flash briefly.
          if (isOwnEvent) return;

          void queryClient.invalidateQueries({
            queryKey: queryKeys.groups.comments(groupPostId),
          });
          if (groupId) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
            void queryClient.invalidateQueries({ queryKey: ["feed-comment-previews", groupId] });
          }
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupPostId, queryClient, currentUserId]);

  const addMutation = useMutation({
    mutationFn: async ({
      content,
      userId,
      parentId,
    }: {
      content: string;
      userId: string;
      parentId?: string | null;
    }) => {
      const { error } = await supabase.from("group_posts_comments").insert({
        group_post_id: groupPostId,
        user_id: userId,
        comment_text: content,
        ...(parentId ? { parent_comment_id: parentId } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ content, userId, parentId }) => {
      if (!currentUserProfile) return;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      const optimistic: DropComment = {
        id: `optimistic-${Date.now()}`,
        group_post_id: groupPostId,
        user_id: userId,
        comment_text: content,
        parent_comment_id: parentId ?? null,
        created_at: new Date().toISOString(),
        author: {
          id: userId,
          display_name: currentUserProfile.display_name,
          avatar_url: currentUserProfile.avatar_url,
          handle: currentUserProfile.handle,
        },
        replies: [],
      };

      queryClient.setQueryData<InfiniteData<DropComment[]>>(key, (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        // pages[0] = newest page; prepend so after flat().reverse() optimistic is at the bottom
        pages[0] = [optimistic, ...(pages[0] ?? [])];
        return { ...old, pages };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
        queryClient.invalidateQueries({ queryKey: ["feed-comment-previews", groupId] });
      }
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
      currentUserId,
    }: {
      commentId: string;
      content: string;
      currentUserId: string;
    }) => {
      const { data, error } = await supabase
        .from("group_posts_comments")
        .update({ comment_text: content })
        .eq("id", commentId)
        .eq("user_id", currentUserId)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      commentId,
      currentUserId,
    }: {
      commentId: string;
      currentUserId: string;
    }) => {
      const { error } = await supabase
        .from("group_posts_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUserId);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData<InfiniteData<DropComment[]>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page
              .filter((c) => c.id !== commentId)
              .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) })),
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    comments: query.data?.pages.flat().reverse() ?? [],
    isLoading: query.isLoading,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    addComment: (content: string, userId: string, parentId?: string | null) =>
      addMutation.mutate({ content, userId, parentId }),
    editComment: (commentId: string, content: string, currentUserId: string) =>
      editMutation.mutate({ commentId, content, currentUserId }),
    deleteComment: (commentId: string, currentUserId: string) =>
      deleteMutation.mutate({ commentId, currentUserId }),
    isAdding: addMutation.isPending,
  };
}
