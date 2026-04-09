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

/**
 * @param rawApiBaseUrl — Base URL for API calls. Leave empty for web (relative). Full URL for mobile.
 * @param accessToken — Optional auth token for API calls. Web uses cookies (not needed). Mobile passes Supabase access token.
 */
export function useExtractMetadata(rawApiBaseUrl = "", accessToken?: string | null): UseExtractMetadataResult {
  const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const [isExtracting, setIsExtracting] = useState(false);
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const extractGenerationRef = useRef(0);

  const extract = useCallback(async (url: string) => {
    const generation = ++extractGenerationRef.current;
    setIsExtracting(true);
    setExtractionFailed(false);
    const endpoint = `${apiBaseUrl}/api/extract`;
    console.log("[useExtractMetadata] Fetching:", endpoint, "for URL:", url);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessTokenRef.current) {
        headers["Authorization"] = `Bearer ${accessTokenRef.current}`;
      }
      console.log("[useExtractMetadata] Starting fetch, token:", accessTokenRef.current);
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ url }),
      });
      console.log("[useExtractMetadata] Response status:", res.status);
      if (generation !== extractGenerationRef.current) return;
      if (res.ok) {
        const data = await res.json();
        console.log("[useExtractMetadata] Extracted data:", JSON.stringify(data).slice(0, 200));
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
        const errorText = await res.text().catch(() => "");
        console.error("[useExtractMetadata] Failed:", res.status, errorText.slice(0, 200));
        setExtractionFailed(true);
      }
    } catch (err) {
      console.error("[useExtractMetadata] Network error:", err);
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
