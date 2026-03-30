"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

type LastSeenRow = {
  group_post_id: string;
  comment_count: number;
  seen_at: string;
};

function queryKey(userId: string, postIds: string[]) {
  return ["group_post_last_seen", userId, postIds.slice().sort().join(",")] as const;
}

export function usePostSeenStatus(
  userId: string | null,
  postIds: string[],
) {
  const queryClient = useQueryClient();

  const { data: seenRows } = useQuery<LastSeenRow[]>({
    queryKey: queryKey(userId ?? "", postIds),
    queryFn: async () => {
      if (!userId || postIds.length === 0) return [];
      const { data, error } = await supabase
        .from("group_post_last_seen")
        .select("group_post_id, comment_count, seen_at")
        .eq("user_id", userId)
        .in("group_post_id", postIds);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!userId && postIds.length > 0,
    staleTime: 1000 * 60,
  });

  const seenMap = new Map<string, number>(
    (seenRows ?? []).map((r) => [r.group_post_id, r.comment_count]),
  );

  const seenAtMap = new Map<string, string>(
    (seenRows ?? []).map((r) => [r.group_post_id, r.seen_at]),
  );

  function hasNewComments(postId: string, commentCount: number): boolean {
    if (commentCount === 0) return false;
    if (!seenMap.has(postId)) return true;
    return commentCount > (seenMap.get(postId) ?? 0);
  }

  function markPostSeen(postId: string, commentCount: number): void {
    if (!userId) return;

    // Optimistic cache update
    const now = new Date().toISOString();
    queryClient.setQueryData<LastSeenRow[]>(
      queryKey(userId, postIds),
      (prev) => {
        const existing = prev ?? [];
        const filtered = existing.filter((r) => r.group_post_id !== postId);
        return [...filtered, { group_post_id: postId, comment_count: commentCount, seen_at: now }];
      },
    );

    // Persist to DB (fire-and-forget)
    void supabase.from("group_post_last_seen").upsert(
      { user_id: userId, group_post_id: postId, seen_at: new Date().toISOString(), comment_count: commentCount },
      { onConflict: "user_id,group_post_id" },
    );
  }

  function lastSeenAt(postId: string): string | null {
    return seenAtMap.get(postId) ?? null;
  }

  return { hasNewComments, markPostSeen, lastSeenAt };
}
