"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { springGentle } from "@/app/_libs/utils/motion";
import { VaultSearch } from "@/app/_components/vault/VaultSearch";
import { VaultFilters } from "@/app/_components/vault/VaultFilters";
import type { VaultFilters as VaultFiltersType } from "@/app/_libs/types/vault";

const DEFAULT_FILTERS: VaultFiltersType = {
  time: "all",
  contentType: "all",
  search: "",
};

export interface VaultFilterSheetProps {
  open: boolean;
  filters: VaultFiltersType;
  onChange: (f: VaultFiltersType) => void;
  onClose: () => void;
}

export function VaultFilterSheet({
  open,
  filters,
  onChange,
  onClose,
}: VaultFilterSheetProps) {
  const t = useTranslations("vault");
  const prefersReducedMotion = useReducedMotion();

  const hasActiveFilter =
    filters.time !== "all" ||
    filters.contentType !== "all" ||
    filters.search.trim() !== "";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="filter-backdrop"
            className="fixed inset-0 z-40 bg-foreground/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            aria-hidden
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="filter-sheet"
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-card border-t border-border bg-background shadow-xl"
            initial={prefersReducedMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={prefersReducedMotion ? undefined : { y: "100%" }}
            transition={springGentle}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <p className="font-sans text-sm font-semibold text-foreground">
                {t("filters")}
              </p>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => onChange(DEFAULT_FILTERS)}
                  className="font-sans text-xs font-medium text-primary hover:underline"
                >
                  {t("clear_filters")}
                </button>
              )}
            </div>

            {/* Content */}
            <div className="space-y-4 px-5 pb-4">
              <VaultSearch
                value={filters.search}
                onChange={(s) => onChange({ ...filters, search: s })}
              />
              <VaultFilters filters={filters} onChange={onChange} />
            </div>

            {/* Done */}
            <div
              className="px-5 pb-6 pt-2"
              style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
            >
              <Button className="w-full" onClick={onClose}>
                {t("filter_done")}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
