"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { useGroupFeed } from "@/app/_libs/hooks/useGroupFeed";
import { createClient } from "@/app/_libs/supabase/client";
import { DropComposer } from "@/components/groups/drop-composer";
import { FeedShareCard } from "@/components/groups/feed-share-card";
import type { GroupRole } from "@/app/_libs/types/groups";

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
  const { drops, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, refetch } =
    useGroupFeed(groupId, currentUserId);
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

  // Scroll to + highlight drop from URL hash (Library card click)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#drop-")) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  }, [drops]);

  const handleDeleteDrop = async (dropId: string) => {
    await supabase.from("group_posts").delete().eq("id", dropId);
    refetch();
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
      <div id="main-content" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <FeedBody
          drops={drops}
          isLoading={isLoading}
          currentUserId={currentUserId}
          groupId={groupId}
          userRole={userRole}
          onDelete={handleDeleteDrop}
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
  onDelete: (id: string) => void;
}

function FeedBody({
  drops,
  isLoading,
  currentUserId,
  groupId,
  userRole,
  onDelete,
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
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
