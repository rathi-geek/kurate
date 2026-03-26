"use client";

import { useQuery } from "@tanstack/react-query";
import { startOfDay } from "date-fns";

import { createClient } from "@/app/_libs/supabase/client";
import type { GroupDrop } from "@kurate/types";
import { GROUP_POST_SELECT, mapRowToGroupDrop } from "@/app/_libs/utils/mapGroupDrop";

enum DiscoveryQueryKey {
  Today = "discovery-today",
}

const supabase = createClient();

function scoreDrops(drop: GroupDrop): number {
  return drop.engagement.like.count + drop.engagement.mustRead.count + drop.commentCount;
}

export function useDiscoveryToday(userId: string) {
  const groupIdsQuery = useQuery({
    queryKey: ["discovery-group-ids", userId],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("conversation_members")
        .select("convo_id")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.convo_id);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  const groupIds = groupIdsQuery.data ?? [];

  const postsQuery = useQuery({
    queryKey: [DiscoveryQueryKey.Today, userId],
    queryFn: async (): Promise<GroupDrop[]> => {
      const todayStart = startOfDay(new Date()).toISOString();
      const { data, error } = await supabase
        .from("group_posts")
        .select(GROUP_POST_SELECT)
        .in("convo_id", groupIds)
        .gte("shared_at", todayStart)
        .order("shared_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);

      const drops = (data ?? []).map((row) =>
        mapRowToGroupDrop(row as Parameters<typeof mapRowToGroupDrop>[0], userId),
      );

      return drops.sort((a, b) => scoreDrops(b) - scoreDrops(a)).slice(0, 10);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId && groupIds.length > 0,
  });

  return {
    drops: postsQuery.data ?? [],
    isLoading: groupIdsQuery.isLoading || postsQuery.isLoading,
  };
}
