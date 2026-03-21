"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { springGentle } from "@/app/_libs/utils/motion";

const DIRECT_AUDIO_EXTENSIONS = /\.(mp3|m4a|ogg|wav)$/i;

function isDirectAudio(url: string): boolean {
  return DIRECT_AUDIO_EXTENSIONS.test(url);
}

export interface PodcastPlayerProps {
  url: string | null;
  title?: string | null;
  source?: string | null;
  onClose: () => void;
}

export function PodcastPlayer({
  url,
  title,
  source,
  onClose,
}: PodcastPlayerProps) {
  const t = useTranslations("reader");
  const tCommon = useTranslations("common");
  const prefersReducedMotion = useReducedMotion();
  const isAudio = url ? isDirectAudio(url) : false;

  useEffect(() => {
    if (url && !isAudio) {
      window.open(url, "_blank", "noopener");
      onClose();
    }
  }, [url, isAudio, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (url && isAudio) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [url, isAudio, onClose]);

  const showPanel = Boolean(url && isAudio);

  return (
    <AnimatePresence>
      {showPanel && url && (
        <>
          <motion.div
            key="podcast-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/20 md:bg-foreground/10"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            key="podcast-panel"
            initial={{ y: prefersReducedMotion ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: prefersReducedMotion ? 0 : "100%" }}
            transition={springGentle}
            className="fixed bottom-0 left-0 right-0 z-50 min-h-[140px] w-full rounded-t-card border-t border-border bg-background shadow-xl"
          >
            <header className="flex shrink-0 items-center justify-end border-b border-border bg-background px-4 py-3">
              <div className="flex flex-1 flex-col gap-0.5 pr-8">
                {title && (
                  <p className="font-sans text-sm font-medium text-foreground line-clamp-1">
                    {title}
                  </p>
                )}
                {source && (
                  <p className="font-sans text-xs text-muted-foreground line-clamp-1">
                    {source}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-3 font-sans text-sm font-medium text-foreground hover:text-muted-foreground"
                aria-label={t("close_podcast_aria")}
              >
                {tCommon("close")}
              </button>
            </header>
            <div className="p-4">
              <audio
                src={url}
                controls
                className="h-10 w-full font-sans"
                preload="metadata"
              >
                {t("audio_unsupported")}
              </audio>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
