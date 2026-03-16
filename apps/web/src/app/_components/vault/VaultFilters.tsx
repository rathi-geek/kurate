"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { useVaultFilterOptions } from "@/app/_libs/hooks/useVaultFilterOptions";
import type { ContentTypeFilter, VaultFilters } from "@/app/_libs/types/vault";
import { cn } from "@/app/_libs/utils/cn";

export interface VaultFiltersProps {
  filters: VaultFilters;
  onChange: (f: VaultFilters) => void;
}

type VaultFilterSection = "time" | "contentType" | "readStatus";

const pillBase =
  "w-full px-3 py-2 rounded-badge font-sans text-xs font-medium text-left transition-colors duration-150";
const pillActive = "bg-primary text-primary-foreground";
const pillInactive = "bg-muted text-muted-foreground hover:bg-muted/80";

export function VaultFilters({ filters, onChange }: VaultFiltersProps) {
  const t = useTranslations("vault");
  const { timeOptions, contentTypeOptions, readStatusOptions } = useVaultFilterOptions();
  const [activeSection, setActiveSection] = useState<VaultFilterSection>("time");

  return (
    <div className="flex flex-row gap-4">
      {/* Left: filter categories */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setActiveSection("time")}
          className={cn(
            "rounded-badge px-3 py-2 text-left font-sans text-xs font-medium transition-colors",
            activeSection === "time"
              ? "bg-muted text-foreground"
              : "bg-surface text-muted-foreground hover:bg-muted/80",
          )}>
          {t("filter_section_time")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("contentType")}
          className={cn(
            "rounded-badge px-3 py-2 text-left font-sans text-xs font-medium transition-colors",
            activeSection === "contentType"
              ? "bg-muted text-foreground"
              : "bg-surface text-muted-foreground hover:bg-muted/80",
          )}>
          {t("filter_section_type")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("readStatus")}
          className={cn(
            "rounded-badge px-3 py-2 text-left font-sans text-xs font-medium transition-colors",
            activeSection === "readStatus"
              ? "bg-muted text-foreground"
              : "bg-surface text-muted-foreground hover:bg-muted/80",
          )}>
          {t("filter_section_read_status")}
        </button>
      </div>

      {/* Right: options for active category */}
      <div className="flex flex-col gap-2">
        {activeSection === "time" && (
          <>
            <p className="text-muted-foreground font-sans text-xs font-semibold">
              {t("filter_section_time")}
            </p>
            <div className="flex flex-col gap-1">
              {timeOptions
                .filter(({ value }) => value !== "all")
                .map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        time: filters.time === value ? "all" : value,
                      })
                    }
                    className={cn(pillBase, filters.time === value ? pillActive : pillInactive)}>
                    {t(labelKey)}
                  </button>
                ))}
            </div>
          </>
        )}

        {activeSection === "contentType" && (
          <>
            <p className="text-muted-foreground font-sans text-xs font-semibold">
              {t("filter_section_type")}
            </p>
            <div className="flex flex-col gap-1">
              {contentTypeOptions
                .filter(({ value }) => value !== "all")
                .map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        contentType:
                          filters.contentType === value ? ("all" as ContentTypeFilter) : value,
                      })
                    }
                    className={cn(
                      pillBase,
                      filters.contentType === value ? pillActive : pillInactive,
                    )}>
                    {t(labelKey)}
                  </button>
                ))}
            </div>
          </>
        )}

        {activeSection === "readStatus" && (
          <>
            <p className="text-muted-foreground font-sans text-xs font-semibold">
              {t("filter_section_read_status")}
            </p>
            <div className="flex flex-col gap-1">
              {readStatusOptions
                .filter(({ value }) => value !== "all")
                .map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        readStatus: filters.readStatus === value ? "all" : value,
                      })
                    }
                    className={cn(
                      pillBase,
                      filters.readStatus === value ? pillActive : pillInactive,
                    )}>
                    {t(labelKey)}
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
