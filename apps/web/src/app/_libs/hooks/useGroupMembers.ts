"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { GroupMember, GroupRole } from "@/app/_libs/types/groups";

const supabase = createClient();

async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  // Attempt profile join — may fail if RLS on group_members still has recursion issues
  const { data, error } = await supabase
    .from("group_members")
    .select(
      "id, group_id, user_id, role, status, joined_at, is_admin, profile:profiles!group_members_user_id_fkey(id, first_name, last_name, avtar_url, handle)",
    )
    .eq("group_id", groupId);

  if (error) {
    // If the join fails (e.g. RLS recursion), fall back to members-only query
    const { data: fallback, error: fallbackError } = await supabase
      .from("group_members")
      .select("id, group_id, user_id, role, status, joined_at, is_admin")
      .eq("group_id", groupId);

    if (fallbackError) throw new Error(fallbackError.message);

    return (fallback ?? []).map((row) => ({
      ...row,
      profile: { id: row.user_id, display_name: null, avatar_url: null, handle: "" },
    }));
  }

  return (data ?? []).map((row) => {
    const rawProfile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return {
      ...row,
      profile: rawProfile
        ? {
            id: rawProfile.id,
            display_name:
              [rawProfile.first_name, rawProfile.last_name].filter(Boolean).join(" ") || rawProfile.handle || null,
            avatar_url: rawProfile.avtar_url ?? null,
            handle: rawProfile.handle ?? "",
          }
        : { id: row.user_id, display_name: null, avatar_url: null, handle: "" },
    };
  });
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
