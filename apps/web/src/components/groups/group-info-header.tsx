"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
import type { Tables } from "@/app/_libs/types/database.types";
import type { GroupMember, GroupRole } from "@/app/_libs/types/groups";
import { EditGroupInfoModal } from "@/components/groups/edit-group-info-modal";
import { ChevronLeftIcon, PencilIcon, PlusIcon } from "@/components/icons";

const supabase = createClient();

export type InfoModal = "invite" | "edit" | null;

export interface GroupInfoHeaderProps {
  group: Tables<"groups">;
  groupSlug: string;
  userRole: GroupRole;
  members: GroupMember[];
  membersLoading: boolean;
  openModal: InfoModal;
  setOpenModal: (m: InfoModal) => void;
}

export function GroupInfoHeader({
  group,
  groupSlug,
  userRole,
  members,
  membersLoading,
  openModal,
  setOpenModal,
}: GroupInfoHeaderProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const queryClient = useQueryClient();

  const isOwner = userRole === "owner";
  const isAdminOrOwner = userRole === "owner" || userRole === "admin";
  const avatarInitial = (group.name?.[0] ?? "G").toUpperCase();

  return (
    <>
      <div className="flex flex-col items-start gap-5 px-5 py-5">
        <div className="flex w-full flex-row items-start gap-3">
          <div className="flex shrink-0 flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/groups/${groupSlug}`)}
              aria-label={t("back_to_feed")}
              className="text-muted-foreground hover:text-foreground hover:bg-surface shrink-0 rounded-md p-1.5 transition-colors">
              <ChevronLeftIcon className="size-[18px]" />
            </button>

            <div className="relative">
              <div className="bg-primary/10 flex size-20 items-center justify-center rounded-full">
                <span className="text-primary text-3xl font-bold">
                  {avatarInitial}
                </span>
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
              {group.name}
            </h1>
            {group.description && (
              <p className="text-muted-foreground mt-1 text-sm leading-snug">
                {group.description}
              </p>
            )}
          </div>
        </div>

        <div className="no-scrollbar flex w-full items-center gap-4 overflow-x-auto pb-1">
          {isAdminOrOwner && (
            <button
              type="button"
              onClick={() => setOpenModal("invite")}
              aria-label={t("add_member")}
              className="group flex shrink-0 flex-col items-center gap-1.5">
              <div className="border-border bg-card text-muted-foreground group-hover:border-primary group-hover:text-primary flex size-11 items-center justify-center rounded-full border-2 border-dashed transition-colors">
                <PlusIcon className="size-4" />
              </div>
              <span className="text-muted-foreground group-hover:text-primary text-[10px] leading-none transition-colors">
                {t("add_member")}
              </span>
            </button>
          )}

          {membersLoading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex shrink-0 flex-col items-center gap-1.5">
                  <div className="bg-surface size-11 animate-pulse rounded-full" />
                  <div className="bg-surface h-2.5 w-8 animate-pulse rounded" />
                </div>
              ))
            : members.map((m) => (
                <div
                  key={m.id}
                  className="flex shrink-0 flex-col items-center gap-1.5">
                  {m.profile.avatar_url ? (
                    <Image
                      src={m.profile.avatar_url}
                      alt={m.profile.display_name ?? ""}
                      width={44}
                      height={44}
                      className="border-border size-11 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 border-border/50 flex size-11 items-center justify-center rounded-full border">
                      <span className="text-primary text-sm font-bold">
                        {(m.profile.display_name?.[0] ?? "?").toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-muted-foreground max-w-[44px] truncate text-center text-[10px] leading-none">
                    {m.profile.display_name ?? t("anonymous")}
                  </span>
                </div>
              ))}
        </div>
      </div>

      <EditGroupInfoModal
        open={openModal === "edit"}
        onOpenChange={(o) => !o && setOpenModal(null)}
        initialName={group.name ?? ""}
        initialDescription={group.description ?? ""}
        onSave={async (name, description) => {
          await supabase
            .from("groups")
            .update({ name, description: description || null })
            .eq("id", group.id);
          await queryClient.invalidateQueries({
            queryKey: queryKeys.groups.detail(groupSlug),
          });
        }}
      />
    </>
  );
}
