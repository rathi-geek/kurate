"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/use-translations";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { queryKeys } from "@kurate/query";
import { cn } from "@/app/_libs/utils/cn";
import {
  type ShareableConversation,
  fetchShareableConversations,
} from "@/app/_libs/utils/fetchShareableConversations";
import { CheckIcon, SearchIcon } from "@/components/icons";

export interface ShareTargetGridProps {
  /** Currently selected conversation/group ids */
  selectedIds: Set<string>;
  /** Called when selection changes (e.g. to enable/disable Share button) */
  onSelectionChange: (ids: string[]) => void;
  /** Ids already shared to (shown as disabled with check) */
  alreadySharedIds: Set<string>;
  /** When true, data is fetched (e.g. only when modal/card is open) */
  enabled?: boolean;
  /** Optional label overrides; otherwise uses vault share_modal_* keys */
  searchPlaceholder?: string;
  noItemsText?: string;
  noResultsText?: string;
  /** Max height for the scrollable grid (e.g. "max-h-48" or "max-h-[60vh]") */
  maxHeight?: string;
  /** Avatar size: "sm" (12) or "md" (14) */
  avatarSize?: "sm" | "md";
  className?: string;
}

export function ShareTargetGrid({
  selectedIds,
  onSelectionChange,
  alreadySharedIds,
  enabled = true,
  searchPlaceholder,
  noItemsText,
  noResultsText,
  maxHeight = "max-h-48",
  avatarSize = "md",
  className,
}: ShareTargetGridProps) {
  const t = useTranslations("vault");
  const [search, setSearch] = useState("");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: queryKeys.vault.shareConversations(),
    queryFn: fetchShareableConversations,
    enabled,
    /** Treat data as fresh for 5 min so reopening the share modal uses cache instead of refetching */
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(
    () =>
      conversations.filter(
        (c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [conversations, search],
  );

  function toggle(id: string) {
    if (alreadySharedIds.has(id)) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(Array.from(next));
  }

  const searchLabel = searchPlaceholder ?? t("share_modal_search_placeholder");
  const emptyLabel = noItemsText ?? t("share_modal_no_targets");
  const noMatchLabel = noResultsText ?? t("share_modal_no_results");

  const avatarClass = avatarSize === "sm" ? "h-12 w-12" : "h-14 w-14";
  const nameMaxW = avatarSize === "sm" ? "max-w-[80px]" : "max-w-[72px]";

  function renderItem(c: ShareableConversation) {
    const already = alreadySharedIds.has(c.id);
    const selected = selectedIds.has(c.id);
    const initial = (c.name?.[0] ?? "?").toUpperCase();

    return (
      <button
        key={c.id}
        type="button"
        disabled={already}
        onClick={() => !already && toggle(c.id)}
        className={cn(
          "flex flex-col items-center gap-1.5 outline-none",
          already && "cursor-not-allowed opacity-60",
        )}
        aria-pressed={selected}
        aria-label={c.name}>
        <div className="relative mt-2">
          <Avatar className={cn("rounded-pill", avatarClass)}>
            {c.avatar_url && <AvatarImage src={c.avatar_url} alt={c.name} />}
            <AvatarFallback className="rounded-pill bg-muted text-foreground font-sans text-base font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
          {selected && (
            <span
              className="bg-success absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
              aria-hidden>
              <CheckIcon className="h-3 w-3" />
            </span>
          )}
          {already && (
            <span
              className="bg-muted-foreground/80 text-card absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full"
              aria-hidden>
              <CheckIcon className="h-3 w-3" />
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-foreground truncate px-1 pb-2 font-sans text-xs",
            nameMaxW,
          )}>
          {c.name}
        </span>
      </button>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative mb-3 shrink-0">
        <SearchIcon
          className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchLabel}
          className="pl-9 font-sans"
          aria-label={searchLabel}
        />
      </div>

      <div className={cn("min-h-0 flex-1 overflow-y-auto", maxHeight)}>
        {isLoading ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className={cn("rounded-pill", avatarClass)} />
                <Skeleton className={cn("h-3 rounded", nameMaxW)} />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-muted-foreground font-sans text-sm">{emptyLabel}</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground font-sans text-sm">{noMatchLabel}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filtered.map(renderItem)}
          </div>
        )}
      </div>
    </div>
  );
}
