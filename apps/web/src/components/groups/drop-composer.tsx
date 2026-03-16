"use client";

import { useCallback, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ChatInput } from "@/app/_components/home/chat-input";
import { UrlExtractPreview } from "@/app/_components/shared/url-extract-preview";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { useExtractMetadata } from "@/app/_libs/hooks/useExtractMetadata";
import { springGentle, shadowFloating, shadowHoverGlow, successGlowBoxShadow, successGlowTransition } from "@/app/_libs/utils/motion";
import { createClient } from "@/app/_libs/supabase/client";

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
  const pendingVaultSave = useRef<Parameters<typeof saveItem.mutate>[0] | null>(null);

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
      async function generateUrlHash(url: string): Promise<string> {
        const normalized = url.toLowerCase().trim();
        const data = new TextEncoder().encode(normalized);
        const buf = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      }

      const url_hash = await generateUrlHash(detectedUrl);
      const { data: loggedItem, error: liError } = await supabase
        .from("logged_items")
        .upsert(
          {
            url: detectedUrl,
            url_hash,
            title: metadata?.title ?? detectedUrl,
            content_type: metadata?.content_type ?? "article",
            preview_image_url: metadata?.preview_image ?? null,
            raw_metadata: { source: metadata?.source ?? null, read_time: metadata?.read_time ?? null },
          },
          { onConflict: "url_hash" },
        )
        .select("id")
        .single();
      if (liError) throw new Error(liError.message);

      const { error } = await supabase.from("group_posts").insert({
        convo_id: groupId,
        logged_item_id: loggedItem.id,
        shared_by: currentUserId,
        note: note.trim() || null,
      });

      if (error) throw new Error(error.message);

      pendingVaultSave.current = {
        url: detectedUrl,
        title: metadata?.title,
        source: metadata?.source,
        preview_image: metadata?.preview_image,
        content_type: metadata?.content_type ?? "article",
        read_time: metadata?.read_time,
        save_source: "shares",
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
        cancel: { label: "No", onClick: () => { pendingVaultSave.current = null; } },
        duration: 6000,
        actionButtonStyle: { backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" },
      });

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
