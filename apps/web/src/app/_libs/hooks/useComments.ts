"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { DropComment } from "@/app/_libs/types/groups";

const supabase = createClient();
const PAGE_SIZE = 5;

async function fetchComments(groupPostId: string, cursor: string | null): Promise<DropComment[]> {
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
      author:profiles!group_posts_comments_user_id_fkey(id, first_name, last_name, avtar_url, handle)
      `,
    )
    .eq("group_post_id", groupPostId)
    .order("created_at", { ascending: true })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.gt("created_at", cursor);
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
        avatar_url: rawAuthor?.avtar_url ?? null,
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

export function useComments(groupPostId: string, groupId?: string) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      if (groupId) queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      if (groupId) queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(groupId) });
    },
  });

  return {
    comments: query.data?.pages.flat() ?? [],
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
