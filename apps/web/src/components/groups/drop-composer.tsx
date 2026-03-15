"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Typewriter } from "@/components/ui/typewriter";
import { CyclingText } from "@/components/ui/cycling-text";

import { ChatInput } from "@/app/_components/home/chat-input";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { useExtractMetadata } from "@/app/_libs/hooks/useExtractMetadata";
import { getLinkCopy } from "@/app/_libs/utils/getLinkCopy";
import { springGentle } from "@/app/_libs/utils/motion";
import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";

const supabase = createClient();

interface DropComposerProps {
  groupId: string;
  currentUserId: string;
  onDropPosted: () => void;
}

export function DropComposer({ groupId, currentUserId, onDropPosted }: DropComposerProps) {
  const t = useTranslations("groups");
  const tLinkPreview = useTranslations("link_preview");
  const prefersReducedMotion = useReducedMotion();
  const saveItem = useSaveItem();
  const queryClient = useQueryClient();

  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  // Text-only post state (requires DB migration: group_shares.content + nullable logged_item_id)
  const [pendingTextPost, setPendingTextPost] = useState<string | null>(null);

  const { isExtracting, metadata, extractionFailed, extract, reset } = useExtractMetadata();
  const linkCopy = getLinkCopy(detectedUrl ?? "", tLinkPreview as (key: string) => string);

  const showPopup = isExtracting || !!metadata || !!detectedUrl || extractionFailed || !!pendingTextPost;

  const handleUrlChange = useCallback(async (url: string | null) => {
    setDetectedUrl(url);
    if (!url) {
      reset();
      return;
    }
    await extract(url);
  }, [extract, reset]);

  const handlePost = async () => {
    if (!detectedUrl || !currentUserId) return;
    setIsPosting(true);
    try {
      const saveResult = await saveItem.mutateAsync({
        url: detectedUrl,
        title: metadata?.title,
        source: metadata?.source,
        author: metadata?.author,
        preview_image: metadata?.preview_image,
        content_type: metadata?.content_type ?? "article",
        read_time: metadata?.read_time,
        save_source: "feed",
      });

      let loggedItemId: string | null = null;

      if (saveResult.status === "saved" && saveResult.item) {
        loggedItemId = saveResult.item.id;
      } else if (saveResult.status === "duplicate") {
        const { data } = await supabase
          .from("logged_items")
          .select("id")
          .eq("user_id", currentUserId)
          .eq("url", detectedUrl)
          .maybeSingle();
        loggedItemId = data?.id ?? null;
      }

      if (!loggedItemId) return;

      const { error } = await supabase.from("group_shares").insert({
        group_id: groupId,
        logged_item_id: loggedItemId,
        shared_by: currentUserId,
        note: note.trim() || null,
      });

      if (error) throw new Error(error.message);

      if (saveResult.status === "saved") {
        const itemId = loggedItemId;
        toast("Shared to the group", {
          action: {
            label: "Save to vault",
            onClick: () => {},
          },
          cancel: {
            label: "Remove from vault",
            onClick: async () => {
              await supabase.from("logged_items").delete().eq("id", itemId);
              queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
            },
          },
          duration: 6000,
        });
      } else {
        toast.success("Shared to the group");
      }

      setDetectedUrl(null);
      reset();
      setNote("");
      onDropPosted();
    } finally {
      setIsPosting(false);
    }
  };

  // Text-only post handler — requires DB migration before insert will work
  // Migration needed: group_shares.content TEXT, logged_item_id nullable
  const handleTextPost = async () => {
    if (!pendingTextPost?.trim() || !currentUserId) return;
    setIsPosting(true);
    try {
      // group_shares.content and nullable logged_item_id require DB migration
      // After migration, remove the `as any` cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("group_shares") as any).insert({
        group_id: groupId,
        shared_by: currentUserId,
        content: pendingTextPost.trim(),
      });
      if (error) throw new Error(error.message);
      setPendingTextPost(null);
      onDropPosted();
    } finally {
      setIsPosting(false);
    }
  };

  const handleSend = (text: string) => {
    // URL path is handled by onUrlChange; this fires for text-only input
    if (detectedUrl) return;
    if (text.trim()) setPendingTextPost(text.trim());
  };

  return (
    <div className="relative px-4 pt-3 pb-1">
      {/* ── Input bar ─────────────────────────────────────────────────── */}
      <ChatInput
        onSend={handleSend}
        onUrlChange={handleUrlChange}
        placeholder={t("composer_placeholder")}
        showPlusIcon={false}
      />

      {/* ── Floating popup — slides down below input when URL detected ── */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="absolute top-full left-4 right-4 z-50 mt-2"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={springGentle}
          >
            <div className="bg-card rounded-card border shadow-lg p-3 space-y-3">
              {/* Extraction animation */}
              {isExtracting && detectedUrl && (
                <div className="space-y-1 px-0.5 py-1">
                  <p className="text-xs font-medium text-foreground">
                    <Typewriter text={linkCopy.heading} />
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    <CyclingText phrases={linkCopy.subtitles} />
                  </p>
                </div>
              )}

              {/* Extraction failure fallback */}
              {extractionFailed && !metadata && detectedUrl && (
                <div className="rounded-card bg-surface border px-3 py-2">
                  <p className="text-sm text-muted-foreground font-mono truncate">{detectedUrl}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Could not load preview</p>
                </div>
              )}

              {/* Link preview */}
              {metadata && !isExtracting && (
                <div className="rounded-card bg-surface border overflow-hidden">
                  {metadata.preview_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={metadata.preview_image}
                      alt={metadata.title ?? ""}
                      className="h-24 w-full object-cover"
                    />
                  )}
                  <div className="p-2.5">
                    <p className="text-foreground line-clamp-2 text-sm font-medium">
                      {metadata.title ?? metadata.url}
                    </p>
                    {metadata.source && (
                      <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                        {metadata.source}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Note + Post (URL path) */}
              {detectedUrl && (
                <>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("note_placeholder")}
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPosting}
                      onClick={() => {
                        setDetectedUrl(null);
                        reset();
                        setNote("");
                      }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePost}
                      disabled={isPosting || !detectedUrl}
                      size="sm"
                    >
                      {isPosting ? t("posting") : t("post")}
                    </Button>
                  </div>
                </>
              )}

              {/* Text-only post (requires DB migration: group_shares.content + nullable logged_item_id) */}
              {pendingTextPost && !detectedUrl && (
                <>
                  <p className="text-sm text-foreground leading-relaxed px-0.5">
                    {pendingTextPost}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPosting}
                      onClick={() => setPendingTextPost(null)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleTextPost}
                      disabled={isPosting}
                      size="sm"
                      title="Requires DB migration"
                    >
                      {isPosting ? t("posting") : t("post")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
