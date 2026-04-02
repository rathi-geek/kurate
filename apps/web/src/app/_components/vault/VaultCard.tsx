"use client";

import React, { useCallback, useState } from "react";

import Image from "next/image";

import type { VaultItem } from "@kurate/types";

import { Button } from "@/components/ui/button";
import { ContentTypePill } from "@/components/ui/content-type-pill";

import { VaultDeleteModal, shouldSkipConfirm } from "@/app/_components/vault/VaultDeleteModal";
import { VaultRemarkModal } from "@/app/_components/vault/VaultRemarkModal";
import { VaultShareModal } from "@/app/_components/vault/VaultShareModal";
import { useRefreshLoggedItem } from "@/app/_libs/hooks/useRefreshLoggedItem";
import { track } from "@/app/_libs/utils/analytics";
import { cn } from "@/app/_libs/utils/cn";
import {
  CheckIcon,
  DomainIcon,
  DoubleCheckIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

function getDescription(item: VaultItem): string | undefined {
  return item.description ?? undefined;
}

export interface VaultCardProps {
  item: VaultItem;
  deleteItem: (id: string) => void;
  updateRemarks: (id: string, value: string) => void;
  onToggleRead: (item: VaultItem) => void;
}

function VaultCardInner({ item, deleteItem, updateRemarks, onToggleRead }: VaultCardProps) {
  const t = useTranslations("vault");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.open(item.url, "_blank", "noopener,noreferrer");
      }
    },
    [item],
  );

  const [imgError, setImgError] = useState(false);
  const description = getDescription(item);
  useRefreshLoggedItem(item);
  const timeLabel = item.raw_metadata?.read_time ?? item.raw_metadata?.duration;

  return (
    <div
      className={cn(
        "rounded-card border-border bg-card group relative flex h-full min-h-0 flex-col overflow-hidden border transition-shadow duration-200 hover:shadow-md",
        item.is_read && "opacity-60",
      )}>
      <div className="bg-card relative z-10 flex h-full min-h-0 flex-col">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            track("link_opened", {
              context: "vault",
              content_type: item.content_type,
              source: item.raw_metadata?.source ?? null,
            });
            window.open(item.url, "_blank", "noopener,noreferrer");
          }}
          onKeyDown={handleCardKeyDown}
          className="focus-visible:ring-primary rounded-card flex min-h-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          {/* Image / type badge area */}
          <div className="relative h-[150px] w-full shrink-0 overflow-hidden">
            {item.preview_image_url && !imgError ? (
              <Image
                src={item.preview_image_url}
                alt=""
                fill
                unoptimized
                className="object-cover transition-[filter] duration-200 group-hover:blur-sm"
                sizes="(max-width: 640px) 100vw, 300px"
                onError={() => setImgError(true)}
              />
            ) : description ? (
              <div className="bg-muted relative flex h-full w-full items-center justify-center overflow-hidden px-4 py-3 transition-[filter] duration-200 group-hover:blur-sm">
                <p className="text-muted-foreground relative z-10 line-clamp-4 text-center text-xs leading-relaxed">
                  {description}
                </p>
                <ContentTypePill
                  contentType={item.content_type}
                  className="absolute top-2 left-2"
                />
              </div>
            ) : (
              <div className="bg-muted relative flex h-full w-full items-center justify-center transition-[filter] duration-200 group-hover:blur-sm">
                <DomainIcon url={item.url} className="size-12" />
                <ContentTypePill
                  contentType={item.content_type}
                  className="absolute top-2 left-2"
                />
              </div>
            )}

            {/* Content type pill — hidden on hover, only when image is showing */}
            {item.preview_image_url && !imgError && (
              <ContentTypePill
                contentType={item.content_type}
                className="absolute top-2 left-2 transition-opacity duration-200 group-hover:opacity-0"
              />
            )}

            {/* Desktop hover overlay */}
            <div
              className={cn(
                "absolute inset-0 z-10 hidden items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-200",
                "sm:flex pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100",
              )}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-button bg-card/20 hover:bg-card/40 h-9 w-9 text-white backdrop-blur-sm"
                title={item.is_read ? t("mark_unread_aria") : t("mark_read_aria")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!item.is_read) track("link_marked_read");
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
                  setRemarkModalOpen(true);
                }}
                aria-label={t("edit_remark_aria")}
                title={t("edit_remark_aria")}>
                <PencilIcon className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-button bg-card/20 hover:bg-card/40 h-9 w-9 text-white backdrop-blur-sm"
                title={t("share_aria")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShareModalOpen(true);
                }}
                aria-label={t("share_aria")}>
                <ShareIcon className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-button bg-card/20 hover:bg-card/40 h-9 w-9 text-red-400 backdrop-blur-sm hover:text-red-300"
                title={t("delete_aria")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  track("link_deleted", { content_type: item.content_type });
                  if (shouldSkipConfirm()) {
                    deleteItem(item.id);
                    return;
                  }
                  setDeleteModalOpen(true);
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

            {(item.tags ?? []).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.tags!.map((tag) => (
                  <ContentTypePill key={tag} contentType={tag} />
                ))}
              </div>
            )}

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
          </div>
        </div>

        {/* Mobile action row — always visible on small screens */}
        <div className="border-border flex items-center justify-around border-t px-2 py-1 sm:hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!item.is_read) track("link_marked_read");
              onToggleRead(item);
            }}
            className="text-muted-foreground hover:text-foreground rounded p-2 transition-colors"
            aria-label={item.is_read ? t("mark_unread_aria") : t("mark_read_aria")}>
            {item.is_read ? (
              <DoubleCheckIcon className="size-4" />
            ) : (
              <CheckIcon className="size-4" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRemarkModalOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground rounded p-2 transition-colors"
            aria-label={t("edit_remark_aria")}>
            <PencilIcon className="size-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShareModalOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground rounded p-2 transition-colors"
            aria-label={t("share_aria")}>
            <ShareIcon className="size-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              track("link_deleted", { content_type: item.content_type });
              if (shouldSkipConfirm()) {
                deleteItem(item.id);
                return;
              }
              setDeleteModalOpen(true);
            }}
            className="rounded p-2 text-red-400 transition-colors hover:text-red-500"
            aria-label={t("delete_aria")}>
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>

      <VaultDeleteModal
        open={deleteModalOpen}
        onConfirm={() => {
          deleteItem(item.id);
          setDeleteModalOpen(false);
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
      <VaultShareModal open={shareModalOpen} item={item} onClose={() => setShareModalOpen(false)} />
      <VaultRemarkModal
        open={remarkModalOpen}
        item={item}
        onSave={(id, value) => {
          updateRemarks(id, value);
          setRemarkModalOpen(false);
        }}
        onClose={() => setRemarkModalOpen(false)}
      />
    </div>
  );
}

export const VaultCard = React.memo(VaultCardInner);
