"use client";

import { useTranslations } from "@/i18n/use-translations";

import { Input } from "@/components/ui/input";

import { useDebouncedValue } from "@/app/_libs/hooks/useDebouncedValue";
import { SearchIcon } from "@/components/icons";
import { track } from "@/app/_libs/utils/analytics";

const DEBOUNCE_MS = 300;

export interface VaultSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function VaultSearch({ value, onChange }: VaultSearchProps) {
  const t = useTranslations("vault");
  const [localValue, setLocalValue] = useDebouncedValue(value, (v) => {
    if (v.trim()) track("vault_searched", { query_length: v.trim().length });
    onChange(v);
  }, DEBOUNCE_MS);

  return (
    <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-sm transition-shadow focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]">
      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={t("search_placeholder")}
        aria-label={t("search_placeholder")}
        className="h-auto min-h-0 flex-1 border-0 bg-transparent py-0 pl-1 pr-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}
