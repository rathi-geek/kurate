"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import type { SaveItemInput } from "@/app/_libs/hooks/useSaveItem";

const supabase = createClient();

export function useVaultToggle(userId: string, url: string) {
  const queryClient = useQueryClient();
  const saveItem = useSaveItem();
  const key = queryKeys.groups.vaultItem(userId, url);

  const savedQuery = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!userId || !url) return false;
      const { data } = await supabase
        .from("logged_items")
        .select("id")
        .eq("user_id", userId)
        .eq("url", url)
        .maybeSingle();
      return !!data;
    },
    staleTime: 1000 * 60,
    enabled: !!userId && !!url,
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("logged_items")
        .delete()
        .eq("user_id", userId)
        .eq("url", url);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
  });

  const save = (itemData: Omit<SaveItemInput, "url" | "save_source">) => {
    saveItem.mutate(
      { ...itemData, url, save_source: "discovered" },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: key });
        },
      },
    );
  };

  const toggle = (itemData?: Omit<SaveItemInput, "url" | "save_source">) => {
    if (savedQuery.data) {
      removeMutation.mutate();
    } else {
      save(itemData ?? {});
    }
  };

  return {
    isSaved: savedQuery.data ?? false,
    toggle,
    isLoading: savedQuery.isLoading || saveItem.isPending || removeMutation.isPending,
  };
}
