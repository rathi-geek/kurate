"use client";

import { VaultCardSkeleton } from "@/app/_components/vault/VaultCardSkeleton";
import { VaultEmptyState } from "@/app/_components/vault/VaultEmptyState";
import { VaultErrorState } from "@/app/_components/vault/VaultErrorState";
import { VaultGrid } from "@/app/_components/vault/VaultGrid";
import { useVault } from "@/app/_libs/hooks/useVault";
import type { VaultFilters as VaultFiltersType } from "@kurate/types";

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

export function VaultLibrary({ onNavigateToDiscover, filters }: VaultLibraryProps) {
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
  } = useVault(filters);

  const isEmpty = !isLoading && !isError && items.length === 0;

  return (
    <div className="flex min-h-0 flex-col">
      {/* Fetching indicator */}
      {isFetching && !isLoading && !filters.search.trim() && (
        <div className="flex justify-end px-5 pt-2">
          <span className="bg-primary/60 h-1.5 w-1.5 animate-pulse rounded-full" />
        </div>
      )}

      {/* Scrollable content */}
      <div className="space-y-4 p-5">
        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <VaultCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && isError && <VaultErrorState onRetry={() => refetch()} />}

        {isEmpty && <VaultEmptyState onExplore={onNavigateToDiscover ?? (() => {})} />}

        {!isLoading && !isError && !isEmpty && (
          <VaultGrid
            items={items}
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
}
