"use client";

import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfDay } from "@kurate/utils";
import type { Database, GroupDrop } from "@kurate/types";

import { mapFeedRowToGroupDrop, type FeedRow } from "./mapFeedRow";

function scoreDrops(drop: GroupDrop): number {
  return (
    drop.engagement.like.count +
    drop.engagement.mustRead.count +
    drop.commentCount
  );
}

export function useDiscoveryFeed(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const query = useQuery({
    queryKey: ["discovery-feed", userId],
    queryFn: async (): Promise<{
      todayDrops: GroupDrop[];
      newDrops: GroupDrop[];
    }> => {
      const todayStart = startOfDay(new Date()).toISOString();

      const { data, error } = await supabase.rpc("get_discovery_feed_page", {
        p_user_id: userId,
        p_limit: 60,
      });
      if (error) throw new Error(error.message);

      const all = (data ?? []).map((row) =>
        mapFeedRowToGroupDrop(row as FeedRow),
      );

      const todayDrops = all
        .filter((d) => d.shared_at >= todayStart)
        .sort((a, b) => scoreDrops(b) - scoreDrops(a))
        .slice(0, 10);

      const todayIds = new Set(todayDrops.map((d) => d.id));
      const newDrops = all.filter((d) => !todayIds.has(d.id)).slice(0, 20);

      return { todayDrops, newDrops };
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  return {
    todayDrops: query.data?.todayDrops ?? [],
    newDrops: query.data?.newDrops ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
