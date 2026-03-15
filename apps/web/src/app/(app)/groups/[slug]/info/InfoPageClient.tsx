"use client";

import { Suspense, useState } from "react";

import { useTranslations } from "next-intl";

import { useGroupFeed } from "@/app/_libs/hooks/useGroupFeed";
import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import type { Tables } from "@/app/_libs/types/database.types";
import type { GroupDrop, GroupRole } from "@/app/_libs/types/groups";
import {
  GroupInfoHeader,
  type InfoModal,
} from "@/components/groups/group-info-header";
import { GroupInviteModal } from "@/components/groups/group-invite-modal";
import { LibraryCard } from "@/components/groups/library-card";

interface InfoPageClientProps {
  group: Tables<"groups">;
  currentUserId: string;
  userRole: GroupRole;
  groupSlug: string;
}

export function InfoPageClient(props: InfoPageClientProps) {
  return (
    <Suspense fallback={null}>
      <InfoPageInner {...props} />
    </Suspense>
  );
}

function InfoPageInner({ group, currentUserId, userRole, groupSlug }: InfoPageClientProps) {
  const t = useTranslations("groups");
  const { members, isLoading: membersLoading } = useGroupMembers(
    group.id,
    currentUserId,
  );
  const {
    drops,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
  } = useGroupFeed(group.id, currentUserId);

  if (hasNextPage) fetchNextPage();

  const [openModal, setOpenModal] = useState<InfoModal>(null);
  const memberIds = new Set(members.map((m) => m.user_id));

  return (
    <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <GroupInfoHeader
          group={group}
          groupSlug={groupSlug}
          userRole={userRole}
          members={members}
          membersLoading={membersLoading}
          openModal={openModal}
          setOpenModal={setOpenModal}
        />

        {/* ── Library grid ───────────────────────────────────────── */}
        <div className="px-1 py-1">
          {feedLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-surface aspect-square animate-pulse" />
              ))}
            </div>
          ) : drops.length === 0 ? (
            <div className="text-muted-foreground py-16 text-center text-sm">
              {t("library_empty")}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-3">
              {drops.map((drop: GroupDrop) => (
                <LibraryCard
                  key={drop.id}
                  drop={drop}
                  currentUserId={currentUserId}
                  groupId={group.id}
                  groupSlug={groupSlug}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <GroupInviteModal
        open={openModal === "invite"}
        onOpenChange={(o) => !o && setOpenModal(null)}
        groupId={group.id}
        inviteCode={group.invite_code ?? ""}
        memberIds={memberIds}
        currentUserId={currentUserId}
      />
    </div>
  );
}
