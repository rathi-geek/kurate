"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/app/_components/sidebar";
import { MobileBottomTab } from "@/app/_components/sidebar/mobile-bottom-tab";
import { ROUTES } from "@kurate/utils";
import { useAuth } from "@/app/_libs/auth-context";
import { useUnreadCounts } from "@/app/_libs/hooks/useUnreadCounts";
import { useNotifications } from "@/app/_libs/hooks/useNotifications";
import { useDMConversations } from "@/app/_libs/hooks/useDMConversations";
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

  // Single instances — passed as props to avoid duplicate Supabase subscriptions
  const { counts: unreadCounts, markRead } = useUnreadCounts(userId);
  const { conversations } = useDMConversations(userId);
  const notif = useNotifications(userId);

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
      />
    </SidebarOverridesProvider>
  );
}
