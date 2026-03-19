"use client";

import { useState, useEffect } from "react";

import type { Tables } from "@/app/_libs/types/database.types";
import type { GroupRole } from "@/app/_libs/types/groups";
import { useSidebarContextOptional } from "@/app/_components/sidebar/sidebar-context";
import { FeedHeader } from "@/components/groups/feed-header";
import { FeedTabView } from "@/components/groups/feed-tab-view";
import { LibraryView } from "@/components/groups/library-view";

interface GroupPageClientProps {
  group: Tables<"conversations">;
  currentUserId: string;
  userRole: GroupRole;
  groupId: string;
}

export function GroupPageClient({
  group,
  currentUserId,
  userRole,
  groupId,
}: GroupPageClientProps) {
  const [view, setView] = useState<"feed" | "library">("feed");
  const sidebarCtx = useSidebarContextOptional();

  useEffect(() => {
    void sidebarCtx?.markRead?.(group.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden">
      <FeedHeader
        group={group}
        groupId={groupId}
        currentUserId={currentUserId}
        view={view}
        onToggleLibrary={() => setView((v) => (v === "feed" ? "library" : "feed"))}
      />
      {view === "feed" ? (
        <FeedTabView groupId={group.id} currentUserId={currentUserId} userRole={userRole} />
      ) : (
        <LibraryView
          groupId={group.id}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      )}
    </div>
  );
}
