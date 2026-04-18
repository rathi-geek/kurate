"use client";

import { useEffect, useRef } from "react";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import { useGroupComposer } from "@kurate/hooks";
import type { GroupRole } from "@kurate/types";

import { DropComposer } from "@/app/_components/groups/drop-composer";
import { FeedShareCard } from "@/app/_components/groups/feed-share-card";
import { PendingGroupPostCard } from "@/app/_components/groups/PendingGroupPostCard";
import { fetchComments } from "@/app/_libs/hooks/useComments";
import { useGroupFeed } from "@/app/_libs/hooks/useGroupFeed";
import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { upsertLoggedItem } from "@/app/_libs/hooks/useSaveItem";
import { webPendingDb } from "@/app/_libs/db/pending-db";
import { createClient } from "@/app/_libs/supabase/client";
import { useTranslations } from "@/i18n/use-translations";

const supabase = createClient();

interface FeedTabViewProps {
  groupId: string;
  currentUserId: string;
  userRole: GroupRole;
}

export function FeedTabView({
  groupId,
  currentUserId,
  userRole,
}: FeedTabViewProps) {
  const t = useTranslations("groups");
  const queryClient = useQueryClient();
  const {
    entries,
    drops,
    markPostSeen,
    deleteDrop,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useGroupFeed(groupId, currentUserId);
  const { members } = useGroupMembers(groupId, currentUserId);
  const me = members.find((m) => m.user_id === currentUserId);
  const currentUserProfile = me
    ? {
        id: me.profile_id,
        display_name: me.profile_display_name,
        avatar_path: me.profile_avatar_path,
        handle: me.profile_handle,
      }
    : undefined;
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Retry/dismiss handlers for failed pending cards.
  // Re-instantiating the composer here is a minor cost — it has no expensive
  // effects of its own; it just shares the Dexie-backed state.
  const retryComposer = useGroupComposer({
    groupId,
    currentUserId,
    supabase,
    upsertLoggedItem,
    currentUserProfile: currentUserProfile ?? null,
    platform: { pendingDb: webPendingDb },
  });

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prefetch comments for top 10 confirmed drops so threads open instantly
  useEffect(() => {
    if (!drops.length) return;
    for (const drop of drops.slice(0, 10)) {
      void queryClient.prefetchInfiniteQuery({
        queryKey: queryKeys.groups.comments(drop.id),
        queryFn: ({ pageParam }) => fetchComments(drop.id, pageParam as string | null),
        initialPageParam: null as string | null,
        staleTime: 1000 * 30,
      });
    }
  }, [drops, queryClient]);

  // Scroll to + highlight drop from URL hash (notification / Library card click).
  // The ref gate ensures we only scroll once — subsequent feed refetches won't re-trigger.
  const hasScrolledToHashRef = useRef(false);
  useEffect(() => {
    if (hasScrolledToHashRef.current) return;
    const hash = window.location.hash;
    if (!hash.startsWith("#drop-")) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      hasScrolledToHashRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  }, [drops]);

  const handleDeleteDrop = (dropId: string) => {
    void deleteDrop(dropId);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Composer — outside scroll so its popup can overflow downward */}
      <div className="relative shrink-0">
        <DropComposer
          groupId={groupId}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
        />
      </div>

      {/* Scrollable feed */}
      <div id="main-content" className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <FeedBody
          entries={entries}
          isLoading={isLoading}
          currentUserId={currentUserId}
          groupId={groupId}
          userRole={userRole}
          currentUserProfile={currentUserProfile}
          onDelete={handleDeleteDrop}
          markPostSeen={markPostSeen}
          onRetryPending={retryComposer.retry}
          onDismissPending={(tempId) =>
            void webPendingDb.deletePendingGroupPost(tempId)
          }
        />

        <div ref={sentinelRef} className="h-1" />

        {isFetchingNextPage && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            {t("loading_more")}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feed body states ─────────────────────────────────────────────────────────

interface FeedBodyProps {
  entries: ReturnType<typeof useGroupFeed>["entries"];
  isLoading: boolean;
  currentUserId: string;
  groupId: string;
  userRole: GroupRole;
  currentUserProfile?: { id: string; display_name: string | null; avatar_path: string | null; handle: string };
  onDelete: (id: string) => void;
  markPostSeen?: (postId: string, seenAt: string) => void;
  onRetryPending: (tempId: string) => Promise<void>;
  onDismissPending: (tempId: string) => void;
}

function FeedBody({
  entries,
  isLoading,
  currentUserId,
  groupId,
  userRole,
  currentUserProfile,
  onDelete,
  markPostSeen,
  onRetryPending,
  onDismissPending,
}: FeedBodyProps) {
  const t = useTranslations("groups");
  const prefersReducedMotion = useSafeReducedMotion();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-card border bg-card h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {t("feed_empty")}
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {entries.map((entry) => {
            // React key: pending uses tempId (so the pending and confirmed
            // entries are different React components), confirmed uses server id.
            // layoutId: shared once the pending row knows its serverId — Framer
            // morphs the dimmed pending card into the live confirmed card.
            const key =
              entry.kind === "pending"
                ? `pending-${entry.data.tempId}`
                : entry.data.id;
            const layoutId =
              entry.kind === "pending"
                ? entry.data.serverId
                  ? `group-post-${entry.data.serverId}`
                  : `group-post-pending-${entry.data.tempId}`
                : `group-post-${entry.data.id}`;

            return (
              <motion.div
                key={key}
                layoutId={prefersReducedMotion ? undefined : layoutId}
                layout={!prefersReducedMotion}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}>
                {entry.kind === "pending" ? (
                  <PendingGroupPostCard
                    row={entry.data}
                    currentUserProfile={
                      currentUserProfile
                        ? {
                            display_name: currentUserProfile.display_name,
                            avatar_path: currentUserProfile.avatar_path,
                            handle: currentUserProfile.handle,
                          }
                        : undefined
                    }
                    onRetry={onRetryPending}
                    onDismiss={onDismissPending}
                  />
                ) : (
                  <FeedShareCard
                    drop={entry.data}
                    currentUserId={currentUserId}
                    groupId={groupId}
                    userRole={userRole}
                    currentUserProfile={currentUserProfile}
                    onDelete={onDelete}
                    markPostSeen={markPostSeen}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
