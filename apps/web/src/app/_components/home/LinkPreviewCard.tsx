"use client";

import { useCallback, useState } from "react";

import { motion } from "framer-motion";

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
import { useTranslations } from "@/i18n/use-translations";

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
          <div className="pr-12">
            <UrlExtractPreview url={url} isLoading={false} metadata={metadata} />
          </div>
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
            noItemsText={t("no_groups_cta")}
            noResultsText={t("no_results")}
            maxHeight="max-h-48"
            avatarSize="sm"
            emptySlot={
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <p className="text-muted-foreground text-sm">
                  Want to share with others too?
                </p>
                <p className="text-muted-foreground text-xs">
                  Create a group or invite them to join the platform.
                </p>
              </div>
            }
          />

          <div className="mt-3 flex w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              {t("skip")}
            </button>

            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={() => onShare(Array.from(selectedIds))}>
                {t("share_btn_send")}
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
