import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@kurate/types";
import { queryKeys } from "@kurate/query";

type BucketLastReadRow = {
  bucket: string;
  last_read_at: string;
};

const QUERY_KEY = (userId: string) => ["bucket_last_read", userId] as const;

interface UseBucketLastReadConfig {
  supabase: SupabaseClient<Database>;
  userId: string | null;
}

export function useBucketLastRead({
  supabase,
  userId,
}: UseBucketLastReadConfig) {
  const queryClient = useQueryClient();
  const uid = userId ?? "";

  const { data, isLoading } = useQuery<BucketLastReadRow[]>({
    queryKey: QUERY_KEY(uid),
    queryFn: async () => {
      if (!userId) return [];
      const { data: rows, error } = await supabase
        .from("bucket_last_read")
        .select("bucket, last_read_at")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return (rows ?? []) as BucketLastReadRow[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const rowMap = new Map<string, string>(
    (data ?? []).map((r) => [r.bucket, r.last_read_at]),
  );

  function lastReadAt(bucket: string): string | null {
    return rowMap.get(bucket) ?? null;
  }

  async function markBucketRead(bucket: string): Promise<void> {
    if (!userId) return;
    const now = new Date().toISOString();

    // Optimistic cache update
    queryClient.setQueryData<BucketLastReadRow[]>(
      QUERY_KEY(userId),
      (prev) => {
        const existing = prev ?? [];
        const filtered = existing.filter((r) => r.bucket !== bucket);
        return [...filtered, { bucket, last_read_at: now }];
      },
    );

    const { error } = await supabase
      .from("bucket_last_read")
      .upsert(
        { user_id: userId, bucket, last_read_at: now },
        { onConflict: "user_id,bucket" },
      );

    if (error) {
      // Revert optimistic update
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY(userId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.thoughts.bucketSummaries(),
      });
    }
  }

  return { lastReadAt, markBucketRead, isLoading };
}
