"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { ChatInput } from "@/app/_components/home/chat-input";
import { LinkPreviewCard, type ExtractedMeta } from "@/app/_components/home/LinkPreviewCard";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { useScrollDirection } from "@/app/_libs/hooks/useScrollDirection";
import { springGentle } from "@/app/_libs/utils/motion";
import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";

const URL_REGEX = /https?:\/\/[^\s]+/;
const supabase = createClient();

type PreviewPhase = "idle" | "loading" | "loaded" | "share";

interface VaultTabViewProps {
  onNavigateToDiscover?: () => void;
  onScrollDirectionChange?: (dir: "up" | "down") => void;
}

export function VaultTabView({ onNavigateToDiscover, onScrollDirectionChange }: VaultTabViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(scrollRef);
  const isScrolledDown = scrollDir === "down";
  const saveItem = useSaveItem();
  const queryClient = useQueryClient();

  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<ExtractedMeta | null>(null);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [savedItemGroups, setSavedItemGroups] = useState<string[]>([]);

  useEffect(() => {
    if (scrollDir) onScrollDirectionChange?.(scrollDir);
  }, [scrollDir, onScrollDirectionChange]);

  const handleUrlChange = useCallback(
    (url: string | null) => {
      if (!url) {
        setPreviewPhase("idle");
        setPreviewUrl(null);
        setPreviewMeta(null);
        return;
      }
      if (url === previewUrl) return; // already fetching / fetched this URL
      setPreviewUrl(url);
      setPreviewPhase("loading");
      fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((meta: ExtractedMeta | null) => {
          setPreviewMeta(meta);
          setPreviewPhase("loaded");
        })
        .catch(() => {
          setPreviewMeta(null);
          setPreviewPhase("loaded");
        });
    },
    [previewUrl],
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
          save_source: "logged",
        });

        if (result.status === "duplicate") {
          toast("Already in your Vault", { description: "This link has been saved before." });
          setPreviewPhase("idle");
        } else if (result.status === "saved" && result.item) {
          setSavedItemId(result.item.id);
          setSavedItemGroups(result.item.shared_to_groups ?? []);
          setPreviewPhase("share");
        }
      } catch {
        // network error — silently fail
      }
    },
    [previewMeta, saveItem],
  );

  const handleShare = useCallback(
    async (groupId: string) => {
      if (!savedItemId) return;
      const next = [...new Set([...savedItemGroups, groupId])];
      await supabase.from("logged_items").update({ shared_to_groups: next }).eq("id", savedItemId);
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      setPreviewPhase("idle");
      toast("Shared!");
    },
    [savedItemId, savedItemGroups, queryClient],
  );

  const handleSkip = useCallback(() => {
    setPreviewPhase("idle");
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
          {previewPhase !== "idle" && (
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
                  phase={previewPhase as "loading" | "loaded" | "share"}
                  url={previewUrl!}
                  metadata={previewMeta ?? undefined}
                  savedItemId={savedItemId ?? undefined}
                  savedItemGroups={savedItemGroups}
                  onClose={() => setPreviewPhase("idle")}
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
              placeholder="Paste a link to log it…"
              disabled={saveItem.isPending}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
