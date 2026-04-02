"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "@/i18n/use-translations";
import { AnimatePresence, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { springGentle } from "@/app/_libs/utils/motion";

export interface ArticleReaderProps {
  url: string | null;
  title?: string;
  hostname?: string;
  readTime?: number;
  onClose: () => void;
}

interface ReaderResponse {
  title?: string;
  content?: string;
  author?: string;
  date?: string;
}

export function ArticleReader({
  url,
  title: titleProp,
  hostname,
  readTime,
  onClose,
}: ArticleReaderProps) {
  const t = useTranslations("reader");
  const tCommon = useTranslations("common");
  const prefersReducedMotion = useSafeReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<ReaderResponse | null>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url) {
      setData(null);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    setData(null);

    const encoded = encodeURIComponent(url);
    fetch(`/api/reader?url=${encoded}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: ReaderResponse) => {
        setData({
          title: body.title ?? titleProp,
          content: body.content ?? "<p>Loading...</p>",
          author: body.author,
          date: body.date,
        });
      })
      .catch(() => {
        setError(true);
        setData({
          title: titleProp,
          content: "<p>Content could not be loaded. You can open the original link below.</p>",
        });
      })
      .finally(() => setLoading(false));
  }, [url, titleProp]);

  const updateScrollPct = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    if (max <= 0) {
      setScrollPct(100);
      return;
    }
    setScrollPct(Math.min(100, (scrollTop / max) * 100));
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    updateScrollPct();
    el.addEventListener("scroll", updateScrollPct, { passive: true });
    const ro = new ResizeObserver(updateScrollPct);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollPct);
      ro.disconnect();
    };
  }, [url, data, updateScrollPct]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (url) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [url, onClose]);

  const title = data?.title ?? titleProp;
  const displayHostname = hostname ?? (url ? new URL(url).hostname : "");
  const openOriginal = () => {
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <AnimatePresence>
      {url && (
        <>
          <motion.div
            key="reader-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/20 md:bg-foreground/10"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            key="reader-panel"
            initial={{ y: prefersReducedMotion ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: prefersReducedMotion ? 0 : "100%" }}
            transition={springGentle}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[95vh] w-full flex-col rounded-t-card border-t border-border bg-background shadow-xl"
          >
            <div
              className="h-0.5 shrink-0 bg-primary transition-[width] duration-150"
              style={{ width: `${scrollPct}%` }}
            />
            <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 font-sans text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← {tCommon("back")}
              </button>
              <span className="font-mono text-xs text-muted-foreground truncate flex-1 text-center px-2">
                {displayHostname}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                {readTime != null && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {t("reading_time", { minutes: readTime })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={openOriginal}
                  className="font-sans text-sm font-medium text-primary hover:underline"
                >
                  {t("open_original_label")}
                </button>
              </div>
            </header>
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto min-h-0"
              onScroll={updateScrollPct}
            >
              <article className="max-w-[680px] mx-auto px-6 py-10">
                {loading && !data && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <span className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="font-sans text-sm text-muted-foreground">{t("loading")}</p>
                  </div>
                )}
                {data && !loading && (
                  <>
                    <h1 className="font-serif text-3xl font-normal text-foreground">
                      {title ?? "Untitled"}
                    </h1>
                    {(data.author ?? data.date) && (
                      <p className="font-mono text-xs text-muted-foreground mt-2">
                        {[data.author, data.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div
                      className="prose prose-neutral mt-6 dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: data.content ?? "" }}
                    />
                  </>
                )}
                {error && data && (
                  <p className="font-sans text-sm text-muted-foreground mt-4">
                    Failed to load full article. Use “Open original” to read on the site.
                  </p>
                )}
              </article>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
