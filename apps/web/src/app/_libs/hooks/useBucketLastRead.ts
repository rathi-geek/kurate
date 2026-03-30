"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import type { ThoughtBucket } from "@kurate/utils";

const supabase = createClient();

type BucketLastReadRow = {
  bucket: ThoughtBucket;
  last_read_at: string;
};

const QUERY_KEY = (userId: string) => ["bucket_last_read", userId] as const;

export function useBucketLastRead(userId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BucketLastReadRow[]>({
    queryKey: QUERY_KEY(userId ?? ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("bucket_last_read")
        .select("bucket, last_read_at")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return (data ?? []) as BucketLastReadRow[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  });

  const rowMap = new Map<ThoughtBucket, string>(
    (data ?? []).map((r) => [r.bucket, r.last_read_at]),
  );

  function lastReadAt(bucket: ThoughtBucket): string | null {
    return rowMap.get(bucket) ?? null;
  }

  function markBucketRead(bucket: ThoughtBucket): void {
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

    // Persist to DB (fire-and-forget)
    void supabase.from("bucket_last_read").upsert(
      { user_id: userId, bucket, last_read_at: now },
      { onConflict: "user_id,bucket" },
    );
  }

  return { lastReadAt, markBucketRead, isLoading };
}
