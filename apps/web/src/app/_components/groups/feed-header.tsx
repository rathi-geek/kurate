"use client";

import { useTranslations } from "@/i18n/use-translations";
import { LuNewspaper, LuLibrary } from "react-icons/lu";

import type { Tables } from "@kurate/types";
import { GroupView } from "@/app/(app)/groups/[id]/GroupPageClient";

interface FeedHeaderProps {
  group: Tables<"conversations">;
  groupId: string;
  currentUserId: string;
  view: GroupView.Feed | GroupView.Library;
  onToggleLibrary: () => void;
  onShowInfo: () => void;
}

export function FeedHeader({ group, view, onToggleLibrary, onShowInfo }: FeedHeaderProps) {
  const t = useTranslations("groups");
  const initial = (group.group_name?.[0] ?? "G").toUpperCase();

  return (
    <div className="shrink-0 px-4 py-2.5 flex items-center justify-between gap-3 border-b border-border bg-background">
      {/* Left: avatar + name + description — clickable to open info panel */}
      <button
        type="button"
        onClick={onShowInfo}
        className="flex items-center gap-2.5 min-w-0 text-left"
      >
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{initial}</span>
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-sm text-foreground block truncate">
            {group.group_name}
          </span>
          {group.group_description && (
            <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-xs">
              {group.group_description}
            </span>
          )}
        </div>
      </button>

      {/* Right: icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* View toggle — shows destination icon */}
        <button
          type="button"
          onClick={onToggleLibrary}
          aria-label={view === GroupView.Feed ? t("show_library") : t("show_feed")}
          className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-surface"
        >
          {view === GroupView.Feed
            ? <LuLibrary size={18} aria-hidden="true" />
            : <LuNewspaper size={18} aria-hidden="true" />
          }
        </button>

        {/* Info / settings — inline panel */}
        <button
          type="button"
          onClick={onShowInfo}
          aria-label={t("info_aria")}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
