"use client";

import { Suspense, useState, useEffect } from "react";

import { useSearchParams } from "next/navigation";

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

  const searchParams = useSearchParams();
  const [openModal, setOpenModal] = useState<InfoModal>(() =>
    searchParams.get("invite") === "1" ? "invite" : null,
  );

  useEffect(() => {
    if (searchParams.get("invite") === "1") {
      setOpenModal("invite");
      // Clean the URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams]);
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
        memberIds={memberIds}
        currentUserId={currentUserId}
      />
    </div>
  );
}
