"use client";

import { useEffect, useState, useCallback } from "react";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { queryKeys } from "@/app/_libs/query/keys";
import { fetchUserGroups } from "@/app/_libs/utils/fetchUserGroups";
import { springGentle, shadowFloating, shadowHoverGlow, successGlowBoxShadow, successGlowTransition } from "@/app/_libs/utils/motion";
import { CloseIcon, DomainIcon } from "@/components/icons";
import { Typewriter } from "@/components/ui/typewriter";
import { CyclingText } from "@/components/ui/cycling-text";

// ─── Platform copy (localized) ─────────────────────────────────────────────────

interface LinkCopy {
  heading: string;
  subtitles: string[];
}

type TranslateFn = (key: string) => string;

function getLinkCopy(url: string, t: TranslateFn): LinkCopy {
  const almost = t("loading_subtitle_almost");
  try {
    const hostname = new URL(url).hostname.replace("www.", "");

    if (hostname === "youtube.com" || hostname === "youtu.be") {
      return {
        heading: t("loading_heading_youtube"),
        subtitles: [t("loading_subtitle_1_youtube"), t("loading_subtitle_2_youtube"), almost],
      };
    }
    if (hostname === "open.spotify.com" || hostname === "spotify.com") {
      const isTrack = url.includes("/track/") || url.includes("/album/");
      return isTrack
        ? {
            heading: t("loading_heading_spotify_track"),
            subtitles: [
              t("loading_subtitle_1_spotify_track"),
              t("loading_subtitle_2_spotify_track"),
              almost,
            ],
          }
        : {
            heading: t("loading_heading_spotify_episode"),
            subtitles: [
              t("loading_subtitle_1_spotify_episode"),
              t("loading_subtitle_2_spotify_episode"),
              almost,
            ],
          };
    }
    if (hostname === "podcasts.apple.com") {
      return {
        heading: t("loading_heading_spotify_episode"),
        subtitles: [
          t("loading_subtitle_1_spotify_episode"),
          t("loading_subtitle_2_spotify_episode"),
          almost,
        ],
      };
    }
    if (hostname === "vimeo.com") {
      return {
        heading: t("loading_heading_vimeo"),
        subtitles: [t("loading_subtitle_1_vimeo"), t("loading_subtitle_2_vimeo"), almost],
      };
    }
    if (hostname === "twitter.com" || hostname === "x.com") {
      return {
        heading: t("loading_heading_twitter"),
        subtitles: [t("loading_subtitle_1_twitter"), t("loading_subtitle_2_twitter"), almost],
      };
    }
    if (hostname === "github.com") {
      return {
        heading: t("loading_heading_github"),
        subtitles: [t("loading_subtitle_1_github"), t("loading_subtitle_2_github"), almost],
      };
    }
    if (hostname === "reddit.com" || hostname === "old.reddit.com") {
      return {
        heading: t("loading_heading_reddit"),
        subtitles: [t("loading_subtitle_1_reddit"), t("loading_subtitle_2_reddit"), almost],
      };
    }
  } catch {
    // invalid URL — fall through
  }

  return {
    heading: t("loading_heading_default"),
    subtitles: [t("loading_subtitle_1_default"), t("loading_subtitle_2_default"), almost],
  };
}

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
  phase: "loading" | "loaded" | "share";
  url: string;
  metadata?: ExtractedMeta;
  savedItemId?: string;
  savedItemGroups?: string[];
  onClose: () => void;
  onShare: (groupId: string) => void;
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
  const copy = getLinkCopy(url, t as TranslateFn);
  const [isHovered, setIsHovered] = useState(false);
  const [autoCloseKey, setAutoCloseKey] = useState(0);

  // Auto-close share phase after 2s if no hover/interaction
  useEffect(() => {
    if (phase !== "share" || isHovered) return;
    const timer = setTimeout(onSkip, 2000);
    return () => clearTimeout(timer);
  }, [phase, isHovered, onSkip, autoCloseKey]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // Restart the 2s countdown from zero on leave
    setAutoCloseKey((k) => k + 1);
  }, []);

  // Entry: one-time spreading green ring when data arrives; then settle to floating shadow.
  // Hover: switch to steady green glow while mouse is over the card.
  const boxShadow = isHovered
    ? shadowHoverGlow
    : phase === "loaded" || phase === "share"
      ? successGlowBoxShadow
      : shadowFloating;

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchUserGroups,
    enabled: phase === "share",
    staleTime: 1000 * 60 * 5,
  });

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
      {phase === "loading" && (
        <div className="flex items-center gap-3 px-4 py-3">
          <DomainIcon url={url} />
          <div className="min-w-0 flex-1">
            <Typewriter
              text={copy.heading}
              className="text-foreground text-sm font-medium"
            />
            <p className="text-muted-foreground mt-0.5 text-xs">
              <CyclingText phrases={copy.subtitles} />
            </p>
          </div>
        </div>
      )}

      {phase === "loaded" && (
        <div className="flex items-start gap-3 px-4 py-3">
          {metadata?.previewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={metadata.previewImage}
              alt=""
              className="size-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <DomainIcon url={url} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-foreground line-clamp-2 text-sm font-medium">
              {metadata?.title ?? url}
            </p>
            {metadata?.description && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {metadata.description}
              </p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {[
                metadata?.source,
                metadata?.contentType,
                metadata?.readTime ? `${metadata.readTime} min` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close_aria")}
            className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors">
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

      {phase === "share" && (
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-primary text-sm font-semibold">✓ {t("saved_heading")}</span>
            <span className="text-muted-foreground text-sm">{t("share_prompt")}</span>
          </div>
          <div className="border-border mb-2 border-t" />
          {groupsLoading ? (
            <p className="text-muted-foreground py-2 text-sm">…</p>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground py-2 text-sm">{t("no_groups")}</p>
          ) : (
            <ul className="space-y-1.5">
              {groups.map((group) => {
                const already = sharedSet.has(group.id);
                return (
                  <li key={group.id} className="flex items-center justify-between">
                    <span className="text-foreground text-sm">{group.name}</span>
                    {already ? (
                      <span className="text-muted-foreground text-xs">✓</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onShare(group.id)}
                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                        {t("share_btn")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              {t("skip")}
            </button>
          </div>
        </div>
      )}

      {/* Auto-close countdown bar — only visible in share phase when not hovered */}
      {phase === "share" && (
        <motion.div
          key={`progress-${autoCloseKey}`}
          className="absolute bottom-0 left-0 h-0.5 bg-primary/40"
          initial={{ width: "100%" }}
          animate={{ width: isHovered ? "100%" : "0%" }}
          transition={{ duration: isHovered ? 0 : 2, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}
