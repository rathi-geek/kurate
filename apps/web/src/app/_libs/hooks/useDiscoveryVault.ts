"use client";

import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";

import { createClient } from "@/app/_libs/supabase/client";

enum DiscoveryQueryKey {
  Vault = "discovery-vault",
}

export type VaultDiscoveryItem = {
  id: string;
  created_at: string;
  title: string | null;
  url: string;
  content_type: string | null;
};

const supabase = createClient();

export function useDiscoveryVault(userId: string) {
  return useQuery({
    queryKey: [DiscoveryQueryKey.Vault, userId],
    queryFn: async (): Promise<VaultDiscoveryItem[]> => {
      const cutoff = subDays(new Date(), 3).toISOString();
      const { data, error } = await supabase
        .from("user_logged_items")
        .select(
          "id, created_at, logged_item:logged_items!user_logged_items_logged_item_id_fkey(title, url, content_type)",
        )
        .eq("user_id", userId)
        .eq("is_read", false)
        .lte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);

      return (data ?? []).flatMap((row) => {
        const rawItem = Array.isArray(row.logged_item) ? row.logged_item[0] : row.logged_item;
        if (!rawItem?.url) return [];
        return [
          {
            id: row.id,
            created_at: row.created_at,
            title: rawItem.title ?? null,
            url: rawItem.url,
            content_type: rawItem.content_type ?? null,
          } satisfies VaultDiscoveryItem,
        ];
      });
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}
