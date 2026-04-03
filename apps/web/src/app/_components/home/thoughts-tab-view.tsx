"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import { ThoughtsBucketChat } from "@/app/_components/home/thoughts-bucket-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { BUCKET_BADGE_COLOR, BUCKET_META, type ThoughtBucket } from "@kurate/utils";
import { useBucketLastRead } from "@/app/_libs/hooks/useBucketLastRead";
import type { ThoughtMessage } from "@kurate/types";
import { queryKeys } from "@kurate/query";
import { db, type PendingThought } from "@/app/_libs/db";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ALL_BUCKETS: ThoughtBucket[] = ["media", "tasks", "learning", "notes"];

function BucketCard({
  bucket,
  messages,
  onClick,
  unreadCount,
}: {
  bucket: ThoughtBucket;
  messages: ThoughtMessage[];
  onClick: () => void;
  unreadCount: number;
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
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none text-white"
              style={{ backgroundColor: BUCKET_BADGE_COLOR[bucket] }}>
              {unreadCount}
            </span>
          )}
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

type DisplayMessage = ThoughtMessage & { _pending?: boolean; _failed?: boolean };

function pendingToMessage(p: PendingThought): DisplayMessage {
  return {
    id: p.tempId,
    bucket: p.bucket,
    text: p.text,
    createdAt: p.createdAt,
    media_id: p.media_id,
    content_type: p.content_type,
    _pending: p.status === "sending",
    _failed: p.status === "failed",
  };
}

function ThoughtsAllView({
  messages,
  hasNextPage,
  isFetchingNextPage,
  onFetchMore,
  scrollToBottomTrigger,
}: {
  messages: DisplayMessage[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchMore: () => void;
  scrollToBottomTrigger?: number;
}) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (scrollToBottomTrigger && messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottomTrigger]);

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data={messages}
      // Start at the bottom on first mount (initial load / hard refresh / page navigation)
      initialTopMostItemIndex={messages.length - 1}
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
              <motion.div
                className="text-ink rounded-2xl rounded-br-sm px-3 py-2 text-sm"
                style={{ backgroundColor: `var(${meta.colorVar})` }}
                animate={{ opacity: m._pending || m._failed ? 0.7 : 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}>
                <p className="leading-snug whitespace-pre-wrap">{m.text || "📷 Image"}</p>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <span className="text-ink/40 text-[9px]">{meta.label}</span>
                  <span className="text-ink/40 flex items-center gap-1 text-[9px]">
                    {formatTime(m.createdAt)}
                    {m._pending && <span aria-label="Sending">⏱</span>}
                    {m._failed && <span aria-label="Failed to send" className="text-red-400">!</span>}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        );
      }}
    />
  );
}

interface ThoughtsTabViewProps {
  userId: string | null;
  searchQuery: string;
  activeBucket: ThoughtBucket | null;
  onActiveBucketChange: (b: ThoughtBucket | null) => void;
  viewAll: boolean;
  onViewAllChange: (v: boolean) => void;
}

export const ThoughtsTabView = memo(function ThoughtsTabView({ userId, searchQuery, activeBucket, onActiveBucketChange, viewAll, onViewAllChange }: ThoughtsTabViewProps) {
  const queryClient = useQueryClient();
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

  const pendingThoughts = useLiveQuery(() => db.pending_thoughts.toArray(), []);

  const scrollTrigger = useRef(0);
  const prevPendingLengthRef = useRef(0);

  useEffect(() => {
    const newLen = pendingThoughts?.length ?? 0;
    if (newLen > prevPendingLengthRef.current) {
      scrollTrigger.current += 1;
    }
    prevPendingLengthRef.current = newLen;
  }, [pendingThoughts?.length]);

  const allMessages = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  // Search results come back DESC; reverse for chronological (oldest-first) display
  const searchMessages = useMemo(
    () => (isSearching ? [...(searchData?.items ?? [])].reverse() : []),
    [isSearching, searchData],
  );

  // Dedup: when server data includes a text matching a pending thought, clean up Dexie
  useEffect(() => {
    if (!pendingThoughts?.length) return;
    const serverTexts = new Set(allMessages.map((m) => m.text));
    const confirmed = pendingThoughts.filter((p) => serverTexts.has(p.text));
    if (confirmed.length) void db.pending_thoughts.bulkDelete(confirmed.map((t) => t.tempId));
  }, [allMessages, pendingThoughts]);

  // In-render dedup: filter out pending thoughts already confirmed by server (eliminates 1-frame flash)
  const serverTexts = useMemo(() => new Set(allMessages.map((m) => m.text)), [allMessages]);
  const pendingMessages: DisplayMessage[] = !isSearching
    ? (pendingThoughts ?? []).filter((p) => !serverTexts.has(p.text)).map(pendingToMessage)
    : [];
  const displayMessages: DisplayMessage[] = isSearching
    ? (searchMessages as DisplayMessage[])
    : ([...(allMessages as DisplayMessage[]), ...pendingMessages]);

  // Single pass: group all messages by bucket once — reused for ordering, unread counts, and card rendering
  const bucketMessages = useMemo<Map<ThoughtBucket, DisplayMessage[]>>(() => {
    const source: DisplayMessage[] = isSearching
      ? (searchMessages as DisplayMessage[])
      : ([...(allMessages as DisplayMessage[]), ...pendingMessages]);
    const map = new Map<ThoughtBucket, DisplayMessage[]>(ALL_BUCKETS.map((b) => [b, []]));
    for (const m of source) map.get(m.bucket as ThoughtBucket)?.push(m);
    return map;
  }, [isSearching, searchMessages, allMessages, pendingMessages]);

  const displayBuckets = isSearching
    ? ALL_BUCKETS.filter((b) => (bucketMessages.get(b)?.length ?? 0) > 0)
    : ALL_BUCKETS;

  const byBucket = (bucket: ThoughtBucket): DisplayMessage[] => bucketMessages.get(bucket) ?? [];

  const showSkeleton = isSearching ? isSearchLoading : isLoading;

  const sortedBuckets = useMemo(() => {
    return [...displayBuckets].sort((a, b) => {
      const la = bucketMessages.get(a)?.at(-1)?.createdAt ?? null;
      const lb = bucketMessages.get(b)?.at(-1)?.createdAt ?? null;
      if (!la && !lb) return 0;
      if (!la) return 1;
      if (!lb) return -1;
      return new Date(lb).getTime() - new Date(la).getTime();
    });
  }, [displayBuckets, bucketMessages]);

  const handleDeleteThought = useCallback(async (id: string) => {
    // Check if this is a pending thought (still in Dexie) — delete locally instead of via API
    const isPending = (pendingThoughts ?? []).some((p) => p.tempId === id);
    if (isPending) {
      await db.pending_thoughts.delete(id);
      return;
    }
    await fetch(`/api/thoughts/${id}`, { method: "DELETE" });
    void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.all });
  }, [queryClient, pendingThoughts]);

  const { lastReadAt, markBucketRead } = useBucketLastRead(userId);

  const getBucketUnread = useCallback((b: ThoughtBucket): number => {
    const lastSeen = lastReadAt(b);
    const msgs = bucketMessages.get(b) ?? [];
    if (!lastSeen) return msgs.filter((m) => !m._pending).length;
    const cutoff = new Date(lastSeen).getTime();
    return msgs.filter((m) => !m._pending && new Date(m.createdAt).getTime() > cutoff).length;
   
  }, [bucketMessages, lastReadAt]);

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
            scrollToBottomTrigger={scrollTrigger.current}
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
              sortedBuckets.map((b) => (
                <BucketCard
                  key={b}
                  bucket={b}
                  messages={byBucket(b)}
                  unreadCount={getBucketUnread(b)}
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
            onBack={() => {
              if (activeBucket) markBucketRead(activeBucket);
              onActiveBucketChange(null);
            }}
            searchQuery={searchQuery}
            extraMessages={isSearching ? (searchMessages as DisplayMessage[]) : displayMessages}
            onDelete={handleDeleteThought}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
