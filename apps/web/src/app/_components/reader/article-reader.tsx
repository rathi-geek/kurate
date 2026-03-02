"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PANEL_TRANSITION = { type: "spring" as const, stiffness: 280, damping: 30 };

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/20 z-40 md:bg-ink/10"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            key="reader-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={PANEL_TRANSITION}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[720px] bg-background flex flex-col shadow-xl"
          >
            <div
              className="h-0.5 shrink-0 bg-teal transition-[width] duration-150"
              style={{ width: `${scrollPct}%` }}
            />
            <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b bg-background">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 font-sans text-sm font-medium text-ink/70 hover:text-ink"
              >
                ← Back
              </button>
              <span className="font-mono text-xs text-ink/50 truncate flex-1 text-center px-2">
                {displayHostname}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                {readTime != null && (
                  <span className="font-mono text-xs text-ink/40">{readTime} min read</span>
                )}
                <button
                  type="button"
                  onClick={openOriginal}
                  className="font-sans text-[13px] font-medium text-teal hover:underline"
                >
                  Open original
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
                    <span className="inline-block w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                    <p className="font-sans text-sm text-muted-foreground">Loading article…</p>
                  </div>
                )}
                {data && !loading && (
                  <>
                    <h1 className="font-serif text-3xl font-normal text-foreground">
                      {title ?? "Untitled"}
                    </h1>
                    {(data.author ?? data.date) && (
                      <p className="font-mono text-xs text-ink/40 mt-2">
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
