"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import { generateUrlHash } from "@/app/_libs/hooks/useSaveItem";
import type { SaveItemInput } from "@/app/_libs/hooks/useSaveItem";

const supabase = createClient();

export function useVaultToggle(userId: string, url: string) {
  const queryClient = useQueryClient();
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
    staleTime: 0,
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
    onMutate: () => {
      queryClient.setQueryData(key, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (itemData: Omit<SaveItemInput, "url" | "save_source">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const url_hash = await generateUrlHash(url);
      const { data: li, error: liErr } = await supabase
        .from("logged_items")
        .upsert(
          {
            url,
            url_hash,
            title: itemData.title ?? url,
            content_type: itemData.content_type ?? "article",
            preview_image_url: itemData.preview_image ?? null,
            raw_metadata: { source: itemData.source ?? null, read_time: itemData.read_time ?? null },
          },
          { onConflict: "url_hash" },
        )
        .select("id")
        .single();
      if (liErr) throw new Error(liErr.message);

      const { data: existing } = await supabase
        .from("user_logged_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("logged_item_id", li.id)
        .maybeSingle();
      if (existing) return existing.id as string;

      const { data: uli, error: uliErr } = await supabase
        .from("user_logged_items")
        .insert({ user_id: user.id, logged_item_id: li.id, save_source: "shares" })
        .select("id")
        .single();
      if (uliErr) throw new Error(uliErr.message);
      return uli.id as string;
    },
    onMutate: () => {
      // Optimistic: immediately show as saved
      queryClient.setQueryData(key, "optimistic");
    },
    onSuccess: (uliId) => {
      queryClient.setQueryData(key, uliId);
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
    },
    onError: () => {
      queryClient.setQueryData(key, null);
    },
  });

  const toggle = (itemData?: Omit<SaveItemInput, "url" | "save_source">) => {
    if (savedQuery.data) {
      removeMutation.mutate();
    } else {
      saveMutation.mutate(itemData ?? {});
    }
  };

  return {
    isSaved: !!savedQuery.data,
    toggle,
    isLoading: savedQuery.isLoading || saveMutation.isPending || removeMutation.isPending,
  };
}
