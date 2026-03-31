"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { ChatInput } from "@/app/_components/home/chat-input";
import { LinkPreviewCard, type ExtractedMeta } from "@/app/_components/home/LinkPreviewCard";
import { PreviewPhase } from "@/app/_components/home/preview-phase";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import { ThoughtsTabView } from "@/app/_components/home/thoughts-tab-view";
import { VaultTabSubHeader } from "@/app/_components/home/vault-tab-sub-header";
import { useExtractMetadata } from "@/app/_libs/hooks/useExtractMetadata";
import { useScrollDirection } from "@/app/_libs/hooks/useScrollDirection";
import { springGentle } from "@/app/_libs/utils/motion";
import { VaultTab } from "@/app/_libs/chat-types";
import { classifyThought, type ThoughtBucket } from "@kurate/utils";
import { queryKeys } from "@kurate/query";
import { useSubmitContent } from "@kurate/hooks";
import { createClient } from "@/app/_libs/supabase/client";
import { useAuth } from "@/app/_libs/auth-context";
import { fetchShareableConversations, type ShareableConversation } from "@/app/_libs/utils/fetchShareableConversations";
import { track } from "@/app/_libs/utils/analytics";
import type { VaultFilters as VaultFiltersType } from "@kurate/types";
import type { SaveItemResult } from "@kurate/hooks";
import { db } from "@/app/_libs/db";

const supabase = createClient();

interface MediaPreview {
  file: File;
  objectUrl: string;
}

interface VaultTabViewProps {
  onNavigateToDiscover?: () => void;
  onScrollDirectionChange?: (dir: "up" | "down") => void;
}

export function VaultTabView({ onNavigateToDiscover, onScrollDirectionChange }: VaultTabViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(scrollRef);
  const isScrolledDown = scrollDir === "down";
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

  const resetInput = useCallback(() => setInputKey((k) => k + 1), []);

  const { isExtracting, metadata: extractedMeta, extractionFailed, extract, reset: resetExtraction } = useExtractMetadata();

  const handleLinkSaved = useCallback(
    async (result: SaveItemResult) => {
      track("vault_link_saved", {
        content_type: previewMeta?.contentType ?? "article",
        source: previewMeta?.source ?? null,
        has_tags: false,
        is_duplicate: result.status === "duplicate",
      });
      if (result.status === "duplicate") {
        toast("Already in your Vault", { description: "This link has been saved before." });
        setPreviewPhase(PreviewPhase.Idle);
        resetInput();
      } else if (result.status === "saved" && result.item) {
        const cached = queryClient.getQueryData<ShareableConversation[]>(queryKeys.vault.shareConversations());
        const convos = cached ?? (await fetchShareableConversations(userId ?? ""));
        if (convos.length === 0) {
          setPreviewPhase(PreviewPhase.Idle);
          toast("Saved to Vault");
          resetInput();
        } else {
          setSavedLoggedItemId(result.item.logged_item_id);
          setSavedItemGroups([]);
          setPreviewPhase(PreviewPhase.Share);
        }
      }
    },
    [queryClient, previewMeta, resetInput],
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

  useEffect(() => {
    if (scrollDir) onScrollDirectionChange?.(scrollDir);
  }, [scrollDir, onScrollDirectionChange]);

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
        resetExtraction();
        return;
      }
      if (url === previewUrl) return;
      setPreviewUrl(url);
      setPreviewPhase(PreviewPhase.Loading);
      void extract(url);
    },
    [previewUrl, extract, resetExtraction],
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
      toast("Shared!");
      resetInput();
    },
    [savedLoggedItemId, queryClient, resetInput],
  );

  const handleSkip = useCallback(() => {
    setPreviewPhase(PreviewPhase.Idle);
    toast("Saved to Vault");
    resetInput();
  }, [resetInput]);

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
    resetInput();
  }, [resetInput]);

  const handleVaultChatSend = useCallback(
    async (noteText: string) => {
      const meta = previewMeta ? { ...previewMeta, tags: extractedMeta?.tags ?? null } : null;
      if (previewUrl) {
        // Cancel in-flight preview extraction — grid handles null-metadata via useRefreshLoggedItem
        resetExtraction();
        setPreviewMeta(null);
        setPreviewPhase(PreviewPhase.Idle);

        // Deduplicate: same URL already pending → skip
        const existingPending = await db.pending_links.where("url").equals(previewUrl).first();
        if (existingPending) {
          toast("Already in your Vault", { description: "This link has been saved before." });
          setPreviewUrl(null);
          resetInput();
          return;
        }

        const tempId = crypto.randomUUID();
        // URL mode: pending row in Dexie, then POST
        void db.pending_links.add({
          tempId,
          url: previewUrl,
          title: previewMeta?.title ?? previewUrl,
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
        void onSend(previewUrl, undefined, meta, noteText.trim() || null)
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
          ref={scrollRef}
          className={`absolute inset-0 overflow-y-auto transition-opacity duration-150${vaultTab !== VaultTab.LINKS ? " pointer-events-none opacity-0" : " opacity-100"}`}>
          <VaultLibrary
            filters={fullVaultFilters}
            onFiltersChange={handleLibraryFiltersChange}
            onNavigateToDiscover={onNavigateToDiscover}
          />
        </div>
        <div
          className={`absolute inset-0 flex flex-col overflow-hidden transition-opacity duration-150${vaultTab !== VaultTab.THOUGHTS ? " pointer-events-none opacity-0" : " opacity-100"}`}>
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
        animate={prefersReducedMotion ? undefined : { height: isScrolledDown ? 0 : "auto" }}
        transition={springGentle}>
        {/* Link preview card — shown whenever a URL is detected, regardless of active tab */}
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
              className="absolute bottom-full left-0 right-0 z-50 px-5 pb-1"
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

        <div className="px-5 py-3">
          <div className="mx-auto max-w-2xl">
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
