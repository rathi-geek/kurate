"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

import { useDebouncedValue } from "@/app/_libs/hooks/useDebouncedValue";
import { cn } from "@/app/_libs/utils/cn";
import { SearchIcon } from "@/components/icons";

const DEBOUNCE_MS = 300;

export interface VaultSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function VaultSearch({ value, onChange }: VaultSearchProps) {
  const t = useTranslations("vault");
  const [localValue, setLocalValue] = useDebouncedValue(value, onChange, DEBOUNCE_MS);

  return (
    <div className="relative w-full min-w-0">
      <span
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        aria-hidden>
        <SearchIcon className="h-4 w-4" />
      </span>
      <Input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={t("search_placeholder")}
        className={cn(
          "pl-9",
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden",
        )}
        aria-label={t("search_placeholder")}
      />
    </div>
  );
}
