"use client";

/**
 * App sidebar: desktop (collapsible) + mobile drawer.
 * Must remain a client component: uses useState (collapsed), usePathname (active nav),
 * Framer Motion (animate/AnimatePresence), and callback props (onLogout, onPersonClick, etc.).
 * Child sections (People, Groups, Footer) are also client for hooks/interactivity.
 */

import { useState } from "react";

import { useUnreadCounts } from "@/app/_libs/hooks/useUnreadCounts";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

import { useTranslations } from "next-intl";

import { BrandArch, BrandCircle, BrandConcentricArch } from "@/components/brand";
import { CloseIcon } from "@/components/icons";

import { SidebarProvider } from "./sidebar-context";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarGroupsSection } from "./sidebar-groups-section";
import { SidebarPeopleSection } from "./sidebar-people-section";

const springSnappy = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

const springGentle = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
};

const NAV_ITEMS = [
  { href: "/home", labelKey: "home" as const, Icon: BrandArch, iconSize: 14, disabled: false },
  { href: "/profile", labelKey: "profile" as const, Icon: BrandCircle, iconSize: 12, disabled: false },
] as const;

interface AppSidebarProps {
  userEmail?: string;
  userName?: string;
  userId?: string | null;
  onLogout?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onPersonClick?: (handle: string) => void;
  onGroupChatClick?: (groupName: string) => void;
  activeChatHandle?: string | null;
}

export function AppSidebar({
  userEmail,
  userName,
  userId = null,
  onLogout,
  mobileOpen = false,
  onMobileClose,
  onPersonClick,
  onGroupChatClick: _onGroupChatClick,
  activeChatHandle,
}: AppSidebarProps) {
  const t = useTranslations("sidebar");
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { counts: unreadCounts, markRead } = useUnreadCounts(userId);

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(href);
  }

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
            {NAV_ITEMS.map(({ href, labelKey, Icon, iconSize, disabled }) => {
              const label = t(labelKey);
              const active = isActive(href);
              const itemClass = `w-full flex items-center gap-2.5 px-3 py-2 text-left ${
                disabled ? "cursor-default opacity-40" : "transition-colors hover:bg-ink/4"
              } ${active ? "bg-ink/8" : ""}`;

              const content = collapsed ? (
                <Icon s={iconSize} c={active ? "#1A1A1A" : "rgba(26,26,26,0.35)"} />
              ) : (
                <>
                  <Icon s={iconSize} c={active ? "#1A1A1A" : "rgba(26,26,26,0.35)"} />
                  <span
                    className={`font-sans text-xs ${
                      active ? "text-ink font-bold" : "text-ink/55 font-semibold"
                    }`}>
                    {label}
                  </span>
                </>
              );

              return disabled ? (
                <div key={href} className={`${itemClass} rounded-badge`}>
                  {content}
                </div>
              ) : (
                <Link
                  key={href}
                  href={href as never}
                  title={label}
                  className={`${itemClass} rounded-badge`}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-ink/6 mx-3 mb-3 border-t" />

        {/* Scrollable middle section */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarPeopleSection
            collapsed={collapsed}
            currentUserId={userId}
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

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="bg-ink/40 fixed inset-0 z-40 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: springGentle }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />

            {/* Drawer panel */}
            <motion.div
              className="fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-white sm:hidden"
              style={{
                width: 280,
                borderRight: "1.5px solid rgba(26,26,26,0.08)",
              }}
              initial={{ x: -280 }}
              animate={{ x: 0, transition: springGentle }}
              exit={{ x: -280, transition: springGentle }}>
              {/* Header */}
              <div className="flex shrink-0 items-center gap-2 px-4 py-5">
                <div className="ml-1 shrink-0">
                  <BrandConcentricArch s={20} className="text-ink" />
                </div>
                <span className="text-ink flex-1 truncate font-sans text-lg font-black">
                  Kurate
                </span>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="hover:bg-ink/6 cursor-pointer rounded p-1.5 transition-colors"
                  title={t("close")}>
                  <CloseIcon className="size-3.5 text-ink/40" />
                </button>
              </div>

              {/* Nav */}
              <div className="mb-3 shrink-0 px-3">
                <div className="space-y-0.5">
                  {NAV_ITEMS.map(({ href, labelKey, Icon, iconSize, disabled }) => {
                    const label = t(labelKey);
                    const active = isActive(href);
                    const itemClass = `w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${
                      disabled ? "cursor-default opacity-40" : "transition-colors hover:bg-ink/4"
                    } ${active ? "bg-ink/8" : ""}`;

                    return disabled ? (
                      <div key={href} className={`${itemClass} rounded-badge`}>
                        <Icon s={iconSize} c="rgba(26,26,26,0.35)" />
                        <span className="text-ink/55 font-sans text-sm font-semibold">{label}</span>
                      </div>
                    ) : (
                      <Link
                        key={href}
                        href={href as never}
                        className={`${itemClass} rounded-badge`}
                        onClick={onMobileClose}>
                        <Icon s={iconSize} c={active ? "#1A1A1A" : "rgba(26,26,26,0.35)"} />
                        <span
                          className={`font-sans text-sm ${active ? "text-ink font-bold" : "text-ink/55 font-semibold"}`}>
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="border-ink/6 mx-4 mb-3 shrink-0 border-t" />

              {/* Scrollable content */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SidebarPeopleSection
                  onItemClick={onMobileClose}
                  currentUserId={userId}
                  unreadCounts={unreadCounts}
                  markRead={markRead}
                />
                <SidebarGroupsSection
                  onItemClick={onMobileClose}
                  unreadCounts={unreadCounts}
                  markRead={markRead}
                />
              </div>

              {/* Footer */}
              <SidebarFooter
                userName={userName}
                userEmail={userEmail}
                onLogout={onLogout}
                className="shrink-0 px-5 py-4"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SidebarProvider>
  );
}
