"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@kurate/query";
import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

interface ShareToGroupsInput {
  loggedItemId: string;
  groupIds: string[];
  userId: string;
}

export function useShareToGroups() {
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
      toast("Shared!");
    },
  });
}
