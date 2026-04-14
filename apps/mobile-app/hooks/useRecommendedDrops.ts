import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { queryKeys } from '@kurate/query';
import type { Database, GroupDrop, Json } from '@kurate/types';

const PAGE_SIZE = 20;

type RawProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  handle: string | null;
  avatar: { file_path: string; bucket_name: string } | null;
};

type RawItem = {
  url: string | null;
  title: string | null;
  preview_image_url: string | null;
  content_type: string | null;
  raw_metadata: unknown;
  description: string | null;
};

const unwrap = <T>(x: T | T[] | null | undefined): T | null =>
  x == null ? null : Array.isArray(x) ? (x[0] ?? null) : x;

const displayNameOf = (p: RawProfile | null): string | null => {
  if (!p) return null;
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  return full || p.handle || null;
};

const avatarPathOf = (p: RawProfile | null): string | null =>
  p?.avatar ? `${p.avatar.bucket_name}/${p.avatar.file_path}` : null;

function mapRow(row: Record<string, unknown>): GroupDrop {
  const sharer = unwrap(row.sharer as RawProfile | RawProfile[] | null);
  const item = unwrap(row.item as RawItem | RawItem[] | null);

  return {
    id: row.id as string,
    convo_id: row.convo_id as string,
    logged_item_id: (row.logged_item_id as string) ?? null,
    shared_by: row.shared_by as string,
    note: (row.note as string) ?? null,
    content: (row.content as string) ?? null,
    shared_at: row.shared_at as string,
    sharer: {
      id: sharer?.id ?? (row.shared_by as string),
      display_name: displayNameOf(sharer),
      avatar_path: avatarPathOf(sharer),
      handle: sharer?.handle ?? null,
    },
    item: item
      ? {
          url: item.url ?? '',
          title: item.title ?? '',
          preview_image_url: item.preview_image_url ?? null,
          content_type:
            (item.content_type as GroupDrop['item'] extends null
              ? never
              : NonNullable<GroupDrop['item']>['content_type']) ?? 'article',
          raw_metadata: (item.raw_metadata as Json) ?? null,
          description: item.description ?? null,
        }
      : null,
    engagement: {
      like: { count: 0, didReact: false, reactors: [] },
      mustRead: { count: 1, didReact: false, reactors: [] },
      readBy: { count: 0, didReact: false, reactors: [] },
    },
    commentCount: 0,
    seenAt: null,
    latestCommentAt: null,
    latestComment: null,
  };
}

const SELECT = `
  id, convo_id, logged_item_id, shared_by, note, content, shared_at,
  sharer:profiles!group_posts_shared_by_fkey(id, first_name, last_name, handle, avatar:avatar_id(file_path, bucket_name)),
  item:logged_items!group_posts_logged_item_id_fkey(url, title, preview_image_url, content_type, raw_metadata, description),
  group_posts_must_reads!inner(id)
`;

async function fetchRecommendedPage(
  supabase: SupabaseClient<Database>,
  groupId: string,
  cursor: string | null,
): Promise<GroupDrop[]> {
  let query = supabase
    .from('group_posts')
    .select(SELECT)
    .eq('convo_id', groupId)
    .order('shared_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt('shared_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(row =>
    mapRow(row as unknown as Record<string, unknown>),
  );
}

export function useRecommendedDrops(
  supabase: SupabaseClient<Database>,
  groupId: string,
) {
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.groups.feed(groupId), 'recommended'],
    queryFn: ({ pageParam }) =>
      fetchRecommendedPage(supabase, groupId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage =>
      lastPage.length === PAGE_SIZE
        ? lastPage[lastPage.length - 1].shared_at
        : undefined,
    staleTime: 1000 * 30,
    enabled: !!groupId,
  });

  const drops = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  return {
    drops,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
}
