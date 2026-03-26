"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";

export interface TagCount {
  tag: string;
  count: number;
}

export function useVaultTagCounts() {
  return useQuery({
    queryKey: queryKeys.vault.tagCounts(),
    queryFn: async (): Promise<TagCount[]> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch only the tags column — no heavy metadata, no pagination
      const { data } = await supabase
        .from("user_logged_items")
        .select("logged_item:logged_items!user_logged_items_logged_item_id_fkey(tags)")
        .eq("user_id", user.id);

      if (!data) return [];

      const freq: Record<string, number> = {};
      for (const row of data) {
        const li = Array.isArray(row.logged_item) ? row.logged_item[0] : row.logged_item;
        const tags = (li as { tags?: unknown })?.tags;
        if (Array.isArray(tags)) {
          for (const tag of tags) {
            if (typeof tag === "string" && tag.length > 0) {
              freq[tag] = (freq[tag] ?? 0) + 1;
            }
          }
        }
      }

      return Object.entries(freq)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 5,
  });
}
