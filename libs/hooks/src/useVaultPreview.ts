"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { type SaveItemResult } from "./useSaveItem";
import { useExtractMetadata } from "./useExtractMetadata";
import { type ExtractedMeta, PreviewPhase } from "@kurate/types";

type ToastFn = (msg: string, opts?: { description?: string }) => void;
type TrackFn = (event: string, props?: Record<string, unknown>) => void;

export interface UseVaultPreviewConfig {
  /** Base URL for API calls. Leave empty for web (relative). Full URL for mobile. */
  apiBaseUrl?: string;
  /** Optional auth token for API calls. Web uses cookies. Mobile passes Supabase access token. */
  accessToken?: string | null;
  /** Called to reset the ChatInput (e.g. increment inputKey) */
  resetInput: () => void;
  /** Platform-specific toast */
  onToast?: ToastFn;
  /** Platform-specific analytics */
  onTrack?: TrackFn;
}

export function useVaultPreview(config: UseVaultPreviewConfig) {
  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>(PreviewPhase.Idle);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<ExtractedMeta | null>(null);
  const [savedLoggedItemId, setSavedLoggedItemId] = useState<string | null>(null);
  const [savedItemGroups, setSavedItemGroups] = useState<string[]>([]);

  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const lastSentUrlRef = useRef<string | null>(null);
  const [lastSentUrl, setLastSentUrl] = useState<string | null>(null);

  const {
    isExtracting,
    metadata: extractedMeta,
    extractionFailed,
    extract,
    reset: resetExtraction,
  } = useExtractMetadata(config.apiBaseUrl, config.accessToken);

  /** Centralized cleanup — resets all preview/share state back to idle */
  const resetPreviewState = useCallback(() => {
    setPreviewPhase(PreviewPhase.Idle);
    setPreviewUrl(null);
    previewUrlRef.current = null;
    setPreviewMeta(null);
    setSavedLoggedItemId(null);
    setSavedItemGroups([]);
  }, []);

  const handleLinkSaved = useCallback(
    async (result: SaveItemResult) => {
      // Only act on the most recently sent URL — ignore stale callbacks
      if (result.url !== lastSentUrlRef.current) return;

      if (result.status === "duplicate") {
        config.onToast?.("Already in your Vault", {
          description: "This link has been saved before.",
        });
      } else if (result.status === "saved" && result.item) {
        setSavedLoggedItemId(result.item.logged_item_id);
        setSavedItemGroups([]);
        setPreviewPhase(PreviewPhase.Share);
      }
    },
    [config],
  );

  // Sync extracted metadata into preview state
  useEffect(() => {
    console.log("[useVaultPreview] Effect:", { isExtracting, hasExtractedMeta: !!extractedMeta, extractionFailed });
    if (!isExtracting && extractedMeta) {
      setPreviewMeta({
        title: extractedMeta.title,
        source: extractedMeta.source,
        author: extractedMeta.author,
        previewImage: extractedMeta.preview_image ?? null,
        contentType: extractedMeta.content_type ?? null,
        readTime: extractedMeta.read_time ?? null,
      });
      setPreviewPhase(PreviewPhase.Loaded);
    } else if (!isExtracting && extractionFailed) {
      setPreviewPhase(PreviewPhase.Loaded);
    }
  }, [isExtracting, extractedMeta, extractionFailed]);

  const handleUrlChange = useCallback(
    (url: string | null) => {
      if (!url) {
        resetPreviewState();
        resetExtraction();
        return;
      }

      const previewActiveForCurrentUrl =
        url === previewUrl &&
        (previewPhase === PreviewPhase.Loading ||
          previewPhase === PreviewPhase.Loaded ||
          previewPhase === PreviewPhase.Share);
      if (previewActiveForCurrentUrl) return;

      if (url !== previewUrl) {
        setSavedLoggedItemId(null);
        setSavedItemGroups([]);
      }
      setPreviewUrl(url);
      // Eagerly update ref so handleVaultChatSend (called in the same tick for fast paste+enter)
      // sees the URL before React re-renders
      previewUrlRef.current = url;
      setPreviewPhase(PreviewPhase.Loading);
      void extract(url);
    },
    [extract, previewPhase, previewUrl, resetExtraction, resetPreviewState],
  );

  const handlePreviewClose = useCallback(() => {
    resetPreviewState();
    resetExtraction();
    config.resetInput();
  }, [resetExtraction, config, resetPreviewState]);

  const handleSkip = useCallback(() => {
    resetPreviewState();
    resetExtraction();
    config.onToast?.("Saved to Vault");
    config.resetInput();
  }, [resetExtraction, config, resetPreviewState]);

  return {
    previewPhase,
    previewUrl,
    previewMeta,
    savedLoggedItemId,
    savedItemGroups,
    setSavedItemGroups,
    lastSentUrl,
    setLastSentUrl,
    previewUrlRef,
    lastSentUrlRef,
    isExtracting,
    extractedMeta,
    extractionFailed,
    extract,
    resetExtraction,
    resetPreviewState,
    handleUrlChange,
    handlePreviewClose,
    handleSkip,
    handleLinkSaved,
  };
}

export type UseVaultPreviewReturn = ReturnType<typeof useVaultPreview>;
