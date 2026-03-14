"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface EditGroupInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialDescription: string;
  onSave: (name: string, description: string) => Promise<void>;
}

export function EditGroupInfoModal({
  open,
  onOpenChange,
  initialName,
  initialDescription,
  onSave,
}: EditGroupInfoModalProps) {
  const t = useTranslations("groups");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription);
    }
  }, [open, initialName, initialDescription]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("edit_group_info")}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">{t("group_name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground text-sm font-medium">{t("group_description")}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}>
              {t("cancel")}
            </Button>
            <Button type="button" size="sm" disabled={!name.trim() || saving} onClick={handleSave}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
