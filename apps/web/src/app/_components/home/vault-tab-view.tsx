"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { ChatInput } from "@/app/_components/home/chat-input";
import { LinkPreviewCard, type ExtractedMeta } from "@/app/_components/home/LinkPreviewCard";
import { PreviewPhase } from "@/app/_components/home/preview-phase";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { useExtractMetadata } from "@/app/_libs/hooks/useExtractMetadata";
import { useScrollDirection } from "@/app/_libs/hooks/useScrollDirection";
import { springGentle } from "@/app/_libs/utils/motion";
import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
import { fetchShareableConversations, type ShareableConversation } from "@/app/_libs/utils/fetchShareableConversations";

const URL_REGEX = /https?:\/\/[^\s]+/;
const supabase = createClient();

interface VaultTabViewProps {
  onNavigateToDiscover?: () => void;
  onScrollDirectionChange?: (dir: "up" | "down") => void;
}

export function VaultTabView({ onNavigateToDiscover, onScrollDirectionChange }: VaultTabViewProps) {
  const t = useTranslations("vault");
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(scrollRef);
  const isScrolledDown = scrollDir === "down";
  const saveItem = useSaveItem();
  const queryClient = useQueryClient();

  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>(PreviewPhase.Idle);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<ExtractedMeta | null>(null);
  // logged_items.id — used for sharing to group_posts
  const [savedLoggedItemId, setSavedLoggedItemId] = useState<string | null>(null);
  // track which groups this item was shared to in the current session
  const [savedItemGroups, setSavedItemGroups] = useState<string[]>([]);

  const { isExtracting, metadata: extractedMeta, extractionFailed, extract, reset: resetExtraction } = useExtractMetadata();

  useEffect(() => {
    if (scrollDir) onScrollDirectionChange?.(scrollDir);
  }, [scrollDir, onScrollDirectionChange]);

  // Sync extraction result to PreviewPhase and camelCase previewMeta
  useEffect(() => {
    if (!isExtracting && extractedMeta) {
      setPreviewMeta({
        title: extractedMeta.title,
        source: extractedMeta.source,
        author: extractedMeta.author,
        previewImage: extractedMeta.preview_image ?? null,
        contentType: extractedMeta.content_type ?? null,
        readTime: extractedMeta.read_time ?? null,
      });
      setPreviewPhase(PreviewPhase.Loaded);
    } else if (!isExtracting && extractionFailed) {
      // extraction completed but failed — show card with no metadata
      setPreviewPhase(PreviewPhase.Loaded);
    }
  }, [isExtracting, extractedMeta, extractionFailed]);

  const handleUrlChange = useCallback(
    (url: string | null) => {
      if (!url) {
        setPreviewPhase(PreviewPhase.Idle);
        setPreviewUrl(null);
        setPreviewMeta(null);
        resetExtraction();
        return;
      }
      if (url === previewUrl) return; // already fetching / fetched this URL
      setPreviewUrl(url);
      setPreviewPhase(PreviewPhase.Loading);
      void extract(url);
    },
    [previewUrl, extract, resetExtraction],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const urlMatch = text.match(URL_REGEX);
      if (!urlMatch) return;
      const url = urlMatch[0];

      try {
        // Reuse cached metadata if available, otherwise fetch
        const meta =
          previewMeta ??
          (await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null));

        const result = await saveItem.mutateAsync({
          url,
          title: meta?.title ?? url,
          source: meta?.source ?? null,
          author: meta?.author ?? null,
          preview_image: meta?.previewImage ?? null,
          content_type: (meta?.contentType as "article" | "video" | "podcast") ?? "article",
          read_time: meta?.readTime != null ? String(meta.readTime) : null,
          save_source: "external",
        });

        if (result.status === "duplicate") {
          toast("Already in your Vault", { description: "This link has been saved before." });
          setPreviewPhase(PreviewPhase.Idle);
        } else if (result.status === "saved" && result.item) {
          const cached = queryClient.getQueryData<ShareableConversation[]>(queryKeys.vault.shareConversations());
          const convos = cached ?? await fetchShareableConversations();
          if (convos.length === 0) {
            setPreviewPhase(PreviewPhase.Idle);
            toast("Saved to Vault");
          } else {
            setSavedLoggedItemId(result.item.logged_item_id);
            setSavedItemGroups([]);
            setPreviewPhase(PreviewPhase.Share);
          }
        }
      } catch {
        // network error — silently fail
      }
    },
    [previewMeta, saveItem],
  );

  const handleShare = useCallback(
    async (groupIds: string[]) => {
      if (!savedLoggedItemId || groupIds.length === 0) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await Promise.all(
        groupIds.map((convo_id) =>
          supabase.from("group_posts").insert({
            convo_id,
            logged_item_id: savedLoggedItemId,
            shared_by: user.id,
          }),
        ),
      );
      setSavedItemGroups((prev) => [...new Set([...prev, ...groupIds])]);
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      setPreviewPhase(PreviewPhase.Idle);
      toast("Shared!");
    },
    [savedLoggedItemId, queryClient],
  );

  const handleSkip = useCallback(() => {
    setPreviewPhase(PreviewPhase.Idle);
    toast("Saved to Vault");
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Scrollable vault content */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <VaultLibrary onNavigateToDiscover={onNavigateToDiscover} />
      </div>
      {/* Input — hides on scroll down */}
      <motion.div
        className="bg-background relative shrink-0"
        animate={prefersReducedMotion ? undefined : { height: isScrolledDown ? 0 : "auto" }}
        transition={springGentle}>
        {/* Preview card — floats above input, takes no layout space */}
        <AnimatePresence>
          {previewPhase !== PreviewPhase.Idle && (
            <motion.div
              className="absolute bottom-full left-0 right-0 z-50 px-5"
              animate={
                prefersReducedMotion
                  ? undefined
                  : { opacity: isScrolledDown ? 0 : 1, y: isScrolledDown ? 6 : 0 }
              }
              style={{ pointerEvents: isScrolledDown ? "none" : "auto" }}
              transition={springGentle}>
              <div className="mx-auto max-w-2xl">
                <LinkPreviewCard
                  phase={previewPhase}
                  url={previewUrl!}
                  metadata={previewMeta ?? undefined}
                  savedItemId={savedLoggedItemId ?? undefined}
                  savedItemGroups={savedItemGroups}
                  onClose={() => setPreviewPhase(PreviewPhase.Idle)}
                  onShare={handleShare}
                  onSkip={handleSkip}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="px-5 py-3">
          <div className="mx-auto max-w-2xl">
            <ChatInput
              onSend={handleSend}
              onUrlChange={handleUrlChange}
              placeholder={t("log_link_placeholder")}
              disabled={saveItem.isPending}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
