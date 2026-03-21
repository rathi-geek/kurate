"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { VaultModal } from "@/app/_components/vault/VaultModal";

const SKIP_CONFIRM_KEY = "vault.skipDeleteConfirm";

export function shouldSkipConfirm(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SKIP_CONFIRM_KEY) === "true";
}

export interface VaultDeleteModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function VaultDeleteModal({ open, onConfirm, onCancel }: VaultDeleteModalProps) {
  const t = useTranslations("vault");
  const tCommon = useTranslations("common");
  const [dontAskAgain, setDontAskAgain] = useState(false);

  function handleConfirm() {
    if (dontAskAgain) {
      window.localStorage.setItem(SKIP_CONFIRM_KEY, "true");
    }
    onConfirm();
  }

  return (
    <VaultModal
      open={open}
      onClose={onCancel}
      title={t("delete_modal_title")}
      description={t("delete_modal_description")}
      showCloseButton={false}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {t("delete")}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2 py-1">
        <Checkbox
          id="vault-delete-dont-ask"
          checked={dontAskAgain}
          onCheckedChange={(checked) => setDontAskAgain(checked === true)}
        />
        <label
          htmlFor="vault-delete-dont-ask"
          className="cursor-pointer font-sans text-sm text-foreground"
        >
          {t("delete_modal_dont_ask_again")}
        </label>
      </div>
    </VaultModal>
  );
}
