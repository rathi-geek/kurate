"use client";

import { memo, useState } from "react";

import type { VaultFilters as VaultFiltersType } from "@kurate/types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { VaultFilterSheet } from "@/app/_components/vault/VaultFilterSheet";
import { VaultFilters } from "@/app/_components/vault/VaultFilters";
import { VaultSearch } from "@/app/_components/vault/VaultSearch";
import { VaultTab } from "@/app/_libs/chat-types";
import { cn } from "@/app/_libs/utils/cn";
import { SearchIcon, SlidersIcon } from "@/components/icons";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from "@/i18n/use-translations";

const VAULT_TABS = [VaultTab.LINKS, VaultTab.THOUGHTS] as const;

export interface VaultTabSubHeaderProps {
  vaultTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  /** Full filters including `search` — synced with vault list / thoughts */
  fullVaultFilters: VaultFiltersType;
  onFiltersChange: (f: Pick<VaultFiltersType, "time" | "contentType" | "readStatus">) => void;
}

export const VaultTabSubHeader = memo(function VaultTabSubHeader({
  vaultTab,
  onTabChange,
  searchOpen,
  onSearchOpenChange,
  searchQuery,
  onSearchQueryChange,
  fullVaultFilters,
  onFiltersChange,
}: VaultTabSubHeaderProps) {
  // eslint-disable-next-line no-console
  console.log('[VaultTabSubHeader] render', { vaultTab, searchQuery });

  const t = useTranslations("vault");
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const hasActiveFilter = fullVaultFilters.time !== "all" || fullVaultFilters.contentType !== "all";

  const filterButtonClass = cn(
    "rounded-button flex items-center justify-center px-2.5 py-1.5 transition-colors",
    hasActiveFilter ? "text-primary" : "hover:bg-muted hover:text-foreground text-muted-foreground",
  );

  const mobileFilterButton = (
    <button
      type="button"
      onClick={() => setFilterSheetOpen(true)}
      className={filterButtonClass}
      aria-label={t("filters_aria")}>
      <SlidersIcon className="size-3.5" />
    </button>
  );

  const desktopFilterButton = (
    <button type="button" className={filterButtonClass} aria-label={t("filters_aria")}>
      <SlidersIcon className="size-3.5" />
    </button>
  );

  return (
    <>
      <div className="border-ink/8 flex shrink-0 items-center border-b px-5">
        {VAULT_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`relative mr-6 py-2.5 text-sm font-semibold capitalize transition-colors ${
              vaultTab === tab ? "text-ink" : "text-ink/40"
            }`}>
            {tab}
            {vaultTab === tab && (
              <motion.div
                layoutId="vault-tab-underline"
                className="bg-ink absolute right-0 bottom-0 left-0 h-0.5 rounded-full"
              />
            )}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <AnimatePresence initial={false}>
            {searchOpen ? (
              <motion.div
                key="search-open"
                initial={prefersReducedMotion ? false : { width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { width: 0, opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeInOut" }}
                className="overflow-hidden">
                <VaultSearch value={searchQuery} onChange={onSearchQueryChange} />
              </motion.div>
            ) : (
              <motion.button
                key="search-closed"
                type="button"
                onClick={() => onSearchOpenChange(true)}
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

          {vaultTab === VaultTab.LINKS &&
            (isMobile ? (
              mobileFilterButton
            ) : (
              <Popover>
                <PopoverTrigger asChild>{desktopFilterButton}</PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-4">
                  <VaultFilters
                    filters={fullVaultFilters}
                    onChange={(f) => {
                      onFiltersChange({
                        time: f.time,
                        contentType: f.contentType,
                        readStatus: f.readStatus,
                      });
                    }}
                  />
                </PopoverContent>
              </Popover>
            ))}
        </div>
      </div>

      <VaultFilterSheet
        open={filterSheetOpen}
        filters={fullVaultFilters}
        onChange={(f) => {
          onFiltersChange({ time: f.time, contentType: f.contentType, readStatus: f.readStatus });
        }}
        onClose={() => setFilterSheetOpen(false)}
      />
    </>
  );
});
