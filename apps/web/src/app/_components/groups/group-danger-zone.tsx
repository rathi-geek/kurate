"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/use-translations";

import { queryKeys } from "@kurate/query";
import { createClient } from "@/app/_libs/supabase/client";
import type { Tables } from "@kurate/types";
import type { GroupMember, GroupRole } from "@kurate/types";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LogOutIcon } from "@/components/icons/log-out-icon";
import { TrashIcon } from "@/components/icons/trash-icon";
import { Input } from "@/components/ui/input";

const supabase = createClient();

// ─── Confirmation modal ────────────────────────────────────────────────────────

interface DangerConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  action: "leave" | "delete";
  subtitle: string;
  loading: boolean;
  onConfirm: () => void;
}

function DangerConfirmModal({
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
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10">
            {isLeave ? (
              <LogOutIcon className="size-5 text-destructive" />
            ) : (
              <TrashIcon className="size-5 text-destructive" />
            )}
          </div>

          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {t("danger_confirm_type_prefix")}{" "}
              <span className="font-mono font-semibold text-foreground">
                {groupName}
              </span>{" "}
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
              className="flex-1 rounded-card border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface disabled:opacity-50"
            >
              {t("danger_confirm_cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!confirmed || loading}
              className="flex-1 rounded-card bg-destructive py-2 text-sm font-medium text-destructive-foreground transition-all hover:bg-destructive/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? `${confirmLabel}ing…` : confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

export interface GroupDangerZoneProps {
  group: Tables<"conversations">;
  currentUserId: string;
  userRole: GroupRole;
  members: GroupMember[];
}

export function GroupDangerZone({
  group,
  currentUserId,
  userRole,
  members,
}: GroupDangerZoneProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = userRole === "owner";
  const groupName = group.group_name ?? "";
  const others = members.filter((m) => m.user_id !== currentUserId);
  const successor =
    isOwner && others.length > 0
      ? (others.find((m) => m.role === "admin") ??
        others.sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0])
      : null;

  const leaveSubtitle = isOwner
    ? successor
      ? t("leave_group_subtitle_transfer", { successor: successor.profile.display_name ?? t("anonymous") })
      : t("leave_group_subtitle_last")
    : t("leave_group_subtitle_member");

  const handleLeave = async () => {
    setLeaving(true);
    try {
      if (isOwner) {
        if (others.length === 0) {
          const { error } = await supabase.from("conversations").delete().eq("id", group.id);
          if (error) throw error;
        } else {
          const suc =
            others.find((m) => m.role === "admin") ??
            others.sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0];

          const { error: transferError } = await supabase
            .from("conversation_members")
            .update({ role: "owner" })
            .eq("id", suc.id);
          if (transferError) throw transferError;

          const { error: leaveError } = await supabase
            .from("conversation_members")
            .delete()
            .eq("convo_id", group.id)
            .eq("user_id", currentUserId);
          if (leaveError) throw leaveError;
        }
      } else {
        const { error } = await supabase
          .from("conversation_members")
          .delete()
          .eq("convo_id", group.id)
          .eq("user_id", currentUserId);
        if (error) throw error;
      }
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(group.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
      router.push("/home");
    } catch {
      toast.error("Failed to leave group. Please try again.");
    } finally {
      setLeaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("conversations").delete().eq("id", group.id);
      if (error) throw error;
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(group.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
      router.push("/home");
    } catch {
      toast.error("Failed to delete group. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="shrink-0 border-t border-destructive/20 px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-destructive/70">
          {t("danger_zone_label")}
        </p>

        <div className="overflow-hidden rounded-card border border-destructive/25 bg-destructive/5">
          {/* Leave */}
          <button
            type="button"
            onClick={() => setLeaveOpen(true)}
            disabled={leaving || deleting}
            className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <LogOutIcon className="size-4 shrink-0 text-destructive/70 transition-colors group-hover:text-destructive" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                {leaving ? t("leaving") : t("leave_group")}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOwner ? t("leave_group_hint_owner") : t("leave_group_hint_member")}
              </p>
            </div>
          </button>

          {/* Delete — owner only */}
          {isOwner && (
            <>
              <div className="mx-4 h-px bg-destructive/15" />
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={leaving || deleting}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <TrashIcon className="size-4 shrink-0 text-destructive/70 transition-colors group-hover:text-destructive" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-destructive">
                    {deleting ? t("deleting") : t("delete_group")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("delete_group_hint")}
                  </p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      <DangerConfirmModal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        groupName={groupName}
        action="leave"
        subtitle={leaveSubtitle}
        loading={leaving}
        onConfirm={() => {
          setLeaveOpen(false);
          void handleLeave();
        }}
      />
      <DangerConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        groupName={groupName}
        action="delete"
        subtitle={t("delete_group_subtitle")}
        loading={deleting}
        onConfirm={() => {
          setDeleteOpen(false);
          void handleDelete();
        }}
      />
    </>
  );
}
