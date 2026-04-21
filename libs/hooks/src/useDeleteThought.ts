import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import type { ThoughtMessage, Database } from "@kurate/types";

type ThoughtsPage = { items: ThoughtMessage[]; nextCursor: string | null };
type ThoughtsData = { pages: ThoughtsPage[]; pageParams: unknown[] };

interface UseDeleteThoughtConfig {
  supabase: SupabaseClient<Database>;
}

export function useDeleteThought({ supabase }: UseDeleteThoughtConfig) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("thoughts")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id: string) => {
      const key = queryKeys.thoughts.list(null);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ThoughtsData>(key);
      queryClient.setQueryData<ThoughtsData>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== id),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.thoughts.list(null),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.thoughts.all,
      });
    },
  });
}
