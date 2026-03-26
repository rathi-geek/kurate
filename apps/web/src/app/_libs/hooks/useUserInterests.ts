"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";

const supabase = createClient();

export function useUserInterests(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.interests(userId ?? ""),
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_interests")
        .select("interests(name)")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .map((row) => (row.interests as { name: string } | null)?.name)
        .filter(Boolean) as string[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export async function saveUserInterests(userId: string, selectedNames: string[]) {
  await supabase.from("user_interests").delete().eq("user_id", userId);

  if (selectedNames.length === 0) return;

  const { data: interestRows } = await supabase
    .from("interests")
    .select("id, name")
    .in("name", selectedNames);

  if (!interestRows?.length) return;

  const rows = interestRows.map((i) => ({ user_id: userId, interest_id: i.id }));
  await supabase.from("user_interests").insert(rows);
}
