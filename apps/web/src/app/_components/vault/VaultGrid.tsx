"use client";

import { useEffect, useRef } from "react";
import { type Variants, motion, useReducedMotion } from "framer-motion";

import { staggerContainer, staggerItem } from "@/app/_libs/utils/motion";
import type { VaultItem } from "@/app/_libs/types/vault";
import { VaultCard } from "@/app/_components/vault/VaultCard";
import { VaultCardSkeleton } from "@/app/_components/vault/VaultCardSkeleton";

export interface VaultGridProps {
  items: VaultItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  /** Changes when filters change — forces stagger animation to replay */
  animationKey: string;
  onLoadMore: () => void;
  onDelete: (id: string) => void;
  onShare: (item: VaultItem) => void;
  onToggleRead: (item: VaultItem) => void;
  onOpenRemarkModal?: (item: VaultItem) => void;
}

export function VaultGrid({
  items,
  hasMore,
  isLoadingMore,
  animationKey,
  onLoadMore,
  onDelete,
  onShare,
  onToggleRead,
  onOpenRemarkModal,
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
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="h-full min-h-0"
            variants={staggerItem as Variants}
          >
            <VaultCard
              item={item}
              onDelete={onDelete}
              onShare={onShare}
              onToggleRead={onToggleRead}
              onOpenRemarkModal={onOpenRemarkModal}
            />
          </motion.div>
        ))}
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
}
