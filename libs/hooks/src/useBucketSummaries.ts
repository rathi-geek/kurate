import { useQuery } from "@tanstack/react-query";

import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { Database } from "@kurate/types";

export interface BucketSummary {
  bucket: string;
  bucketLabel: string;
  color: string;
  isSystem: boolean;
  isPinned: boolean;
  latestText: string | null;
  latestCreatedAt: string | null;
  totalCount: number;
  unreadCount: number;
}

interface UseBucketSummariesConfig {
  supabase: SupabaseClient<Database>;
  userId: string | null;
  enabled?: boolean;
}

export function useBucketSummaries({
  supabase,
  userId,
  enabled = true,
}: UseBucketSummariesConfig) {
  return useQuery<BucketSummary[]>({
    queryKey: queryKeys.thoughts.bucketSummaries(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_thought_bucket_summaries",
      );
      if (error) throw new Error(error.message);
      return (data ?? []) as BucketSummary[];
    },
    enabled: !!userId && enabled,
    staleTime: 30_000,
  });
}
