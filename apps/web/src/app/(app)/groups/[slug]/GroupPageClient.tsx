"use client";

import type { Tables } from "@/app/_libs/types/database.types";
import type { GroupRole } from "@/app/_libs/types/groups";
import { FeedHeader } from "@/components/groups/feed-header";
import { FeedTabView } from "@/components/groups/feed-tab-view";

interface GroupPageClientProps {
  group: Tables<"conversations">;
  currentUserId: string;
  userRole: GroupRole;
  groupSlug: string;
}

export function GroupPageClient({
  group,
  currentUserId,
  userRole,
  groupSlug,
}: GroupPageClientProps) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden">
      <FeedHeader group={group} groupSlug={groupSlug} currentUserId={currentUserId} />
      <FeedTabView groupId={group.id} currentUserId={currentUserId} userRole={userRole} />
    </div>
  );
}
