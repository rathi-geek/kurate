"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@kurate/query";

export interface BucketSummary {
  bucket: string;
  latestText: string | null;
  latestCreatedAt: string | null;
  totalCount: number;
  unreadCount: number;
}

export function useBucketSummaries(enabled: boolean) {
  return useQuery<BucketSummary[]>({
    queryKey: queryKeys.thoughts.bucketSummaries(),
    queryFn: async () => {
      const res = await fetch("/api/thoughts/buckets");
      if (!res.ok) throw new Error("Failed to fetch bucket summaries");
      return res.json();
    },
    enabled,
    staleTime: 1000 * 30,
  });
}
