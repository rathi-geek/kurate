"use client";

import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  "px-3 py-1.5 rounded-badge font-sans text-xs font-medium transition-colors duration-150";
const pillActive = "bg-primary text-primary-foreground";
const pillInactive = "bg-muted text-muted-foreground hover:bg-muted/80";

export function VaultFilters({ filters, onChange }: VaultFiltersProps) {
  const t = useTranslations("vault");
  const { timeOptions, contentTypeOptions } = useVaultFilterOptions();

  const contentTypeLabel: VaultContentTypeFilterLabelKey =
    contentTypeOptions.find((o) => o.value === filters.contentType)?.labelKey ??
    "filter_all_types";

  return (
    <div className="flex flex-wrap flex-row items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {timeOptions.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...filters, time: value })}
            className={cn(
              pillBase,
              filters.time === value ? pillActive : pillInactive,
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              pillBase,
              pillInactive,
              "inline-flex items-center gap-1.5",
            )}
          >
            {t(contentTypeLabel)}
            <ChevronDownIcon className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={filters.contentType}
            onValueChange={(value) =>
              onChange({
                ...filters,
                contentType: value as ContentTypeFilter,
              })
            }
          >
            {contentTypeOptions.map(({ value, labelKey }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {t(labelKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
