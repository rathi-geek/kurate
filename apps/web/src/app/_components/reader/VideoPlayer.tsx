"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/app/_libs/utils/cn";
import { springGentle } from "@/app/_libs/utils/motion";
import type { SourceRect } from "@/app/_libs/types/vault";

type EmbedResult = { embedUrl: string } | null;

function getEmbed(url: string): EmbedResult {
  const ytWatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (ytWatch) return { embedUrl: `https://www.youtube.com/embed/${ytWatch[1]}` };
  const ytShort = url.match(/youtu\.be\/([^?/]+)/);
  if (ytShort) return { embedUrl: `https://www.youtube.com/embed/${ytShort[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };
  return null;
}

export interface VideoPlayerProps {
  url: string | null;
  title?: string | null;
  initialRect?: SourceRect | null;
  onClose: () => void;
}

export function VideoPlayer({ url, title, initialRect, onClose }: VideoPlayerProps) {
  const t = useTranslations("reader");
  const tVault = useTranslations("vault");
  const tCommon = useTranslations("common");
  const [isClosing, setIsClosing] = useState(false);
  const embed = url ? getEmbed(url) : null;
  const prefersReducedMotion = useReducedMotion();
  const expandFromCard = Boolean(initialRect && !prefersReducedMotion);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

  useEffect(() => {
    if (url && !embed) {
      window.open(url, "_blank", "noopener");
      onClose();
    }
  }, [url, embed, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (url && embed) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [url, embed, handleClose]);

  const showPanel = Boolean(url && embed) && !isClosing;
  const openInNewTab = () => {
    if (url) window.open(url, "_blank", "noopener");
  };

  const exitTransition = {
    ...springGentle,
    onComplete: () => {
      onClose();
    },
  };

  return (
    <AnimatePresence>
      {showPanel && embed && (
        <>
          <motion.div
            key="video-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/20 md:bg-foreground/10"
            aria-hidden
            onClick={handleClose}
          />
          <motion.div
            key="video-panel"
            initial={
              expandFromCard && initialRect
                ? {
                    left: initialRect.x,
                    top: initialRect.y,
                    width: initialRect.width,
                    height: initialRect.height,
                  }
                : prefersReducedMotion
                  ? { y: 0 }
                  : { y: "100%" }
            }
            animate={
              expandFromCard
                ? { left: 0, top: 0, width: "100vw", height: "100vh" }
                : { y: 0 }
            }
            exit={
              expandFromCard && initialRect
                ? {
                    left: initialRect.x,
                    top: initialRect.y,
                    width: initialRect.width,
                    height: initialRect.height,
                    transition: exitTransition,
                  }
                : {
                    y: prefersReducedMotion ? 0 : "100%",
                    transition: exitTransition,
                  }
            }
            transition={springGentle}
            style={{
              position: "fixed",
              ...(expandFromCard ? {} : { left: 0, right: 0, bottom: 0, maxHeight: "95vh" }),
            }}
            className={cn(
              "z-50 flex flex-col overflow-hidden bg-background shadow-xl border-t border-border",
              expandFromCard ? "" : "rounded-t-card",
            )}
          >
            <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 py-3">
              <button
                type="button"
                onClick={handleClose}
                className="font-sans text-sm font-medium text-foreground hover:text-muted-foreground"
                aria-label={t("close_video_aria")}
              >
                {tCommon("close")}
              </button>
              {url && (
                <button
                  type="button"
                  onClick={openInNewTab}
                  className="font-sans text-sm font-medium text-primary hover:underline"
                >
                  {tVault("open")}
                </button>
              )}
            </header>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 md:p-6">
              <div className="mx-auto w-full max-w-7xl aspect-video overflow-hidden rounded-card bg-muted p-4 md:p-6">
                <iframe
                  src={embed.embedUrl}
                  title={title ?? t("video_title_fallback")}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            {title && (
              <h2 className="shrink-0 mx-auto w-full max-w-7xl px-4 pb-4 font-sans text-lg font-medium text-foreground text-center md:px-6">
                {title}
              </h2>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
