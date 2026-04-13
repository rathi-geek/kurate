"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/use-translations";

import { useGroupFeed } from "@/app/_libs/hooks/useGroupFeed";
import { fetchComments } from "@/app/_libs/hooks/useComments";
import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import { DropComposer } from "@/app/_components/groups/drop-composer";
import { FeedShareCard } from "@/app/_components/groups/feed-share-card";
import { queryKeys } from "@kurate/query";
import type { GroupRole } from "@kurate/types";

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
  const { drops, markPostSeen, deleteDrop, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, refetch } =
    useGroupFeed(groupId, currentUserId);
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

  // Prefetch comments for top 10 drops so threads open instantly
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
          onDropPosted={refetch}
        />
      </div>

      {/* Scrollable feed */}
      <div id="main-content" className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <FeedBody
          drops={drops}
          isLoading={isLoading}
          currentUserId={currentUserId}
          groupId={groupId}
          userRole={userRole}
          currentUserProfile={currentUserProfile}
          onDelete={handleDeleteDrop}
          markPostSeen={markPostSeen}
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
  drops: ReturnType<typeof useGroupFeed>["drops"];
  isLoading: boolean;
  currentUserId: string;
  groupId: string;
  userRole: GroupRole;
  currentUserProfile?: { id: string; display_name: string | null; avatar_path: string | null; handle: string };
  onDelete: (id: string) => void;
  markPostSeen?: (postId: string, seenAt: string) => void;
}

function FeedBody({
  drops,
  isLoading,
  currentUserId,
  groupId,
  userRole,
  currentUserProfile,
  onDelete,
  markPostSeen,
}: FeedBodyProps) {
  const t = useTranslations("groups");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-card border bg-card h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {t("feed_empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drops.map((drop) => (
        <FeedShareCard
          key={drop.id}
          drop={drop}
          currentUserId={currentUserId}
          groupId={groupId}
          userRole={userRole}
          currentUserProfile={currentUserProfile}
          onDelete={onDelete}
          markPostSeen={markPostSeen}
        />
      ))}
    </div>
  );
}
