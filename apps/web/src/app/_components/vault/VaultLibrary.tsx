"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useVault } from "@/app/_libs/hooks/useVault";
import type { VaultFilters as VaultFiltersType, VaultItem } from "@/app/_libs/types/vault";
import { VaultEmptyState } from "@/app/_components/vault/VaultEmptyState";
import { VaultErrorState } from "@/app/_components/vault/VaultErrorState";
import { VaultFilters } from "@/app/_components/vault/VaultFilters";
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
    loadMore,
    refetch,
    deleteItem,
  } = useVault(filters);

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

          <div
            className={
              panelMode
                ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            }
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-card border border-border bg-card transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="block w-full text-left"
                >
                  {item.preview_image ? (
                    <img
                      src={item.preview_image}
                      alt=""
                      className="h-[120px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[120px] w-full items-center justify-center bg-muted">
                      <span
                        className={`rounded-badge px-2 py-1 font-mono text-xs font-bold uppercase ${
                          item.content_type === "video"
                            ? "bg-info-bg text-info-foreground"
                            : item.content_type === "podcast"
                              ? "bg-warning-bg text-warning-foreground"
                              : "bg-brand-50 text-primary"
                        }`}
                      >
                        {item.content_type}
                      </span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="line-clamp-2 pr-8 font-sans text-sm font-bold leading-snug text-foreground">
                      {item.title || item.url}
                    </h3>
                    {(item.tags?.length ?? 0) > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(item.tags ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {item.source ?? "—"}
                    </p>
                    {item.read_time && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.read_time} {t("read_suffix")}
                      </p>
                    )}
                  </div>
                </button>
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t("options_aria")}
                      >
                        <span className="text-lg leading-none">⋯</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem onClick={() => onItemClick(item)}>
                        {t("open")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (
                            typeof navigator !== "undefined" &&
                            navigator.share
                          ) {
                            navigator.share({
                              title: item.title ?? undefined,
                              url: item.url,
                            });
                          } else {
                            window.open(item.url, "_blank", "noopener");
                          }
                        }}
                      >
                        {t("share")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                      >
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMore()}
              >
                {t("load_more")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
