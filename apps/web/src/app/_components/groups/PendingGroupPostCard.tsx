"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { PendingGroupPostRow } from "@kurate/hooks";

import { ContentTypePill } from "@/components/ui/content-type-pill";
import { DomainIcon } from "@/components/icons";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { springGentle } from "@/app/_libs/utils/motion";
import { avatarUrl } from "@/app/_libs/utils/getMediaUrl";
import { useTranslations } from "@/i18n/use-translations";

interface CurrentUserProfile {
  display_name: string | null;
  avatar_path: string | null;
  handle: string | null;
}

interface PendingGroupPostCardProps {
  row: PendingGroupPostRow;
  currentUserProfile?: CurrentUserProfile;
  onRetry?: (tempId: string) => void;
  onDismiss?: (tempId: string) => void;
}

const opacityByStatus = {
  sending: 0.7,
  confirmed: 1,
  failed: 0.6,
} as const;

/**
 * Renders the same visual shell as `FeedShareCard` (header + motion.article +
 * full-bleed `-mx-4 h-[220px]` preview image + title + meta), with a status-based
 * opacity dim and timer/check overlays. Geometry matches so the Framer `layoutId`
 * morph from pending → confirmed feels like one card transitioning state.
 */
export function PendingGroupPostCard({
  row,
  currentUserProfile,
  onRetry,
  onDismiss,
}: PendingGroupPostCardProps) {
  const t = useTranslations("groups");
  const prefersReducedMotion = useSafeReducedMotion();

  const isSending = row.status === "sending";
  const isConfirmed = row.status === "confirmed";
  const isFailed = row.status === "failed";

  const displayName = currentUserProfile?.display_name ?? null;
  const handle = currentUserProfile?.handle ?? null;
  const initial = (displayName ?? handle ?? "?")[0]?.toUpperCase() ?? "?";
  const avatar = avatarUrl(currentUserProfile?.avatar_path ?? null);

  return (
    <div>
      {/* Header — mirrors FeedShareCard layout exactly */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex min-w-0 items-center gap-2">
            {avatar ? (
              <Image
                src={avatar}
                alt={displayName ?? ""}
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-foreground text-sm font-semibold">YOU</span>
              <span className="text-muted-foreground ml-1.5 text-xs">
                {isSending && t("posting")}
                {isConfirmed && t("posted")}
                {isFailed && t("failed_to_post")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <motion.article
        animate={{ opacity: opacityByStatus[row.status] }}
        transition={prefersReducedMotion ? { duration: 0 } : springGentle}
        className="rounded-card bg-card border-border relative overflow-hidden border shadow-sm">
        {/* Sending: pulsing timer badge top-right */}
        {isSending && (
          <motion.div
            className="bg-card/95 text-muted-foreground absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-sm"
            animate={prefersReducedMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span aria-hidden>⏱</span>
            <span>{t("posting")}</span>
          </motion.div>
        )}

        {/* Confirmed: brief check flash */}
        {isConfirmed && (
          <motion.div
            className="bg-card/95 text-foreground absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <span aria-hidden>✓</span>
            <span>{t("posted")}</span>
          </motion.div>
        )}

        <div className="p-4 pt-0">
          {/* Sharer note — italic, same as FeedShareCard */}
          {row.note && (
            <div className="py-2">
              <p className="text-ink text-md leading-relaxed italic">{row.note}</p>
            </div>
          )}

          {/* Link drop: full-bleed preview image + title + source — mirrors DropItemPreview */}
          {row.url && (
            <>
              <div className="bg-surface relative -mx-4 mb-3 block h-[220px] overflow-hidden">
                {row.previewImage ? (
                  <Image
                    src={row.previewImage}
                    alt={row.title ?? ""}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-muted/40 border-border/40 flex h-full items-center justify-center border-b">
                    <DomainIcon url={row.url} className="size-14" />
                  </div>
                )}
                {row.contentType && (
                  <ContentTypePill
                    contentType={row.contentType}
                    className="absolute top-2 left-2"
                  />
                )}
              </div>

              <div className="mb-2">
                <span className="text-foreground line-clamp-2 text-base font-bold">
                  {row.title ?? row.url}
                </span>
                {row.source && (
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-primary text-[8px]">●</span>
                    <span>{row.source}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Text-only drop */}
          {!row.url && row.content && (
            <p className="text-foreground pt-4 pb-2 text-base leading-relaxed">
              {row.content}
            </p>
          )}
        </div>

        {/* Failed: footer with retry + dismiss */}
        {isFailed && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-3 border-t px-4 py-2">
            <span className="text-xs font-medium">{t("failed_to_post")}</span>
            <div className="flex items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(row.tempId)}
                  className="rounded-button hover:bg-destructive/15 px-2 py-1 text-xs font-medium underline-offset-2 hover:underline">
                  {t("retry")}
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(row.tempId)}
                  className="rounded-button hover:bg-destructive/15 px-2 py-1 text-xs font-medium underline-offset-2 hover:underline">
                  {t("dismiss")}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.article>
    </div>
  );
}
