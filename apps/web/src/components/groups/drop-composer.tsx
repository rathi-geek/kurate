"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ChatInput } from "@/app/_components/home/chat-input";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { springGentle } from "@/app/_libs/utils/motion";
import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

interface ExtractedMetadata {
  url: string;
  title?: string | null;
  source?: string | null;
  author?: string | null;
  preview_image?: string | null;
  content_type?: "article" | "video" | "podcast";
  read_time?: string | null;
}

interface DropComposerProps {
  groupId: string;
  currentUserId: string;
  onDropPosted: () => void;
}

export function DropComposer({ groupId, currentUserId, onDropPosted }: DropComposerProps) {
  const t = useTranslations("groups");
  const prefersReducedMotion = useReducedMotion();
  const saveItem = useSaveItem();

  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractedMetadata | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [note, setNote] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const showPopup = isExtracting || !!preview || !!detectedUrl;

  const handleUrlChange = useCallback(async (url: string | null) => {
    setDetectedUrl(url);
    if (!url) {
      setPreview(null);
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreview({ url, ...data });
      }
    } catch {
      // ignore extraction errors — user can still post without preview
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handlePost = async () => {
    if (!detectedUrl || !currentUserId) return;
    setIsPosting(true);
    try {
      const saveResult = await saveItem.mutateAsync({
        url: detectedUrl,
        title: preview?.title,
        source: preview?.source,
        author: preview?.author,
        preview_image: preview?.preview_image,
        content_type: preview?.content_type ?? "article",
        read_time: preview?.read_time,
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

      setDetectedUrl(null);
      setPreview(null);
      setNote("");
      onDropPosted();
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="relative px-4 pt-3 pb-1">
      {/* ── Input bar ─────────────────────────────────────────────────── */}
      <ChatInput
        onSend={() => {}}
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
              {/* Extracting state */}
              {isExtracting && (
                <p className="text-muted-foreground animate-pulse text-xs px-0.5">
                  {t("extracting")}
                </p>
              )}

              {/* Link preview */}
              {preview && !isExtracting && (
                <div className="rounded-card bg-surface border overflow-hidden">
                  {preview.preview_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.preview_image}
                      alt={preview.title ?? ""}
                      className="h-24 w-full object-cover"
                    />
                  )}
                  <div className="p-2.5">
                    <p className="text-foreground line-clamp-2 text-sm font-medium">
                      {preview.title ?? preview.url}
                    </p>
                    {preview.source && (
                      <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                        {preview.source}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Note + Post */}
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
                        setPreview(null);
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
