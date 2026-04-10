"use client";

import { useQuery } from "@tanstack/react-query";
import { startOfDay } from "@kurate/utils";

import { createClient } from "@/app/_libs/supabase/client";
import type { GroupDrop } from "@kurate/types";
import { GROUP_POST_SELECT, mapRowToGroupDrop } from "@/app/_libs/utils/mapGroupDrop";

const supabase = createClient();

function scoreDrops(drop: GroupDrop): number {
  return drop.engagement.like.count + drop.engagement.mustRead.count + drop.commentCount;
}

export function useDiscoveryFeed(userId: string) {
  const query = useQuery({
    queryKey: ["discovery-feed", userId],
    queryFn: async (): Promise<{ todayDrops: GroupDrop[]; newDrops: GroupDrop[] }> => {
      const todayStart = startOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .rpc("get_discovery_feed", { p_user_id: userId })
        .select(GROUP_POST_SELECT)
        .order("shared_at", { ascending: false })
        .limit(60);
      if (error) throw new Error(error.message);

      const all = (data ?? []).map((row) =>
        mapRowToGroupDrop(row as Parameters<typeof mapRowToGroupDrop>[0], userId),
      );

      // Today: posts from today ranked by engagement, top 10
      const todayDrops = all
        .filter((d) => d.shared_at >= todayStart)
        .sort((a, b) => scoreDrops(b) - scoreDrops(a))
        .slice(0, 10);

      // New: everything not in today's top 10
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
  };
}
