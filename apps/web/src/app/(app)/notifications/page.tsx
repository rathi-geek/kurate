"use client";

import { useAuth } from "@/app/_libs/auth-context";
import { useNotifications } from "@/app/_libs/hooks/useNotifications";
import { useAutoMarkRead } from "@/app/_libs/hooks/useAutoMarkRead";
import { NotificationItem } from "@/app/_components/notifications/notification-item";
import { useTranslations } from "@/i18n/use-translations";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { notifications, unreadCount, isLoading, markAllRead, markRead } =
    useNotifications(userId);

  useAutoMarkRead(true, unreadCount, markAllRead);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-ink/8 px-4 py-3">
        <h1 className="font-sans text-base font-bold text-ink">{t("title")}</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="font-sans text-xs text-ink/40 transition-colors hover:text-ink/70">
            {t("mark_all_read")}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-9 shrink-0 animate-pulse rounded-full bg-ink/8" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-ink/8" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-ink/8" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <p className="font-sans text-sm font-medium text-ink/50">{t("empty_title")}</p>
            <p className="mt-1 font-mono text-xs text-ink/30">
              {t("empty_subtitle")}
            </p>
          </div>
        )}

        {!isLoading &&
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onNavigate={() => {}}
              markRead={markRead}
            />
          ))}
      </div>
    </div>
  );
}
