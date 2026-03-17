"use client";

import React, { useCallback, useRef } from "react";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import type { VaultItem } from "@/app/_libs/types/vault";
// TODO: restore when in-app reader is re-enabled
// import { useMediaPlayer } from "@/app/_libs/context/MediaPlayerContext";
import { cn } from "@/app/_libs/utils/cn";
import { CheckIcon, DoubleCheckIcon, PencilIcon, ShareIcon, TrashIcon } from "@/components/icons";

function getDescription(item: VaultItem): string | undefined {
  const raw = item.raw_metadata;
  if (raw && typeof raw === "object" && "description" in raw) {
    const d = (raw as { description?: string }).description;
    return typeof d === "string" ? d : undefined;
  }
  return undefined;
}

const contentTypePillClass: Record<"article" | "video" | "podcast", string> = {
  article: "bg-brand-50 text-primary",
  video: "bg-info-bg text-info-foreground",
  podcast: "bg-warning-bg text-warning-foreground",
};

export interface VaultCardProps {
  item: VaultItem;
  onDelete: (id: string) => void;
  onShare?: (item: VaultItem) => void;
  onToggleRead: (item: VaultItem) => void;
  onOpenRemarkModal?: (item: VaultItem) => void;
}

function VaultCardInner({
  item,
  onDelete,
  onShare,
  onToggleRead,
  onOpenRemarkModal,
}: VaultCardProps) {
  const t = useTranslations("vault");
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.open(item.url, "_blank", "noopener,noreferrer");
      }
    },
    [item],
  );

  const description = getDescription(item);
  const timeLabel = item.raw_metadata?.read_time ?? item.raw_metadata?.duration;

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-card border-border bg-card group relative flex h-full min-h-0 flex-col overflow-hidden border transition-shadow duration-200 hover:shadow-md",
        item.is_read && "opacity-60",
      )}>
      <div className="bg-card relative z-10 flex h-full min-h-0 flex-col">
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
          onKeyDown={handleCardKeyDown}
          className="focus-visible:ring-primary rounded-card flex min-h-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          {/* Image / type badge area */}
          <div className="relative h-[150px] w-full shrink-0 overflow-hidden">
            {item.preview_image_url ? (
              <Image
                src={item.preview_image_url}
                alt=""
                fill
                className="object-cover transition-[filter] duration-200 group-hover:blur-sm"
                sizes="(max-width: 640px) 100vw, 300px"
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center transition-[filter] duration-200 group-hover:blur-sm">
                <span
                  className={cn(
                    "rounded-badge px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase",
                    contentTypePillClass[item.content_type],
                  )}>
                  {item.content_type}
                </span>
              </div>
            )}

            {/* Content type pill — hidden on hover */}
            <span
              className={cn(
                "rounded-badge absolute top-2 left-2 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-opacity duration-200 group-hover:opacity-0",
                contentTypePillClass[item.content_type],
              )}>
              {item.content_type}
            </span>

            {/* Hover overlay — dark scrim + action icons */}
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-button bg-card/20 hover:bg-card/40 h-9 w-9 text-white backdrop-blur-sm"
                title={item.is_read ? t("mark_unread_aria") : t("mark_read_aria")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleRead(item);
                }}
                aria-label={item.is_read ? t("mark_unread_aria") : t("mark_read_aria")}>
                {item.is_read ? (
                  <DoubleCheckIcon className="size-4" />
                ) : (
                  <CheckIcon className="size-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-button bg-card/20 hover:bg-card/40 h-9 w-9 text-white backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenRemarkModal?.(item);
                }}
                aria-label={t("edit_remark_aria")}
                title={t("edit_remark_aria")}>
                <PencilIcon className="size-4" />
              </Button>

              {onShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-button bg-card/20 hover:bg-card/40 h-9 w-9 text-white backdrop-blur-sm"
                  title={t("share_aria")}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShare(item);
                  }}
                  aria-label={t("share_aria")}>
                  <ShareIcon className="size-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-button bg-card/20 hover:bg-card/40 h-9 w-9 text-red-400 backdrop-blur-sm hover:text-red-300"
                title={t("delete_aria")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                aria-label={t("delete_aria")}>
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <h3 className="text-foreground line-clamp-2 shrink-0 font-sans text-sm leading-snug font-bold">
              {item.title || item.url}
            </h3>

            {/* Remark (read-only on card; edit via hover pencil → modal) */}
            {(item.remarks ?? "").trim() ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 font-sans text-sm">
                {item.remarks}
              </p>
            ) : null}

            {description ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 min-h-0 flex-1 font-sans text-xs">
                {description}
              </p>
            ) : (
              <div className="min-h-0 flex-1" />
            )}

            <p className="text-muted-foreground mt-1.5 shrink-0 font-mono text-xs">
              {item.raw_metadata?.source ?? "—"}
              {timeLabel && <> · {timeLabel}</>}
            </p>

            {/* {item.saved_from_group_name && (
              <p className="text-primary mt-1 shrink-0 truncate font-sans text-[10px] font-medium">
                Saved from {item.saved_from_group_name}
              </p>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}

export const VaultCard = React.memo(VaultCardInner);
