"use client";

import { useState, useEffect } from "react";

import type { Tables } from "@kurate/types";
import type { GroupRole } from "@kurate/types";
import { useSidebarContextOptional } from "@/app/_components/sidebar/sidebar-context";
import { FeedHeader } from "@/app/_components/groups/feed-header";
import { FeedTabView } from "@/app/_components/groups/feed-tab-view";
import { LibraryView } from "@/app/_components/groups/library-view";

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
