"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { startOfDay, subDays } from "date-fns";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type {
  ContentType,
  SaveSource,
  VaultFilters,
  VaultItem,
} from "@/app/_libs/types/vault";

// saveItem logic lives in useSaveItem.ts — import from there when needed outside vault context

const PAGE_SIZE = 20;

// Module-level singleton — avoids recreating the client on every call
const supabase = createClient();

function toVaultItem(row: Record<string, unknown>): VaultItem {
  return {
    ...row,
    content_type: ((row.content_type as ContentType) ?? "article") as ContentType,
    save_source: ((row.save_source as SaveSource) ?? "logged") as SaveSource,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : null,
    shared_to_groups: Array.isArray(row.shared_to_groups)
      ? (row.shared_to_groups as string[])
      : null,
  } as VaultItem;
}

async function fetchVaultPage(
  filters: VaultFilters,
  cursor: string | null,
): Promise<VaultItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("logged_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { time, contentType, search } = filters;

  if (time !== "all") {
    const now = new Date();
    const from =
      time === "today"
        ? startOfDay(now).toISOString()
        : time === "week"
          ? subDays(now, 7).toISOString()
          : subDays(now, 30).toISOString();
    query = query.gte("created_at", from);
  }

  if (contentType !== "all") {
    query = query.eq("content_type", contentType);
  }

  if (search.trim()) {
    const q = search.trim().replace(/%/g, "\\%");
    query = query.or(
      `title.ilike.%${q}%,source.ilike.%${q}%,author.ilike.%${q}%,remarks.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;

  // Throw so TanStack can track isError, trigger retry (retry: 1 in client.ts), and expose error
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toVaultItem(row as Record<string, unknown>));
}

export function useVault(filters: VaultFilters) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.vault.list(filters),
    queryFn: ({ pageParam }) =>
      fetchVaultPage(filters, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE
        ? lastPage[lastPage.length - 1].created_at
        : undefined,
    staleTime: 1000 * 60,
  });

  const items = query.data?.pages.flat() ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("logged_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vault.all });
      const previous = queryClient.getQueryData(queryKeys.vault.list(filters));
      queryClient.setQueryData(
        queryKeys.vault.list(filters),
        (old: InfiniteData<VaultItem[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.filter((item) => item.id !== id),
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.vault.list(filters),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
  });

  const remarksMutation = useMutation({
    mutationFn: async ({
      id,
      remarks,
    }: { id: string; remarks: string }) => {
      const { error } = await supabase
        .from("logged_items")
        .update({ remarks })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, remarks }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vault.all });
      const previous = queryClient.getQueryData(queryKeys.vault.list(filters));
      queryClient.setQueryData(
        queryKeys.vault.list(filters),
        (old: InfiniteData<VaultItem[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === id ? { ...item, remarks } : item,
              ),
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.vault.list(filters),
          context.previous,
        );
      }
    },
  });

  // TODO: wire toggleRead when is_read column is added to logged_items by backend team
  const toggleReadMutation = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase
        .from("logged_items")
        .update({ is_read } as Record<string, unknown>)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, is_read }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vault.all });
      const previous = queryClient.getQueryData(queryKeys.vault.list(filters));
      queryClient.setQueryData(
        queryKeys.vault.list(filters),
        (old: InfiniteData<VaultItem[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === id ? { ...item, is_read } : item,
              ),
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.vault.list(filters), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
  });

  return {
    items,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    hasMore: query.hasNextPage ?? false,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
    deleteItem: deleteMutation.mutate,
    updateRemarks: (id: string, remarks: string) =>
      remarksMutation.mutate({ id, remarks }),
    toggleRead: (item: VaultItem) =>
      toggleReadMutation.mutate({ id: item.id, is_read: !item.is_read }),
  };
}
