"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
import type { Tables } from "@/app/_libs/types/database.types";
import type { GroupMember, GroupRole } from "@/app/_libs/types/groups";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";
import { EditGroupInfoModal } from "@/components/groups/edit-group-info-modal";
import { GroupInfoMembersList } from "@/components/groups/group-info-members-list";
import { ChevronLeftIcon, PencilIcon, PlusIcon } from "@/components/icons";

const supabase = createClient();

export type InfoModal = "invite" | "edit" | null;

export interface GroupInfoHeaderProps {
  group: Tables<"conversations">;
  groupId: string;
  userRole: GroupRole;
  members: GroupMember[];
  membersLoading: boolean;
  openModal: InfoModal;
  setOpenModal: (m: InfoModal) => void;
}

export function GroupInfoHeader({
  group,
  groupId,
  userRole,
  members,
  membersLoading,
  openModal,
  setOpenModal,
}: GroupInfoHeaderProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [groupAvatarUrl, setGroupAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!group.group_avatar_id) { setGroupAvatarUrl(null); return; }
    supabase
      .from("media_metadata")
      .select("file_path, bucket_name")
      .eq("id", group.group_avatar_id)
      .single()
      .then(({ data }) => { setGroupAvatarUrl(data ? mediaToUrl(data) : null); });
  }, [group.group_avatar_id]);

  const isOwner = userRole === "owner";
  const isAdminOrOwner = userRole === "owner" || userRole === "admin";
  const avatarInitial = (group.group_name?.[0] ?? "G").toUpperCase();

  return (
    <>
      <div className="flex flex-col items-start gap-5 px-5 py-5">
        <div className="flex w-full flex-row items-start gap-3">
          <div className="flex shrink-0 flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/groups/${groupId}`)}
              aria-label={t("back_to_feed")}
              className="text-muted-foreground hover:text-foreground hover:bg-surface shrink-0 rounded-md p-1.5 transition-colors">
              <ChevronLeftIcon className="size-[18px]" />
            </button>

            <div className="relative">
              <div className="bg-primary/10 relative flex size-20 items-center justify-center overflow-hidden rounded-full">
                {groupAvatarUrl ? (
                  <Image src={groupAvatarUrl} alt={group.group_name ?? "Group"} fill className="object-cover" sizes="80px" />
                ) : (
                  <span className="text-primary text-3xl font-bold">{avatarInitial}</span>
                )}
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setOpenModal("edit")}
                  aria-label={t("edit_name_aria")}
                  className="bg-card border-border text-muted-foreground hover:text-foreground absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border shadow-sm transition-colors">
                  <PencilIcon className="size-3" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-1">
            <h1 className="text-foreground font-serif text-xl leading-tight font-normal">
              {group.group_name}
            </h1>
            {group.group_description && (
              <p className="text-muted-foreground mt-1 text-sm leading-snug">
                {group.group_description}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          {isAdminOrOwner && (
            <button
              type="button"
              onClick={() => setOpenModal("invite")}
              aria-label={t("add_member")}
              className="group flex w-full items-center gap-3 rounded-card border border-dashed border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-surface">
              <div className="border-border text-muted-foreground group-hover:border-primary group-hover:text-primary flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed transition-colors">
                <PlusIcon className="size-4" />
              </div>
              <span className="text-muted-foreground group-hover:text-primary text-sm font-medium transition-colors">
                {t("add_member")}
              </span>
            </button>
          )}

          <GroupInfoMembersList members={members} membersLoading={membersLoading} />
        </div>
      </div>

      <EditGroupInfoModal
        open={openModal === "edit"}
        onOpenChange={(o) => !o && setOpenModal(null)}
        groupId={group.id}
        initialName={group.group_name ?? ""}
        initialDescription={group.group_description ?? ""}
        initialAvatarUrl={groupAvatarUrl}
        onAvatarUploaded={(url) => {
          setGroupAvatarUrl(url);
          void queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
        }}
        onSave={async (name, description) => {
          await supabase
            .from("conversations")
            .update({ group_name: name, group_description: description || null })
            .eq("id", group.id);
          await queryClient.invalidateQueries({
            queryKey: queryKeys.groups.detail(groupId),
          });
        }}
      />
    </>
  );
}
