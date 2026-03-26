"use client";

import { useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

const supabase = createClient();

export type NotificationActor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

export type Notification = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  event_id: string | null;
  event_type: string;
  is_read: boolean;
  message: string | null;
  created_at: string;
  actors: NotificationActor[];
};

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      recipient_id,
      actor_id,
      event_id,
      event_type,
      is_read,
      message,
      created_at,
      actors:notification_actors(
        profile:actor_id(id, first_name, last_name, handle,
          avatar:avatar_id(file_path, bucket_name))
      )
    `)
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as {
      id: string;
      recipient_id: string;
      actor_id: string | null;
      event_id: string | null;
      event_type: string;
      is_read: boolean;
      message: string | null;
      created_at: string;
      actors: Array<{
        profile: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          handle: string | null;
          avatar: { file_path: string; bucket_name: string } | null;
        } | null;
      }> | null;
    };

    const actors: NotificationActor[] = (r.actors ?? [])
      .map((a) => {
        const p = a.profile;
        if (!p) return null;
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          handle: p.handle,
          avatar_url: p.avatar ? mediaToUrl(p.avatar) : null,
        };
      })
      .filter(Boolean) as NotificationActor[];

    return {
      id: r.id,
      recipient_id: r.recipient_id,
      actor_id: r.actor_id,
      event_id: r.event_id,
      event_type: r.event_type,
      is_read: r.is_read,
      message: r.message,
      created_at: r.created_at,
      actors,
    };
  });
}

export function useNotifications(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.list(userId ?? ""),
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
  });

  // Realtime subscription: invalidate on new notification for this user
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const row = payload.new as { recipient_id: string };
          if (row.recipient_id !== userId) return;
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.list(userId),
          });
        },
      )
      .subscribe((_status, err) => {
        if (err) console.error("[useNotifications] subscription error:", err);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.list(userId),
    });
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.list(userId ?? ""),
    });
  }

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markAllRead,
    markRead,
  };
}
