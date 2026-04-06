import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@kurate/query';
import type { ThoughtMessage } from '@kurate/types';
import type { ThoughtBucket } from '@kurate/utils';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

const PAGE_SIZE = 50;

type ThoughtRow = Record<string, unknown>;

function toThoughtMessage(row: ThoughtRow): ThoughtMessage {
  return {
    id: row.id as string,
    bucket: row.bucket as ThoughtBucket,
    text: (row.text as string | null) ?? '',
    createdAt: row.created_at as string,
    media_id: (row.media_id as string | null) ?? null,
    content_type: row.content_type as string,
  };
}

export function useThoughts(bucket: ThoughtBucket | null, searchQuery: string) {
  const userId = useAuthStore(state => state.userId) ?? '';
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
          .from('thoughts')
          .select('*')
          .eq('user_id', userId)
          .ilike('text', `%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(200);
        if (bucket) q = q.eq('bucket', bucket);
        const { data: rows, error } = await q;
        if (error) throw new Error(error.message);
        return { items: (rows ?? []).map(toThoughtMessage), nextCursor: null };
      }

      let q = supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1);
      if (bucket) q = q.eq('bucket', bucket);
      if (pageParam) q = q.lt('created_at', pageParam);

      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);

      const items = rows ?? [];
      const hasMore = items.length > PAGE_SIZE;
      const page = hasMore ? items.slice(0, PAGE_SIZE) : items;
      const nextCursor = hasMore
        ? (page[page.length - 1].created_at as string)
        : null;

      return { items: page.map(toThoughtMessage), nextCursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
    enabled: !!userId,
  });

  const messages = useMemo(
    () => data?.pages.flatMap(p => p.items) ?? [],
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
