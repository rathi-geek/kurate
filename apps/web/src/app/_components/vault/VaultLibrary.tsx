"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { useVault } from "@/app/_libs/hooks/useVault";
import type { VaultFilters as VaultFiltersType, VaultItem } from "@/app/_libs/types/vault";
import { VaultDeleteModal, shouldSkipConfirm } from "@/app/_components/vault/VaultDeleteModal";
import { VaultEmptyState } from "@/app/_components/vault/VaultEmptyState";
import { VaultRemarkModal } from "@/app/_components/vault/VaultRemarkModal";
import { VaultShareModal } from "@/app/_components/vault/VaultShareModal";
import { VaultErrorState } from "@/app/_components/vault/VaultErrorState";
import { VaultFilters } from "@/app/_components/vault/VaultFilters";
import { VaultGrid } from "@/app/_components/vault/VaultGrid";
import { VaultSearch } from "@/app/_components/vault/VaultSearch";

export interface VaultLibraryProps {
  onItemClick: (item: VaultItem) => void;
  panelMode?: boolean;
  onNavigateToDiscover?: () => void;
}

export function VaultLibrary({
  onItemClick,
  panelMode = false,
  onNavigateToDiscover,
}: VaultLibraryProps) {
  const t = useTranslations("vault");
  const [filters, setFilters] = useState<VaultFiltersType>({
    time: "all",
    contentType: "all",
    search: "",
  });

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

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    targetId: string | null;
  }>({ open: false, targetId: null });
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    targetItem: VaultItem | null;
  }>({ open: false, targetItem: null });
  const [remarkModal, setRemarkModal] = useState<{
    open: boolean;
    targetItem: VaultItem | null;
  }>({ open: false, targetItem: null });

  function handleDelete(id: string) {
    if (shouldSkipConfirm()) {
      deleteItem(id);
      return;
    }
    setDeleteModal({ open: true, targetId: id });
  }

  function handleShare(item: VaultItem) {
    setShareModal({ open: true, targetItem: item });
  }

  function handleOpenRemarkModal(item: VaultItem) {
    setRemarkModal({ open: true, targetItem: item });
  }

  const isEmpty = !isLoading && items.length === 0;

  return (
    <div className={panelMode ? "space-y-4 p-5" : "mt-8 space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VaultSearch
          value={filters.search}
          onChange={(s) => setFilters((f) => ({ ...f, search: s }))}
        />
      </div>
      <VaultFilters filters={filters} onChange={setFilters} />

      {isFetching && !isLoading && (
        <div className="h-0.5 w-full animate-pulse rounded-full bg-primary/30" />
      )}

      {isLoading && (
        <div className="p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("title")}
          </p>
          <p className="mt-2 font-sans text-xs text-muted-foreground">
            {t("loading")}
          </p>
        </div>
      )}

      {!isLoading && isError && <VaultErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && isEmpty && (
        <VaultEmptyState onExplore={onNavigateToDiscover ?? (() => {})} />
      )}

      {!isLoading && !isError && !isEmpty && (
        <>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("title")}
            </p>
            <span className="font-mono text-xs text-muted-foreground">
              {t("items_count", { count: items.length })}
            </span>
          </div>

          <VaultGrid
            items={items}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            animationKey={`${filters.time}-${filters.contentType}-${filters.search}`}
            onLoadMore={loadMore}
            onOpen={onItemClick}
            onDelete={handleDelete}
            onShare={handleShare}
            onToggleRead={toggleRead}
            onOpenRemarkModal={handleOpenRemarkModal}
          />
        </>
      )}

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
    </div>
  );
}
