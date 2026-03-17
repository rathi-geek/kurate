"use client";

import { useState, useEffect, useCallback } from "react";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useUnreadCounts(userId: string | null) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("convo_id")
      .eq("user_id", userId);

    const convoIds = (memberships ?? []).map((m) => m.convo_id);
    if (!convoIds.length) return;

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

    const map = new Map<string, number>();
    for (const msg of messages ?? []) {
      if (!readSet.has(msg.id)) {
        map.set(msg.convo_id, (map.get(msg.convo_id) ?? 0) + 1);
      }
    }
    setCounts(map);
  }, [userId]);

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
      .subscribe((status, err) => {
        if (err) console.error("[useUnreadCounts] subscription error:", err);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchCounts]);

  const markRead = useCallback(
    async (convoId: string) => {
      if (!userId) return;

      setCounts((prev) => {
        const next = new Map(prev);
        next.delete(convoId);
        return next;
      });

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
    [userId],
  );

  const totalUnread = Array.from(counts.values()).reduce((s, n) => s + n, 0);

  return { counts, markRead, totalUnread };
}
