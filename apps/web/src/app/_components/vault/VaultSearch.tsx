"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "@/components/icons";
import { useDebouncedValue } from "@/app/_libs/hooks/useDebouncedValue";
import { cn } from "@/app/_libs/utils/cn";

const DEBOUNCE_MS = 300;

export interface VaultSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function VaultSearch({ value, onChange }: VaultSearchProps) {
  const [localValue, setLocalValue] = useDebouncedValue(
    value,
    onChange,
    DEBOUNCE_MS,
  );

  const showClear = localValue.length > 0;

  return (
    <div className="relative w-full min-w-0">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      >
        <SearchIcon className="h-4 w-4" />
      </span>
      <Input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Search your vault…"
        className={cn("pl-9", showClear && "pr-9")}
        aria-label="Search your vault"
      />
      {showClear && (
        <button
          type="button"
          onClick={() => {
            setLocalValue("");
            onChange("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-button p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          aria-label="Clear search"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      )}
    </div>
  );
}
