"use client";

import { useCallback, useRef, useState } from "react";

import type { ContentType } from "@kurate/types";

export interface ExtractedMetadata {
  url: string;
  title?: string | null;
  source?: string | null;
  author?: string | null;
  preview_image?: string | null;
  content_type?: ContentType;
  read_time?: string | null;
  duration?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

interface UseExtractMetadataResult {
  isExtracting: boolean;
  metadata: ExtractedMetadata | null;
  extractionFailed: boolean;
  extract: (url: string) => Promise<void>;
  reset: () => void;
}

export function useExtractMetadata(): UseExtractMetadataResult {
  const [isExtracting, setIsExtracting] = useState(false);
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const extractGenerationRef = useRef(0);

  const extract = useCallback(async (url: string) => {
    const generation = ++extractGenerationRef.current;
    setIsExtracting(true);
    setExtractionFailed(false);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (generation !== extractGenerationRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (generation !== extractGenerationRef.current) return;
        setMetadata({
          url,
          ...data,
          preview_image: (data as { previewImage?: string }).previewImage ?? null,
          content_type:
            (data as { contentType?: "article" | "video" | "podcast" }).contentType ?? undefined,
          read_time: (data as { readTime?: string }).readTime ?? null,
          duration: (data as { duration?: string }).duration ?? null,
        });
      } else {
        setExtractionFailed(true);
      }
    } catch {
      if (generation !== extractGenerationRef.current) return;
      setExtractionFailed(true);
    } finally {
      if (generation === extractGenerationRef.current) {
        setIsExtracting(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    extractGenerationRef.current += 1;
    setMetadata(null);
    setExtractionFailed(false);
    setIsExtracting(false);
  }, []);

  return { isExtracting, metadata, extractionFailed, extract, reset };
}
