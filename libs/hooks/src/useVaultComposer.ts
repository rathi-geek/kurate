"use client";

import { type SetStateAction, useCallback } from "react";

import { type ThoughtBucket, classifyThought } from "@kurate/utils";
import { type ExtractedMeta, VaultTab } from "@kurate/types";

import type { ExtractedMetadata } from "./useExtractMetadata";
import type { SendOptions } from "./useSubmitContent";
import type { UseVaultPreviewReturn } from "./useVaultPreview";
import type { PendingDB } from "./types/pending-db";

type ToastFn = (msg: string, opts?: { description?: string }) => void;
type TrackFn = (event: string, props?: Record<string, unknown>) => void;

export interface UseVaultComposerConfig {
  /** Whole preview object from useVaultPreview */
  preview: UseVaultPreviewReturn;

  /** Submit function from useSubmitContent */
  onSend: (text: string, opts?: SendOptions) => Promise<void>;

  /** Tab context */
  tab: {
    vaultTab: VaultTab;
    setVaultTab: (value: SetStateAction<VaultTab>) => void;
    activeBucket: ThoughtBucket | null;
    onThoughtViewAllChange: (v: boolean) => void;
  };

  /** Edit support (optional) */
  edit?: {
    editingThought: { id: string; text: string } | null;
    editThought: { mutate: (args: { id: string; text: string }) => void };
    setEditingThought: (value: null) => void;
  };

  /** Platform-specific injection */
  platform?: {
    pendingDb?: PendingDB;
    onToast?: ToastFn;
    onTrack?: TrackFn;
    generateTempId?: () => string;
  };

  resetInput: () => void;
}

// Simple fallback UUID for environments without crypto.randomUUID
function fallbackUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useVaultComposer(config: UseVaultComposerConfig) {
  const {
    preview,
    onSend,
    tab,
    edit,
    platform,
    resetInput,
  } = config;

  const generateId = platform?.generateTempId ?? fallbackUUID;

  const handleVaultChatSend = useCallback(
    async (noteText: string) => {
      // Edit mode — update existing thought, then clear
      if (edit?.editingThought) {
        const trimmed = noteText.trim();
        if (trimmed && trimmed !== edit.editingThought.text) {
          edit.editThought.mutate({ id: edit.editingThought.id, text: trimmed });
        }
        edit.setEditingThought(null);
        resetInput();
        return;
      }

      const meta: ExtractedMeta | null = preview.previewMeta
        ? { ...preview.previewMeta, tags: (preview.extractedMeta as ExtractedMetadata | null)?.tags ?? null } as ExtractedMeta
        : null;

      // Use ref (eagerly updated in handleUrlChange) instead of stale state for fast paste+enter
      const effectiveUrl = preview.previewUrlRef.current;

      if (effectiveUrl) {
        // ── URL path → logged_items ──
        preview.resetExtraction();

        // Deduplicate: same URL already pending → skip
        if (platform?.pendingDb) {
          const existing = await platform.pendingDb.getPendingLinkByUrl(effectiveUrl);
          if (existing) {
            platform.onToast?.("Already in your Vault", {
              description: "This link has been saved before.",
            });
            preview.resetPreviewState();
            resetInput();
            return;
          }
        }

        const tempId = generateId();
        preview.lastSentUrlRef.current = effectiveUrl;
        preview.setLastSentUrl(effectiveUrl);

        // Add pending row (if DB available)
        if (platform?.pendingDb) {
          void platform.pendingDb.addPendingLink({
            tempId,
            url: effectiveUrl,
            title: preview.previewMeta?.title ?? effectiveUrl,
            source: preview.previewMeta?.source ?? null,
            author: preview.previewMeta?.author ?? null,
            previewImage: preview.previewMeta?.previewImage ?? null,
            contentType: preview.previewMeta?.contentType ?? "link",
            readTime: preview.previewMeta?.readTime != null ? String(preview.previewMeta.readTime) : null,
            tags: (preview.extractedMeta as ExtractedMetadata | null)?.tags ?? null,
            description: preview.previewMeta?.description ?? null,
            remarks: noteText.trim() || null,
            createdAt: new Date().toISOString(),
            status: "sending",
          });
        }

        platform?.onTrack?.("vault_link_saved", {
          content_type: preview.previewMeta?.contentType ?? "link",
          source: preview.previewMeta?.source ?? null,
          has_tags: ((preview.extractedMeta as ExtractedMetadata | null)?.tags ?? []).length > 0,
          is_duplicate: false,
        });

        // Clear preview state so input is ready for next URL
        preview.resetPreviewState();

        void onSend(effectiveUrl, { meta, remarks: noteText.trim() || null })
          .then(async () => {
            await platform?.pendingDb?.updatePendingLinkStatus(tempId, "confirmed");
          })
          .catch(async () => {
            platform?.onTrack?.("vault_link_save_failed", { url: effectiveUrl });
            await platform?.pendingDb?.updatePendingLinkStatus(tempId, "failed");
          });
      } else {
        // ── Text → thoughts ──
        const tempId = generateId();
        const bucket = tab.activeBucket ?? classifyThought(noteText);

        if (platform?.pendingDb) {
          void platform.pendingDb.addPendingThought({
            tempId,
            text: noteText,
            bucket,
            content_type: "text",
            media_id: null,
            createdAt: new Date().toISOString(),
            status: "sending",
          });
        }

        if (tab.vaultTab !== VaultTab.THOUGHTS) {
          platform?.onTrack?.("links_thoughts_switched", {
            from: tab.vaultTab,
            to: VaultTab.THOUGHTS,
            source: "auto_thought_added",
          });
        }
        tab.setVaultTab(VaultTab.THOUGHTS);
        tab.onThoughtViewAllChange(true);

        void onSend(noteText, { tempId }).catch(async () => {
          await platform?.pendingDb?.updatePendingThoughtStatus(tempId, "failed");
        });
      }
    },
    [
      edit,
      generateId,
      onSend,
      platform,
      preview,
      resetInput,
      tab,
    ],
  );

  return { handleVaultChatSend };
}
