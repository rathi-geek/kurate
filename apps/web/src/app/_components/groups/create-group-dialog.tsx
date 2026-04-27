"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/use-translations";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { queryKeys } from "@kurate/query";
import { ROUTES } from "@kurate/utils";
import { createClient } from "@/app/_libs/supabase/client";
import { track } from "@/app/_libs/utils/analytics";
import { cn } from "@/app/_libs/utils/cn";

const supabase = createClient();

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const t = useTranslations("groups");
  const tV = useTranslations("validation");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    let hasError = false;

    if (!trimmedName) return;
    if (trimmedName.length > 50) {
      setNameError(tV("group_name_too_long", { max: 50 }));
      hasError = true;
    }
    if (trimmedDesc.length > 200) {
      setDescError(tV("group_desc_too_long", { max: 200 }));
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    setNameError(null);
    setDescError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("conversations")
        .insert({
          group_name: trimmedName,
          group_description: description.trim() || null,
          group_max_members: 50,
          is_group: true,
        })
        .select("id, group_name")
        .single();

      if (groupError) {
        throw new Error(groupError.message);
      }

      // Add creator as owner — upsert in case a DB trigger already inserted them
      const { error: memberError } = await supabase
        .from("conversation_members")
        .upsert(
          { convo_id: group.id, user_id: user.id, role: "owner" },
          { onConflict: "convo_id,user_id", ignoreDuplicates: true },
        );

      if (memberError) throw new Error(memberError.message);

      // Refresh sidebar groups list
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });

      track("group_created", {
        group_id: group.id,
        group_name: trimmedName,
        has_description: !!description.trim(),
      });
      onOpenChange(false);
      setName("");
      setDescription("");
      setNameError(null);
      setDescError(null);

      router.push(ROUTES.APP.GROUP_INVITE_FLOW(group.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("character varying")) {
        setNameError(tV("group_name_too_long", { max: 50 }));
      } else {
        toast.error(msg || t("error_generic"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("create_title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="group-name" className="text-foreground text-sm font-medium">
              {t("create_name_label")}
            </label>
            <Input
              id="group-name"
              value={name}
              maxLength={50}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder={t("create_name_placeholder")}
              className={nameError ? "border-destructive" : ""}
              autoFocus
              required
            />
            {nameError && <p className="text-destructive text-xs">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="group-desc" className="text-foreground text-sm font-medium">
              {t("group_description")}{" "}
              <span className="text-muted-foreground font-normal">{t("create_desc_optional")}</span>
            </label>
            <Textarea
              id="group-desc"
              value={description}
              maxLength={200}
              onChange={(e) => { setDescription(e.target.value); setDescError(null); }}
              placeholder={t("create_desc_placeholder")}
              rows={2}
              className={cn("resize-none", descError && "border-destructive")}
            />
            {descError && <p className="text-destructive text-xs">{descError}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? t("create_creating") : t("create_submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
