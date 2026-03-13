"use client";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { GroupDrop } from "@/app/_libs/types/groups";

const supabase = createClient();

type ReactionType = "like" | "must_read" | "read_by";

interface ToggleReactionInput {
  groupShareId: string;
  groupId: string;
  reactionType: ReactionType;
  currentUserId: string;
  didReact: boolean;
}

export function useDropEngagement() {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async ({
      groupShareId,
      reactionType,
      currentUserId,
      didReact,
    }: ToggleReactionInput) => {
      if (didReact) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("group_share_id", groupShareId)
          .eq("user_id", currentUserId)
          .eq("type", reactionType);
        if (error) throw new Error(error.message);
      } else {
        // ON CONFLICT DO NOTHING — safe even without unique constraint
        const { error } = await supabase.from("reactions").upsert(
          {
            group_share_id: groupShareId,
            user_id: currentUserId,
            type: reactionType,
          },
          { onConflict: "group_share_id,user_id,type", ignoreDuplicates: true },
        );
        if (error) throw new Error(error.message);
      }
    },
    onMutate: async ({
      groupShareId,
      groupId,
      reactionType,
      didReact,
    }: ToggleReactionInput) => {
      const feedKey = queryKeys.groups.feed(groupId);
      await queryClient.cancelQueries({ queryKey: feedKey });

      const previous = queryClient.getQueryData(feedKey);

      const engagementKey =
        reactionType === "like"
          ? "like"
          : reactionType === "must_read"
            ? "mustRead"
            : "readBy";

      queryClient.setQueryData(
        feedKey,
        (old: InfiniteData<GroupDrop[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((drop) => {
                if (drop.id !== groupShareId) return drop;
                const delta = didReact ? -1 : 1;
                return {
                  ...drop,
                  engagement: {
                    ...drop.engagement,
                    [engagementKey]: {
                      count: drop.engagement[engagementKey].count + delta,
                      didReact: !didReact,
                    },
                  },
                };
              }),
            ),
          };
        },
      );

      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.groups.feed(vars.groupId),
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.feed(vars.groupId),
      });
    },
  });

  return {
    toggleReaction: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}
