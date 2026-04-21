import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import type { ThoughtMessage, Database } from "@kurate/types";

type ThoughtsPage = { items: ThoughtMessage[]; nextCursor: string | null };
type ThoughtsData = { pages: ThoughtsPage[]; pageParams: unknown[] };

interface UseEditThoughtConfig {
  supabase: SupabaseClient<Database>;
}

interface EditThoughtInput {
  id: string;
  text: string;
}

export function useEditThought({ supabase }: UseEditThoughtConfig) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text }: EditThoughtInput) => {
      const { error } = await supabase
        .from("thoughts")
        .update({ text })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, text }) => {
      const key = queryKeys.thoughts.list(null);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ThoughtsData>(key);
      queryClient.setQueryData<ThoughtsData>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === id ? { ...item, text } : item,
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
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
