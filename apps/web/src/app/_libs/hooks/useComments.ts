"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { DropComment } from "@/app/_libs/types/groups";

const supabase = createClient();
const PAGE_SIZE = 5;

async function fetchComments(groupShareId: string, cursor: string | null): Promise<DropComment[]> {
  let query = supabase
    .from("comments")
    .select(
      `
      id,
      group_share_id,
      user_id,
      content,
      created_at,
      author:profiles!comments_user_id_fkey(id, first_name, last_name, avtar_url, handle)
      `,
    )
    .eq("group_share_id", groupShareId)
    .order("created_at", { ascending: true })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.gt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const flat = (data ?? []).map((row) => {
    const rawAuthor = Array.isArray(row.author) ? row.author[0] : row.author;
    // parent_id and updated_at not in DB types yet — read via cast once migration applied
    const rowAny = row as Record<string, unknown>;
    return {
      ...row,
      parent_id: (rowAny.parent_id as string | null) ?? null,
      updated_at: (rowAny.updated_at as string | null) ?? null,
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

  // Build tree: nest replies under parent comments
  // Before migration: all parent_id are null, so all are top-level
  const topLevel: DropComment[] = [];
  const byId = new Map<string, DropComment>();
  for (const c of flat) byId.set(c.id, c as DropComment);
  for (const c of flat) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.replies.push(c as DropComment["replies"][0]);
    } else {
      topLevel.push(c as DropComment);
    }
  }

  return topLevel;
}

export function useComments(groupShareId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.groups.comments(groupShareId);

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchComments(groupShareId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].created_at : undefined,
    staleTime: 1000 * 30,
    enabled: !!groupShareId,
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
      // parent_id requires DB migration: ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE
      const insertData: Record<string, unknown> = {
        group_share_id: groupShareId,
        user_id: userId,
        content,
      };
      // Only include parent_id once DB migration is applied
      if (parentId) {
        insertData.parent_id = parentId;
      }
      const { error } = await supabase.from("comments").insert(insertData as never);
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
