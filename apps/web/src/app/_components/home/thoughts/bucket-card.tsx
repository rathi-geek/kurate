"use client";

import { useState } from "react";

import { MAX_BUCKET_NAME_LENGTH, getBucketBadgeColor } from "@kurate/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatTime } from "@/app/_components/home/thoughts/utils";
import { DotsHorizontalIcon } from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

interface BucketCardProps {
  slug: string;
  label: string;
  color: string;
  isPinned: boolean;
  isSystem: boolean;
  latestText: string | null;
  latestCreatedAt: string | null;
  unreadCount: number;
  bucketId?: string;
  onClick: () => void;
  onRename?: (bucketId: string, newLabel: string) => Promise<void>;
  onDelete?: (bucketId: string) => Promise<void>;
  onTogglePin?: (bucketId: string, pinned: boolean) => Promise<void>;
}

export function BucketCard({
  label,
  color,
  isPinned,
  isSystem,
  latestText,
  latestCreatedAt,
  unreadCount,
  bucketId,
  onClick,
  onRename,
  onDelete,
  onTogglePin,
}: BucketCardProps) {
  const t = useTranslations("thoughts");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(label);
  const showMenu = !isSystem && bucketId;

  const handleRename = async () => {
    if (!bucketId || !onRename || !renameValue.trim()) return;
    await onRename(bucketId, renameValue.trim());
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div
        className="flex w-full items-center gap-2 rounded-xl px-4 py-3"
        style={{ backgroundColor: color }}>
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          maxLength={MAX_BUCKET_NAME_LENGTH}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          className="text-ink min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => void handleRename()}
          className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-medium">
          Save
        </button>
        <button
          type="button"
          onClick={() => setRenaming(false)}
          className="text-muted-foreground text-xs">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="group/card flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-left transition-colors"
      style={{ backgroundColor: color }}>
      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1">
          <p className="text-ink text-sm font-semibold">{label}</p>
          {isPinned && (
            <svg
              className="text-ink/40 size-2.5"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1-.707.708l-.812-.813-3.04 3.04a5.5 5.5 0 0 1-.577 4.397l-.346.592a.5.5 0 0 1-.807.076L5.45 10.424l-3.743 3.743a.5.5 0 0 1-.707-.707l3.743-3.743L1.394 6.37a.5.5 0 0 1 .076-.808l.593-.345A5.5 5.5 0 0 1 6.46 4.64l3.04-3.04-.813-.812a.5.5 0 0 1 .14-.854z" />
            </svg>
          )}
        </div>
        <p className="text-ink/45 mt-0.5 truncate text-xs">{latestText || t("no_thoughts_yet")}</p>
      </button>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {latestCreatedAt && (
          <span className="text-ink/30 text-[10px]">{formatTime(latestCreatedAt)}</span>
        )}
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] leading-none font-bold text-white"
              style={{ backgroundColor: getBucketBadgeColor(color) }}>
              {unreadCount}
            </span>
          )}
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="text-ink/30 hover:text-ink/60 rounded-card p-0.5">
                  <DotsHorizontalIcon className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                {onTogglePin && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      void onTogglePin(bucketId, !isPinned);
                    }}>
                    {isPinned ? t("unpin_bucket") : t("pin_bucket")}
                  </DropdownMenuItem>
                )}
                {onRename && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameValue(label);
                      setRenaming(true);
                    }}>
                    {t("rename_bucket")}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(t("delete_bucket_confirm"))) {
                          void onDelete(bucketId);
                        }
                      }}>
                      {t("delete_bucket")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
