"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "@/i18n/use-translations";
import { MAX_BUCKET_NAME_LENGTH } from "@kurate/utils";
import type { Bucket } from "@kurate/types";

interface CreateBucketDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateBucket: (label: string) => Promise<Bucket>;
  isCreating: boolean;
}

export function CreateBucketDialog({ open, onClose, onCreateBucket, isCreating }: CreateBucketDialogProps) {
  const t = useTranslations("thoughts");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("bucket_name_required"));
      return;
    }
    if (trimmed.length > MAX_BUCKET_NAME_LENGTH) {
      setError(t("bucket_name_too_long"));
      return;
    }
    setError(null);
    try {
      await onCreateBucket(trimmed);
      setName("");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg === "BUCKET_NAME_DUPLICATE") setError(t("bucket_name_duplicate"));
      else if (msg === "MAX_BUCKETS_REACHED") setError(t("max_buckets_reached"));
      else setError(msg);
    }
  }, [name, onCreateBucket, onClose, t]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-card border-border w-full max-w-sm rounded-xl border p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-ink mb-4 text-base font-semibold">{t("create_bucket")}</h3>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("new_bucket_placeholder")}
          maxLength={MAX_BUCKET_NAME_LENGTH}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleCreate();
            if (e.key === "Escape") onClose();
          }}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <p className="text-muted-foreground mt-1 text-right text-xs">
          {name.length}/{MAX_BUCKET_NAME_LENGTH}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg px-4 py-2 text-sm transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isCreating || !name.trim()}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
            {isCreating ? "Creating..." : t("create_bucket")}
          </button>
        </div>
      </div>
    </div>
  );
}
