"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { DropComment } from "@/app/_libs/types/groups";

const supabase = createClient();

async function fetchComments(groupShareId: string): Promise<DropComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      group_share_id,
      user_id,
      content,
      created_at,
      author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `,
    )
    .eq("group_share_id", groupShareId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  // Build flat list with parent_id/updated_at injected as null (not in DB yet)
  const flat = (data ?? []).map((row) => {
    const rawAuthor = Array.isArray(row.author) ? row.author[0] : row.author;
    return {
      ...row,
      parent_id: null as string | null,
      updated_at: null as string | null,
      author: {
        id: rawAuthor?.id ?? row.user_id,
        display_name: rawAuthor?.display_name ?? null,
        avatar_url: rawAuthor?.avatar_url ?? null,
      },
      replies: [] as DropComment["replies"],
    };
  });

  // All top-level since no parent_id column yet
  return flat;
}

export function useComments(groupShareId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.groups.comments(groupShareId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchComments(groupShareId),
    staleTime: 1000 * 30,
    enabled: !!groupShareId,
  });

  const addMutation = useMutation({
    mutationFn: async ({
      content,
      userId,
    }: {
      content: string;
      userId: string;
      parentId?: string | null;
    }) => {
      // parent_id not in DB schema yet — omit until backend adds it
      const { error } = await supabase.from("comments").insert({
        group_share_id: groupShareId,
        user_id: userId,
        content,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
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
      const updateData: Record<string, unknown> = { content };
      // updated_at not in DB schema yet — omit until backend adds it
      const { data, error } = await supabase
        .from("comments")
        .update(updateData)
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
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUserId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    addComment: (content: string, userId: string, parentId?: string | null) =>
      addMutation.mutate({ content, userId, parentId }),
    editComment: (commentId: string, content: string, currentUserId: string) =>
      editMutation.mutate({ commentId, content, currentUserId }),
    deleteComment: (commentId: string, currentUserId: string) =>
      deleteMutation.mutate({ commentId, currentUserId }),
    isAdding: addMutation.isPending,
  };
}
