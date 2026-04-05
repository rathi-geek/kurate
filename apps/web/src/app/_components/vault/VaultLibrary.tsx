"use client";

import { memo, useCallback, useEffect, useMemo } from "react";

import type { VaultFilters as VaultFiltersType } from "@kurate/types";
import { useLiveQuery } from "dexie-react-hooks";

import { VaultCardSkeleton } from "@/app/_components/vault/VaultCardSkeleton";
import { VaultEmptyState } from "@/app/_components/vault/VaultEmptyState";
import { VaultErrorState } from "@/app/_components/vault/VaultErrorState";
import { VaultGrid, type GridEntry } from "@/app/_components/vault/VaultGrid";
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

/** How long (ms) a confirmed pending card stays before being cleaned up from Dexie */
const CONFIRMED_LINGER_MS = 2000;

export const VaultLibrary = memo(function VaultLibrary({
  onNavigateToDiscover,
  filters,
}: VaultLibraryProps) {
  const { user, loading: authLoading } = useAuth();
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

  const stillLoading = authLoading || isLoading;

  const pendingLinks = useLiveQuery(() => db.pending_links.toArray(), []);

  const serverUrls = useMemo(() => new Set(items.map((i) => i.url)), [items]);

  // When server data arrives for a pending link, mark it "confirmed" in Dexie
  // (instead of deleting immediately — this keeps the card in place)
  useEffect(() => {
    if (!pendingLinks?.length || !items.length) return;
    const toConfirm = pendingLinks.filter(
      (p) => p.status === "sending" && serverUrls.has(p.url),
    );
    if (toConfirm.length) {
      void db.pending_links.bulkUpdate(
        toConfirm.map((l) => ({ key: l.tempId, changes: { status: "confirmed" as const } })),
      );
    }
  }, [items, pendingLinks, serverUrls]);

  // After a short delay, clean up confirmed items from Dexie
  useEffect(() => {
    if (!pendingLinks?.length) return;
    const confirmed = pendingLinks.filter((p) => p.status === "confirmed");
    if (!confirmed.length) return;

    const timer = setTimeout(() => {
      void db.pending_links.bulkDelete(confirmed.map((l) => l.tempId));
    }, CONFIRMED_LINGER_MS);

    return () => clearTimeout(timer);
  }, [pendingLinks]);

  const dismissPending = useCallback(
    (tempId: string) => void db.pending_links.delete(tempId),
    [],
  );

  // Build unified list:
  // - All pending/failed/confirmed-but-still-in-Dexie items go first (newest)
  // - Server items that DON'T have a matching pending entry follow
  const pendingUrls = useMemo(
    () => new Set((pendingLinks ?? []).map((p) => p.url)),
    [pendingLinks],
  );

  const entries = useMemo<GridEntry[]>(() => {
    const pending: GridEntry[] = (pendingLinks ?? []).map((p) => ({
      kind: "pending",
      data: p,
    }));
    // Skip server items whose URL is still represented by a pending card
    const confirmed: GridEntry[] = items
      .filter((i) => !pendingUrls.has(i.url))
      .map((i) => ({ kind: "confirmed", data: i }));
    return [...pending, ...confirmed];
  }, [pendingLinks, items, pendingUrls]);

  const hasNoItems = entries.length === 0;
  const hasActiveFilter =
    filters.time !== "all"
    || filters.contentType !== "all"
    || filters.readStatus !== "all"
    || filters.search.trim() !== "";
  const isEmptyDefault = !stillLoading && !isError && hasNoItems && !hasActiveFilter;
  const isEmptyFiltered = !stillLoading && !isError && hasNoItems && hasActiveFilter;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Fetching indicator */}
      {isFetching && !stillLoading && !filters.search.trim() && (
        <div className="flex justify-end px-5 pt-2">
          <span className="bg-primary/60 h-1.5 w-1.5 animate-pulse rounded-full" />
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex min-h-0 flex-1 flex-col space-y-4 p-5">
        {stillLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <VaultCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!stillLoading && isError && <VaultErrorState onRetry={() => refetch()} />}

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

        {!stillLoading && !isError && !isEmptyDefault && !isEmptyFiltered && (
          <VaultGrid
            entries={entries}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            animationKey={`${filters.time}-${filters.contentType}-${filters.search}`}
            onLoadMore={loadMore}
            deleteItem={deleteItem}
            updateRemarks={updateRemarks}
            onToggleRead={toggleRead}
            onDismissPending={dismissPending}
          />
        )}
      </div>
    </div>
  );
});
