"use client";

import { useEffect, useState } from "react";

import type { Tables } from "@kurate/types";
import type { GroupRole } from "@kurate/types";

import { FeedHeader } from "@/app/_components/groups/feed-header";
import { FeedTabView } from "@/app/_components/groups/feed-tab-view";
import { LibraryView } from "@/app/_components/groups/library-view";
import { track } from "@/app/_libs/utils/analytics";
import { useSidebarContextOptional } from "@/app/_components/sidebar/sidebar-context";

import { InfoPageClient } from "./info/InfoPageClient";

export enum GroupView {
  Feed = "feed",
  Library = "library",
  Info = "info",
}

interface GroupPageClientProps {
  group: Tables<"conversations">;
  currentUserId: string;
  userRole: GroupRole;
  groupId: string;
}

export function GroupPageClient({ group, currentUserId, userRole, groupId }: GroupPageClientProps) {
  const [view, setView] = useState<GroupView>(GroupView.Feed);
  const sidebarCtx = useSidebarContextOptional();

  useEffect(() => {
    void sidebarCtx?.markRead?.(group.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  useEffect(() => {
    if (view === GroupView.Info) return;
    track(view === GroupView.Feed ? "group_feed_view" : "group_library_view", { group_id: group.id, view });
  }, [view, group.id]);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden">
      {view === GroupView.Info ? (
        <InfoPageClient
          group={group}
          groupId={groupId}
          currentUserId={currentUserId}
          userRole={userRole}
          onBack={() => setView(GroupView.Feed)}
        />
      ) : (
        <>
          <FeedHeader
            group={group}
            groupId={groupId}
            currentUserId={currentUserId}
            view={view}
            onToggleLibrary={() =>
              setView((v) => (v === GroupView.Feed ? GroupView.Library : GroupView.Feed))
            }
            onShowInfo={() => setView(GroupView.Info)}
          />
          {view === GroupView.Feed ? (
            <FeedTabView groupId={group.id} currentUserId={currentUserId} userRole={userRole} />
          ) : (
            <LibraryView groupId={group.id} currentUserId={currentUserId} userRole={userRole} />
          )}
        </>
      )}
    </div>
  );
}
