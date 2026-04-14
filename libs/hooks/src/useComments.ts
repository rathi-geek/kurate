"use client";

import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { Database, DropComment } from "@kurate/types";

const PAGE_SIZE = 30;

export async function fetchComments(
  supabase: SupabaseClient<Database>,
  groupPostId: string,
  cursor: string | null,
): Promise<DropComment[]> {
  const { data, error } = await supabase.rpc("get_group_post_comments", {
    p_post_id: groupPostId,
    p_cursor: cursor ?? undefined,
    p_limit: PAGE_SIZE,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as DropComment[];
}

export function useComments(
  supabase: SupabaseClient<Database>,
  groupPostId: string,
  groupId?: string,
  currentUserProfile?: { id: string; display_name: string | null; avatar_path: string | null; handle: string },
) {
  const queryClient = useQueryClient();
  const key = queryKeys.groups.comments(groupPostId);

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchComments(supabase, groupPostId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].created_at : undefined,
    staleTime: 1000 * 30,
    refetchOnMount: "always",
    enabled: !!groupPostId,
  });

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
  }, [groupPostId, queryClient, currentUserId, supabase]);

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
        author_id: userId,
        author_display_name: currentUserProfile.display_name,
        author_avatar_path: currentUserProfile.avatar_path,
        author_handle: currentUserProfile.handle,
      };

      queryClient.setQueryData<InfiniteData<DropComment[]>>(key, (old) => {
        if (!old) return old;
        const pages = [...old.pages];
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
        queryClient.invalidateQueries({ queryKey: ["feed-comment-previews", groupId] });
      }
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
      currentUserId: cuid,
    }: {
      commentId: string;
      content: string;
      currentUserId: string;
    }) => {
      const { data, error } = await supabase
        .from("group_posts_comments")
        .update({ comment_text: content })
        .eq("id", commentId)
        .eq("user_id", cuid)
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
      currentUserId: cuid,
    }: {
      commentId: string;
      currentUserId: string;
    }) => {
      const { error } = await supabase
        .from("group_posts_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", cuid);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData<InfiniteData<DropComment[]>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => page.filter((c) => c.id !== commentId)),
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
