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
  RawMetadata,
  VaultFilters,
  VaultItem,
} from "@/app/_libs/types/vault";

const PAGE_SIZE = 20;
const supabase = createClient();

function toVaultItem(row: Record<string, unknown>): VaultItem {
  const li = (Array.isArray(row.logged_item) ? row.logged_item[0] : row.logged_item) as
    | Record<string, unknown>
    | null;
  const sg = (Array.isArray(row.saved_group) ? row.saved_group[0] : row.saved_group) as
    | Record<string, unknown>
    | null;

  return {
    // user_logged_items fields
    id: row.id as string,
    user_id: row.user_id as string,
    logged_item_id: row.logged_item_id as string,
    save_source: ((row.save_source as SaveSource) ?? "external") as SaveSource,
    remarks: (row.remarks as string | null) ?? null,
    is_read: (row.is_read as boolean) ?? false,
    created_at: row.created_at as string,
    author: null,
    saved_from_group: (row.saved_from_group as string | null) ?? null,
    saved_from_group_name: (sg?.group_name as string | null) ?? null,
    shared_by: null,
    // logged_items fields (from join)
    url: (li?.url as string) ?? "",
    title: (li?.title as string) ?? "",
    url_hash: (li?.url_hash as string) ?? "",
    preview_image_url: (li?.preview_image_url as string | null) ?? null,
    content_type: ((li?.content_type as ContentType) ?? "article") as ContentType,
    description: (li?.description as string | null) ?? null,
    tags: Array.isArray(li?.tags) ? (li.tags as string[]) : null,
    raw_metadata: (li?.raw_metadata as RawMetadata | null) ?? null,
    logged_item_created_at: (li?.created_at as string) ?? (row.created_at as string),
  };
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
    .from("user_logged_items")
    .select(
      "id, user_id, logged_item_id, save_source, remarks, is_read, created_at, saved_from_group, saved_group:conversations!saved_from_group(group_name), logged_item:logged_items!user_logged_items_logged_item_id_fkey(url, title, url_hash, preview_image_url, content_type, description, tags, raw_metadata, created_at)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { time, contentType, search, readStatus } = filters;

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

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let items = (data ?? []).map((row) => toVaultItem(row as Record<string, unknown>));

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter((item) => {
      const inRemarks = item.remarks?.toLowerCase().includes(q) ?? false;
      const inTitle = item.title.toLowerCase().includes(q);
      const inUrl = item.url.toLowerCase().includes(q);
      const inDescription = (item.description ?? "").toLowerCase().includes(q);
      return inRemarks || inTitle || inUrl || inDescription;
    });
  }

  if (readStatus === "read") {
    items = items.filter((item) => item.is_read);
  } else if (readStatus === "unread") {
    items = items.filter((item) => !item.is_read);
  }

  // Client-side content type filter (field lives on joined logged_items)
  if (contentType !== "all") {
    return items.filter((item) => item.content_type === contentType);
  }

  return items;
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

  const rawItems = query.data?.pages.flat() ?? [];
  // Unread first, read at end (like WhatsApp); within each group, newest first
  const items = [...rawItems].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // id is user_logged_items.id
      const { error } = await supabase
        .from("user_logged_items")
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
        queryClient.setQueryData(queryKeys.vault.list(filters), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
  });

  const remarksMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks: string }) => {
      // remarks live on user_logged_items
      const { error } = await supabase
        .from("user_logged_items")
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
        queryClient.setQueryData(queryKeys.vault.list(filters), context.previous);
      }
    },
  });

  const toggleReadMutation = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase
        .from("user_logged_items")
        .update({ is_read })
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
