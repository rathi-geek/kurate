import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { ThoughtMessage, Database } from "@kurate/types";

const PAGE_SIZE = 50;

type ThoughtRow = Database["public"]["Tables"]["thoughts"]["Row"];

function toMessage(row: ThoughtRow): ThoughtMessage {
  return {
    id: row.id,
    bucket: row.bucket,
    text: row.text ?? "",
    created_at: row.created_at,
    media_id: row.media_id,
    content_type: row.content_type,
  };
}

interface UseThoughtsConfig {
  supabase: SupabaseClient<Database>;
  userId: string | null;
}

export function useThoughts(
  { supabase, userId }: UseThoughtsConfig,
  bucket: string | null,
  searchQuery: string,
) {
  const isSearch = searchQuery.length > 0;

  const queryKey = isSearch
    ? queryKeys.thoughts.search(searchQuery)
    : queryKeys.thoughts.list(bucket);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (isSearch) {
        let q = supabase
          .from("thoughts")
          .select("*")
          .eq("user_id", userId!)
          .ilike("text", `%${searchQuery}%`)
          .order("created_at", { ascending: false })
          .limit(200);
        if (bucket) q = q.eq("bucket", bucket);
        const { data: rows, error } = await q;
        if (error) throw new Error(error.message);
        return {
          items: (rows ?? []).map(toMessage),
          nextCursor: null,
        };
      }

      let q = supabase
        .from("thoughts")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE + 1);
      if (bucket) q = q.eq("bucket", bucket);
      if (pageParam) q = q.lt("created_at", pageParam);

      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);

      const items = rows ?? [];
      const hasMore = items.length > PAGE_SIZE;
      const page = hasMore ? items.slice(0, PAGE_SIZE) : items;
      const nextCursor = hasMore
        ? page[page.length - 1].created_at
        : null;

      return { items: page.map(toMessage), nextCursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!userId,
  });

  const messages = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  return {
    messages,
    isLoading,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  };
}
