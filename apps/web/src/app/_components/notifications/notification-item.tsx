"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import type { Notification } from "@kurate/types";
import { createClient } from "@/app/_libs/supabase/client";
import { useTranslations } from "@/i18n/use-translations";

interface NotificationItemProps {
  notification: Notification;
  onNavigate: () => void;
  markRead: (id: string) => Promise<void>;
}

export function NotificationItem({
  notification,
  onNavigate,
  markRead,
}: NotificationItemProps) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const actor = notification.actors[0] ?? null;

  const displayName = actor
    ? [actor.first_name, actor.last_name].filter(Boolean).join(" ") ||
      actor.handle ||
      "Someone"
    : "Someone";

  const initial = displayName[0]?.toUpperCase() ?? "?";
  const eventKey = `event_${notification.event_type}` as const;
  const label = t(eventKey) ?? notification.message ?? notification.event_type;

  async function handleClick() {
    await markRead(notification.id);
    onNavigate();

    if (!["like", "must_read", "comment", "new_post", "also_must_read", "also_commented", "must_read_broadcast", "co_engaged"].includes(notification.event_type)) return;
    if (!notification.event_id) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("group_posts")
      .select("convo_id")
      .eq("id", notification.event_id)
      .single();

    if (data) {
      router.push(`/groups/${data.convo_id}#drop-${notification.event_id}`);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
    >
      {/* Actor avatar */}
      <div className="relative mt-0.5 size-9 shrink-0">
        <div className="bg-primary/10 relative flex size-9 items-center justify-center overflow-hidden rounded-full">
          {actor?.avatar_url ? (
            <Image
              src={actor.avatar_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <span className="text-primary text-sm font-bold">{initial}</span>
          )}
        </div>
        {!notification.is_read && (
          <span className="bg-primary absolute -top-0.5 -right-0.5 size-2.5 rounded-full" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm leading-snug">
          <span className="font-semibold">{displayName}</span>{" "}
          <span className="text-muted-foreground">{label}</span>
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </button>
  );
}
