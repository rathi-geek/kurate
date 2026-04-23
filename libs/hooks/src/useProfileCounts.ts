import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { Database } from "@kurate/types";

export interface ProfileCounts {
  saved: number;
  read: number;
  shared: number;
}

interface UseProfileCountsConfig {
  supabase: SupabaseClient<Database>;
  userId: string | null;
}

export function useProfileCounts({
  supabase,
  userId,
}: UseProfileCountsConfig) {
  return useQuery({
    queryKey: queryKeys.user.profileCounts(userId ?? ""),
    enabled: !!userId,
    queryFn: async (): Promise<ProfileCounts> => {
      const [saved, read, shared] = await Promise.all([
        supabase
          .from("user_logged_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
        supabase
          .from("user_logged_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!)
          .eq("is_read", true),
        supabase
          .from("group_posts")
          .select("id", { count: "exact", head: true })
          .eq("shared_by", userId!),
      ]);
      return {
        saved: saved.count ?? 0,
        read: read.count ?? 0,
        shared: shared.count ?? 0,
      };
    },
  });
}
