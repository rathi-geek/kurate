"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { queryKeys } from "@kurate/query";
import { type Tables, type GroupMember, type GroupRole } from "@kurate/types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DangerConfirmModal } from "@/app/_components/groups/danger-confirm-modal";
import { createClient } from "@/app/_libs/supabase/client";
import { LogOutIcon } from "@/components/icons/log-out-icon";
import { TrashIcon } from "@/components/icons/trash-icon";
import { useTranslations } from "@/i18n/use-translations";

const supabase = createClient();

// ─── Danger Zone ──────────────────────────────────────────────────────────────

export interface GroupDangerZoneProps {
  group: Tables<"conversations">;
  currentUserId: string;
  userRole: GroupRole;
  members: GroupMember[];
}

export function GroupDangerZone({ group, currentUserId, userRole, members }: GroupDangerZoneProps) {
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
      ? t("leave_group_subtitle_transfer", {
          successor: successor.profile_display_name ?? t("anonymous"),
        })
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
      <div className="border-destructive/20 shrink-0 border-t px-2 py-4 md:px-5">
        <p className="text-destructive/70 mb-3 text-[11px] font-semibold tracking-wider uppercase">
          {t("danger_zone_label")}
        </p>

        <div className="rounded-card border-destructive/25 bg-destructive/5 overflow-hidden border">
          {/* Leave */}
          <button
            type="button"
            onClick={() => setLeaveOpen(true)}
            disabled={leaving || deleting}
            className="group hover:bg-destructive/10 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50">
            <LogOutIcon className="text-destructive/70 group-hover:text-destructive size-4 shrink-0 transition-colors" />
            <div className="min-w-0 flex-1">
              <p className="text-destructive text-sm font-medium">
                {leaving ? t("leaving") : t("leave_group")}
              </p>
              <p className="text-muted-foreground text-xs">
                {isOwner ? t("leave_group_hint_owner") : t("leave_group_hint_member")}
              </p>
            </div>
          </button>

          {/* Delete — owner only */}
          {isOwner && (
            <>
              <div className="bg-destructive/15 mx-4 h-px" />
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={leaving || deleting}
                className="group hover:bg-destructive/10 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50">
                <TrashIcon className="text-destructive/70 group-hover:text-destructive size-4 shrink-0 transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-destructive text-sm font-medium">
                    {deleting ? t("deleting") : t("delete_group")}
                  </p>
                  <p className="text-muted-foreground text-xs">{t("delete_group_hint")}</p>
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
