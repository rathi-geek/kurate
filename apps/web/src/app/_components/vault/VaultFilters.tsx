"use client";

import { useTranslations } from "next-intl";

import { useVaultFilterOptions } from "@/app/_libs/hooks/useVaultFilterOptions";
import type { VaultFilters } from "@/app/_libs/types/vault";
import { cn } from "@/app/_libs/utils/cn";

export interface VaultFiltersProps {
  filters: VaultFilters;
  onChange: (f: VaultFilters) => void;
}

export function VaultFilters({ filters, onChange }: VaultFiltersProps) {
  const t = useTranslations("vault");
  const { timeOptions, contentTypeOptions, readStatusOptions } = useVaultFilterOptions();

  const FilterTypes: { label: string; key: keyof VaultFilters; options: { value: string; labelKey: string }[] }[] = [
    {
      label: t("filter_section_time"),
      key: "time",
      options: timeOptions
        .filter(({ value }) => value !== "all")
        .map(({ value, labelKey }) => ({ value, labelKey })),
    },
    {
      label: t("filter_section_type"),
      key: "contentType",
      options: contentTypeOptions
        .filter(({ value }) => value !== "all")
        .map(({ value, labelKey }) => ({ value, labelKey })),
    },
    {
      label: t("filter_section_read_status"),
      key: "readStatus",
      options: readStatusOptions
        .filter(({ value }) => value !== "all")
        .map(({ value, labelKey }) => ({ value, labelKey })),
    },
  ];

  return (
    <div className="space-y-4">
      {FilterTypes.map(({ label, key, options }) => (
        <div key={key} className="flex flex-col gap-2 space-y-2">
          <p className="text-foreground border-border border-b pb-2 font-sans text-xs font-bold">
            {label}
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map(({ value, labelKey }) => {
              const isActive = filters[key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ ...filters, [key]: isActive ? "all" : value })}
                  className={cn(
                    "rounded-badge px-3 py-1.5 font-sans text-xs font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}>
                  {t(labelKey as Parameters<typeof t>[0])}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
