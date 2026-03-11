"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function VaultDeleteModal({
  open,
  onConfirm,
  onCancel,
}: VaultDeleteModalProps) {
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("delete_modal_title")}</DialogTitle>
          <DialogDescription>{t("delete_modal_description")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-2">
          <Checkbox
            id="vault-delete-dont-ask"
            checked={dontAskAgain}
            onCheckedChange={(checked) =>
              setDontAskAgain(checked === true)
            }
          />
          <label
            htmlFor="vault-delete-dont-ask"
            className="cursor-pointer font-sans text-sm text-foreground"
          >
            {t("delete_modal_dont_ask_again")}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
