"use client";

import { memo, useEffect, useRef } from "react";
import { AnimatePresence, LayoutGroup, type Variants, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";

import { staggerContainer, staggerItem } from "@/app/_libs/utils/motion";
import type { VaultItem } from "@kurate/types";
import type { PendingLink } from "@/app/_libs/db";
import { VaultCard } from "@/app/_components/vault/VaultCard";
import { VaultCardSkeleton } from "@/app/_components/vault/VaultCardSkeleton";
import { PendingLinkCard } from "@/app/_components/vault/PendingLinkCard";

export type GridEntry =
  | { kind: "pending"; data: PendingLink }
  | { kind: "confirmed"; data: VaultItem };

export interface VaultGridProps {
  entries: GridEntry[];
  hasMore: boolean;
  isLoadingMore: boolean;
  /** Changes when filters change — forces stagger animation to replay */
  animationKey: string;
  onLoadMore: () => void;
  deleteItem: (id: string) => void;
  updateRemarks: (id: string, value: string) => void;
  onToggleRead: (item: VaultItem) => void;
  onDismissPending?: (tempId: string) => void;
}

export const VaultGrid = memo(function VaultGrid({
  entries,
  hasMore,
  isLoadingMore,
  animationKey,
  onLoadMore,
  deleteItem,
  updateRemarks,
  onToggleRead,
  onDismissPending,
}: VaultGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useSafeReducedMotion();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <>
      <LayoutGroup>
        <motion.div
          key={animationKey}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
          variants={staggerContainer as Variants}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
        >
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => {
              const url = entry.kind === "pending" ? entry.data.url : entry.data.url;
              const key = entry.kind === "pending" ? `pending-${entry.data.tempId}` : entry.data.id;

              return (
                <motion.div
                  key={key}
                  layoutId={prefersReducedMotion ? undefined : `vault-${url}`}
                  className="h-full min-h-0"
                  variants={staggerItem as Variants}
                  initial={prefersReducedMotion ? false : "hidden"}
                  animate="visible"
                  exit="hidden"
                  layout={!prefersReducedMotion}
                >
                  {entry.kind === "pending" ? (
                    <PendingLinkCard link={entry.data} onDismiss={onDismissPending} />
                  ) : (
                    <VaultCard
                      item={entry.data}
                      deleteItem={deleteItem}
                      updateRemarks={updateRemarks}
                      onToggleRead={onToggleRead}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

      {isLoadingMore && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <VaultCardSkeleton key={i} />
          ))}
        </div>
      )}
    </>
  );
});
