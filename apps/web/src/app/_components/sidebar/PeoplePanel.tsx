"use client";

import { useState } from "react";

import Link from "next/link";

import type { DMConversation } from "@kurate/types";
import { ROUTES, formatRelativeTime } from "@kurate/utils";

import { FindUserSheet } from "@/app/_components/people/find-user-sheet";
import { PlusIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "@/i18n/use-translations";

interface PeoplePanelProps {
  userId: string | null;
  conversations: DMConversation[];
  isLoading: boolean;
}

export function PeoplePanel({ userId, conversations, isLoading }: PeoplePanelProps) {
  const t = useTranslations("people");
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
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
              className="border-ink/6 hover:bg-surface flex items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-colors">
              <Avatar className="size-10">
                {convo.otherUser.avatar_url && (
                  <AvatarImage src={convo.otherUser.avatar_url} alt={convo.otherUser.display_name ?? convo.otherUser.handle ?? ""} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {(convo.otherUser.display_name?.[0] ?? convo.otherUser.handle?.[0] ?? "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {convo.otherUser.display_name ??
                      (convo.otherUser.handle ? `@${convo.otherUser.handle}` : t("unknown"))}
                  </p>
                  {convo.lastMessage && (
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {formatRelativeTime(convo.lastMessage.sentAt)}
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

      {userId && (
        <FindUserSheet
          open={newMessageOpen}
          onOpenChange={setNewMessageOpen}
          currentUserId={userId}
        />
      )}
    </div>
  );
}
