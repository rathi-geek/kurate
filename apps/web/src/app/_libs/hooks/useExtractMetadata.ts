"use client";

import { useState, useCallback } from "react";

export interface ExtractedMetadata {
  url: string;
  title?: string | null;
  source?: string | null;
  author?: string | null;
  preview_image?: string | null;
  content_type?: "article" | "video" | "podcast";
  read_time?: string | null;
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

  const extract = useCallback(async (url: string) => {
    setIsExtracting(true);
    setExtractionFailed(false);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setMetadata({
          url,
          ...data,
          preview_image: (data as { previewImage?: string }).previewImage ?? null,
          content_type: (data as { contentType?: "article" | "video" | "podcast" }).contentType ?? undefined,
          read_time: (data as { readTime?: string }).readTime ?? null,
        });
      } else {
        setExtractionFailed(true);
      }
    } catch {
      setExtractionFailed(true);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMetadata(null);
    setExtractionFailed(false);
  }, []);

  return { isExtracting, metadata, extractionFailed, extract, reset };
}
