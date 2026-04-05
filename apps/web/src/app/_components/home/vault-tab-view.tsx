"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { useSubmitContent } from "@kurate/hooks";
import type { VaultFilters as VaultFiltersType } from "@kurate/types";
import type { ThoughtBucket } from "@kurate/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

import { CloseIcon } from "@/components/icons";
import { LinkPreviewCard } from "@/app/_components/home/LinkPreviewCard";
import { ChatInput } from "@/app/_components/home/chat-input";
import { PreviewPhase } from "@kurate/types";
import { ThoughtsTabView } from "@/app/_components/home/thoughts-tab-view";
import { VaultTabSubHeader } from "@/app/_components/home/vault-tab-sub-header";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import { useAuth } from "@/app/_libs/auth-context";
import { VaultTab } from "@kurate/types";
import { db } from "@/app/_libs/db";
import { usePendingItemTimeout } from "@/app/_libs/hooks/usePendingItemTimeout";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useEditThought } from "@/app/_libs/hooks/useEditThought";
import { useShareToGroups } from "@/app/_libs/hooks/useShareToGroups";
import { useVaultComposer } from "@/app/_libs/hooks/useVaultComposer";
import { useVaultPreview } from "@/app/_libs/hooks/useVaultPreview";
import { createClient } from "@/app/_libs/supabase/client";
import { track } from "@/app/_libs/utils/analytics";
import { springGentle } from "@/app/_libs/utils/motion";
import { useTranslations } from "@/i18n/use-translations";

const supabase = createClient();

interface MediaPreview {
  file: File;
  objectUrl: string;
}

interface VaultTabViewProps {
  onNavigateToDiscover?: () => void;
  onScrollDirectionChange?: (dir: "up" | "down") => void;
}

export function VaultTabView({ onNavigateToDiscover }: VaultTabViewProps) {
  usePendingItemTimeout();
  const prefersReducedMotion = useSafeReducedMotion();
  const t = useTranslations("vault");
  const tThoughts = useTranslations("thoughts");
  const shareToGroups = useShareToGroups();
  const editThought = useEditThought();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [vaultTab, setVaultTab] = useState<VaultTab>(VaultTab.LINKS);
  const [vaultFilters, setVaultFilters] = useState<Omit<VaultFiltersType, "search">>({
    time: "all",
    contentType: "all",
    readStatus: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeBucket, setActiveBucket] = useState<ThoughtBucket | null>(null);
  const [thoughtsViewAll, setThoughtsViewAll] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [editingThought, setEditingThought] = useState<{ id: string; text: string } | null>(null);

  const resetInput = useCallback(() => setInputKey((k) => k + 1), []);

  // --- Preview hook ---
  const preview = useVaultPreview(resetInput);

  // --- Submit content ---
  const { onSend } = useSubmitContent({
    supabase,
    queryClient,
    onRouted: (dest) => {
      setVaultTab(dest === "links" ? VaultTab.LINKS : VaultTab.THOUGHTS);
      if (dest === "thoughts" && mediaPreview) {
        URL.revokeObjectURL(mediaPreview.objectUrl);
        setMediaPreview(null);
      }
    },
    onLinkSaved: preview.handleLinkSaved,
    onThoughtSent: async (_, tempId) => {
      await db.pending_thoughts.delete(tempId);
    },
    activeBucket,
  });

  // --- Composer hook ---
  const { handleVaultChatSend } = useVaultComposer({
    previewUrlRef: preview.previewUrlRef,
    previewMeta: preview.previewMeta,
    extractedMeta: preview.extractedMeta,
    lastSentUrlRef: preview.lastSentUrlRef,
    setLastSentUrl: preview.setLastSentUrl,
    resetPreviewState: preview.resetPreviewState,
    resetExtraction: preview.resetExtraction,
    resetInput,
    onSend,
    activeBucket,
    vaultTab,
    setVaultTab,
    editingThought,
    editThought,
    setEditingThought,
  });

  // --- Local handlers ---
  const handleEditStart = useCallback((id: string, text: string) => {
    setEditingThought({ id, text });
    setInputKey((k) => k + 1);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingThought(null);
    setInputKey((k) => k + 1);
  }, []);

  const handleTabChange = (tab: VaultTab) => {
    if (vaultTab !== tab) {
      track("links_thoughts_switched", { from: vaultTab, to: tab, source: "manual" });
    }
    setVaultTab(tab);
    setSearchQuery("");
    setSearchOpen(false);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.objectUrl);
      setMediaPreview(null);
    }
  };

  const handleActiveBucketChange = (b: ThoughtBucket | null) => {
    if (b && b !== activeBucket) track("thoughts_bucket_view", { bucket: b });
    setActiveBucket(b);
  };

  useEffect(() => {
    if (vaultTab === VaultTab.THOUGHTS && thoughtsViewAll) {
      track("thoughts_all_chats_view", { bucket: "all" });
    }
  }, [vaultTab, thoughtsViewAll]);

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview.objectUrl);
    };
  }, [mediaPreview]);

  const handleShare = useCallback(
    async (groupIds: string[]) => {
      if (!preview.savedLoggedItemId || groupIds.length === 0 || !userId) return;
      await shareToGroups.mutateAsync({
        loggedItemId: preview.savedLoggedItemId,
        groupIds,
        userId,
      });
      preview.setSavedItemGroups((prev) => [...new Set([...prev, ...groupIds])]);
      preview.resetPreviewState();
      preview.resetExtraction();
      resetInput();
    },
    [preview, userId, shareToGroups, resetInput],
  );

  const dismissMediaPreview = useCallback(() => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview.objectUrl);
    setMediaPreview(null);
  }, [mediaPreview]);

  const fullVaultFilters: VaultFiltersType = useMemo(
    () => ({ ...vaultFilters, search: searchQuery }),
    [vaultFilters, searchQuery],
  );

  const handleLibraryFiltersChange = useCallback((f: VaultFiltersType) => {
    setVaultFilters({ time: f.time, contentType: f.contentType, readStatus: f.readStatus });
    setSearchQuery(f.search);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VaultTabSubHeader
        vaultTab={vaultTab}
        onTabChange={handleTabChange}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        fullVaultFilters={fullVaultFilters}
        onFiltersChange={(f) => setVaultFilters(f)}
      />

      {/* Scrollable content area — both tabs always mounted and stacked.
          Use opacity/pointer-events (NOT display:none) so scroll positions are preserved. */}
      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${vaultTab !== VaultTab.LINKS ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <VaultLibrary
            filters={fullVaultFilters}
            onFiltersChange={handleLibraryFiltersChange}
            onNavigateToDiscover={onNavigateToDiscover}
          />
        </div>
        <div
          className={`absolute inset-0 flex flex-col overflow-hidden transition-opacity duration-150 ${vaultTab !== VaultTab.THOUGHTS ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <ThoughtsTabView
            userId={userId}
            searchQuery={searchQuery}
            activeBucket={activeBucket}
            onActiveBucketChange={handleActiveBucketChange}
            viewAll={thoughtsViewAll}
            onViewAllChange={setThoughtsViewAll}
            onEditStart={handleEditStart}
          />
        </div>
      </div>

      {/* Composer section — preview overlays + ChatInput */}
      <motion.div className="bg-background relative shrink-0" transition={springGentle}>
        <AnimatePresence>
          {preview.previewPhase !== PreviewPhase.Idle && (
            <motion.div
              className="absolute right-0 bottom-full left-0 z-50 px-5"
              transition={springGentle}>
              <div className="mx-auto max-w-2xl">
                <LinkPreviewCard
                  phase={preview.previewPhase}
                  url={preview.previewUrl ?? preview.lastSentUrl ?? ""}
                  metadata={preview.previewMeta ?? undefined}
                  savedItemId={preview.savedLoggedItemId ?? undefined}
                  savedItemGroups={preview.savedItemGroups}
                  onClose={preview.handlePreviewClose}
                  onShare={handleShare}
                  onSkip={preview.handleSkip}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mediaPreview && (
            <motion.div
              className="absolute right-0 bottom-full left-0 z-50 px-5 pb-1"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              transition={springGentle}>
              <div className="mx-auto max-w-2xl">
                <div className="bg-card flex items-center gap-3 rounded-2xl border px-3 py-2 shadow-sm">
                  <Image
                    src={mediaPreview.objectUrl}
                    alt="Preview"
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <p className="text-foreground/70 min-w-0 flex-1 truncate text-xs">
                    {mediaPreview.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={dismissMediaPreview}
                    className="text-muted-foreground hover:text-foreground shrink-0 text-sm leading-none transition-colors"
                    aria-label="Remove image">
                    ×
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-5 py-3 md:py-8">
          <div className="mx-auto max-w-4xl">
            {editingThought && (
              <div className="border-border/50 bg-surface mb-2 flex items-center gap-2 rounded-lg border px-3 py-2">
                <div className="bg-primary w-0.5 self-stretch rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="text-primary text-[11px] font-semibold">{tThoughts("edit_aria")}</p>
                  <p className="text-muted-foreground line-clamp-1 text-[11px]">
                    {editingThought.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  aria-label="Cancel edit">
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <ChatInput
              key={inputKey}
              placeholder={t("input_placeholder")}
              onSend={handleVaultChatSend}
              onUrlChange={editingThought ? undefined : preview.handleUrlChange}
              collapsible={vaultTab === VaultTab.THOUGHTS && !editingThought}
              initialValue={editingThought?.text}
              autoFocus={!!editingThought}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
