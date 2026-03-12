"use client";

/**
 * Skeleton placeholder for VaultCard. Same card dimensions, pulse animation.
 * White card background, cream skeleton placeholders.
 */
export function VaultCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-white">
      <div className="h-[150px] w-full animate-pulse bg-cream" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-cream" />
        <div className="h-4 w-full animate-pulse rounded bg-cream" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-cream" />
      </div>
      <div className="flex gap-1 border-t border-border px-3 py-2">
        <div className="h-7 w-7 animate-pulse rounded-button bg-cream" />
        <div className="h-7 w-7 animate-pulse rounded-button bg-cream" />
        <div className="h-7 w-7 animate-pulse rounded-button bg-cream" />
        <div className="h-7 w-7 animate-pulse rounded-button bg-cream" />
      </div>
    </div>
  );
}
