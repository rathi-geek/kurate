"use client";

import { useState, useEffect, useCallback } from "react";

import { createClient } from "@/app/_libs/supabase/client";
import { useDMUnreadCounts } from "@kurate/hooks";

const supabase = createClient();

export function useUnreadCounts(userId: string | null, groupIds?: Set<string>) {
  const {
    counts: dmCounts,
    markRead: markDMRead,
    totalDMUnread,
  } = useDMUnreadCounts(supabase, userId);

  const [groupCounts, setGroupCounts] = useState<Map<string, number>>(new Map());

  const fetchGroupCounts = useCallback(async () => {
    if (!userId || !groupIds || groupIds.size === 0) return;

    const groupIdArr = Array.from(groupIds);
    const results = await Promise.all(
      groupIdArr.map(async (gid) => {
        const lastSeen = localStorage.getItem(`group_last_seen:${gid}`);
        if (!lastSeen) return { gid, count: null };
        const { count } = await supabase
          .from("group_posts")
          .select("id", { count: "exact", head: true })
          .eq("convo_id", gid)
          .neq("shared_by", userId)
          .gt("shared_at", lastSeen);
        return { gid, count: count ?? 0 };
      }),
    );

    setGroupCounts((prev) => {
      const map = new Map<string, number>();
      for (const { gid, count } of results) {
        if (count !== null && count > 0) map.set(gid, count);
      }
      // Preserve realtime-accumulated group counts for groups with no localStorage lastSeen
      if (groupIds) {
        for (const gid of groupIds) {
          if (!map.has(gid) && prev.has(gid)) {
            map.set(gid, prev.get(gid)!);
          }
        }
      }
      return map;
    });
  }, [userId, groupIds]);

  useEffect(() => {
    if (!userId) return;
    void fetchGroupCounts();

    const groupChannel = supabase
      .channel("unread-group-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_posts" },
        (payload) => {
          const post = payload.new as { id: string; convo_id: string; shared_by: string };
          if (post.shared_by === userId) return;
          if (!groupIds?.has(post.convo_id)) return;
          setGroupCounts((prev) => {
            const next = new Map(prev);
            next.set(post.convo_id, (next.get(post.convo_id) ?? 0) + 1);
            return next;
          });
        },
      )
      .subscribe((_status, err) => {
        if (err) console.error("[useUnreadCounts] group subscription error:", err);
      });

    return () => {
      void supabase.removeChannel(groupChannel);
    };
  }, [userId, fetchGroupCounts, groupIds]);

  // Re-fetch group counts when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchGroupCounts();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchGroupCounts]);

  // Merge DM + group counts
  const counts = new Map<string, number>();
  for (const [k, v] of dmCounts) counts.set(k, v);
  for (const [k, v] of groupCounts) counts.set(k, v);

  const markRead = useCallback(
    async (convoId: string) => {
      if (!userId) return;

      // Group posts — track via localStorage
      if (groupIds?.has(convoId)) {
        setGroupCounts((prev) => {
          const next = new Map(prev);
          next.delete(convoId);
          return next;
        });
        localStorage.setItem(`group_last_seen:${convoId}`, new Date().toISOString());
        return;
      }

      // DMs — delegate to libs hook
      await markDMRead(convoId);
    },
    [userId, groupIds, markDMRead],
  );

  const totalUnread = totalDMUnread + Array.from(groupCounts.values()).reduce((s, n) => s + n, 0);

  return { counts, markRead, totalUnread };
}
