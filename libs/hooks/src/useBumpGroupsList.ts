"use client";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";

import type { GroupRow } from "./useUserGroups";

/**
 * Returns a function that bumps the given group to the top of the
 * `queryKeys.groups.list()` cache and refreshes its `last_activity_at`.
 *
 * Pure cache mutation — no invalidation, no refetch. Use after an optimistic
 * post lands so the sidebar reorders instantly without flicker.
 */
export function useBumpGroupsList() {
  const queryClient = useQueryClient();
  return useCallback(
    (row: { convo_id: string; createdAt: string }) => {
      queryClient.setQueryData<GroupRow[]>(queryKeys.groups.list(), (old) => {
        if (!old) return old;
        const idx = old.findIndex((g) => g.id === row.convo_id);
        if (idx < 0) return old;
        const copy = old.slice();
        const [bumped] = copy.splice(idx, 1);
        return [{ ...bumped, last_activity_at: row.createdAt }, ...copy];
      });
    },
    [queryClient],
  );
}
