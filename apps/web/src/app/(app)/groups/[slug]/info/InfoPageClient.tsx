"use client";

import { Suspense, useState } from "react";

import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import type { Tables } from "@/app/_libs/types/database.types";
import type { GroupRole } from "@/app/_libs/types/groups";
import {
  GroupInfoHeader,
  type InfoModal,
} from "@/components/groups/group-info-header";
import { GroupInviteModal } from "@/components/groups/group-invite-modal";

interface InfoPageClientProps {
  group: Tables<"conversations">;
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
  const { members, isLoading: membersLoading } = useGroupMembers(
    group.id,
    currentUserId,
  );

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
