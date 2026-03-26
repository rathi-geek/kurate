"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";

const supabase = createClient();

function postReadKey(groupPostId: string) {
  return [...queryKeys.groups.engagement(groupPostId), "reads"] as const;
}

export function usePostRead(groupPostId: string, currentUserId: string) {
  const queryClient = useQueryClient();
  const key = postReadKey(groupPostId);

  const readQuery = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_post_reads")
        .select("id")
        .eq("group_post_id", groupPostId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.id ?? null; // returns the read record id or null
    },
    staleTime: 1000 * 60,
    enabled: !!groupPostId && !!currentUserId,
  });

  const readCountQuery = useQuery({
    queryKey: [...queryKeys.groups.engagement(groupPostId), "read_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("group_post_reads")
        .select("id", { count: "exact", head: true })
        .eq("group_post_id", groupPostId);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    staleTime: 1000 * 60,
    enabled: !!groupPostId,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (readQuery.data) {
        // Already read — unmark
        const { error } = await supabase
          .from("group_post_reads")
          .delete()
          .eq("id", readQuery.data);
        if (error) throw new Error(error.message);
      } else {
        // Mark as read
        const { error } = await supabase.from("group_post_reads").insert({
          group_post_id: groupPostId,
          user_id: currentUserId,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.groups.engagement(groupPostId), "read_count"],
      });
    },
  });

  return {
    didRead: !!readQuery.data,
    readCount: readCountQuery.data ?? 0,
    toggleRead: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}
