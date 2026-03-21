"use client";

import { useCallback, useState } from "react";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { PreviewPhase } from "@/app/_components/home/preview-phase";
import { ShareTargetGrid } from "@/app/_components/shared/share-target-grid";
import { UrlExtractPreview } from "@/app/_components/shared/url-extract-preview";
import {
  shadowFloating,
  shadowHoverGlow,
  springGentle,
  successGlowBoxShadow,
  successGlowTransition,
} from "@/app/_libs/utils/motion";
import { CloseIcon } from "@/components/icons";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedMeta {
  title?: string | null;
  source?: string | null;
  author?: string | null;
  previewImage?: string | null;
  contentType?: string | null;
  readTime?: number | string | null;
  description?: string | null;
}

export interface LinkPreviewCardProps {
  phase: Exclude<PreviewPhase, PreviewPhase.Idle>;
  url: string;
  metadata?: ExtractedMeta;
  savedItemId?: string;
  savedItemGroups?: string[];
  onClose: () => void;
  onShare: (groupIds: string[]) => void;
  onSkip: () => void;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function LinkPreviewCard({
  phase,
  url,
  metadata,
  savedItemId: _savedItemId,
  savedItemGroups = [],
  onClose,
  onShare,
  onSkip,
}: LinkPreviewCardProps) {
  const t = useTranslations("link_preview");
  const [isHovered, setIsHovered] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const boxShadow = isHovered
    ? shadowHoverGlow
    : phase === PreviewPhase.Loaded || phase === PreviewPhase.Share
      ? successGlowBoxShadow
      : shadowFloating;

  function handleSelectionChange(ids: string[]) {
    setSelectedIds(new Set(ids));
  }

  const sharedSet = new Set(savedItemGroups);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: (Array.isArray(boxShadow) ? [...boxShadow] : boxShadow) as string | string[],
      }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ ...springGentle, boxShadow: successGlowTransition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-card border-border relative mb-0 overflow-hidden rounded-2xl border">
      {phase === PreviewPhase.Loading && <UrlExtractPreview url={url} isLoading={true} />}

      {phase === PreviewPhase.Loaded && (
        <div className="relative">
          <UrlExtractPreview url={url} isLoading={false} metadata={metadata} />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close_aria")}
            className="text-muted-foreground hover:text-foreground absolute top-3 right-3 shrink-0 p-1 transition-colors">
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

      {phase === PreviewPhase.Share && (
        <div className="px-4 py-3">
          <div className="mb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm font-semibold">✓ {t("saved_heading")}</span>
              <span className="text-muted-foreground text-sm">{t("share_prompt")}</span>
            </div>
          </div>

          <div className="border-border mb-3 border-t" />

          <ShareTargetGrid
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            alreadySharedIds={sharedSet}
            enabled={true}
            searchPlaceholder={t("search_placeholder")}
            noItemsText={t("no_groups")}
            noResultsText={t("no_results")}
            maxHeight="max-h-48"
            avatarSize="sm"
          />

          <div className="mt-3 flex w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              {t("skip")}
            </button>

            <Button
              size="sm"
              onClick={() => onShare(Array.from(selectedIds))}
              className={selectedIds.size === 0 ? "opacity-50" : undefined}
              disabled={selectedIds.size === 0}>
              {t("share_btn_send")}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
