"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { queryKeys } from "@kurate/query";
import { ROUTES } from "@kurate/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useIsMobile } from "@/hooks/use-mobile";

import { AppSidebar } from "@/app/_components/sidebar";
import { GroupsPanel } from "@/app/_components/sidebar/GroupsPanel";
import { MobileBottomTab } from "@/app/_components/sidebar/mobile-bottom-tab";
import { PeoplePanel } from "@/app/_components/sidebar/PeoplePanel";
import { useAuth } from "@/app/_libs/auth-context";
import { useDMConversations } from "@/app/_libs/hooks/useDMConversations";
import { fetchGroupFeedPage } from "@/app/_libs/hooks/useGroupFeed";
import { fetchMessages } from "@/app/_libs/hooks/useMessages";
import { useNotifications } from "@/app/_libs/hooks/useNotifications";
import { useUnreadCounts } from "@/app/_libs/hooks/useUnreadCounts";
import {
  type SidebarOverrides,
  SidebarOverridesProvider,
} from "@/app/_libs/sidebar-overrides-context";
import { createClient } from "@/app/_libs/supabase/client";
import { fetchGroupDetail } from "@/app/_libs/utils/fetchGroupDetail";
import { fetchUserGroups } from "@/app/_libs/utils/fetchUserGroups";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [sidebarOverrides, setSidebarOverrides] = useState<SidebarOverrides>({});
  const [activePanel, setActivePanel] = useState<"people" | "groups" | null>(null);

  useEffect(() => { setActivePanel(null); }, [pathname]);

  const userId = user?.id ?? null;
  const userEmail = user?.email ?? "";
  const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const userAvatarUrl = profile?.avatar_url ?? null;
  const userInitials = (
    [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join("") ||
    profile?.handle?.[0] ||
    "?"
  ).toUpperCase();

  const queryClient = useQueryClient();

  // Single instances — passed as props to avoid duplicate Supabase subscriptions
  const { conversations } = useDMConversations(userId);
  const notif = useNotifications(userId);

  // Show unread notification count in browser tab title
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = notif.unreadCount > 0 ? `(${notif.unreadCount}) ${base}` : base;
  }, [notif.unreadCount]);

  // Groups list — SidebarGroupsSection already fetches this; no extra network call
  const { data: userGroups = [] } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchUserGroups,
    staleTime: 1000 * 60,
  });
  const groupIds = useMemo(() => new Set(userGroups.map((g) => g.id)), [userGroups]);

  // useUnreadCounts must come after groupIds so group badge tracking works
  const { counts: unreadCounts, markRead } = useUnreadCounts(userId, groupIds);

  // Eager prefetch all group feeds + details on sidebar mount
  useEffect(() => {
    if (!userId || userGroups.length === 0) return;
    for (const g of userGroups) {
      void queryClient.prefetchInfiniteQuery({
        queryKey: queryKeys.groups.feed(g.id),
        queryFn: ({ pageParam }) => fetchGroupFeedPage(g.id, userId, pageParam as string | null),
        initialPageParam: null,
        staleTime: 1000 * 30,
      });
      void queryClient.prefetchQuery({
        queryKey: queryKeys.groups.detail(g.id),
        queryFn: () => fetchGroupDetail(g.id),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [userId, userGroups, queryClient]);

  // Eager prefetch top 3 DM threads on sidebar mount
  useEffect(() => {
    if (conversations.length === 0) return;
    for (const c of conversations) {
      void queryClient.prefetchInfiniteQuery({
        queryKey: queryKeys.people.messages(c.id),
        queryFn: ({ pageParam }) => fetchMessages(c.id, pageParam as string | undefined),
        initialPageParam: undefined,
        staleTime: 1000 * 60,
      });
    }
  }, [conversations, queryClient]);

  // Realtime: refresh group list when added to a new group
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("group-memberships")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
          // On DELETE (member removed / group deleted), also drop the detail cache
          if (payload.eventType === "DELETE" && payload.old?.convo_id) {
            queryClient.removeQueries({
              queryKey: queryKeys.groups.detail(payload.old.convo_id as string),
            });
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.AUTH.LOGIN);
  }, [router]);

  if (isMobile) {
    return (
      <div className="bg-background flex h-screen flex-col items-center justify-center px-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground mb-6"
          aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <h1 className="text-foreground mb-2 text-xl font-semibold">Desktop Only</h1>
        <p className="text-muted-foreground max-w-xs text-sm">
          Kurate is optimized for desktop browsers. Please visit us on a laptop or desktop computer
          for the best experience.
        </p>
      </div>
    );
  }

  return (
    <SidebarOverridesProvider setOverrides={setSidebarOverrides}>
      <div className="bg-background flex h-screen">
        <AppSidebar
          loading={loading}
          userEmail={userEmail}
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
          userAvatarUrl={userAvatarUrl}
          userInitials={userInitials}
          unreadCounts={unreadCounts}
          markRead={markRead}
          conversations={conversations}
          notifications={notif.notifications}
          notifUnreadCount={notif.unreadCount}
          notifIsLoading={notif.isLoading}
          notifMarkAllRead={notif.markAllRead}
          notifMarkRead={notif.markRead}
          {...sidebarOverrides}
        />
        <main id="main-content" className="flex-1 overflow-y-auto pb-16 sm:pb-0">
          {children}
        </main>
      </div>
      {activePanel === "people" && (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-background pb-16 sm:hidden">
          <PeoplePanel userId={userId} conversations={conversations} isLoading={false} />
        </div>
      )}
      {activePanel === "groups" && (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-background pb-16 sm:hidden">
          <GroupsPanel />
        </div>
      )}
      <MobileBottomTab
        loading={loading}
        userId={userId}
        userAvatarUrl={userAvatarUrl}
        userInitials={userInitials}
        unreadCounts={unreadCounts}
        notifUnreadCount={notif.unreadCount}
        groupIds={groupIds}
        activePanel={activePanel}
        onTabClick={(tab) => setActivePanel((p) => (p === tab ? null : tab))}
      />
    </SidebarOverridesProvider>
  );
}
