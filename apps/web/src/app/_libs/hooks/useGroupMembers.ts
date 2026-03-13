"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { GroupMember, GroupRole } from "@/app/_libs/types/groups";

const supabase = createClient();

async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  // TODO: Once RLS on group_members is fixed, restore the profile join:
  //   .select("id, group_id, user_id, role, status, joined_at,
  //            profile:profiles!group_members_user_id_fkey(id, display_name, avatar_url)")
  //   .eq("group_id", groupId)
  const { data, error } = await supabase
    .from("group_members")
    .select("id, group_id, user_id, role, status, joined_at")
    .eq("group_id", groupId);

  if (error) throw new Error(error.message);

  // TODO: Remove placeholder profile once RLS is fixed and join is restored
  return (data ?? []).map((row) => ({
    ...row,
    profile: {
      id: row.user_id,
      display_name: null,
      avatar_url: null,
    },
  }));
}

export function useGroupMembers(groupId: string, currentUserId: string) {
  const query = useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: () => fetchGroupMembers(groupId),
    staleTime: 1000 * 60,
    enabled: !!groupId,
  });

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
