"use client";

import { useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { VaultCardSkeleton } from "@/app/_components/vault/VaultCardSkeleton";
import { VaultDeleteModal, shouldSkipConfirm } from "@/app/_components/vault/VaultDeleteModal";
import { VaultEmptyState } from "@/app/_components/vault/VaultEmptyState";
import { VaultErrorState } from "@/app/_components/vault/VaultErrorState";
import { VaultFilterSheet } from "@/app/_components/vault/VaultFilterSheet";
import { VaultFilters } from "@/app/_components/vault/VaultFilters";
import { VaultGrid } from "@/app/_components/vault/VaultGrid";
import { VaultRemarkModal } from "@/app/_components/vault/VaultRemarkModal";
import { VaultSearch } from "@/app/_components/vault/VaultSearch";
import { VaultShareModal } from "@/app/_components/vault/VaultShareModal";
import { useVault } from "@/app/_libs/hooks/useVault";
import type { VaultFilters as VaultFiltersType, VaultItem } from "@/app/_libs/types/vault";
import { SearchIcon, SlidersIcon } from "@/components/icons";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_FILTERS: VaultFiltersType = {
  time: "all",
  contentType: "all",
  search: "",
  readStatus: "all",
};

export interface VaultLibraryProps {
  onNavigateToDiscover?: () => void;
}

export function VaultLibrary({ onNavigateToDiscover }: VaultLibraryProps) {
  const t = useTranslations("vault");
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const [filters, setFilters] = useState<VaultFiltersType>(DEFAULT_FILTERS);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; targetId: string | null }>({
    open: false,
    targetId: null,
  });
  const [shareModal, setShareModal] = useState<{ open: boolean; targetItem: VaultItem | null }>({
    open: false,
    targetItem: null,
  });
  const [remarkModal, setRemarkModal] = useState<{ open: boolean; targetItem: VaultItem | null }>({
    open: false,
    targetItem: null,
  });

  function handleDelete(id: string) {
    if (shouldSkipConfirm()) {
      deleteItem(id);
      return;
    }
    setDeleteModal({ open: true, targetId: id });
  }

  const hasActiveFilter =
    filters.time !== "all" || filters.contentType !== "all" || filters.search.trim() !== "";

  const isEmpty = !isLoading && !isError && items.length === 0;

  const filterTrigger = (
    <button
      type="button"
      onClick={isMobile ? () => setFilterSheetOpen(true) : undefined}
      className="rounded-button text-muted-foreground hover:bg-muted hover:text-foreground relative flex items-center gap-1.5 px-2.5 py-1.5 font-sans text-xs font-medium transition-colors"
      aria-label={t("filters_aria")}>
      <SlidersIcon className="size-3.5" />
      {t("filters")}
      {hasActiveFilter && (
        <span className="bg-primary absolute -top-0.5 -right-0.5 size-2 rounded-full" />
      )}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-col">
      {/* Sticky header */}
      <div className="bg-background px-5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
            {t("title")}
          </p>

          <div className="flex items-center gap-3">
            {isFetching && !isLoading && !filters.search.trim() && (
              <span className="bg-primary/60 h-1.5 w-1.5 animate-pulse rounded-full" />
            )}

            <div className="flex items-center gap-2">
              <AnimatePresence initial={false}>
                {searchOpen ? (
                  <motion.div
                    key="vault-search-open"
                    initial={prefersReducedMotion ? false : { width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { width: 0, opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeInOut" }}
                    className="overflow-hidden">
                    <VaultSearch
                      value={filters.search}
                      onChange={(s) => setFilters((f) => ({ ...f, search: s }))}
                    />
                  </motion.div>
                ) : (
                  <motion.button
                    key="vault-search-closed"
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="rounded-button hover:bg-muted hover:text-foreground text-muted-foreground flex items-center justify-center px-2.5 py-1.5 transition-colors"
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                    aria-label={t("search_placeholder")}>
                    <SearchIcon className="size-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile: opens bottom sheet; Desktop: opens popover */}
            {isMobile ? (
              filterTrigger
            ) : (
              <Popover>
                <PopoverTrigger asChild>{filterTrigger}</PopoverTrigger>
                <PopoverContent align="end" className="w-[450px] space-y-3 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-sans text-sm font-semibold">
                      {t("filters")}
                    </p>
                    {hasActiveFilter && (
                      <button
                        type="button"
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="text-primary font-sans text-xs font-medium hover:underline">
                        {t("clear_filters")}
                      </button>
                    )}
                  </div>
                  <VaultFilters filters={filters} onChange={setFilters} />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

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
            onDelete={handleDelete}
            onShare={(item) => setShareModal({ open: true, targetItem: item })}
            onToggleRead={toggleRead}
            onOpenRemarkModal={(item) => setRemarkModal({ open: true, targetItem: item })}
          />
        )}
      </div>

      {/* Modals */}
      <VaultDeleteModal
        open={deleteModal.open}
        onConfirm={() => {
          if (deleteModal.targetId) deleteItem(deleteModal.targetId);
          setDeleteModal({ open: false, targetId: null });
        }}
        onCancel={() => setDeleteModal({ open: false, targetId: null })}
      />

      <VaultShareModal
        open={shareModal.open}
        item={shareModal.targetItem}
        onClose={() => setShareModal({ open: false, targetItem: null })}
      />

      <VaultRemarkModal
        open={remarkModal.open}
        item={remarkModal.targetItem}
        onSave={(id, value) => {
          updateRemarks(id, value);
          setRemarkModal({ open: false, targetItem: null });
        }}
        onClose={() => setRemarkModal({ open: false, targetItem: null })}
      />

      {/* Mobile-only bottom sheet */}
      <VaultFilterSheet
        open={filterSheetOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterSheetOpen(false)}
      />
    </div>
  );
}
