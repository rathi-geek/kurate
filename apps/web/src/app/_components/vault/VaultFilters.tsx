"use client";

import { useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { ChevronDownIcon } from "@/components/icons";
import { useVaultFilterOptions } from "@/app/_libs/hooks/useVaultFilterOptions";
import { cn } from "@/app/_libs/utils/cn";
import type {
  ContentTypeFilter,
  VaultContentTypeFilterLabelKey,
  VaultFilters,
} from "@/app/_libs/types/vault";

export interface VaultFiltersProps {
  filters: VaultFilters;
  onChange: (f: VaultFilters) => void;
}

const pillBase =
  "w-full px-3 py-2 rounded-badge font-sans text-xs font-medium text-left transition-colors duration-150";
const pillActive = "bg-primary text-primary-foreground";
const pillInactive = "bg-muted text-muted-foreground hover:bg-muted/80";

export function VaultFilters({ filters, onChange }: VaultFiltersProps) {
  const t = useTranslations("vault");
  const prefersReducedMotion = useReducedMotion();
  const { timeOptions, contentTypeOptions } = useVaultFilterOptions();
  const [contentTypeOpen, setContentTypeOpen] = useState(false);

  const contentTypeLabel: VaultContentTypeFilterLabelKey =
    contentTypeOptions.find((o) => o.value === filters.contentType)?.labelKey ??
    "filter_all_types";

  return (
    <div className="flex flex-col gap-3">
      {/* Time filters — vertical */}
      <div className="flex flex-col gap-1">
        {timeOptions.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...filters, time: value })}
            className={cn(pillBase, filters.time === value ? pillActive : pillInactive)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Content type — inline accordion */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setContentTypeOpen((v) => !v)}
          className={cn(
            pillBase,
            "inline-flex items-center justify-between",
            filters.contentType !== "all" ? pillActive : pillInactive,
          )}
        >
          <span>{t(contentTypeLabel)}</span>
          <motion.span
            animate={{ rotate: contentTypeOpen ? 180 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <ChevronDownIcon className="size-3.5" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {contentTypeOpen && (
            <motion.div
              key="content-type-list"
              initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 pt-1">
                {contentTypeOptions.map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      onChange({ ...filters, contentType: value as ContentTypeFilter });
                      setContentTypeOpen(false);
                    }}
                    className={cn(
                      pillBase,
                      "pl-5", // indent
                      filters.contentType === value ? pillActive : pillInactive,
                    )}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
