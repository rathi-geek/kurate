"use client";

import { useRouter } from "next/navigation";

import type { Tables } from "@kurate/types";
import { LuLibrary, LuNewspaper } from "react-icons/lu";

import { GroupView } from "@/app/(app)/groups/[id]/GroupPageClient";
import { useTranslations } from "@/i18n/use-translations";

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
  const router = useRouter();
  const initial = (group.group_name?.[0] ?? "G").toUpperCase();

  return (
    <div className="border-border bg-background flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
      {/* Left: back (mobile only) + avatar + name */}
      <div className="flex min-w-0 items-center gap-1">
        {/* Back arrow — mobile only */}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground -ml-1 shrink-0 p-1 transition-colors md:hidden"
          aria-label="Go back">
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <path
              d="M12 5l-5 5 5 5"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Avatar + name — taps to open info panel */}
        <button
          type="button"
          onClick={onShowInfo}
          className="flex min-w-0 items-center gap-2.5 text-left">
          <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
            <span className="text-primary text-xs font-bold">{initial}</span>
          </div>
          <div className="min-w-0">
            <span className="text-foreground block truncate text-sm font-semibold">
              {group.group_name}
            </span>
            {group.group_description && (
              <span className="text-muted-foreground hidden max-w-xs truncate text-xs sm:block">
                {group.group_description}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Right: icons */}
      <div className="flex shrink-0 items-center gap-1">
        {/* View toggle — shows destination icon */}
        <button
          type="button"
          onClick={onToggleLibrary}
          aria-label={view === GroupView.Feed ? t("show_library") : t("show_feed")}
          className="text-muted-foreground hover:text-foreground hover:bg-surface rounded-md p-1.5 transition-colors">
          {view === GroupView.Feed ? (
            <LuLibrary size={18} aria-hidden="true" />
          ) : (
            <LuNewspaper size={18} aria-hidden="true" />
          )}
        </button>

        {/* Info / settings — hidden on mobile (avatar button already triggers it) */}
        <button
          type="button"
          onClick={onShowInfo}
          aria-label={t("info_aria")}
          className="text-muted-foreground hover:text-foreground hover:bg-surface hidden rounded-md p-1.5 transition-colors md:flex">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
