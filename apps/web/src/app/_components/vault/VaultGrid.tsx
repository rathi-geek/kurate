"use client";

import { memo, useEffect, useRef } from "react";
import { AnimatePresence, type Variants, motion, useReducedMotion } from "framer-motion";

import { staggerContainer, staggerItem } from "@/app/_libs/utils/motion";
import type { VaultItem } from "@kurate/types";
import type { PendingLink } from "@/app/_libs/db";
import { VaultCard } from "@/app/_components/vault/VaultCard";
import { VaultCardSkeleton } from "@/app/_components/vault/VaultCardSkeleton";
import { PendingLinkCard } from "@/app/_components/vault/PendingLinkCard";

export interface VaultGridProps {
  items: VaultItem[];
  /** Optimistic pending links — rendered at the top of the same grid to avoid layout shift */
  pendingItems?: PendingLink[];
  hasMore: boolean;
  isLoadingMore: boolean;
  /** Changes when filters change — forces stagger animation to replay */
  animationKey: string;
  onLoadMore: () => void;
  deleteItem: (id: string) => void;
  updateRemarks: (id: string, value: string) => void;
  onToggleRead: (item: VaultItem) => void;
}

export const VaultGrid = memo(function VaultGrid({
  items,
  pendingItems = [],
  hasMore,
  isLoadingMore,
  animationKey,
  onLoadMore,
  deleteItem,
  updateRemarks,
  onToggleRead,
}: VaultGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

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
      <motion.div
        key={animationKey}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
        variants={staggerContainer as Variants}
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        {/* Pending items share the same grid — no layout shift when confirmed */}
        {pendingItems.map((link) => (
          <PendingLinkCard key={link.tempId} link={link} />
        ))}

        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="h-full min-h-0"
              variants={staggerItem as Variants}
              initial={prefersReducedMotion ? false : "hidden"}
              animate="visible"
              exit="hidden"
            >
              <VaultCard
                item={item}
                deleteItem={deleteItem}
                updateRemarks={updateRemarks}
                onToggleRead={onToggleRead}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

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
