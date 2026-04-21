"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { type SaveItemResult, useExtractMetadata } from "@kurate/hooks";
import { type ExtractedMeta, PreviewPhase } from "@kurate/types";
import { toast } from "sonner";

export function useVaultPreview(resetInput: () => void) {
  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>(PreviewPhase.Idle);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<ExtractedMeta | null>(null);
  const [savedLoggedItemId, setSavedLoggedItemId] = useState<string | null>(null);
  const [savedItemGroups, setSavedItemGroups] = useState<string[]>([]);

  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  // Tracks the most recently sent URL — survives preview state reset so
  // handleLinkSaved can still show the share modal for the correct link.
  const lastSentUrlRef = useRef<string | null>(null);
  const [lastSentUrl, setLastSentUrl] = useState<string | null>(null);

  const {
    isExtracting,
    metadata: extractedMeta,
    extractionFailed,
    extract,
    reset: resetExtraction,
  } = useExtractMetadata();

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
        toast("Already in your Vault", { description: "This link has been saved before." });
      } else if (result.status === "saved" && result.item) {
        setSavedLoggedItemId(result.item.logged_item_id);
        setSavedItemGroups([]);
        setPreviewPhase(PreviewPhase.Share);
      }
    },
    [],
  );

  // Sync extracted metadata into preview state
  useEffect(() => {
    if (!isExtracting && extractedMeta) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncing extraction output into preview state
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
    resetInput();
  }, [resetExtraction, resetInput, resetPreviewState]);

  const handleSkip = useCallback(() => {
    resetPreviewState();
    resetExtraction();
    toast("Saved to Vault");
    resetInput();
  }, [resetExtraction, resetInput, resetPreviewState]);

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
