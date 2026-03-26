"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/app/_libs/supabase/client";
import { AVATARS_BUCKET } from "@/app/_libs/utils/getMediaUrl";
import { CameraIcon } from "@/components/icons";

export interface EditGroupInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  initialName: string;
  initialDescription: string;
  initialAvatarUrl?: string | null;
  onSave: (name: string, description: string) => Promise<void>;
  onAvatarUploaded?: (url: string) => void;
}

export function EditGroupInfoModal({
  open,
  onOpenChange,
  groupId,
  initialName,
  initialDescription,
  initialAvatarUrl,
  onSave,
  onAvatarUploaded,
}: EditGroupInfoModalProps) {
  const t = useTranslations("groups");
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription);
      setAvatarUrl(initialAvatarUrl ?? null);
    }
  }, [open, initialName, initialDescription, initialAvatarUrl]);

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
    setUploading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const ext = file.name.split(".").pop();
    const path = `group_avatars/${groupId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { upsert: true });
    if (uploadErr) { setUploading(false); return; }

    const { data: media, error: mediaErr } = await supabase
      .from("media_metadata")
      .upsert({
        provider: "supabase",
        bucket_name: AVATARS_BUCKET,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        owner_id: user.id,
        is_public: true,
      }, { onConflict: "owner_id,provider,file_path,file_name" })
      .select("id")
      .single();
    if (mediaErr) { setUploading(false); return; }

    await supabase.from("conversations").update({ group_avatar_id: media.id }).eq("id", groupId);
    const { data: { publicUrl } } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    URL.revokeObjectURL(localUrl);
    setAvatarUrl(publicUrl);
    setUploading(false);
    onAvatarUploaded?.(publicUrl);
  }

  const avatarInitial = (name[0] ?? "G").toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("edit_group_info")}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              className="group relative cursor-pointer"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <div className="relative size-16 overflow-hidden rounded-full bg-primary/10">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary">
                    {uploading ? "…" : avatarInitial}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <CameraIcon className="size-4 text-white" />
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

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
              disabled={saving || uploading}>
              {t("cancel")}
            </Button>
            <Button type="button" size="sm" disabled={!name.trim() || saving || uploading} onClick={handleSave}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
