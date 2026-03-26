"use client";

/**
 * App sidebar: desktop (collapsible) only.
 * Mobile navigation is handled by MobileBottomTab.
 * All realtime hooks are owned by AppShell and passed as props.
 */

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";

import { useTranslations } from "@/i18n/use-translations";

import type { DMConversation } from "@kurate/types";
import type { Notification } from "@/app/_libs/hooks/useNotifications";

import { BrandArch, BrandConcentricArch } from "@/components/brand";
import { BellIcon } from "@/components/icons";

import { NotificationPanel } from "@/app/_components/notifications/notification-panel";
import { UnreadBadge } from "./unread-badge";

import { SidebarProvider } from "./sidebar-context";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarGroupsSection } from "./sidebar-groups-section";
import { SidebarPeopleSection } from "./sidebar-people-section";

const springSnappy = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

interface AppSidebarProps {
  userEmail?: string;
  userName?: string;
  userId?: string | null;
  onLogout?: () => void;
  onPersonClick?: (handle: string) => void;
  onGroupChatClick?: (groupName: string) => void;
  activeChatHandle?: string | null;
  // Profile avatar
  userAvatarUrl?: string | null;
  userInitials?: string;
  // Shared hook results from AppShell
  unreadCounts?: Map<string, number>;
  markRead?: (convoId: string) => Promise<void>;
  conversations?: DMConversation[];
  notifications?: Notification[];
  notifUnreadCount?: number;
  notifIsLoading?: boolean;
  notifMarkAllRead?: () => Promise<void>;
  notifMarkRead?: (id: string) => Promise<void>;
}

export function AppSidebar({
  userEmail,
  userName,
  userId = null,
  onLogout,
  onPersonClick,
  onGroupChatClick: _onGroupChatClick,
  activeChatHandle,
  userAvatarUrl,
  userInitials = "?",
  unreadCounts = new Map(),
  markRead,
  conversations = [],
  notifications = [],
  notifUnreadCount = 0,
  notifIsLoading = false,
  notifMarkAllRead,
  notifMarkRead,
}: AppSidebarProps) {
  const t = useTranslations("sidebar");
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(href);
  }

  const homeActive = isActive("/home");
  const profileActive = isActive("/profile");

  return (
    <SidebarProvider
      activeChatHandle={activeChatHandle}
      onPersonClick={onPersonClick}
      markRead={markRead}>
      {/* Desktop sidebar */}
      <motion.div
        animate={{ width: collapsed ? 60 : 220 }}
        transition={springSnappy}
        className="border-ink/8 hidden h-full shrink-0 flex-col overflow-hidden border-r bg-white sm:flex">
        {/* Logo + collapse toggle */}
        <div className="flex min-w-0 items-center gap-2 px-3 py-5">
          <div className="ml-1 shrink-0">
            <BrandConcentricArch s={20} className="text-ink" />
          </div>
          {!collapsed && (
            <span className="text-ink flex-1 truncate font-sans text-lg font-black">Kurate</span>
          )}
          <motion.button
            onClick={() => setCollapsed((c) => !c)}
            className="hover:bg-ink/6 shrink-0 cursor-pointer rounded p-1.5 transition-colors"
            title={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
            whileTap={{ scale: 0.9 }}>
            <motion.svg
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={springSnappy}
              width={12}
              height={12}
              viewBox="0 0 12 12"
              fill="none">
              <path
                d="M7.5 9.5L4 6l3.5-3.5"
                stroke="#1A1A1A"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.4}
              />
            </motion.svg>
          </motion.button>
        </div>

        {/* Navigation */}
        <div className={collapsed ? "mb-3 px-2" : "mb-3 px-3"}>
          <div className="space-y-0.5">
            {/* Home */}
            <Link
              href="/home"
              title={t("home")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-badge transition-colors hover:bg-ink/4 ${homeActive ? "bg-ink/8" : ""}`}>
              <BrandArch s={14} c={homeActive ? "#1A1A1A" : "rgba(26,26,26,0.35)"} />
              {!collapsed && (
                <span className={`font-sans text-xs ${homeActive ? "text-ink font-bold" : "text-ink/55 font-semibold"}`}>
                  {t("home")}
                </span>
              )}
            </Link>

            {/* Profile — avatar or initials */}
            <Link
              href="/profile"
              title={t("profile")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-badge transition-colors hover:bg-ink/4 ${profileActive ? "bg-ink/8" : ""}`}>
              <div className={`relative flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-full ${profileActive ? "ring-1 ring-ink/40" : ""}`}>
                {userAvatarUrl ? (
                  <Image src={userAvatarUrl} alt={userInitials} fill className="object-cover" sizes="18px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-ink font-sans text-[8px] font-bold text-cream">
                    {userInitials}
                  </div>
                )}
              </div>
              {!collapsed && (
                <span className={`font-sans text-xs ${profileActive ? "text-ink font-bold" : "text-ink/55 font-semibold"}`}>
                  {t("profile")}
                </span>
              )}
            </Link>

            {/* Bell / Notifications */}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              title="Notifications"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-ink/4 rounded-badge">
              <div className="relative shrink-0">
                <BellIcon className="text-ink/35 size-[18px]" />
                <UnreadBadge
                  count={notifUnreadCount}
                  variant="dot"
                  className="absolute -top-0.5 -right-0.5"
                />
              </div>
              {!collapsed && (
                <span className="text-ink/55 font-sans text-xs font-semibold">
                  Notifications
                </span>
              )}
              {!collapsed && notifUnreadCount > 0 && (
                <UnreadBadge count={notifUnreadCount} variant="inline" className="ml-auto" />
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-ink/6 mx-3 mb-3 border-t" />

        {/* Scrollable middle section */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarPeopleSection
            collapsed={collapsed}
            currentUserId={userId}
            conversations={conversations}
            unreadCounts={unreadCounts}
            markRead={markRead}
          />
          <SidebarGroupsSection
            collapsed={collapsed}
            unreadCounts={unreadCounts}
            markRead={markRead}
          />
        </div>

        {/* Footer */}
        <SidebarFooter
          userName={userName}
          userEmail={userEmail}
          onLogout={onLogout}
          collapsed={collapsed}
        />
      </motion.div>

      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={notifUnreadCount}
        isLoading={notifIsLoading}
        markAllRead={notifMarkAllRead ?? (async () => {})}
        markRead={notifMarkRead ?? (async () => {})}
      />
    </SidebarProvider>
  );
}
