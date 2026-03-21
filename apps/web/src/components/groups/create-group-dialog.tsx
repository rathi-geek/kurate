"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
// Postgres unique-violation code
const PG_UNIQUE_VIOLATION = "23505";

const supabase = createClient();

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError(null);

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
        if (groupError.code === PG_UNIQUE_VIOLATION) {
          setError(t("name_taken"));
          return;
        }
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

      onOpenChange(false);
      setName("");
      setDescription("");

      router.push(`/groups/${group.id}/info?invite=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_generic"));
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
              onChange={(e) => setName(e.target.value)}
              placeholder={t("create_name_placeholder")}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="group-desc" className="text-foreground text-sm font-medium">
              {t("group_description")}{" "}
              <span className="text-muted-foreground font-normal">{t("create_desc_optional")}</span>
            </label>
            <Textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("create_desc_placeholder")}
              rows={2}
              className="resize-none"
            />
          </div>

          {error && <p className="text-error-foreground text-xs">{error}</p>}

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
