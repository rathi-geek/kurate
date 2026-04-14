"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "@/i18n/use-translations";

import type { GroupMember, GroupRole } from "@kurate/types";
import { avatarUrl } from "@/app/_libs/utils/getMediaUrl";
import { MemberActionModal } from "./member-action-modal";

export interface GroupInfoMembersListProps {
  members: GroupMember[];
  membersLoading: boolean;
  userRole: GroupRole;
  currentUserId: string;
}

const ROLE_KEYS = {
  owner: "member_role_owner",
  admin: "member_role_admin",
  member: "member_role_member",
} as const satisfies Record<GroupRole, string>;

function getRoleTranslationKey(role: GroupRole): (typeof ROLE_KEYS)[GroupRole] {
  return ROLE_KEYS[role];
}

export function GroupInfoMembersList({
  members,
  membersLoading,
  userRole,
  currentUserId,
}: GroupInfoMembersListProps) {
  const t = useTranslations("groups");
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  const isOwner = userRole === "owner";

  if (membersLoading) {
    return (
      <div className="flex w-full flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex w-full items-center gap-3 rounded-card border border-border bg-card px-3 py-2.5">
            <div className="bg-surface size-10 shrink-0 animate-pulse rounded-full" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="bg-surface h-3.5 w-24 animate-pulse rounded" />
              <div className="bg-surface h-2.5 w-16 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        {members.map((m) => {
          const role = (m.role ?? "member") as GroupRole;
          const roleKey = getRoleTranslationKey(role);
          const isSelf = m.user_id === currentUserId;
          const isThisOwner = role === "owner";
          // Owner can tap any row that isn't themselves or another owner
          const tappable = isOwner && !isSelf && !isThisOwner;

          return (
            <div
              key={m.id}
              role={tappable ? "button" : undefined}
              tabIndex={tappable ? 0 : undefined}
              onClick={tappable ? () => setSelectedMember(m) : undefined}
              onKeyDown={tappable ? (e) => e.key === "Enter" && setSelectedMember(m) : undefined}
              className={`flex w-full items-center gap-3 rounded-card border border-border bg-card px-3 py-2.5 ${
                tappable ? "cursor-pointer transition-colors hover:bg-surface" : ""
              }`}
            >
              {avatarUrl(m.profile_avatar_path) ? (
                <Image
                  src={avatarUrl(m.profile_avatar_path)!}
                  alt={m.profile_display_name ?? ""}
                  width={40}
                  height={40}
                  className="border-border size-10 shrink-0 rounded-full border object-cover"
                />
              ) : (
                <div className="bg-primary/10 border-border/50 flex size-10 shrink-0 items-center justify-center rounded-full border">
                  <span className="text-primary text-sm font-bold">
                    {(m.profile_display_name?.[0] ?? "?").toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <p className="text-foreground truncate text-sm font-medium">
                  {m.profile_display_name ?? t("anonymous")}
                </p>
                {m.profile_handle && (
                  <p className="text-muted-foreground truncate text-xs">
                    @{m.profile_handle}
                  </p>
                )}
              </div>
              <span className="bg-muted text-muted-foreground shrink-0 rounded-badge px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                {t(roleKey)}
              </span>
              {tappable && (
                <svg className="size-4 shrink-0 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      <MemberActionModal
        member={selectedMember}
        open={selectedMember !== null}
        onOpenChange={(open) => { if (!open) setSelectedMember(null); }}
      />
    </>
  );
}
