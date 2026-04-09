"use client";

import { queryKeys } from "@kurate/query";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";

export interface InterestCount {
  name: string;
  count: number;
  percentage: number;
}

export function useContentDNA() {
  return useQuery({
    queryKey: queryKeys.vault.contentDNA(),
    queryFn: async (): Promise<InterestCount[]> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex nested select not typed by Supabase
      const { data } = await (supabase as any)
        .from("user_logged_items")
        .select(
          `logged_item:logged_items!user_logged_items_logged_item_id_fkey(
            logged_item_interests ( interests ( id, name ) )
          )`,
        )
        .eq("user_id", user.id);

      if (!data) return [];

      const freq: Record<string, number> = {};
      for (const row of data as Record<string, unknown>[]) {
        const li = Array.isArray(row.logged_item) ? row.logged_item[0] : row.logged_item;
        const lii = (li as Record<string, unknown> | null)?.logged_item_interests;
        if (!Array.isArray(lii)) continue;
        for (const entry of lii as Record<string, unknown>[]) {
          const interest = Array.isArray(entry.interests) ? entry.interests[0] : entry.interests;
          const name = (interest as Record<string, unknown> | null)?.name;
          if (typeof name === "string" && name.length > 0) {
            freq[name] = (freq[name] ?? 0) + 1;
          }
        }
      }

      const sorted = Object.entries(freq)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const total = sorted.reduce((s, { count }) => s + count, 0);
      return sorted.map(({ name, count }) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}
