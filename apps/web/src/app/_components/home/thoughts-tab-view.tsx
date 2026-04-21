"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";

import { useTranslations } from "@/i18n/use-translations";
import { PlusIcon } from "@/components/icons";
import { CreateBucketDialog } from "@/app/_components/home/thoughts/create-bucket-dialog";
import { ThoughtsBucketChat } from "@/app/_components/home/thoughts-bucket-chat";
import { BucketCard } from "@/app/_components/home/thoughts/bucket-card";
import { ThoughtsAllSkeleton } from "@/app/_components/home/thoughts/thoughts-all-skeleton";
import { BucketCardSkeleton } from "@/app/_components/home/thoughts/bucket-card-skeleton";
import { ThoughtsAllView } from "@/app/_components/home/thoughts/thoughts-all-view";
import { type DisplayMessage, pendingToMessage } from "@/app/_components/home/thoughts/utils";
import {
  useBuckets,
  useMoveBucket,
  useThoughts,
  useBucketSummaries,
  type BucketSummary,
  useDeleteThought,
  useBucketLastRead,
} from "@kurate/hooks";
import { sortBucketSummaries } from "@kurate/utils";
import { queryKeys } from "@kurate/query";
import { db } from "@/app/_libs/db";
import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

interface ThoughtsTabViewProps {
  userId: string | null;
  searchQuery: string;
  activeBucket: string | null;
  onActiveBucketChange: (b: string | null) => void;
  viewAll: boolean;
  onViewAllChange: (v: boolean) => void;
  onEditStart?: (id: string, text: string) => void;
}

export const ThoughtsTabView = memo(function ThoughtsTabView({
  userId,
  searchQuery,
  activeBucket,
  onActiveBucketChange,
  viewAll,
  onViewAllChange,
  onEditStart,
}: ThoughtsTabViewProps) {
  const t = useTranslations("thoughts");
  const isSearching = searchQuery.trim().length > 0;
  const needsFullList = viewAll || isSearching;
  const supaConfig = { supabase, userId };

  // ── Backend bucket summaries ──
  const { data: bucketSummaries, isLoading: isSummariesLoading } = useBucketSummaries(
    supaConfig,
  );

  // ── Thoughts (list + search via shared hook) ──
  const {
    messages: serverMessages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
  } = useThoughts(supaConfig, needsFullList ? null : activeBucket, searchQuery);

  // ── Dexie pending queue (web-specific) ──
  const pendingThoughts = useLiveQuery(() => db.pending_thoughts.toArray(), []);
  const scrollTrigger = pendingThoughts?.length ?? 0;

  // Dedup: clean up Dexie entries confirmed by server
  useEffect(() => {
    if (!pendingThoughts?.length || !needsFullList) return;
    const serverTexts = new Set(serverMessages.map((m) => m.text));
    const confirmed = pendingThoughts.filter((p) => serverTexts.has(p.text));
    if (confirmed.length) void db.pending_thoughts.bulkDelete(confirmed.map((t) => t.tempId));
  }, [serverMessages, pendingThoughts, needsFullList]);

  const serverTexts = useMemo(() => new Set(serverMessages.map((m) => m.text)), [serverMessages]);
  const pendingMessages: DisplayMessage[] = !isSearching
    ? (pendingThoughts ?? []).filter((p) => !serverTexts.has(p.text)).map(pendingToMessage)
    : [];
  const displayMessages: DisplayMessage[] = [
    ...pendingMessages,
    ...(serverMessages as DisplayMessage[]),
  ];

  // ── Merge pending thoughts into bucket summaries ──
  const mergedSummaries = useMemo<BucketSummary[]>(() => {
    if (!bucketSummaries) return [];
    const pending = pendingThoughts ?? [];
    if (pending.length === 0) return bucketSummaries;

    const pendingByBucket = new Map<string, typeof pending>();
    for (const p of pending) {
      const list = pendingByBucket.get(p.bucket) ?? [];
      list.push(p);
      pendingByBucket.set(p.bucket, list);
    }

    const merged = bucketSummaries.map((s) => {
      const bp = pendingByBucket.get(s.bucket);
      if (!bp?.length) return s;
      const latestPending = bp.reduce((a, b) =>
        new Date(b.createdAt).getTime() > new Date(a.createdAt).getTime() ? b : a,
      );
      const pendingIsNewer =
        !s.latestCreatedAt ||
        new Date(latestPending.createdAt).getTime() > new Date(s.latestCreatedAt).getTime();
      return {
        ...s,
        latestText: pendingIsNewer ? latestPending.text : s.latestText,
        latestCreatedAt: pendingIsNewer ? latestPending.createdAt : s.latestCreatedAt,
        totalCount: s.totalCount + bp.length,
      };
    });

    return sortBucketSummaries(merged);
  }, [bucketSummaries, pendingThoughts]);

  // ── Build bucket lookup maps ──
  const bucketMap = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {};
    for (const s of mergedSummaries) {
      map[s.bucket] = { label: s.bucketLabel, color: s.color };
    }
    return map;
  }, [mergedSummaries]);

  // Active bucket summary
  const activeSummary = useMemo(
    () => mergedSummaries.find((s) => s.bucket === activeBucket),
    [mergedSummaries, activeBucket],
  );

  const showSkeleton = needsFullList
    ? isLoading && pendingMessages.length === 0
    : isSummariesLoading;

  const deleteThought = useDeleteThought({ supabase });
  const handleDeleteThought = useCallback(
    (id: string) => {
      const isPending = (pendingThoughts ?? []).some((p) => p.tempId === id);
      if (isPending) {
        void db.pending_thoughts.delete(id);
        return;
      }
      deleteThought.mutate(id);
    },
    [pendingThoughts, deleteThought],
  );

  const moveBucket = useMoveBucket({ supabase });
  const handleMoveThought = useCallback(
    (thoughtId: string, targetBucket: string) => {
      moveBucket.mutate({ thoughtId, newBucket: targetBucket });
    },
    [moveBucket],
  );

  const { markBucketRead } = useBucketLastRead(supaConfig);
  const queryClient = useQueryClient();

  const handleOpenBucket = useCallback(
    (bucket: string) => {
      markBucketRead(bucket);
      queryClient.setQueryData<BucketSummary[]>(
        queryKeys.thoughts.bucketSummaries(),
        (prev) => prev?.map((s) => (s.bucket === bucket ? { ...s, unreadCount: 0 } : s)),
      );
      onActiveBucketChange(bucket);
    },
    [markBucketRead, queryClient, onActiveBucketChange],
  );

  // Filter summaries when searching in bucket view
  const visibleSummaries = isSearching
    ? mergedSummaries.filter((s) => s.totalCount > 0)
    : mergedSummaries;

  // ── Create bucket ──
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { buckets, createBucket, renameBucket, deleteBucket, togglePin, isCreating } = useBuckets({
    supabase,
    userId,
  });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-3 pb-1">
        <div className="mx-auto flex justify-end">
          <button
            type="button"
            onClick={() => onViewAllChange(!viewAll)}
            className="text-ink/50 hover:text-ink/70 text-xs underline underline-offset-2 transition-colors">
            {viewAll ? t("view_buckets") : t("view_all_chats")}
          </button>
        </div>
      </div>

      {viewAll ? (
        showSkeleton ? (
          <ThoughtsAllSkeleton />
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
            <p className="text-ink/50 text-sm font-medium">
              {isSearching ? t("empty_no_match") : t("empty_no_thoughts")}
            </p>
            <p className="text-ink/30 text-xs">
              {isSearching ? t("empty_try_keywords") : t("empty_start_typing")}
            </p>
          </div>
        ) : (
          <ThoughtsAllView
            messages={displayMessages}
            hasNextPage={isSearching ? false : !!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchMore={() => void fetchNextPage()}
            scrollToBottomTrigger={scrollTrigger}
            onDelete={handleDeleteThought}
            onEditStart={onEditStart}
            onMove={handleMoveThought}
            allBuckets={mergedSummaries}
            bucketMap={bucketMap}
          />
        )
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-2">
            {showSkeleton ? (
              <BucketCardSkeleton />
            ) : visibleSummaries.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
                <p className="text-ink/50 text-sm font-medium">
                  {isSearching ? t("empty_no_buckets_match") : t("empty_no_thoughts")}
                </p>
                <p className="text-ink/30 text-xs">
                  {isSearching ? t("empty_try_keywords") : t("empty_start_typing")}
                </p>
              </div>
            ) : (
              <>
                {visibleSummaries.map((s) => {
                  const bucketRow = buckets.find((b) => b.slug === s.bucket);
                  return (
                    <BucketCard
                      key={s.bucket}
                      slug={s.bucket}
                      label={s.bucketLabel}
                      color={s.color}
                      isPinned={s.isPinned}
                      isSystem={s.isSystem}
                      latestText={s.latestText}
                      latestCreatedAt={s.latestCreatedAt}
                      unreadCount={s.unreadCount}
                      bucketId={bucketRow?.id}
                      onClick={() => handleOpenBucket(s.bucket)}
                      onRename={renameBucket}
                      onDelete={deleteBucket}
                      onTogglePin={togglePin}
                    />
                  );
                })}
                {/* Create bucket button */}
                {!isSearching && (
                  <button
                    type="button"
                    onClick={() => setShowCreateDialog(true)}
                    className="text-muted-foreground hover:text-foreground border-border hover:border-border/80 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors">
                    <PlusIcon className="size-4" />
                    {t("create_bucket")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeBucket && activeSummary && (
          <ThoughtsBucketChat
            key={activeBucket}
            bucket={activeBucket}
            bucketLabel={activeSummary.bucketLabel}
            color={activeSummary.color}
            onBack={() => onActiveBucketChange(null)}
            searchQuery={searchQuery}
            extraMessages={displayMessages}
            onDelete={handleDeleteThought}
            onEditStart={onEditStart}
            onMove={handleMoveThought}
            allBuckets={mergedSummaries}
          />
        )}
      </AnimatePresence>

      <CreateBucketDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateBucket={createBucket}
        isCreating={isCreating}
      />
    </div>
  );
});
