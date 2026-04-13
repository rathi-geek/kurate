"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { Database, GroupMember, GroupRole } from "@kurate/types";

async function fetchGroupMembers(
  supabase: SupabaseClient<Database>,
  groupId: string,
): Promise<GroupMember[]> {
  const { data, error } = await supabase.rpc("get_group_members", {
    p_group_id: groupId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as GroupMember[];
}

export function useGroupMembers(
  supabase: SupabaseClient<Database>,
  groupId: string,
  currentUserId: string,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: () => fetchGroupMembers(supabase, groupId),
    staleTime: 1000 * 60,
    enabled: !!groupId,
  });

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-members-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_members", filter: `convo_id=eq.${groupId}` },
        () => { void queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) }); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [groupId, queryClient, supabase]);

  const members = query.data ?? [];
  const currentMember = members.find((m) => m.user_id === currentUserId);
  const currentRole = (currentMember?.role as GroupRole) ?? "member";

  return {
    members,
    currentRole,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
