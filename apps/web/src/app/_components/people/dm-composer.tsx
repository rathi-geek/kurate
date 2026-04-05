"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/use-translations";

import { Textarea } from "@/components/ui/textarea";

import { UrlExtractPreview } from "@/app/_components/shared/url-extract-preview";
import { useExtractMetadata } from "@kurate/hooks";
import { generateUrlHash } from "@/app/_libs/hooks/useSaveItem";
import { queryKeys } from "@kurate/query";
import { createClient } from "@/app/_libs/supabase/client";
import { CloseIcon, SendIcon } from "@/components/icons";

const supabase = createClient();

const URL_REGEX = /https?:\/\/[^\s]+/;

interface DmComposerProps {
  convoId: string;
  currentUserId: string;
  onMessageSent?: () => void;
  replyTo?: { messageId: string; senderName: string; text: string } | null;
  onCancelReply?: () => void;
  editingMessage?: { messageId: string; text: string } | null;
  onCancelEdit?: () => void;
}

export function DmComposer({
  convoId,
  currentUserId,
  onMessageSent,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}: DmComposerProps) {
  const t = useTranslations("people");
  const queryClient = useQueryClient();
  const {
    isExtracting,
    metadata,
    extractionFailed,
    extract,
    reset: resetMetadata,
  } = useExtractMetadata();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const detectedUrlRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea whenever a reply is set
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  // Prefill text and focus when editing starts
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editingMessage?.messageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTextChange = useCallback(
    async (value: string) => {
      setText(value);
      const match = URL_REGEX.exec(value);
      const url = match?.[0] ?? null;
      if (url && url !== detectedUrlRef.current) {
        detectedUrlRef.current = url;
        await extract(url);
      } else if (!url && detectedUrlRef.current) {
        detectedUrlRef.current = null;
        resetMetadata();
      }
    },
    [extract, resetMetadata],
  );

  const handleDismissPreview = () => {
    detectedUrlRef.current = null;
    resetMetadata();
  };

  const handleSend = async () => {
    const trimmedText = text.trim();

    // Edit mode — update existing message
    if (editingMessage) {
      if (!trimmedText) return;
      setSending(true);
      try {
        await supabase
          .from("messages")
          .update({ message_text: trimmedText })
          .eq("id", editingMessage.messageId)
          .eq("sender_id", currentUserId);
        setText("");
        onCancelEdit?.();
        await queryClient.invalidateQueries({ queryKey: queryKeys.people.messages(convoId) });
        onMessageSent?.();
        textareaRef.current?.focus();
      } finally {
        setSending(false);
      }
      return;
    }

    const hasLink = !!metadata && !!detectedUrlRef.current;
    if (!trimmedText && !hasLink) return;

    setSending(true);
    try {
      if (hasLink && metadata) {
        const url = metadata.url;
        const url_hash = await generateUrlHash(url);
        const { data: loggedItem, error: liError } = await supabase
          .from("logged_items")
          .upsert(
            {
              url,
              url_hash,
              title: metadata.title ?? url,
              content_type: metadata.content_type ?? "article",
              preview_image_url: metadata.preview_image ?? null,
              description: null,
              raw_metadata: {
                source: metadata.source ?? null,
                author: metadata.author ?? null,
                read_time: metadata.read_time ?? null,
              },
            },
            { onConflict: "url_hash" },
          )
          .select("id")
          .single();

        if (liError) throw new Error(liError.message);

        await supabase.from("messages").insert({
          convo_id: convoId,
          sender_id: currentUserId,
          message_text: trimmedText.replace(URL_REGEX, "").trim() || "",
          message_type: "logged_item",
          logged_item_id: loggedItem.id,
          ...(replyTo ? { message_parent_id: replyTo.messageId } : {}),
        });

        resetMetadata();
        detectedUrlRef.current = null;
      } else {
        await supabase.from("messages").insert({
          convo_id: convoId,
          sender_id: currentUserId,
          message_text: trimmedText,
          message_type: "text",
          ...(replyTo ? { message_parent_id: replyTo.messageId } : {}),
        });
      }

      setText("");
      onCancelReply?.();
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.messages(convoId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.conversations() });
      onMessageSent?.();
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const hasContent = text.trim().length > 0 || !!metadata;

  return (
    <div className="border-border/60 border-t bg-white px-4 py-3">
      {/* Edit context banner */}
      {editingMessage && (
        <div className="border-border/50 bg-surface mb-2 flex items-center gap-2 rounded-lg border px-3 py-2">
          <div className="bg-primary w-0.5 self-stretch rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="text-primary text-[11px] font-semibold">{t("composer_editing")}</p>
            <p className="text-muted-foreground line-clamp-1 text-[11px]">{editingMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => { setText(""); onCancelEdit?.(); }}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            aria-label="Cancel edit">
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Reply context banner */}
      {replyTo && (
        <div className="border-border/50 bg-surface mb-2 flex items-center gap-2 rounded-lg border px-3 py-2">
          <div className="bg-primary w-0.5 self-stretch rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="text-primary text-[11px] font-semibold">{replyTo.senderName}</p>
            <p className="text-muted-foreground line-clamp-1 text-[11px]">{replyTo.text}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            aria-label={t("composer_cancel_reply_aria")}>
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Link preview — shared UrlExtractPreview with Typewriter/CyclingText animations */}
      {(isExtracting || metadata || extractionFailed) && detectedUrlRef.current && (
        <div className="border-border bg-surface mb-2 overflow-hidden rounded-xl border">
          <div className="flex items-start">
            <div className="min-w-0 flex-1">
              <UrlExtractPreview
                url={detectedUrlRef.current}
                isLoading={isExtracting}
                extractionFailed={extractionFailed}
                metadata={
                  metadata
                    ? {
                        title: metadata.title,
                        source: metadata.source,
                        previewImage: metadata.preview_image ?? null,
                        contentType: metadata.content_type ?? null,
                        readTime: metadata.read_time ?? null,
                      }
                    : null
                }
              />
            </div>
            <button
              type="button"
              onClick={handleDismissPreview}
              className="text-muted-foreground hover:text-foreground m-2 shrink-0 self-start transition-colors"
              aria-label={t("composer_dismiss_preview_aria")}>
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Textarea with send button inside */}
      <div className="border-border/60 bg-surface focus-within:ring-primary/30 flex items-end rounded-2xl border focus-within:ring-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => void handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("composer_placeholder")}
          rows={1}
          className="max-h-32 min-h-[38px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-2 text-sm shadow-none outline-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!hasContent || sending}
          aria-label={t("composer_send_aria")}
          className="bg-primary text-primary-foreground enabled:hover:bg-primary enabled:hover:text-primary-foreground mr-1.5 mb-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-25">
          <SendIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
