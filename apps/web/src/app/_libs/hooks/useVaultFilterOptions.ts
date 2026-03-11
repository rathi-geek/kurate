"use client";

import { useMemo } from "react";

import {
  CONTENT_TYPE_FILTER_OPTIONS,
  TIME_FILTER_OPTIONS,
  type ContentTypeFilter,
  type TimeFilter,
  type VaultContentTypeFilterLabelKey,
  type VaultTimeFilterLabelKey,
} from "@/app/_libs/types/vault";

export interface TimeOption {
  value: TimeFilter;
  labelKey: VaultTimeFilterLabelKey;
}

export interface ContentTypeOption {
  value: ContentTypeFilter;
  labelKey: VaultContentTypeFilterLabelKey;
}

export interface VaultFilterOptionsResult {
  timeOptions: readonly TimeOption[];
  contentTypeOptions: readonly ContentTypeOption[];
}

/**
 * Returns vault filter options. Prefers backend (GET /api/vault/filter-options)
 * when available; falls back to enum-derived options from vault types.
 * Backend response shape: { timeOptions: TimeOption[], contentTypeOptions: ContentTypeOption[] }
 * with labelKey for i18n or label for plain string.
 */
export function useVaultFilterOptions(): VaultFilterOptionsResult {
  return useMemo(
    (): VaultFilterOptionsResult => {
      // When backend is ready, fetch here and fall back to enum options on error:
      // try {
      //   const res = await fetch('/api/vault/filter-options');
      //   if (res.ok) {
      //     const data = await res.json();
      //     if (data?.timeOptions?.length && data?.contentTypeOptions?.length)
      //       return data;
      //   }
      // } catch {}
      return {
        timeOptions: TIME_FILTER_OPTIONS,
        contentTypeOptions: CONTENT_TYPE_FILTER_OPTIONS,
      };
    },
    [],
  );
}
