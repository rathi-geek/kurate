"use client";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";
import type { GroupDrop } from "@kurate/types";

const supabase = createClient();

type ReactionType = "like" | "must_read";

interface ToggleReactionInput {
  groupPostId: string;
  groupId: string;
  reactionType: ReactionType;
  currentUserId: string;
  didReact: boolean;
}

export function useDropEngagement() {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async ({
      groupPostId,
      reactionType,
      currentUserId,
      didReact,
    }: ToggleReactionInput) => {
      if (didReact) {
        // Remove reaction
        const table = reactionType === "like" ? "group_posts_likes" : "group_posts_must_reads";
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("group_post_id", groupPostId)
          .eq("user_id", currentUserId);
        if (error) throw new Error(error.message);
      } else {
        // Add reaction
        if (reactionType === "like") {
          const { error } = await supabase
            .from("group_posts_likes")
            .insert({ group_post_id: groupPostId, user_id: currentUserId });
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase
            .from("group_posts_must_reads")
            .insert({ group_post_id: groupPostId, user_id: currentUserId });
          if (error) throw new Error(error.message);
        }
      }
    },
    onMutate: async ({
      groupPostId,
      groupId,
      reactionType,
      didReact,
    }: ToggleReactionInput) => {
      const feedKey = queryKeys.groups.feed(groupId);
      await queryClient.cancelQueries({ queryKey: feedKey });

      const previous = queryClient.getQueryData(feedKey);

      const engagementKey = reactionType === "like" ? "like" : "mustRead";

      queryClient.setQueryData(
        feedKey,
        (old: InfiniteData<GroupDrop[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((drop) => {
                if (drop.id !== groupPostId) return drop;
                const delta = didReact ? -1 : 1;
                return {
                  ...drop,
                  engagement: {
                    ...drop.engagement,
                    [engagementKey]: {
                      ...drop.engagement[engagementKey],
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
        queryClient.setQueryData(queryKeys.groups.feed(vars.groupId), context.previous);
      }
      toast.error("Could not update — check your connection and try again");
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(vars.groupId) });
    },
  });

  return {
    toggleReaction: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}
