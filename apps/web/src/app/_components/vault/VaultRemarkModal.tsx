"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/app/_libs/utils/cn";
import type { VaultItem } from "@/app/_libs/types/vault";

export interface VaultRemarkModalProps {
  open: boolean;
  item: VaultItem | null;
  onSave: (id: string, value: string) => void;
  onClose: () => void;
}

export function VaultRemarkModal({
  open,
  item,
  onSave,
  onClose,
}: VaultRemarkModalProps) {
  const t = useTranslations("vault");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState(item?.remarks ?? "");

  useEffect(() => {
    if (open && item) {
      setDraft(item.remarks ?? "");
    }
  }, [open, item?.id, item?.remarks]);

  function handleSave() {
    if (!item) return;
    onSave(item.id, draft);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("remark_modal_title")}</DialogTitle>
          {item && (
            <DialogDescription className="line-clamp-2 font-sans text-sm">
              {item.title || item.url}
            </DialogDescription>
          )}
        </DialogHeader>
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => { const len = e.target.value.length; e.target.setSelectionRange(len, len); }}
          placeholder={t("remark_placeholder")}
          rows={4}
          aria-label={t("remark_placeholder")}
          className={cn(
            "min-h-0 w-full resize-none border-0 border-b-2 border-primary bg-transparent px-0 py-1 font-sans text-sm text-muted-foreground shadow-none outline-none transition-colors",
            "rounded-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/70",
          )}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!item}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
