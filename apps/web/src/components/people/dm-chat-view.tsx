"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { useTranslations } from "next-intl";

import { useMessages } from "@/app/_libs/hooks/useMessages";
import type { DMMessage } from "@/app/_libs/types/people";
import { ROUTES } from "@/app/_libs/constants/routes";
import { useSidebarContextOptional } from "@/app/_components/sidebar/sidebar-context";
import { ChevronLeftIcon } from "@/components/icons";
import { Link } from "@/i18n";
import { MessageBubble } from "./message-bubble";
import { DmComposer } from "./dm-composer";

interface DmChatViewProps {
  convoId: string;
  currentUserId: string;
  otherUserName: string;
}

export function DmChatView({ convoId, currentUserId, otherUserName }: DmChatViewProps) {
  const t = useTranslations("people");
  const sidebarCtx = useSidebarContextOptional();
  const { messages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMessages(convoId);

  useEffect(() => {
    void sidebarCtx?.markRead?.(convoId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convoId, messages.length]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const [replyingTo, setReplyingTo] = useState<{
    messageId: string;
    senderName: string;
    text: string;
  } | null>(null);

  // Initial scroll to bottom once messages load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading, messages.length]);

  // After messages change:
  // - If we loaded older messages → restore scroll position so view doesn't jump
  // - If a new message arrived at bottom → scroll to bottom smoothly
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (loadingOlderRef.current) {
      // Restore position: new content was prepended above
      const scrolled = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = scrolled;
      loadingOlderRef.current = false;
      prevScrollHeightRef.current = 0;
    } else if (initialLoadDoneRef.current) {
      // A new message arrived — only scroll if already near bottom
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 120) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length]);

  // Detect scroll to top → load older messages
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage || loadingOlderRef.current) return;

    if (container.scrollTop < 80) {
      loadingOlderRef.current = true;
      prevScrollHeightRef.current = container.scrollHeight;
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleReply = (msg: DMMessage) => {
    setReplyingTo({
      messageId: msg.id,
      senderName: msg.sender.display_name ?? `@${msg.sender.handle}`,
      text: msg.message_text ?? (msg.item?.title ?? "Link"),
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border/60 flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3">
        <Link
          href={ROUTES.APP.PEOPLE}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("back_aria")}
        >
          <ChevronLeftIcon className="h-[18px] w-[18px]" />
        </Link>
        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
          <span className="text-primary text-xs font-bold">
            {(otherUserName[0] ?? "?").toUpperCase()}
          </span>
        </div>
        <h1 className="text-foreground font-sans text-sm font-semibold">{otherUserName}</h1>
      </div>

      {/* Messages list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto py-2"
      >
        {/* Loading older messages indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <p className="text-muted-foreground text-xs">{t("chat_loading_older")}</p>
          </div>
        )}

        {/* End of history indicator */}
        {!hasNextPage && messages.length >= 30 && (
          <div className="flex justify-center py-2">
            <p className="text-muted-foreground/50 text-[10px]">{t("chat_beginning")}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">{t("chat_loading")}</p>
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">{t("chat_empty", { name: otherUserName })}</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentUserId}
            convoId={convoId}
            allMessages={messages}
            onReply={handleReply}
            isContinuation={index > 0 && messages[index - 1]?.sender_id === msg.sender_id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <DmComposer
        convoId={convoId}
        currentUserId={currentUserId}
        replyTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onMessageSent={() => {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
      />
    </div>
  );
}
