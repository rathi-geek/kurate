"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { Tables } from "@kurate/types";
import { queryKeys } from "@kurate/query";

import type { GroupRow } from "@/app/_libs/utils/fetchUserGroups";
import { fetchGroupDetail, fetchGroupRole } from "@/app/_libs/utils/fetchGroupDetail";

export function useGroupDetail(groupId: string) {
  const queryClient = useQueryClient();
  const listCache = queryClient.getQueryData<GroupRow[]>(queryKeys.groups.list());
  const fromCache = listCache?.find((g) => g.id === groupId);

  // Use list-cache entry as placeholder so the page renders immediately.
  // The full conversations row is fetched in the background.
  const placeholderData: Partial<Tables<"conversations">> | undefined = fromCache
    ? { id: fromCache.id, group_name: fromCache.name, is_group: true }
    : undefined;

  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => fetchGroupDetail(groupId),
    placeholderData: placeholderData as Tables<"conversations"> | undefined,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGroupRole(groupId: string, userId: string) {
  return useQuery({
    queryKey: ["groups", "role", groupId, userId] as const,
    queryFn: () => fetchGroupRole(groupId, userId),
    staleTime: 1000 * 60 * 5,
  });
}
