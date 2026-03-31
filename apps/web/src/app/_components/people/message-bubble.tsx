"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/use-translations";

import { queryKeys } from "@kurate/query";
import { createClient } from "@/app/_libs/supabase/client";
import type { DMMessage } from "@kurate/types";
import { PencilIcon, ReplyIcon, SmileIcon, TrashIcon } from "@/components/icons";
import Link from "next/link";
import { track } from "@/app/_libs/utils/analytics";

const supabase = createClient();

const EMOJI_ROWS = [
  ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"],
  ["😍", "🥰", "😊", "😎", "🤔", "😅", "🥲", "😭"],
  ["💯", "✨", "💪", "👏", "🫶", "🤝", "💀", "🫡"],
  ["😡", "🤯", "🥳", "😴", "🤮", "👀", "🫠", "💔"],
];

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MessageBubbleProps {
  message: DMMessage;
  currentUserId: string;
  convoId: string;
  allMessages?: DMMessage[];
  onReply?: (msg: DMMessage) => void;
  onEdit?: (msg: DMMessage) => void;
  isContinuation?: boolean;
}

export function MessageBubble({
  message,
  currentUserId,
  convoId,
  allMessages = [],
  onReply,
  onEdit,
  isContinuation = false,
}: MessageBubbleProps) {
  const t = useTranslations("people");
  const queryClient = useQueryClient();
  const isOwn = message.sender_id === currentUserId;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  const groupedReactions = message.reactions.reduce<
    Record<string, { count: number; myReaction: boolean }>
  >((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, myReaction: false };
    acc[r.emoji]!.count++;
    if (r.user_id === currentUserId) acc[r.emoji]!.myReaction = true;
    return acc;
  }, {});

  const handleReact = async (emoji: string) => {
    setPickerOpen(false);
    const myReaction = groupedReactions[emoji]?.myReaction;
    if (myReaction) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", message.id)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("message_reactions")
        .insert({ message_id: message.id, user_id: currentUserId, emoji });
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.people.messages(convoId) });
  };

  const handleDelete = async () => {
    if (!isOwn) return;
    await supabase.from("messages").delete().eq("id", message.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.people.messages(convoId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.people.conversations() });
  };

  // Find quoted parent message
  const parentMessage = message.message_parent_id
    ? allMessages.find((m) => m.id === message.message_parent_id)
    : null;

  return (
    <div
      className={`group/msg relative flex gap-2 px-4 ${isContinuation ? "pt-0.5 pb-1" : "py-1"} ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex max-w-[75%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div className="relative" ref={pickerRef}>
          {/* Floating action pill — beside the bubble */}
          <div
            className={`border-border/50 absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-full border bg-white px-2 py-1 opacity-0 shadow-md transition-opacity group-hover/msg:opacity-100 ${
              isOwn ? "right-full mr-1.5" : "left-full ml-1.5"
            }`}>
            {/* React button — opens emoji picker */}
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("bubble_react_aria")}>
              <SmileIcon className="h-4 w-4" />
            </button>

            <div className="bg-border/60 mx-0.5 h-4 w-px" />

            {/* Reply button — available for all messages */}
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t("bubble_reply_aria")}>
                <ReplyIcon className="h-[15px] w-[15px]" />
              </button>
            )}

            {/* Edit button — own text messages only */}
            {isOwn && message.message_type === "text" && onEdit && (
              <>
                <div className="bg-border/60 mx-0.5 h-4 w-px" />
                <button
                  type="button"
                  onClick={() => onEdit(message)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Edit message">
                  <PencilIcon className="h-3 w-3" />
                </button>
              </>
            )}

            {/* Delete button — own messages only */}
            {isOwn && (
              <>
                <div className="bg-border/60 mx-0.5 h-4 w-px" />
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={t("bubble_delete_aria")}>
                  <TrashIcon className="h-3 w-3" />
                </button>
              </>
            )}
          </div>

          {/* Emoji picker panel — beside the bubble, aligned to bottom of pill */}
          {pickerOpen && (
            <div
              className={`border-border/50 absolute top-1/2 z-20 -translate-y-1/2 rounded-2xl border bg-white p-2 shadow-lg ${
                isOwn ? "right-full mr-10" : "left-full ml-10"
              }`}>
              {EMOJI_ROWS.map((row, i) => (
                <div key={i} className="flex gap-0.5">
                  {row.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => void handleReact(emoji)}
                      className={`hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:scale-125 ${
                        groupedReactions[emoji]?.myReaction ? "bg-primary/10" : ""
                      }`}
                      title={emoji}>
                      {emoji}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div
            className={`rounded-2xl px-3 py-2 text-sm ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-surface text-foreground border-border rounded-bl-sm border"
            }`}>
            {/* Quoted parent message */}
            {parentMessage && (
              <div
                className={`mb-2 rounded-lg border-l-2 py-1 pr-1 pl-2 text-[11px] ${
                  isOwn ? "border-white/40 bg-white/10" : "border-primary/40 bg-background/60"
                }`}>
                <p className={`font-semibold ${isOwn ? "text-white/80" : "text-foreground/70"}`}>
                  {parentMessage.sender.display_name ?? `@${parentMessage.sender.handle}`}
                </p>
                <p className={`line-clamp-2 ${isOwn ? "text-white/60" : "text-muted-foreground"}`}>
                  {parentMessage.message_text || parentMessage.item?.title || t("link_fallback")}
                </p>
              </div>
            )}

            {/* Note above link (logged_item type) */}
            {message.message_type === "logged_item" && message.message_text && (
              <p className="mb-2 text-sm">{message.message_text}</p>
            )}

            {/* Link card */}
            {message.message_type === "logged_item" && message.item && (
              <Link
                href={message.item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("link_opened", { context: "personal_chat" })}
                className={`block overflow-hidden rounded-xl border ${
                  isOwn ? "border-white/20 bg-white/10" : "border-border bg-background"
                } transition-opacity hover:opacity-80`}>
                {message.item.preview_image_url && (
                  <span className="relative block h-32 w-full">
                    <Image
                      src={message.item.preview_image_url}
                      alt={message.item.title ?? ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 480px) 100vw, 360px"
                    />
                  </span>
                )}
                <div className="p-2">
                  {message.item.title && (
                    <p
                      className={`line-clamp-2 text-xs font-medium ${isOwn ? "text-white" : "text-foreground"}`}>
                      {message.item.title}
                    </p>
                  )}
                  {message.item.description && (
                    <p
                      className={`mt-0.5 line-clamp-2 text-[10px] ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                      {message.item.description}
                    </p>
                  )}
                  <p
                    className={`mt-1 truncate text-[10px] ${isOwn ? "text-white/50" : "text-muted-foreground/70"}`}>
                    {new URL(message.item.url).hostname.replace("www.", "")}
                  </p>
                </div>
              </Link>
            )}
            <div className="flex flex-row items-end justify-between gap-2">
              {/* Plain text */}
              {message.message_type === "text" && (
                <p className="leading-none wrap-break-word whitespace-pre-wrap">
                  {message.message_text}
                </p>
              )}

              {/* Timestamp — inside pill, bottom-right like WhatsApp */}
              <div className="flex justify-end">
                <span
                  className={`text-[9px] leading-none ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reactions bar */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {Object.entries(groupedReactions).map(([emoji, { count, myReaction }]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => void handleReact(emoji)}
                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors ${
                  myReaction
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-surface"
                }`}>
                <span>{emoji}</span>
                <span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
