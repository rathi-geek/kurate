"use client";

import { memo, useEffect, useMemo } from "react";

import type { VaultFilters as VaultFiltersType } from "@kurate/types";
import { useLiveQuery } from "dexie-react-hooks";

import { VaultCardSkeleton } from "@/app/_components/vault/VaultCardSkeleton";
import { VaultEmptyState } from "@/app/_components/vault/VaultEmptyState";
import { VaultErrorState } from "@/app/_components/vault/VaultErrorState";
import { VaultGrid } from "@/app/_components/vault/VaultGrid";
import { db } from "@/app/_libs/db";
import { useVault } from "@/app/_libs/hooks/useVault";
import { useAuth } from "@/app/_libs/auth-context";

export const DEFAULT_FILTERS: VaultFiltersType = {
  time: "all",
  contentType: "all",
  search: "",
  readStatus: "all",
};

export interface VaultLibraryProps {
  onNavigateToDiscover?: () => void;
  filters: VaultFiltersType;
  onFiltersChange: (f: VaultFiltersType) => void;
}

export const VaultLibrary = memo(function VaultLibrary({
  onNavigateToDiscover,
  filters,
}: VaultLibraryProps) {
  const { user } = useAuth();
  const {
    items,
    isLoading,
    isFetching,
    isError,
    hasMore,
    isLoadingMore,
    loadMore,
    refetch,
    deleteItem,
    updateRemarks,
    toggleRead,
  } = useVault(filters, user?.id ?? "");

  const pendingLinks = useLiveQuery(() => db.pending_links.toArray(), []);

  const serverUrls = useMemo(() => new Set(items.map((i) => i.url)), [items]);

  // Only show pending cards for links not yet confirmed by the server.
  // When `items` gains the URL, this filters it out in the SAME render that VaultCard appears
  // → no duplication flash, no blank-gap flash.
  const visiblePendingLinks = useMemo(
    () => (pendingLinks ?? []).filter((p) => !serverUrls.has(p.url)),
    [pendingLinks, serverUrls],
  );

  // Dedup: when server data includes a URL matching a pending link, remove from Dexie
  useEffect(() => {
    if (!pendingLinks?.length || !items.length) return;
    const confirmed = pendingLinks.filter((p) => serverUrls.has(p.url));
    if (confirmed.length) void db.pending_links.bulkDelete(confirmed.map((l) => l.tempId));
  }, [items, pendingLinks, serverUrls]);

  const hasNoItems = items.length === 0 && !pendingLinks?.length;
  const hasActiveFilter =
    filters.time !== "all"
    || filters.contentType !== "all"
    || filters.readStatus !== "all"
    || filters.search.trim() !== "";
  const isEmptyDefault = !isLoading && !isError && hasNoItems && !hasActiveFilter;
  const isEmptyFiltered = !isLoading && !isError && hasNoItems && hasActiveFilter;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Fetching indicator */}
      {isFetching && !isLoading && !filters.search.trim() && (
        <div className="flex justify-end px-5 pt-2">
          <span className="bg-primary/60 h-1.5 w-1.5 animate-pulse rounded-full" />
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex min-h-0 flex-1 flex-col space-y-4 p-5">
        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <VaultCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && isError && <VaultErrorState onRetry={() => refetch()} />}

        {isEmptyDefault && (
          <VaultEmptyState onExplore={onNavigateToDiscover ?? (() => {})} />
        )}

        {isEmptyFiltered && (
          <VaultEmptyState
            onExplore={onNavigateToDiscover ?? (() => {})}
            variant="filtered"
            filters={filters}
          />
        )}

        {!isLoading && !isError && !isEmptyDefault && !isEmptyFiltered && (
          <VaultGrid
            items={items}
            pendingItems={visiblePendingLinks}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            animationKey={`${filters.time}-${filters.contentType}-${filters.search}`}
            onLoadMore={loadMore}
            deleteItem={deleteItem}
            updateRemarks={updateRemarks}
            onToggleRead={toggleRead}
          />
        )}
      </div>
    </div>
  );
});
