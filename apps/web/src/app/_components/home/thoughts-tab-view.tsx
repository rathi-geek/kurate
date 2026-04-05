"use client";

import { memo, useCallback, useEffect, useMemo } from "react";

import { AnimatePresence } from "framer-motion";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";

import { useTranslations } from "@/i18n/use-translations";
import { ThoughtsBucketChat } from "@/app/_components/home/thoughts-bucket-chat";
import { BucketCard } from "@/app/_components/home/thoughts/bucket-card";
import { ThoughtsAllSkeleton } from "@/app/_components/home/thoughts/thoughts-all-skeleton";
import { BucketCardSkeleton } from "@/app/_components/home/thoughts/bucket-card-skeleton";
import { ThoughtsAllView } from "@/app/_components/home/thoughts/thoughts-all-view";
import { type DisplayMessage, pendingToMessage } from "@/app/_components/home/thoughts/utils";
import { useDeleteThought } from "@/app/_libs/hooks/useDeleteThought";
import { useBucketLastRead } from "@/app/_libs/hooks/useBucketLastRead";
import { useBucketSummaries, type BucketSummary } from "@/app/_libs/hooks/useBucketSummaries";
import type { ThoughtBucket } from "@kurate/utils";
import type { ThoughtMessage } from "@kurate/types";
import { queryKeys } from "@kurate/query";
import { db } from "@/app/_libs/db";

interface ThoughtsTabViewProps {
  userId: string | null;
  searchQuery: string;
  activeBucket: ThoughtBucket | null;
  onActiveBucketChange: (b: ThoughtBucket | null) => void;
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

  // ── Backend bucket summaries (only when showing bucket cards) ──
  const { data: bucketSummaries, isLoading: isSummariesLoading } = useBucketSummaries(
    !needsFullList,
  );

  // ── Full list (only when "view all" or searching) ──
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: queryKeys.thoughts.list(null),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "100" });
      if (pageParam) params.set("cursor", pageParam as string);
      const res = await fetch(`/api/thoughts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch thoughts");
      return res.json() as Promise<{ items: ThoughtMessage[]; nextCursor: string | null }>;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    select: (raw) => ({
      ...raw,
      pages: [...raw.pages].reverse().map((p) => ({ ...p, items: [...p.items].reverse() })),
    }),
    enabled: needsFullList,
  });

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: queryKeys.thoughts.search(searchQuery),
    queryFn: async () => {
      const params = new URLSearchParams({ q: searchQuery, limit: "200" });
      const res = await fetch(`/api/thoughts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ items: ThoughtMessage[]; nextCursor: string | null }>;
    },
    enabled: isSearching,
  });

  const pendingThoughts = useLiveQuery(() => db.pending_thoughts.toArray(), []);
  const scrollTrigger = pendingThoughts?.length ?? 0;
  const allMessages = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const searchMessages = useMemo(
    () => (isSearching ? [...(searchData?.items ?? [])].reverse() : []),
    [isSearching, searchData],
  );

  // Dedup: when server data includes a text matching a pending thought, clean up Dexie
  useEffect(() => {
    if (!pendingThoughts?.length || !needsFullList) return;
    const serverTexts = new Set(allMessages.map((m) => m.text));
    const confirmed = pendingThoughts.filter((p) => serverTexts.has(p.text));
    if (confirmed.length) void db.pending_thoughts.bulkDelete(confirmed.map((t) => t.tempId));
  }, [allMessages, pendingThoughts, needsFullList]);

  const serverTexts = useMemo(() => new Set(allMessages.map((m) => m.text)), [allMessages]);
  const pendingMessages: DisplayMessage[] = !isSearching
    ? (pendingThoughts ?? []).filter((p) => !serverTexts.has(p.text)).map(pendingToMessage)
    : [];
  const displayMessages: DisplayMessage[] = isSearching
    ? (searchMessages as DisplayMessage[])
    : [...(allMessages as DisplayMessage[]), ...pendingMessages];

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

    return bucketSummaries.map((s) => {
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
  }, [bucketSummaries, pendingThoughts]);

  const showSkeleton = needsFullList
    ? isSearching
      ? isSearchLoading
      : isLoading && pendingMessages.length === 0
    : isSummariesLoading;

  const deleteThought = useDeleteThought();
  const handleDeleteThought = useCallback(
    (id: string) => {
      const isPending = (pendingThoughts ?? []).some((p) => p.tempId === id);
      deleteThought.mutate({ id, isPending });
    },
    [pendingThoughts, deleteThought],
  );

  const { markBucketRead } = useBucketLastRead(userId);

  // Filter summaries when searching in bucket view
  const visibleSummaries = isSearching
    ? mergedSummaries.filter((s) => s.totalCount > 0)
    : mergedSummaries;

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
              visibleSummaries.map((s) => (
                <BucketCard
                  key={s.bucket}
                  bucket={s.bucket as ThoughtBucket}
                  latestText={s.latestText}
                  latestCreatedAt={s.latestCreatedAt}
                  unreadCount={s.unreadCount}
                  onClick={() => onActiveBucketChange(s.bucket as ThoughtBucket)}
                />
              ))
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeBucket && (
          <ThoughtsBucketChat
            key={activeBucket}
            bucket={activeBucket}
            onBack={() => {
              if (activeBucket) markBucketRead(activeBucket);
              onActiveBucketChange(null);
            }}
            searchQuery={searchQuery}
            extraMessages={isSearching ? (searchMessages as DisplayMessage[]) : displayMessages}
            onDelete={handleDeleteThought}
            onEditStart={onEditStart}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
