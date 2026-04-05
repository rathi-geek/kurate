"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import type { ThoughtMessage } from "@kurate/types";
import { db } from "@/app/_libs/db";

interface DeleteThoughtInput {
  id: string;
  isPending?: boolean;
}

type ThoughtsPage = { items: ThoughtMessage[]; nextCursor: string | null };
type ThoughtsData = { pages: ThoughtsPage[]; pageParams: unknown[] };

export function useDeleteThought() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPending }: DeleteThoughtInput) => {
      if (isPending) {
        await db.pending_thoughts.delete(id);
        return;
      }
      await fetch(`/api/thoughts/${id}`, { method: "DELETE" });
    },
    onMutate: async ({ id, isPending }) => {
      if (isPending) return;
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
    onError: (_err, { isPending }, context) => {
      if (isPending) return;
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.thoughts.list(null), context.previous);
      }
    },
    onSettled: (_data, _err, { isPending }) => {
      if (!isPending) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.all });
      }
    },
  });
}
