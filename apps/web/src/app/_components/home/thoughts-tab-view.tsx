"use client";

import { useMemo } from "react";

import { AnimatePresence } from "framer-motion";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";

import { ThoughtsBucketChat } from "@/app/_components/home/thoughts-bucket-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { BUCKET_META, type ThoughtBucket } from "@kurate/utils";
import type { ThoughtMessage } from "@kurate/types";
import { queryKeys } from "@kurate/query";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ALL_BUCKETS: ThoughtBucket[] = ["media", "tasks", "learning", "notes"];

function BucketCard({
  bucket,
  messages,
  onClick,
}: {
  bucket: ThoughtBucket;
  messages: ThoughtMessage[];
  onClick: () => void;
}) {
  const meta = BUCKET_META[bucket];
  const latest = messages.at(-1);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors"
      style={{ backgroundColor: `var(${meta.colorVar})` }}>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-semibold">{meta.label}</p>
        <p className="text-ink/45 mt-0.5 truncate text-xs">{latest?.text || "No thoughts yet"}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {latest && <span className="text-ink/30 text-[10px]">{formatTime(latest.createdAt)}</span>}
        <svg className="text-ink/30 size-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}

function ThoughtsAllSkeleton() {
  const widths = ["60%", "45%", "72%", "38%", "55%", "50%"];
  return (
    <div className="space-y-1 px-5 py-2">
      {widths.map((w, i) => (
        <div key={i} className="flex justify-end py-0.5">
          <Skeleton className="h-9 rounded-2xl rounded-br-sm" style={{ width: w }} />
        </div>
      ))}
    </div>
  );
}

function ThoughtsAllView({
  messages,
  hasNextPage,
  isFetchingNextPage,
  onFetchMore,
}: {
  messages: ThoughtMessage[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchMore: () => void;
}) {
  return (
    <Virtuoso
      className="h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data={messages}
      // Stick to bottom when new messages arrive; skip if user scrolled up
      followOutput="smooth"
      // Load older messages when scrolled to top
      startReached={() => {
        if (hasNextPage && !isFetchingNextPage) onFetchMore();
      }}
      itemContent={(_, m) => {
        const meta = BUCKET_META[m.bucket];
        return (
          <div className="flex justify-end px-5 py-0.5">
            <div className="max-w-[75%]">
              <div
                className="text-ink rounded-2xl rounded-br-sm px-3 py-2 text-sm"
                style={{ backgroundColor: `var(${meta.colorVar})` }}>
                <p className="leading-snug whitespace-pre-wrap">{m.text || "📷 Image"}</p>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <span className="text-ink/40 text-[9px]">{meta.label}</span>
                  <span className="text-ink/40 text-[9px]">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}

interface ThoughtsTabViewProps {
  searchQuery: string;
  activeBucket: ThoughtBucket | null;
  onActiveBucketChange: (b: ThoughtBucket | null) => void;
  viewAll: boolean;
  onViewAllChange: (v: boolean) => void;
}

export function ThoughtsTabView({ searchQuery, activeBucket, onActiveBucketChange, viewAll, onViewAllChange }: ThoughtsTabViewProps) {
  const isSearching = searchQuery.trim().length > 0;

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
    // Reverse pages and items once (memoized by TanStack Query) → oldest-first for top-to-bottom rendering
    select: (raw) => ({
      ...raw,
      pages: [...raw.pages].reverse().map((p) => ({ ...p, items: [...p.items].reverse() })),
    }),
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

  const allMessages = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  // Search results come back DESC; reverse for chronological (oldest-first) display
  const searchMessages = useMemo(
    () => (isSearching ? [...(searchData?.items ?? [])].reverse() : []),
    [isSearching, searchData],
  );

  const displayMessages = isSearching ? searchMessages : allMessages;

  const displayBuckets = isSearching
    ? ALL_BUCKETS.filter((b) => searchMessages.some((m) => m.bucket === b))
    : ALL_BUCKETS;

  const byBucket = (bucket: ThoughtBucket) =>
    (isSearching ? searchMessages : allMessages).filter((m) => m.bucket === bucket);

  const showSkeleton = isSearching ? isSearchLoading : isLoading;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Sticky toggle */}
      <div className="shrink-0 px-5 pt-3 pb-1">
        <div className="mx-auto flex justify-end">
          <button
            type="button"
            onClick={() => onViewAllChange(!viewAll)}
            className="text-ink/50 hover:text-ink/70 text-xs underline underline-offset-2 transition-colors">
            {viewAll ? "View buckets" : "View all chats"}
          </button>
        </div>
      </div>

      {/* Content */}
      {viewAll ? (
        showSkeleton ? (
          <ThoughtsAllSkeleton />
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
            <p className="text-ink/50 text-sm font-medium">
              {isSearching ? "No thoughts match your search" : "No thoughts yet"}
            </p>
            <p className="text-ink/30 text-xs">
              {isSearching ? "Try different keywords" : "Start typing to capture your first thought"}
            </p>
          </div>
        ) : (
          <ThoughtsAllView
            messages={displayMessages}
            hasNextPage={isSearching ? false : !!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchMore={() => void fetchNextPage()}
          />
        )
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-2">
            {showSkeleton ? (
              <ThoughtsAllSkeleton />
            ) : displayBuckets.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
                <p className="text-ink/50 text-sm font-medium">
                  {isSearching ? "No buckets match your search" : "No thoughts yet"}
                </p>
                <p className="text-ink/30 text-xs">
                  {isSearching ? "Try different keywords" : "Start typing to capture your first thought"}
                </p>
              </div>
            ) : (
              displayBuckets.map((b) => (
                <BucketCard
                  key={b}
                  bucket={b}
                  messages={byBucket(b)}
                  onClick={() => onActiveBucketChange(b)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Bucket chat overlay */}
      <AnimatePresence>
        {activeBucket && (
          <ThoughtsBucketChat
            key={activeBucket}
            bucket={activeBucket}
            onBack={() => onActiveBucketChange(null)}
            searchQuery={searchQuery}
            extraMessages={isSearching ? searchMessages : allMessages}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
