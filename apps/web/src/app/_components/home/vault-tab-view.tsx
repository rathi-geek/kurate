"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSubmitContent } from "@kurate/hooks";
import type { SaveItemResult } from "@kurate/hooks";
import { queryKeys } from "@kurate/query";
import type { VaultFilters as VaultFiltersType } from "@kurate/types";
import { type ThoughtBucket, classifyThought } from "@kurate/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { type ExtractedMeta, LinkPreviewCard } from "@/app/_components/home/LinkPreviewCard";
import { ChatInput } from "@/app/_components/home/chat-input";
import { PreviewPhase } from "@/app/_components/home/preview-phase";
import { ThoughtsTabView } from "@/app/_components/home/thoughts-tab-view";
import { VaultTabSubHeader } from "@/app/_components/home/vault-tab-sub-header";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import { useAuth } from "@/app/_libs/auth-context";
import { VaultTab } from "@/app/_libs/chat-types";
import { db } from "@/app/_libs/db";
import { useExtractMetadata } from "@/app/_libs/hooks/useExtractMetadata";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { createClient } from "@/app/_libs/supabase/client";
import { track } from "@/app/_libs/utils/analytics";
import {
  type ShareableConversation,
  fetchShareableConversations,
} from "@/app/_libs/utils/fetchShareableConversations";
import { springGentle } from "@/app/_libs/utils/motion";

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
  const prefersReducedMotion = useSafeReducedMotion();
  // const scrollRef = useRef<HTMLDivElement>(null);
  // const scrollDir = useScrollDirection(scrollRef);
  // const isScrolledDown = scrollDir === "down";
  // const collapseComposerOnScroll = isScrolledDown;
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

  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>(PreviewPhase.Idle);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<ExtractedMeta | null>(null);
  const [savedLoggedItemId, setSavedLoggedItemId] = useState<string | null>(null);
  const [savedItemGroups, setSavedItemGroups] = useState<string[]>([]);

  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const previewUrlRef = useRef<string | null>(null);
  previewUrlRef.current = previewUrl;

  const resetInput = useCallback(() => setInputKey((k) => k + 1), []);

  const {
    isExtracting,
    metadata: extractedMeta,
    extractionFailed,
    extract,
    reset: resetExtraction,
  } = useExtractMetadata();

  const handleLinkSaved = useCallback(
    async (result: SaveItemResult) => {
      if (result.url !== previewUrlRef.current) return;

      track("vault_link_saved", {
        content_type: previewMeta?.contentType ?? "article",
        source: previewMeta?.source ?? null,
        has_tags: false,
        is_duplicate: result.status === "duplicate",
      });
      if (result.status === "duplicate") {
        toast("Already in your Vault", { description: "This link has been saved before." });
        setPreviewPhase(PreviewPhase.Idle);
        setPreviewUrl(null);
        setPreviewMeta(null);
        setSavedLoggedItemId(null);
        setSavedItemGroups([]);
        resetExtraction();
        resetInput();
      } else if (result.status === "saved" && result.item) {
        const cached = queryClient.getQueryData<ShareableConversation[]>(
          queryKeys.vault.shareConversations(),
        );
        const convos = cached ?? (await fetchShareableConversations(userId ?? ""));
        if (result.url !== previewUrlRef.current) return;
        if (convos.length === 0) {
          setPreviewPhase(PreviewPhase.Idle);
          setPreviewUrl(null);
          setPreviewMeta(null);
          setSavedLoggedItemId(null);
          setSavedItemGroups([]);
          resetExtraction();
          toast("Saved to Vault");
          resetInput();
        } else {
          setSavedLoggedItemId(result.item.logged_item_id);
          setSavedItemGroups([]);
          setPreviewPhase(PreviewPhase.Share);
        }
      }
    },
    [queryClient, previewMeta, resetExtraction, resetInput, userId],
  );

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
    onLinkSaved: handleLinkSaved,
    onThoughtSent: async (_, tempId) => {
      await db.pending_thoughts.delete(tempId);
    },
    activeBucket,
  });

  // useEffect(() => {
  //   if (scrollDir) onScrollDirectionChange?.(scrollDir);
  // }, [scrollDir, onScrollDirectionChange]);

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
      setPreviewPhase(PreviewPhase.Loaded);
    }
  }, [isExtracting, extractedMeta, extractionFailed]);

  // Revoke object URL on unmount or when mediaPreview changes
  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview.objectUrl);
    };
  }, [mediaPreview]);

  const handleTabChange = (tab: VaultTab) => {
    const from = vaultTab;
    if (from !== tab) {
      track("links_thoughts_switched", { from, to: tab, source: "manual" });
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
    if (b && b !== activeBucket) {
      track("thoughts_bucket_view", { bucket: b });
    }
    setActiveBucket(b);
  };

  useEffect(() => {
    if (vaultTab === VaultTab.THOUGHTS && thoughtsViewAll) {
      track("thoughts_all_chats_view", { bucket: "all" });
    }
  }, [vaultTab, thoughtsViewAll]);

  const handleUrlChange = useCallback(
    (url: string | null) => {
      if (!url) {
        setPreviewPhase(PreviewPhase.Idle);
        setPreviewUrl(null);
        setPreviewMeta(null);
        setSavedLoggedItemId(null);
        setSavedItemGroups([]);
        resetExtraction();
        return;
      }

      const previewActiveForCurrentUrl =
        url === previewUrl &&
        (previewPhase === PreviewPhase.Loading ||
          previewPhase === PreviewPhase.Loaded ||
          previewPhase === PreviewPhase.Share);
      if (previewActiveForCurrentUrl) return;

      if (url !== previewUrl) {
        setSavedLoggedItemId(null);
        setSavedItemGroups([]);
      }
      setPreviewUrl(url);
      // Eagerly update ref so handleVaultChatSend (called in the same tick for fast paste+enter)
      // sees the URL before React re-renders
      previewUrlRef.current = url;
      setPreviewPhase(PreviewPhase.Loading);
      void extract(url);
    },
    [extract, previewPhase, previewUrl, resetExtraction],
  );

  const handleShare = useCallback(
    async (groupIds: string[]) => {
      if (!savedLoggedItemId || groupIds.length === 0) return;
      if (!userId) return;
      await Promise.all(
        groupIds.map((convo_id) =>
          supabase.from("group_posts").insert({
            convo_id,
            logged_item_id: savedLoggedItemId,
            shared_by: userId,
          }),
        ),
      );
      setSavedItemGroups((prev) => [...new Set([...prev, ...groupIds])]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      setPreviewPhase(PreviewPhase.Idle);
      setPreviewUrl(null);
      setPreviewMeta(null);
      setSavedLoggedItemId(null);
      setSavedItemGroups([]);
      resetExtraction();
      toast("Shared!");
      resetInput();
    },
    [savedLoggedItemId, queryClient, resetExtraction, resetInput, userId],
  );

  const handleSkip = useCallback(() => {
    setPreviewPhase(PreviewPhase.Idle);
    setPreviewUrl(null);
    setPreviewMeta(null);
    setSavedLoggedItemId(null);
    setSavedItemGroups([]);
    resetExtraction();
    toast("Saved to Vault");
    resetInput();
  }, [resetExtraction, resetInput]);

  // Media upload hidden — feature not enabled (handler removed; re-add when re-enabling)

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

  const handlePreviewClose = useCallback(() => {
    setPreviewPhase(PreviewPhase.Idle);
    setPreviewUrl(null);
    setPreviewMeta(null);
    setSavedLoggedItemId(null);
    setSavedItemGroups([]);
    resetExtraction();
    resetInput();
  }, [resetExtraction, resetInput]);

  const handleVaultChatSend = useCallback(
    async (noteText: string) => {
      const meta = previewMeta ? { ...previewMeta, tags: extractedMeta?.tags ?? null } : null;
      // Use ref (eagerly updated in handleUrlChange) instead of stale state for fast paste+enter
      const effectiveUrl = previewUrlRef.current;
      if (effectiveUrl) {
        // Cancel in-flight preview extraction — grid handles null-metadata via useRefreshLoggedItem
        resetExtraction();
        setPreviewMeta(null);
        setPreviewPhase(PreviewPhase.Idle);

        // Deduplicate: same URL already pending → skip
        const existingPending = await db.pending_links.where("url").equals(effectiveUrl).first();
        if (existingPending) {
          toast("Already in your Vault", { description: "This link has been saved before." });
          setPreviewUrl(null);
          setPreviewMeta(null);
          setSavedLoggedItemId(null);
          setSavedItemGroups([]);
          resetExtraction();
          resetInput();
          return;
        }

        const tempId = crypto.randomUUID();
        // URL mode: pending row in Dexie, then POST
        void db.pending_links.add({
          tempId,
          url: effectiveUrl,
          title: previewMeta?.title ?? effectiveUrl,
          source: previewMeta?.source ?? null,
          author: previewMeta?.author ?? null,
          previewImage: previewMeta?.previewImage ?? null,
          contentType: previewMeta?.contentType ?? "article",
          readTime: previewMeta?.readTime != null ? String(previewMeta.readTime) : null,
          tags: extractedMeta?.tags ?? null,
          description: previewMeta?.description ?? null,
          remarks: noteText.trim() || null,
          createdAt: new Date().toISOString(),
          status: "sending",
        });
        // Clear preview state so next URL is detected fresh
        setPreviewUrl(null);
        previewUrlRef.current = null;
        setPreviewMeta(null);
        setSavedLoggedItemId(null);
        setSavedItemGroups([]);

        void onSend(effectiveUrl, undefined, meta, noteText.trim() || null)
          .then(async () => {
            await db.pending_links.delete(tempId);
          })
          .catch(async () => {
            await db.pending_links.update(tempId, { status: "failed" });
          });
      } else {
        // Text → thoughts: classify, Dexie row, switch tab, POST
        const tempId = crypto.randomUUID();
        const bucket = activeBucket ?? classifyThought(noteText);
        void db.pending_thoughts.add({
          tempId,
          text: noteText,
          bucket,
          content_type: "text",
          media_id: null,
          createdAt: new Date().toISOString(),
          status: "sending",
        });
        if (vaultTab !== VaultTab.THOUGHTS) {
          track("links_thoughts_switched", {
            from: vaultTab,
            to: VaultTab.THOUGHTS,
            source: "auto_thought_added",
          });
        }
        setVaultTab(VaultTab.THOUGHTS);
        void onSend(noteText, undefined, null, null, tempId).catch(async () => {
          await db.pending_thoughts.update(tempId, { status: "failed" });
        });
      }
    },
    [
      activeBucket,
      extractedMeta?.tags,
      onSend,
      previewMeta,
      previewUrl,
      resetExtraction,
      resetInput,
      vaultTab,
    ],
  );

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
          // ref={scrollRef}
          className={`absolute inset-0 overflow-y-auto transition-opacity duration-150${vaultTab !== VaultTab.LINKS ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <VaultLibrary
            filters={fullVaultFilters}
            onFiltersChange={handleLibraryFiltersChange}
            onNavigateToDiscover={onNavigateToDiscover}
          />
        </div>
        <div
          className={`absolute inset-0 flex flex-col overflow-hidden transition-opacity duration-150${vaultTab !== VaultTab.THOUGHTS ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <ThoughtsTabView
            userId={userId}
            searchQuery={searchQuery}
            activeBucket={activeBucket}
            onActiveBucketChange={handleActiveBucketChange}
            viewAll={thoughtsViewAll}
            onViewAllChange={setThoughtsViewAll}
          />
        </div>
      </div>

      {/* Single ChatInput — always visible, routes by content (URL → links, text/media → thoughts) */}
      <motion.div
        className="bg-background relative shrink-0"
        // animate={
        //   prefersReducedMotion ? undefined : { height: collapseComposerOnScroll ? 0 : "auto" }
        // }
        transition={springGentle}>
        {/* Link preview card — shown whenever a URL is detected, regardless of active tab */}
        <AnimatePresence>
          {previewPhase !== PreviewPhase.Idle && (
            <motion.div
              className="absolute right-0 bottom-full left-0 z-50 px-5"
              // animate={
              //   prefersReducedMotion
              //     ? undefined
              //     : {
              //         opacity: collapseComposerOnScroll ? 0 : 1,
              //         y: collapseComposerOnScroll ? 6 : 0,
              //       }
              // }
              // style={{ pointerEvents: collapseComposerOnScroll ? "none" : "auto" }}
              transition={springGentle}>
              <div className="mx-auto max-w-2xl">
                <LinkPreviewCard
                  phase={previewPhase}
                  url={previewUrl!}
                  metadata={previewMeta ?? undefined}
                  savedItemId={savedLoggedItemId ?? undefined}
                  savedItemGroups={savedItemGroups}
                  onClose={handlePreviewClose}
                  onShare={handleShare}
                  onSkip={handleSkip}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media preview bar */}
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
                  <img
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
            <ChatInput
              key={inputKey}
              placeholder="Drop a thought, task, link or something you overheard."
              onSend={handleVaultChatSend}
              onUrlChange={handleUrlChange}
              collapsible={vaultTab === VaultTab.THOUGHTS}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
