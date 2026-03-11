"use client";

import React, { useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, useMotionValue, useTransform } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  EyeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import { cn } from "@/app/_libs/utils/cn";
import type { VaultItem } from "@/app/_libs/types/vault";

function getDescription(item: VaultItem): string | undefined {
  const raw = item.raw_metadata;
  if (raw && typeof raw === "object" && "description" in raw) {
    const d = (raw as { description?: string }).description;
    return typeof d === "string" ? d : undefined;
  }
  return undefined;
}

const contentTypePillClass: Record<
  "article" | "video" | "podcast",
  string
> = {
  article: "bg-brand-50 text-primary",
  video: "bg-info-bg text-info-foreground",
  podcast: "bg-warning-bg text-warning-foreground",
};

export interface VaultCardProps {
  item: VaultItem;
  onOpen: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onShare: (item: VaultItem) => void;
  onToggleRead: (item: VaultItem) => void;
  onEditRemark: (id: string, value: string) => void;
  onOpenRemarkModal?: (item: VaultItem) => void;
}

function VaultCardInner({
  item,
  onOpen,
  onDelete,
  onShare,
  onToggleRead,
  onOpenRemarkModal,
}: VaultCardProps) {
  const dragX = useMotionValue(0);
  const stripOpacity = useTransform(dragX, [0, -72], [0, 1]);

  const description = getDescription(item);
  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
  });

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -48) {
        onDelete(item.id);
      }
      dragX.set(0);
    },
    [item.id, onDelete, dragX],
  );

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-border bg-card transition-shadow duration-200 hover:shadow-md",
        item.is_read && "opacity-60",
      )}
    >
      {/* Red strip behind (swipe reveal) */}
      <motion.div
        className="absolute inset-y-0 right-0 z-0 flex w-[72px] items-center justify-center bg-destructive/90 text-destructive-foreground"
        style={{ opacity: stripOpacity }}
        aria-hidden
      >
        <TrashIcon className="size-5" />
      </motion.div>

      <motion.div
        className="relative z-10 flex h-full min-h-0 flex-col bg-card"
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => dragX.set(info.offset.x)}
        onDragEnd={handleDragEnd}
      >
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="flex min-h-0 flex-1 flex-col text-left"
        >
          {/* Image / type badge area */}
          <div className="relative h-[150px] w-full shrink-0 overflow-hidden">
            {item.preview_image ? (
              <img
                src={item.preview_image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span
                  className={cn(
                    "rounded-badge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                    contentTypePillClass[item.content_type],
                  )}
                >
                  {item.content_type}
                </span>
              </div>
            )}
            {/* Content type pill top-left */}
            <span
              className={cn(
                "absolute left-2 top-2 rounded-badge px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                contentTypePillClass[item.content_type],
              )}
            >
              {item.content_type}
            </span>
            {/* Pencil: add/edit remark — opens modal */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7 rounded-button bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenRemarkModal?.(item);
              }}
              aria-label="Add or edit remark"
            >
              <PencilIcon className="size-3.5" />
            </Button>
            {/* Read state eye badge */}
            {item.is_read && (
              <span className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full bg-card/90">
                <EyeIcon className="size-3.5 text-muted-foreground" />
              </span>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <h3 className="line-clamp-2 shrink-0 font-sans text-sm font-bold leading-snug text-foreground">
              {item.title || item.url}
            </h3>

            {/* Remark (read-only on card; edit via pencil → modal) */}
            {(item.remarks ?? "").trim() ? (
              <p className="mt-1 line-clamp-2 font-sans text-sm text-muted-foreground">
                {item.remarks}
              </p>
            ) : null}

            {description ? (
              <p className="mt-1 line-clamp-2 flex-1 font-sans text-xs text-muted-foreground min-h-0">
                {description}
              </p>
            ) : (
              <div className="min-h-0 flex-1" />
            )}

            <p className="mt-1.5 shrink-0 font-mono text-xs text-muted-foreground">
              {item.source ?? "—"} · {timeAgo}
            </p>
          </div>
        </button>

        {/* Footer actions — always at bottom */}
        <div className="mt-auto flex shrink-0 items-center gap-1 border-t border-border px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpen(item);
            }}
            aria-label="Open"
          >
            <ExternalLinkIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleRead(item);
            }}
            aria-label={item.is_read ? "Mark unread" : "Mark read"}
          >
            {item.is_read ? (
              <EyeOffIcon className="size-3.5" />
            ) : (
              <EyeIcon className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare(item);
            }}
            aria-label="Share"
          >
            <ShareIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-button text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(item.id);
            }}
            aria-label="Delete"
          >
            <TrashIcon className="size-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export const VaultCard = React.memo(VaultCardInner);
