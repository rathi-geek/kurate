import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@kurate/query';
import type { ThoughtBucket } from '@kurate/utils';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

export interface BucketSummary {
  bucket: ThoughtBucket;
  latestText: string | null;
  latestCreatedAt: string | null;
  totalCount: number;
  unreadCount: number;
}

export function useBucketSummaries() {
  const userId = useAuthStore(state => state.userId);

  return useQuery<BucketSummary[]>({
    queryKey: queryKeys.thoughts.bucketSummaries(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_thought_bucket_summaries',
      );
      if (error) throw new Error(error.message);
      return ((data as Record<string, unknown>[]) ?? []).map(row => ({
        bucket: row.bucket as ThoughtBucket,
        latestText: (row.latest_text as string | null) ?? null,
        latestCreatedAt: (row.latest_created_at as string | null) ?? null,
        totalCount: (row.total_count as number) ?? 0,
        unreadCount: (row.unread_count as number) ?? 0,
      }));
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
