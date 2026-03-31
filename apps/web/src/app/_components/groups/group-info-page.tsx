"use client";

import { Suspense, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import type { GroupRole, Tables } from "@kurate/types";

import { GroupDangerZone } from "@/app/_components/groups/group-danger-zone";
import { GroupInfoHeader, type InfoModal } from "@/app/_components/groups/group-info-header";
import { GroupInviteModal } from "@/app/_components/groups/group-invite-modal";
import { PendingGroupInvitesSection } from "@/app/_components/groups/pending-group-invites-section";
import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import { useGroupInvites } from "@/app/_libs/hooks/useGroupInvites";

interface GroupInfoPageProps {
  group: Tables<"conversations">;
  currentUserId: string;
  userRole: GroupRole;
  groupId: string;
  onBack?: () => void;
}

export function GroupInfoPage(props: GroupInfoPageProps) {
  return (
    <Suspense fallback={null}>
      <GroupInfoPageInner {...props} />
    </Suspense>
  );
}

function GroupInfoPageInner({ group, currentUserId, userRole, groupId, onBack }: GroupInfoPageProps) {
  const { members, isLoading: membersLoading } = useGroupMembers(group.id, currentUserId);
  const { invites, removeInvite } = useGroupInvites(group.id);

  const searchParams = useSearchParams();
  const [openModal, setOpenModal] = useState<InfoModal>(() =>
    searchParams.get("invite") === "1" ? "invite" : null,
  );

  useEffect(() => {
    if (searchParams.get("invite") === "1") {
      setOpenModal("invite");
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams]);

  const memberIds = new Set(members.map((m) => m.user_id));
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="w-full flex-1 overflow-y-auto">
        <GroupInfoHeader
          group={group}
          groupId={groupId}
          userRole={userRole}
          currentUserId={currentUserId}
          members={members}
          membersLoading={membersLoading}
          openModal={openModal}
          setOpenModal={setOpenModal}
          onBack={onBack}
        />

        {isOwnerOrAdmin && (
          <PendingGroupInvitesSection
            groupId={group.id}
            invites={invites}
            onRemoveInvite={removeInvite}
          />
        )}
      </div>

      <GroupDangerZone
        group={group}
        currentUserId={currentUserId}
        userRole={userRole}
        members={members}
      />

      <GroupInviteModal
        open={openModal === "invite"}
        onOpenChange={(o) => !o && setOpenModal(null)}
        groupId={group.id}
        memberIds={memberIds}
        currentUserId={currentUserId}
      />
    </div>
  );
}
