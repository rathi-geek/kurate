"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import type { GroupDrop } from "@/app/_libs/types/groups";
import { GROUP_POST_SELECT, mapRowToGroupDrop } from "@/app/_libs/utils/mapGroupDrop";

enum DiscoveryQueryKey {
  New = "discovery-new",
}

const supabase = createClient();

export function useDiscoveryNew(userId: string) {
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

  const readIdsQuery = useQuery({
    queryKey: ["discovery-read-ids", userId],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("group_post_reads")
        .select("group_post_id")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return new Set((data ?? []).map((r) => r.group_post_id));
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  const postsQuery = useQuery({
    queryKey: [DiscoveryQueryKey.New, userId],
    queryFn: async (): Promise<GroupDrop[]> => {
      const readSet = readIdsQuery.data ?? new Set<string>();
      const { data, error } = await supabase
        .from("group_posts")
        .select(GROUP_POST_SELECT)
        .in("convo_id", groupIds)
        .order("shared_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);

      const drops = (data ?? []).map((row) =>
        mapRowToGroupDrop(row as Parameters<typeof mapRowToGroupDrop>[0], userId),
      );

      return drops.filter((d) => !readSet.has(d.id)).slice(0, 20);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId && groupIds.length > 0 && !readIdsQuery.isLoading,
  });

  return {
    drops: postsQuery.data ?? [],
    isLoading: groupIdsQuery.isLoading || readIdsQuery.isLoading || postsQuery.isLoading,
  };
}
