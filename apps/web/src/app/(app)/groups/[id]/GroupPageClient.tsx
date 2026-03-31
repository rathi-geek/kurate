"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import type { GroupRole } from "@kurate/types";

import { FeedHeader } from "@/app/_components/groups/feed-header";
import { FeedTabView } from "@/app/_components/groups/feed-tab-view";
import { LibraryView } from "@/app/_components/groups/library-view";
import { track } from "@/app/_libs/utils/analytics";
import { useSidebarContextOptional } from "@/app/_components/sidebar/sidebar-context";
import { useGroupDetail, useGroupRole } from "@/app/_libs/hooks/useGroupDetail";
import { createClient } from "@/app/_libs/supabase/client";

import { GroupInfoPage } from "@/app/_components/groups/group-info-page";

export enum GroupView {
  Feed = "feed",
  Library = "library",
  Info = "info",
}

interface GroupPageClientProps {
  groupId: string;
  currentUserId: string;
}

function GroupPageInner({ groupId, currentUserId }: GroupPageClientProps) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<GroupView>(() => {
    const v = searchParams.get("view");
    if (v === "info") return GroupView.Info;
    if (searchParams.get("invite") === "1") return GroupView.Info;
    return GroupView.Feed;
  });
  const sidebarCtx = useSidebarContextOptional();

  useEffect(() => {
    const v = searchParams.get("view");
    const invite = searchParams.get("invite");
    if (v === "info" || invite === "1") {
      setView(GroupView.Info);
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      url.searchParams.delete("invite");
      window.history.replaceState(null, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();
  const { data: group, isLoading, isPlaceholderData } = useGroupDetail(groupId);
  const { data: userRole = "member" } = useGroupRole(groupId, currentUserId);

  // Group not found after fetch (navigated to stale/deleted URL) — redirect
  useEffect(() => {
    if (!isLoading && !isPlaceholderData && !group) {
      router.replace("/home");
    }
  }, [isLoading, isPlaceholderData, group, router]);

  // Real-time: redirect immediately if current user's membership is deleted
  // (group deleted by owner, or user kicked) while they're viewing the page
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`my-membership-${groupId}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "conversation_members", filter: `convo_id=eq.${groupId}` },
        (payload) => {
          if (payload.old?.user_id === currentUserId) {
            router.replace("/home");
          }
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [groupId, currentUserId, router]);

  useEffect(() => {
    if (!group?.id) return;
    void sidebarCtx?.markRead?.(group.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id]);

  useEffect(() => {
    if (!group?.id || view === GroupView.Info) return;
    track(view === GroupView.Feed ? "group_feed_view" : "group_library_view", { group_id: group.id, view });
  }, [view, group?.id]);

  if (!group) return null;

  return (
    <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden">
      {view === GroupView.Info ? (
        <GroupInfoPage
          group={group}
          groupId={groupId}
          currentUserId={currentUserId}
          userRole={userRole as GroupRole}
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
            <FeedTabView groupId={group.id} currentUserId={currentUserId} userRole={userRole as GroupRole} />
          ) : (
            <LibraryView groupId={group.id} currentUserId={currentUserId} userRole={userRole as GroupRole} />
          )}
        </>
      )}
    </div>
  );
}

export function GroupPageClient({ groupId, currentUserId }: GroupPageClientProps) {
  return (
    <Suspense fallback={null}>
      <GroupPageInner groupId={groupId} currentUserId={currentUserId} />
    </Suspense>
  );
}
