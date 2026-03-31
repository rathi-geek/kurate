"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppSidebar } from "@/app/_components/sidebar";
import { MobileBottomTab } from "@/app/_components/sidebar/mobile-bottom-tab";
import { ROUTES } from "@kurate/utils";
import { queryKeys } from "@kurate/query";
import { useAuth } from "@/app/_libs/auth-context";
import { useUnreadCounts } from "@/app/_libs/hooks/useUnreadCounts";
import { useNotifications } from "@/app/_libs/hooks/useNotifications";
import { useDMConversations } from "@/app/_libs/hooks/useDMConversations";
import { fetchUserGroups } from "@/app/_libs/utils/fetchUserGroups";
import { fetchGroupFeedPage } from "@/app/_libs/hooks/useGroupFeed";
import { fetchGroupDetail } from "@/app/_libs/utils/fetchGroupDetail";
import { fetchMessages } from "@/app/_libs/hooks/useMessages";
import {
  SidebarOverridesProvider,
  type SidebarOverrides,
} from "@/app/_libs/sidebar-overrides-context";
import { createClient } from "@/app/_libs/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [sidebarOverrides, setSidebarOverrides] = useState<SidebarOverrides>({});

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
        queryFn: ({ pageParam }) =>
          fetchGroupFeedPage(g.id, userId, pageParam as string | null),
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
        queryFn: ({ pageParam }) =>
          fetchMessages(c.id, pageParam as string | undefined),
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
        { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${userId}` },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
          // On DELETE (member removed / group deleted), also drop the detail cache
          if (payload.eventType === "DELETE" && payload.old?.convo_id) {
            queryClient.removeQueries({ queryKey: queryKeys.groups.detail(payload.old.convo_id as string) });
          }
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.AUTH.LOGIN);
  }, [router]);

  return (
    <SidebarOverridesProvider setOverrides={setSidebarOverrides}>
      <div className="bg-background flex h-screen">
        <AppSidebar
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
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-16 sm:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomTab
        userId={userId}
        userAvatarUrl={userAvatarUrl}
        userInitials={userInitials}
        unreadCounts={unreadCounts}
        notifUnreadCount={notif.unreadCount}
        groupIds={groupIds}
      />
    </SidebarOverridesProvider>
  );
}
