"use client";

import { type MutableRefObject, type SetStateAction, useCallback } from "react";

import { type ThoughtBucket, classifyThought } from "@kurate/utils";
import { toast } from "sonner";

import { type ExtractedMeta, VaultTab } from "@kurate/types";
import type { ExtractedMetadata } from "@kurate/hooks";
import { db } from "@/app/_libs/db";
import { track } from "@/app/_libs/utils/analytics";

interface UseVaultComposerParams {
  previewUrlRef: MutableRefObject<string | null>;
  previewMeta: ExtractedMeta | null;
  extractedMeta: ExtractedMetadata | null;
  lastSentUrlRef: MutableRefObject<string | null>;
  setLastSentUrl: (url: string | null) => void;
  resetPreviewState: () => void;
  resetExtraction: () => void;
  resetInput: () => void;
  onSend: (
    text: string,
    file?: File,
    meta?: ExtractedMeta | null,
    remarks?: string | null,
    tempId?: string,
  ) => Promise<void>;
  activeBucket: ThoughtBucket | null;
  vaultTab: VaultTab;
  setVaultTab: (value: SetStateAction<VaultTab>) => void;
  editingThought: { id: string; text: string } | null;
  editThought: { mutate: (args: { id: string; text: string }) => void };
  setEditingThought: (value: { id: string; text: string } | null) => void;
}

export function useVaultComposer({
  previewUrlRef,
  previewMeta,
  extractedMeta,
  lastSentUrlRef,
  setLastSentUrl,
  resetPreviewState,
  resetExtraction,
  resetInput,
  onSend,
  activeBucket,
  vaultTab,
  setVaultTab,
  editingThought,
  editThought,
  setEditingThought,
}: UseVaultComposerParams) {
  const handleVaultChatSend = useCallback(
    async (noteText: string) => {
      // Edit mode — update existing thought via API, then clear
      if (editingThought) {
        const trimmed = noteText.trim();
        if (trimmed && trimmed !== editingThought.text) {
          editThought.mutate({ id: editingThought.id, text: trimmed });
        }
        setEditingThought(null);
        resetInput();
        return;
      }

      const meta = previewMeta ? { ...previewMeta, tags: extractedMeta?.tags ?? null } : null;
      // Use ref (eagerly updated in handleUrlChange) instead of stale state for fast paste+enter
      const effectiveUrl = previewUrlRef.current;
      if (effectiveUrl) {
        // Cancel in-flight preview extraction — grid handles null-metadata via useRefreshLoggedItem
        resetExtraction();

        // Deduplicate: same URL already pending → skip
        const existingPending = await db.pending_links.where("url").equals(effectiveUrl).first();
        if (existingPending) {
          toast("Already in your Vault", { description: "This link has been saved before." });
          resetPreviewState();
          resetInput();
          return;
        }

        const tempId = crypto.randomUUID();
        lastSentUrlRef.current = effectiveUrl;
        setLastSentUrl(effectiveUrl);
        // URL mode: pending row in Dexie, then POST
        void db.pending_links.add({
          tempId,
          url: effectiveUrl,
          title: previewMeta?.title ?? effectiveUrl,
          source: previewMeta?.source ?? null,
          author: previewMeta?.author ?? null,
          previewImage: previewMeta?.previewImage ?? null,
          contentType: previewMeta?.contentType ?? "article",
          readTime: previewMeta?.readTime != null ? String(previewMeta.readTime) : null,
          tags: extractedMeta?.tags ?? null,
          description: previewMeta?.description ?? null,
          remarks: noteText.trim() || null,
          createdAt: new Date().toISOString(),
          status: "sending",
        });
        // Clear preview state so input is ready for next URL
        resetPreviewState();

        void onSend(effectiveUrl, undefined, meta, noteText.trim() || null)
          .then(async () => {
            await db.pending_links.update(tempId, { status: "confirmed" });
          })
          .catch(async () => {
            await db.pending_links.update(tempId, { status: "failed" });
          });
      } else {
        // Text → thoughts: classify, Dexie row, switch tab, POST
        const tempId = crypto.randomUUID();
        const bucket = activeBucket ?? classifyThought(noteText);
        void db.pending_thoughts.add({
          tempId,
          text: noteText,
          bucket,
          content_type: "text",
          media_id: null,
          createdAt: new Date().toISOString(),
          status: "sending",
        });
        if (vaultTab !== VaultTab.THOUGHTS) {
          track("links_thoughts_switched", {
            from: vaultTab,
            to: VaultTab.THOUGHTS,
            source: "auto_thought_added",
          });
        }
        setVaultTab(VaultTab.THOUGHTS);
        void onSend(noteText, undefined, null, null, tempId).catch(async () => {
          await db.pending_thoughts.update(tempId, { status: "failed" });
        });
      }
    },
    [
      activeBucket,
      editThought,
      editingThought,
      extractedMeta?.tags,
      lastSentUrlRef,
      onSend,
      previewMeta,
      previewUrlRef,
      resetExtraction,
      resetInput,
      resetPreviewState,
      setEditingThought,
      setLastSentUrl,
      setVaultTab,
      vaultTab,
    ],
  );

  return { handleVaultChatSend };
}
