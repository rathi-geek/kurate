"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Tables } from "@kurate/types";
import { queryKeys } from "@kurate/query";
import { fetchGroupDetail, fetchGroupRole } from "./fetchGroupDetail";

import type { GroupRow } from "./useUserGroups";

export function useGroupDetail(supabase: SupabaseClient, groupId: string) {
  const queryClient = useQueryClient();
  const listCache = queryClient.getQueryData<GroupRow[]>(queryKeys.groups.list());
  const fromCache = listCache?.find((g) => g.id === groupId);

  const placeholderData: Partial<Tables<"conversations">> | undefined = fromCache
    ? { id: fromCache.id, group_name: fromCache.name, is_group: true }
    : undefined;

  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => fetchGroupDetail(supabase, groupId),
    placeholderData: placeholderData as Tables<"conversations"> | undefined,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGroupRole(supabase: SupabaseClient, groupId: string, userId: string) {
  return useQuery({
    queryKey: ["groups", "role", groupId, userId] as const,
    queryFn: () => fetchGroupRole(supabase, groupId, userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}
