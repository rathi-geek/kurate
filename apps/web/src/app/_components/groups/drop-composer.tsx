"use client";

import { useCallback, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { toast } from "sonner";

import { ChatInput } from "@/app/_components/home/chat-input";
import { UrlExtractPreview } from "@/app/_components/shared/url-extract-preview";
import { useExtractMetadata } from "@kurate/hooks";
import { upsertLoggedItem, useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { createClient } from "@/app/_libs/supabase/client";
import { track } from "@/app/_libs/utils/analytics";
import {
  shadowFloating,
  springGentle,
  successGlowBoxShadow,
  successGlowTransition,
} from "@/app/_libs/utils/motion";
import { CloseIcon } from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

const supabase = createClient();

interface DropComposerProps {
  groupId: string;
  currentUserId: string;
  onDropPosted: () => void;
}

export function DropComposer({ groupId, currentUserId, onDropPosted }: DropComposerProps) {
  const t = useTranslations("groups");
  const prefersReducedMotion = useSafeReducedMotion();
  const saveItem = useSaveItem();
  const pendingVaultSave = useRef<Parameters<typeof saveItem.mutate>[0] | null>(null);

  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const { isExtracting, metadata, extractionFailed, extract, reset } = useExtractMetadata();

  const boxShadow = metadata && !isExtracting ? successGlowBoxShadow : shadowFloating;

  const showPreview = !!detectedUrl || isExtracting || (extractionFailed && !!detectedUrl);

  const handleUrlChange = useCallback(
    async (url: string | null) => {
      setDetectedUrl(url);
      if (!url) {
        reset();
        return;
      }
      await extract(url);
    },
    [extract, reset],
  );

  const handleCancel = useCallback(() => {
    setDetectedUrl(null);
    reset();
    setInputKey((k) => k + 1);
  }, [reset]);

  // Handles both text-only posts and link posts (note comes from ChatInput)
  const handleSend = useCallback(
    async (text: string) => {
      if (!currentUserId) return;

      if (detectedUrl) {
        // Link post — text from ChatInput is the optional note
        setIsPosting(true);
        try {
          const loggedItemId = await upsertLoggedItem({
            url: detectedUrl,
            title: metadata?.title,
            description: metadata?.description,
            content_type: metadata?.content_type,
            preview_image_url: metadata?.preview_image ?? null,
            source: metadata?.source,
            read_time: metadata?.read_time ? String(metadata.read_time) : null,
          });

          const { error } = await supabase.from("group_posts").insert({
            convo_id: groupId,
            logged_item_id: loggedItemId,
            shared_by: currentUserId,
            note: text.trim() || null,
          });

          if (error) throw new Error(error.message);
          track("group_post_created", { content_type: metadata?.content_type ?? "article" });

          pendingVaultSave.current = {
            url: detectedUrl,
            title: metadata?.title,
            source: metadata?.source,
            preview_image: metadata?.preview_image,
            content_type: metadata?.content_type ?? "article",
            read_time: metadata?.read_time,
            save_source: "shares",
            saved_from_group: groupId,
          };

          toast("Shared to group · Save to vault?", {
            action: {
              label: "Yes",
              onClick: () => {
                if (pendingVaultSave.current) {
                  saveItem.mutate(pendingVaultSave.current, {
                    onError: () => toast.error("Failed to save to vault"),
                  });
                  pendingVaultSave.current = null;
                }
              },
            },
            cancel: {
              label: "No",
              onClick: () => {
                pendingVaultSave.current = null;
              },
            },
            duration: 6000,
            actionButtonStyle: {
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            },
          });

          setDetectedUrl(null);
          reset();
          setInputKey((k) => k + 1);
          onDropPosted();
        } finally {
          setIsPosting(false);
        }
        return;
      }

      // Text-only post
      if (!text.trim()) return;
      setIsPosting(true);
      try {
        const { error } = await supabase.from("group_posts").insert({
          convo_id: groupId,
          shared_by: currentUserId,
          content: text.trim(),
        });
        if (error) throw new Error(error.message);
        track("group_text_post_created", {});
        setInputKey((k) => k + 1);
        onDropPosted();
      } finally {
        setIsPosting(false);
      }
    },
    [detectedUrl, metadata, currentUserId, groupId, onDropPosted, reset, saveItem],
  );

  return (
    <div className="space-y-2 px-4 pt-3 pb-1">
      {/* ChatInput — note is typed here when URL is locked, plain text for text-only posts */}
      <ChatInput
        key={inputKey}
        onSend={handleSend}
        onUrlChange={handleUrlChange}
        placeholder={t("composer_placeholder")}
        disabled={isPosting}
      />

      {/* Preview card — appears below ChatInput when URL is detected */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
            animate={{
              opacity: 1,
              y: 0,
              boxShadow: (Array.isArray(boxShadow) ? [...boxShadow] : boxShadow) as
                | string
                | string[],
            }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ ...springGentle, boxShadow: successGlowTransition }}
            className="bg-card rounded-card relative overflow-hidden border">
            <div className="pr-8">
              <UrlExtractPreview
                url={detectedUrl ?? ""}
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
              onClick={handleCancel}
              disabled={isPosting}
              aria-label={t("cancel")}
              className="text-muted-foreground hover:text-foreground absolute top-2 right-2 p-1 transition-colors">
              <CloseIcon className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
