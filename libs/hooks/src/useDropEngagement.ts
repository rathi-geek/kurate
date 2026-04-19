"use client";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { GroupDrop } from "@kurate/types";

type ReactionType = "like" | "must_read";

interface ToggleReactionInput {
  groupPostId: string;
  groupId: string;
  reactionType: ReactionType;
  currentUserId: string;
  didReact: boolean;
}

export function useDropEngagement(
  supabase: SupabaseClient,
  onError?: (message: string) => void,
) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async ({
      groupPostId,
      reactionType,
      currentUserId,
      didReact,
    }: ToggleReactionInput) => {
      if (didReact) {
        const table = reactionType === "like" ? "group_posts_likes" : "group_posts_must_reads";
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("group_post_id", groupPostId)
          .eq("user_id", currentUserId);
        if (error) throw new Error(error.message);
      } else {
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
      // Cancel all queries that share the feed prefix (feed + recommended)
      await queryClient.cancelQueries({ queryKey: feedKey });

      const previous = queryClient.getQueryData(feedKey);
      const engagementKey = reactionType === "like" ? "like" : "mustRead";

      const updater = (old: InfiniteData<GroupDrop[]> | undefined) => {
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
      };

      // Update both the main feed and any sub-queries (e.g. recommended)
      queryClient.setQueryData(feedKey, updater);
      queryClient.setQueryData([...feedKey, "recommended"], updater);

      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.groups.feed(vars.groupId), context.previous);
      }
      onError?.("Could not update — check your connection and try again");
    },
    onSettled: (_data, _err, vars) => {
      // Invalidate with prefix match so both feed and recommended refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.feed(vars.groupId) });
    },
  });

  return {
    toggleReaction: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}
