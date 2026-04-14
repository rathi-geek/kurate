"use client";

import { useState } from "react";

import { queryKeys } from "@kurate/query";
import type { GroupMember, GroupRole } from "@kurate/types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PenLineIcon, UserXIcon } from "@/components/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useTranslations } from "@/i18n/use-translations";
import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

interface MemberActionModalProps {
  member: GroupMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberActionModal({ member, open, onOpenChange }: MemberActionModalProps) {
  const t = useTranslations("groups");
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<"role" | "remove" | null>(null);

  if (!member) return null;

  const role = (member.role ?? "member") as GroupRole;
  const name =
    member.profile_display_name ?? member.profile_handle ?? t("member_fallback_name");
  const isAdmin = role === "admin";

  const handleRoleChange = async () => {
    const newRole = isAdmin ? "member" : "admin";
    setLoading("role");
    const { error } = await supabase
      .from("conversation_members")
      .update({ role: newRole })
      .eq("id", member.id);
    setLoading(null);
    if (error) {
      toast.error(t("toast_member_role_failed"));
      return;
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(member.convo_id) });
    toast.success(
      newRole === "admin" ? t("toast_member_now_admin", { name }) : t("toast_member_now_member", { name }),
    );
    onOpenChange(false);
  };

  const handleRemove = async () => {
    setLoading("remove");
    const { error } = await supabase.from("conversation_members").delete().eq("id", member.id);
    setLoading(null);
    if (error) {
      toast.error(t("toast_member_remove_failed"));
      return;
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(member.convo_id) });
    toast.success(t("toast_member_removed", { name }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{t("member_action_title")}</DialogTitle>
        </DialogHeader>

        <div className="mt-1 space-y-3">
          {/* Member info */}
          <div className="rounded-card border-border bg-surface flex items-center gap-3 border px-3 py-2.5">
            <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
              <span className="text-primary text-sm font-bold">
                {(name[0] ?? "?").toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">{name}</p>
              {member.profile_handle && (
                <p className="text-muted-foreground text-xs">@{member.profile_handle}</p>
              )}
            </div>
            <span className="rounded-badge bg-muted text-muted-foreground ml-auto shrink-0 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
              {t(`member_role_${role}`)}
            </span>
          </div>

          {/* Role toggle */}
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleRoleChange()}
            className="rounded-card border-border hover:bg-surface flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors disabled:opacity-50">
            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
              <PenLineIcon className="text-primary size-4" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                {loading === "role"
                  ? t("member_action_updating")
                  : isAdmin
                    ? t("member_action_revoke_admin_label")
                    : t("member_action_make_admin_label")}
              </p>
              <p className="text-muted-foreground text-xs">
                {isAdmin ? t("member_action_revoke_admin_desc") : t("member_action_make_admin_desc")}
              </p>
            </div>
          </button>

          {/* Remove from group */}
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleRemove()}
            className="rounded-card border-destructive/25 hover:bg-destructive/5 flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors disabled:opacity-50">
            <div className="bg-destructive/10 flex size-8 shrink-0 items-center justify-center rounded-full">
              <UserXIcon className="text-destructive size-4" />
            </div>
            <div>
              <p className="text-destructive text-sm font-medium">
                {loading === "remove" ? t("member_action_removing") : t("member_action_remove_title")}
              </p>
              <p className="text-muted-foreground text-xs">{t("member_action_remove_desc")}</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
