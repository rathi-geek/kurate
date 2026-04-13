"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { LogOutIcon } from "@/components/icons/log-out-icon";
import { TrashIcon } from "@/components/icons/trash-icon";
import { useTranslations } from "@/i18n/use-translations";

export interface DangerConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  action: "leave" | "delete";
  subtitle: string;
  loading: boolean;
  onConfirm: () => void;
}

export function DangerConfirmModal({
  open,
  onOpenChange,
  groupName,
  action,
  subtitle,
  loading,
  onConfirm,
}: DangerConfirmModalProps) {
  const t = useTranslations("groups");
  const [typed, setTyped] = useState("");

  const isLeave = action === "leave";
  const title = isLeave ? t("leave_group") : t("delete_group");
  const confirmLabel = isLeave ? t("danger_confirm_leave") : t("danger_confirm_delete");
  const confirmed = typed.trim() === groupName.trim();

  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-sm">
        <DialogHeader>
          <div className="bg-destructive/10 mb-3 flex size-10 items-center justify-center rounded-full">
            {isLeave ? (
              <LogOutIcon className="text-destructive size-5" />
            ) : (
              <TrashIcon className="text-destructive size-5" />
            )}
          </div>

          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 space-y-4">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">
              {t("danger_confirm_type_prefix")}{" "}
              <span className="text-foreground font-mono font-semibold">{groupName}</span>{" "}
              {t("danger_confirm_type_suffix")}
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={groupName}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="rounded-card border-border text-muted-foreground hover:bg-surface flex-1 border py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {t("danger_confirm_cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!confirmed || loading}
              className="rounded-card bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? `${confirmLabel}ing…` : confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
