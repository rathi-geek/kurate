"use client";

import { useState, useEffect, useCallback } from "react";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useUnreadCounts(userId: string | null, groupIds?: Set<string>) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [resubscribeKey, setResubscribeKey] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("convo_id")
      .eq("user_id", userId);

    const convoIds = (memberships ?? []).map((m) => m.convo_id);

    const map = new Map<string, number>();

    if (convoIds.length) {
      const { data: readReceiptIds } = await supabase
        .from("message_read_receipts")
        .select("message_id")
        .eq("user_id", userId);

      const readSet = new Set((readReceiptIds ?? []).map((r) => r.message_id));

      const { data: messages } = await supabase
        .from("messages")
        .select("id, convo_id")
        .in("convo_id", convoIds)
        .neq("sender_id", userId);

      for (const msg of messages ?? []) {
        if (!readSet.has(msg.id)) {
          map.set(msg.convo_id, (map.get(msg.convo_id) ?? 0) + 1);
        }
      }
    }

    // Group post unread counts — tracked via localStorage last-seen timestamps
    if (groupIds && groupIds.size > 0) {
      const groupIdArr = Array.from(groupIds);
      for (const gid of groupIdArr) {
        const lastSeen = localStorage.getItem(`group_last_seen:${gid}`);
        if (!lastSeen) {
          // No prior visit — treat as all-read until realtime fires
          map.set(gid, 0);
          continue;
        }
        let query = supabase
          .from("group_posts")
          .select("id", { count: "exact", head: true })
          .eq("convo_id", gid)
          .neq("shared_by", userId)
          .gt("shared_at", lastSeen);
        const { count } = await query;
        if (count) map.set(gid, count);
      }
    }

    setCounts(map);
  }, [userId, groupIds]);

  useEffect(() => {
    if (!userId) return;
    void fetchCounts();

    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { id: string; convo_id: string; sender_id: string };
          if (msg.sender_id === userId) return;
          setCounts((prev) => {
            const next = new Map(prev);
            next.set(msg.convo_id, (next.get(msg.convo_id) ?? 0) + 1);
            return next;
          });
        },
      )
      .subscribe((_status, err) => {
        if (err) console.error("[useUnreadCounts] subscription error:", err);
      });

    const groupChannel = supabase
      .channel("unread-group-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_posts" },
        (payload) => {
          const post = payload.new as { id: string; convo_id: string; shared_by: string };
          if (post.shared_by === userId) return;
          if (!groupIds?.has(post.convo_id)) return;
          setCounts((prev) => {
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
      void supabase.removeChannel(channel);
      void supabase.removeChannel(groupChannel);
    };
  }, [userId, fetchCounts, groupIds, resubscribeKey]);

  // Re-fetch + re-subscribe when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchCounts();
        setResubscribeKey((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchCounts]);

  const markRead = useCallback(
    async (convoId: string) => {
      if (!userId) return;

      setCounts((prev) => {
        const next = new Map(prev);
        next.delete(convoId);
        return next;
      });

      // Group posts — track via localStorage, no DB write needed
      if (groupIds?.has(convoId)) {
        localStorage.setItem(`group_last_seen:${convoId}`, new Date().toISOString());
        return;
      }

      const { data: readReceiptIds } = await supabase
        .from("message_read_receipts")
        .select("message_id")
        .eq("user_id", userId);

      const readSet = new Set((readReceiptIds ?? []).map((r) => r.message_id));

      const { data: unread } = await supabase
        .from("messages")
        .select("id")
        .eq("convo_id", convoId)
        .neq("sender_id", userId);

      const toMark = (unread ?? []).filter((m) => !readSet.has(m.id));
      if (!toMark.length) return;

      await supabase.from("message_read_receipts").insert(
        toMark.map((m) => ({
          message_id: m.id,
          user_id: userId,
          read_at: new Date().toISOString(),
        })),
      );
    },
    [userId, groupIds],
  );

  const totalUnread = Array.from(counts.values()).reduce((s, n) => s + n, 0);

  return { counts, markRead, totalUnread };
}
