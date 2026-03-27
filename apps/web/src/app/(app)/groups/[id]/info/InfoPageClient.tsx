"use client";

import { Suspense, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import type { Tables } from "@kurate/types";
import type { GroupRole } from "@kurate/types";

import { GroupDangerZone } from "@/app/_components/groups/group-danger-zone";
import { GroupInfoHeader, type InfoModal } from "@/app/_components/groups/group-info-header";
import { GroupInviteModal } from "@/app/_components/groups/group-invite-modal";
import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";

interface InfoPageClientProps {
  group: Tables<"conversations">;
  currentUserId: string;
  userRole: GroupRole;
  groupId: string;
  onBack?: () => void;
}

export function InfoPageClient(props: InfoPageClientProps) {
  return (
    <Suspense fallback={null}>
      <InfoPageInner {...props} />
    </Suspense>
  );
}

function InfoPageInner({ group, currentUserId, userRole, groupId, onBack }: InfoPageClientProps) {
  const { members, isLoading: membersLoading } = useGroupMembers(group.id, currentUserId);

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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="w-full flex-1 overflow-y-auto">
        <GroupInfoHeader
          group={group}
          groupId={groupId}
          userRole={userRole}
          members={members}
          membersLoading={membersLoading}
          openModal={openModal}
          setOpenModal={setOpenModal}
          onBack={onBack}
        />
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
