"use client";

import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/use-translations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { INTEREST_OPTIONS, validateUsername } from "@kurate/utils";
import { useUserInterests, saveUserInterests } from "@/app/_libs/hooks/useUserInterests";
import { useUsernameAvailability } from "@/app/_libs/hooks/useUsernameAvailability";
import { queryKeys } from "@kurate/query";
import { uploadAvatar, deleteAvatar } from "@kurate/hooks";
import { createClient } from "@/app/_libs/supabase/client";
import { cn } from "@/app/_libs/utils/cn";
import { fadeUpHero, springGentle } from "@/app/_libs/utils/motion";
import { track } from "@/app/_libs/utils/analytics";
import { CameraIcon, TrashIcon } from "@/components/icons";

const VISIBLE_COUNT = 8;

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ open, onClose }: ProfileEditModalProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tV = useTranslations("validation");
  const { user, profile, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const interestsQuery = useUserInterests(user?.id);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const { status: handleStatus, setStatus: setHandleStatus } = useUsernameAvailability(
    username,
    profile?.handle ?? undefined,
  );

  useEffect(() => {
    if (open && profile) {
      const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
      setName(displayName);
      setUsername(profile.handle ?? "");
      setBio(profile.about ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      setExpanded(false);
      setNameError(null);
      setUsernameError(null);
      setHandleStatus("idle");
    }
  }, [open, profile, setHandleStatus]);

  // Sync interests from query when modal opens or data loads
  useEffect(() => {
    if (open && interestsQuery.data) {
      setInterests(interestsQuery.data);
    }
  }, [open, interestsQuery.data]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      toast.error(t("upload_size_error"));
      return;
    }

    const previousUrl = avatarUrl;
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
    setUploading(true);

    try {
      const supabase = createClient();
      const cacheBustedUrl = await uploadAvatar(
        supabase,
        user.id,
        file,
        file.name,
        file.type,
        file.size,
      );
      URL.revokeObjectURL(localUrl);
      setAvatarUrl(cacheBustedUrl);
    } catch {
      URL.revokeObjectURL(localUrl);
      setAvatarUrl(previousUrl);
      toast.error(t("upload_error"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAvatar() {
    if (!user) return;
    setDeletingAvatar(true);

    try {
      const supabase = createClient();
      await deleteAvatar(supabase, user.id);
      setAvatarUrl("");
      await refreshUser();
      toast.success(t("avatar_deleted"));
    } catch {
      toast.error(t("avatar_delete_error"));
    } finally {
      setDeletingAvatar(false);
    }
  }

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError(tV("name_required"));
      hasError = true;
    } else if (trimmedName.length > 50) {
      setNameError(tV("name_too_long", { max: 50 }));
      hasError = true;
    }
    if (!trimmedUsername) {
      setUsernameError(tV("username_required"));
      hasError = true;
    }
    if (hasError || !user) return;

    setSaving(true);
    const supabase = createClient();
    const spaceIdx = trimmedName.indexOf(" ");
    const first_name = spaceIdx === -1 ? trimmedName : trimmedName.slice(0, spaceIdx);
    const last_name = spaceIdx === -1 ? null : trimmedName.slice(spaceIdx + 1) || null;

    const { error } = await supabase.from("profiles").update({
      first_name,
      last_name,
      handle: trimmedUsername,
      about: bio,
    }).eq("id", user.id);
    if (error) {
      toast.error(t("save_error"));
      setSaving(false);
      return;
    }

    await saveUserInterests(user.id, interests);

    const changedFields: string[] = [];
    if (first_name !== profile?.first_name || last_name !== (profile?.last_name ?? null)) changedFields.push("name");
    if (trimmedUsername !== profile?.handle) changedFields.push("handle");
    if (bio !== (profile?.about ?? "")) changedFields.push("bio");

    track("profile_edited", { fields_changed: changedFields });
    track("interests_updated", { count: interests.length });

    await queryClient.invalidateQueries({ queryKey: queryKeys.user.interests(user.id) });
    await refreshUser();
    setSaving(false);
    onClose();
  }

  const avatarLetter = name ? name[0].toUpperCase() : "?";
  const visibleInterests = expanded ? INTEREST_OPTIONS : INTEREST_OPTIONS.slice(0, VISIBLE_COUNT);
  const canSave =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    !usernameError &&
    handleStatus !== "taken" &&
    handleStatus !== "checking";
  const busy = saving || uploading || deletingAvatar;

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
              <div className="relative inline-block">
                <button
                  type="button"
                  className="relative cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title={t("change_photo")}>
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-primary">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={name} fill className="object-cover blur-[2px]" sizes="64px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary-foreground blur-[1px]">
                        {uploading ? "…" : avatarLetter}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                      <CameraIcon className="size-4 text-white" />
                    </div>
                  </div>
                </button>
                {avatarUrl && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="border-background bg-card text-muted-foreground hover:text-destructive absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm transition-colors"
                        disabled={busy}
                        title={t("remove_photo")}
                      >
                        <TrashIcon className="size-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("remove_photo_title")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("remove_photo_desc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAvatar}>
                          {t("remove_photo_confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
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
                  maxLength={50}
                  onChange={(e) => { setName(e.target.value); setNameError(null); }}
                  onBlur={() => { if (!name.trim()) setNameError(tV("name_required")); }}
                  placeholder={t("display_name_placeholder")}
                />
                {nameError && <p className="text-destructive text-xs">{nameError}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
                  {t("username")}
                </label>
                <Input
                  value={username}
                  maxLength={20}
                  onChange={(e) => {
                    const v = e.target.value.toLowerCase().replace(/\s/g, "");
                    setUsername(v);
                    setUsernameError(v.trim() ? validateUsername(v.trim()) : null);
                  }}
                  onBlur={() => {
                    const trimmed = username.trim();
                    if (!trimmed) setUsernameError(tV("username_required"));
                    else setUsernameError(validateUsername(trimmed));
                  }}
                  placeholder={t("username_placeholder")}
                />
                {usernameError && <p className="text-destructive text-xs">{usernameError}</p>}
                {!usernameError && handleStatus === "checking" && (
                  <p className="text-muted-foreground text-xs">{t("username_checking")}</p>
                )}
                {!usernameError && handleStatus === "available" && (
                  <p className="text-success text-xs">{t("username_available")}</p>
                )}
                {!usernameError && handleStatus === "taken" && (
                  <p className="text-destructive text-xs">{t("username_taken")}</p>
                )}
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
                  maxLength={300}
                  className="min-h-0 resize-none"
                />
                <p className="text-muted-foreground text-right text-xs">{bio.length}/300</p>
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
              <Button size="sm" onClick={handleSave} disabled={busy || !canSave}>
                {saving ? t("saving") : t("save_changes")}
              </Button>
            </DialogFooter>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
