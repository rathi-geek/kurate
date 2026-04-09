"use client";

import { LuX } from "react-icons/lu";

import type { Notification } from "@kurate/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAutoMarkRead } from "@/app/_libs/hooks/useAutoMarkRead";
import { useTranslations } from "@/i18n/use-translations";
import { NotificationItem } from "./notification-item";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  markAllRead,
  markRead,
}: NotificationPanelProps) {
  const t = useTranslations("notifications");

  useAutoMarkRead(open, unreadCount, markAllRead);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showClose={false}
        className="flex w-full max-w-sm flex-col p-0">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <SheetTitle className="text-base min-w-0 flex-1 truncate">{t("title")}</SheetTitle>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-muted-foreground hover:text-foreground shrink-0 text-xs transition-colors">
                {t("mark_all_read")}
              </button>
            )}
            <SheetClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary shrink-0 rounded-xs p-1 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden">
              <LuX className="size-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="bg-muted size-9 shrink-0 animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="text-muted-foreground flex flex-col items-center justify-center px-4 py-16 text-center">
              <p className="text-sm font-medium">{t("empty_title")}</p>
              <p className="mt-1 text-xs">
                {t("empty_subtitle")}
              </p>
            </div>
          )}

          {!isLoading &&
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onNavigate={onClose}
                markRead={markRead}
              />
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
