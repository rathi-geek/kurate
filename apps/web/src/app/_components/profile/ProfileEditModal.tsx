"use client";

import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/app/_libs/auth-context";
import { INTEREST_OPTIONS } from "@/app/_libs/constants/interests";
import { createClient } from "@/app/_libs/supabase/client";
import { cn } from "@/app/_libs/utils/cn";
import { fadeUpHero, springGentle } from "@/app/_libs/utils/motion";
import { CameraIcon } from "@/components/icons";

const VISIBLE_COUNT = 8;

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ open, onClose }: ProfileEditModalProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { user, profile, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
      setName(displayName);
      setUsername(profile.handle ?? "");
      setBio(profile.about ?? "");
      setInterests(Array.isArray(profile.interests) ? profile.interests : []);
      setAvatarUrl(profile.avtar_url ?? "");
      setExpanded(false);
    }
  }, [open, profile]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const supabase = createClient();
    const path = `${user.id}/avatar`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const trimmed = name.trim();
    const spaceIdx = trimmed.indexOf(" ");
    const first_name = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const last_name = spaceIdx === -1 ? null : trimmed.slice(spaceIdx + 1) || null;
    await supabase.from("profiles").update({
      first_name,
      last_name,
      handle: username,
      about: bio,
      interests,
      avtar_url: avatarUrl,
    }).eq("id", user.id);
    await refreshUser();
    setSaving(false);
    onClose();
  }

  const avatarLetter = name ? name[0].toUpperCase() : "?";
  const visibleInterests = expanded ? INTEREST_OPTIONS : INTEREST_OPTIONS.slice(0, VISIBLE_COUNT);
  const busy = saving || uploading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpHero}
          transition={springGentle}>
          {/* Header */}
          <div className="border-border border-b px-6 pt-5 pb-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">{t("edit_title")}</DialogTitle>
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          <div className="max-h-[68vh] space-y-5 overflow-y-auto px-6 py-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                className="group relative cursor-pointer"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title={t("change_photo")}>
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-primary">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary-foreground">
                      {uploading ? "…" : avatarLetter}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <CameraIcon className="size-4 text-white" />
                </div>
              </button>
              <p className="text-muted-foreground/60 font-mono text-[10px] tracking-wider uppercase">
                {t("change_photo")}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
                  {t("display_name")}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("display_name_placeholder")}
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
                  {t("username")}
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("username_placeholder")}
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
                  {t("bio")}
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("bio_placeholder")}
                  rows={2}
                  className="min-h-0 resize-none"
                />
              </div>
            </div>

            {/* Interests */}
            <div>
              <p className="text-muted-foreground mb-2.5 font-mono text-[10px] font-medium tracking-wider uppercase">
                {t("interests")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visibleInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "rounded-full px-3 py-1 font-sans text-xs transition-all",
                      interests.includes(interest)
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary/50 hover:bg-accent border bg-transparent",
                    )}>
                    {interest}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1 font-sans text-xs underline transition-colors">
                  {expanded ? t("show_less") : t("show_more")}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-border border-t px-6 py-4">
            <DialogFooter className="flex-row justify-end gap-2">
              <Button size="sm" variant="outline" onClick={onClose} disabled={busy}>
                {tCommon("cancel")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={busy}>
                {saving ? t("saving") : t("save_changes")}
              </Button>
            </DialogFooter>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
