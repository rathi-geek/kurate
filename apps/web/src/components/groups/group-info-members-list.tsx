"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import type { GroupMember, GroupRole } from "@/app/_libs/types/groups";

export interface GroupInfoMembersListProps {
  members: GroupMember[];
  membersLoading: boolean;
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
}: GroupInfoMembersListProps) {
  const t = useTranslations("groups");

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
    <div className="flex w-full flex-col gap-2">
      {members.map((m) => {
        const role = (m.role ?? "member") as GroupRole;
        const roleKey = getRoleTranslationKey(role);
        return (
          <div
            key={m.id}
            className="flex w-full items-center gap-3 rounded-card border border-border bg-card px-3 py-2.5">
            {m.profile.avatar_url ? (
              <Image
                src={m.profile.avatar_url}
                alt={m.profile.display_name ?? ""}
                width={40}
                height={40}
                className="border-border size-10 shrink-0 rounded-full border object-cover"
              />
            ) : (
              <div className="bg-primary/10 border-border/50 flex size-10 shrink-0 items-center justify-center rounded-full border">
                <span className="text-primary text-sm font-bold">
                  {(m.profile.display_name?.[0] ?? "?").toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <p className="text-foreground truncate text-sm font-medium">
                {m.profile.display_name ?? t("anonymous")}
              </p>
              {m.profile.handle && (
                <p className="text-muted-foreground truncate text-xs">
                  @{m.profile.handle}
                </p>
              )}
            </div>
            <span className="bg-muted text-muted-foreground shrink-0 rounded-badge px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              {t(roleKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
