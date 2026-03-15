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

  // Returns the user_logged_items.id if saved, null otherwise
  const savedQuery = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!userId || !url) return null;
      // Look up the shared catalog entry by URL
      const { data: li } = await supabase
        .from("logged_items")
        .select("id")
        .eq("url", url)
        .maybeSingle();
      if (!li) return null;
      // Check if this user has saved it
      const { data: uli } = await supabase
        .from("user_logged_items")
        .select("id")
        .eq("user_id", userId)
        .eq("logged_item_id", li.id)
        .maybeSingle();
      return uli?.id ?? null;
    },
    staleTime: 1000 * 60,
    enabled: !!userId && !!url,
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const uliId = savedQuery.data;
      if (!uliId) return;
      const { error } = await supabase
        .from("user_logged_items")
        .delete()
        .eq("id", uliId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
  });

  const save = (itemData: Omit<SaveItemInput, "url" | "save_source">) => {
    saveItem.mutate(
      { ...itemData, url, save_source: "shares" },
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
    isSaved: !!savedQuery.data,
    toggle,
    isLoading: savedQuery.isLoading || saveItem.isPending || removeMutation.isPending,
  };
}
