"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";

interface ShareToGroupsInput {
  loggedItemId: string;
  groupIds: string[];
  userId: string;
}

export function useShareToGroups(
  supabase: SupabaseClient,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loggedItemId, groupIds, userId }: ShareToGroupsInput) => {
      await Promise.all(
        groupIds.map((convo_id) =>
          supabase.from("group_posts").insert({
            convo_id,
            logged_item_id: loggedItemId,
            shared_by: userId,
          }),
        ),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      onSuccess?.();
    },
  });
}
