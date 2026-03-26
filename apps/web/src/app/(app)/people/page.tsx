"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ROUTES } from "@kurate/utils";

import { FindUserSheet } from "@/app/_components/people/find-user-sheet";
import { useDMConversations } from "@/app/_libs/hooks/useDMConversations";
import { createClient } from "@/app/_libs/supabase/client";
import { PlusIcon } from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

const supabase = createClient();

function formatRelativeTime(iso: string, justNowLabel: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return justNowLabel;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PeoplePage() {
  const t = useTranslations("people");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const { conversations, isLoading } = useDMConversations(currentUserId);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-foreground font-sans text-xl font-bold">{t("page_title")}</h1>
        <button
          type="button"
          onClick={() => setNewMessageOpen(true)}
          className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90">
          <PlusIcon className="h-3 w-3" />
          {t("new_message_btn")}
        </button>
      </div>

      {/* Conversations list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface h-16 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground text-sm">{t("empty_title")}</p>
          <p className="text-muted-foreground mt-1 text-xs">{t("empty_subtitle")}</p>
          <button
            type="button"
            onClick={() => setNewMessageOpen(true)}
            className="bg-primary text-primary-foreground mt-4 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90">
            {t("empty_cta")}
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((convo) => (
            <Link
              key={convo.id}
              href={ROUTES.APP.PERSON(convo.id)}
              className="flex items-center gap-3 rounded-xl border border-ink/6 bg-white px-3 py-3 transition-colors hover:bg-surface">
              <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary text-sm font-bold">
                  {(
                    convo.otherUser.display_name?.[0] ??
                    convo.otherUser.handle?.[0] ??
                    "?"
                  ).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {convo.otherUser.display_name ??
                      (convo.otherUser.handle ? `@${convo.otherUser.handle}` : t("unknown"))}
                  </p>
                  {convo.lastMessage && (
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {formatRelativeTime(convo.lastMessage.sentAt, t("time_just_now"))}
                    </span>
                  )}
                </div>
                {convo.lastMessage && (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {convo.lastMessage.text}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New message sheet */}
      {currentUserId && (
        <FindUserSheet
          open={newMessageOpen}
          onOpenChange={setNewMessageOpen}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
