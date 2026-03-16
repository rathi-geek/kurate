"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LuNewspaper, LuLibrary } from "react-icons/lu";

import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import type { Tables } from "@/app/_libs/types/database.types";

interface FeedHeaderProps {
  group: Tables<"conversations">;
  groupSlug: string;
  currentUserId: string;
  view: "feed" | "library";
  onToggleLibrary: () => void;
}

export function FeedHeader({ group, groupSlug, currentUserId, view, onToggleLibrary }: FeedHeaderProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const { members } = useGroupMembers(group.id, currentUserId);
  const initial = (group.group_name?.[0] ?? "G").toUpperCase();

  return (
    <div className="shrink-0 px-4 py-2.5 flex items-center justify-between gap-3 border-b border-border bg-background">
      {/* Left: avatar + name + description (desc desktop-only) */}
      <div className="flex items-center gap-2.5 min-w-0">
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
      </div>

      {/* Right: member avatars (desktop only) + icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Member avatars — desktop only */}
        {members.length > 0 && (
          <div className="hidden sm:flex items-center -space-x-1.5 mr-2">
            {members.slice(0, 5).map((m) => (
              <div key={m.id} className="size-6 shrink-0">
                {m.profile.avatar_url ? (
                  <Image
                    src={m.profile.avatar_url}
                    alt={m.profile.display_name ?? ""}
                    width={24}
                    height={24}
                    className="rounded-full object-cover border-2 border-background"
                  />
                ) : (
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary border-2 border-background">
                    {(m.profile.display_name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View toggle — shows destination icon */}
        <button
          type="button"
          onClick={onToggleLibrary}
          aria-label={view === "feed" ? t("show_library") : t("show_feed")}
          className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-surface"
        >
          {view === "feed"
            ? <LuLibrary size={18} aria-hidden="true" />
            : <LuNewspaper size={18} aria-hidden="true" />
          }
        </button>

        {/* Info / settings → /info page */}
        <button
          type="button"
          onClick={() => router.push(`/groups/${groupSlug}/info`)}
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
