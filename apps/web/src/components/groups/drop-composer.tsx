"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ChatInput } from "@/app/_components/home/chat-input";
import { UrlExtractPreview } from "@/app/_components/shared/url-extract-preview";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { useExtractMetadata } from "@/app/_libs/hooks/useExtractMetadata";
import { springGentle, shadowFloating, shadowHoverGlow, successGlowBoxShadow, successGlowTransition } from "@/app/_libs/utils/motion";
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
  const prefersReducedMotion = useReducedMotion();
  const saveItem = useSaveItem();
  const queryClient = useQueryClient();

  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  // Text-only post state (requires DB migration: group_shares.content + nullable logged_item_id)
  const [pendingTextPost, setPendingTextPost] = useState<string | null>(null);

  const { isExtracting, metadata, extractionFailed, extract, reset } = useExtractMetadata();

  const boxShadow = isHovered
    ? shadowHoverGlow
    : metadata && !isExtracting
      ? successGlowBoxShadow
      : shadowFloating;

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
        save_source: "shares",
      });

      const loggedItemId = saveResult.item?.logged_item_id ?? null;

      if (!loggedItemId) return;

      const { error } = await supabase.from("group_posts").insert({
        convo_id: groupId,
        logged_item_id: loggedItemId,
        shared_by: currentUserId,
        note: note.trim() || null,
      });

      if (error) throw new Error(error.message);

      if (saveResult.status === "saved") {
        const userItemId = saveResult.item!.id;
        toast("Shared to group · Save to vault?", {
          cancel: {
            label: "No",
            onClick: async () => {
              await supabase.from("user_logged_items").delete().eq("id", userItemId);
              queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
            },
          },
          action: {
            label: "Yes",
            onClick: () => {},
          },
          duration: 6000,
        });
      } else {
        toast.success("Shared to group");
      }

      setDetectedUrl(null);
      reset();
      setNote("");
      setInputKey((k) => k + 1);
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
      // group_posts.content requires DB migration: nullable logged_item_id already exists
      // After migration adds content column, remove the `as any` cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("group_posts") as any).insert({
        convo_id: groupId,
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
        key={inputKey}
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
            <motion.div
              animate={{
                boxShadow: (Array.isArray(boxShadow) ? [...boxShadow] : boxShadow) as string | string[],
              }}
              transition={{ ...springGentle, boxShadow: successGlowTransition }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="bg-card rounded-card border p-3 space-y-3"
            >
              {/* URL extraction preview (loading / loaded / failed) */}
              {detectedUrl && (
                <UrlExtractPreview
                  url={detectedUrl}
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
                        setInputKey((k) => k + 1);
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
