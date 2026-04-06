"use client";

import { memo, useState, useEffect, useRef } from "react";

import { type VaultFilters as VaultFiltersType, VaultTab } from "@kurate/types";
import { motion } from "framer-motion";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { VaultFilterSheet } from "@/app/_components/vault/VaultFilterSheet";
import { VaultFilters } from "@/app/_components/vault/VaultFilters";
import { VaultSearch } from "@/app/_components/vault/VaultSearch";
import { cn } from "@/app/_libs/utils/cn";
import { SearchIcon, SlidersIcon } from "@/components/icons";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from "@/i18n/use-translations";

const VAULT_TABS = [VaultTab.LINKS, VaultTab.THOUGHTS] as const;
const SEARCH_EXIT_MS = 200;

export interface VaultTabSubHeaderProps {
  vaultTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
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
  const t = useTranslations("vault");
  const isMobile = useIsMobile();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Delay tab re-appearance until after search closes (avoids layout jump).
  // `tabsVisible` only flips to true inside the setTimeout callback (never synchronously).
  const [tabsVisible, setTabsVisible] = useState(!searchOpen);
  const showTabsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showTabsTimerRef.current) clearTimeout(showTabsTimerRef.current);
    if (searchOpen) {
      // Hiding is safe to read from the prop directly — no setState needed
      showTabsTimerRef.current = null;
    } else {
      showTabsTimerRef.current = setTimeout(() => setTabsVisible(true), SEARCH_EXIT_MS);
    }
    return () => {
      if (showTabsTimerRef.current) clearTimeout(showTabsTimerRef.current);
    };
  }, [searchOpen]);

  // Tabs hidden immediately when search opens (derived), shown after delay when it closes
  const showTabs = searchOpen ? false : tabsVisible;

  // Reset tabsVisible when search opens so next close triggers the delay
  if (searchOpen && tabsVisible) {
    setTabsVisible(false);
  }

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

  const mobileSearchOpen = isMobile && searchOpen;
  const hideTabs = isMobile && !showTabs;

  return (
    <>
      <div className="border-ink/8 flex shrink-0 items-center gap-1 border-b px-5">
        {/* Tab buttons */}
        {!hideTabs &&
          VAULT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`relative mr-5 py-1.5 text-sm font-semibold capitalize transition-colors ${
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

        {/* Search + filter */}
        <div className={cn("flex items-center gap-1", mobileSearchOpen ? "flex-1" : "ml-auto")}>
          {searchOpen ? (
            <div
              role="presentation"
              className={cn("overflow-hidden", isMobile ? "flex-1" : "w-[220px]")}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  onSearchOpenChange(false);
                }
              }}>
              <VaultSearch
                value={searchQuery}
                onChange={onSearchQueryChange}
                onClose={() => {
                  onSearchOpenChange(false);
                  onSearchQueryChange("");
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onSearchOpenChange(true)}
              className="rounded-button hover:bg-muted hover:text-foreground text-muted-foreground flex items-center justify-center px-2.5 py-1.5 transition-colors"
              aria-label={t("search_placeholder")}>
              <SearchIcon className="size-3.5" />
            </button>
          )}

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
