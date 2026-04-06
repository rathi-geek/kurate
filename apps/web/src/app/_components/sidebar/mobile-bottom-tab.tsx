"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuMessageCircle, LuUsers } from "react-icons/lu";

import { BrandArch } from "@/components/brand";
import { BellIcon } from "@/components/icons";
import { UnreadBadge } from "@/app/_components/sidebar/unread-badge";

import { AvatarSkeleton } from "./AvatarSkeleton";

interface MobileBottomTabProps {
  loading?: boolean;
  userId: string | null;
  userAvatarUrl: string | null;
  userInitials: string;
  unreadCounts: Map<string, number>;
  notifUnreadCount: number;
  groupIds?: Set<string>;
  activePanel: "people" | "groups" | null;
  onTabClick: (tab: "people" | "groups") => void;
}

export function MobileBottomTab({
  loading = false,
  userAvatarUrl,
  userInitials,
  unreadCounts,
  notifUnreadCount,
  groupIds,
  activePanel,
  onTabClick,
}: MobileBottomTabProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(href);
  }

  const peopleActive = activePanel === "people" || (!activePanel && isActive("/people"));
  const groupsActive = activePanel === "groups" || (!activePanel && isActive("/groups"));

  const iconActive = "#1A1A1A";
  const iconInactive = "rgba(26,26,26,0.35)";

  const tabClass =
    "flex flex-1 flex-col items-center justify-center py-2 transition-colors active:bg-ink/4";

  const hasDMUnread = Array.from(unreadCounts.values()).some((c) => c > 0);
  const hasGroupUnread = groupIds
    ? Array.from(groupIds).some((id) => (unreadCounts.get(id) ?? 0) > 0)
    : false;
  const profileActive = isActive("/profile");

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-ink/8 bg-white sm:hidden">
      {/* 1. Home */}
      <Link href="/home" className={tabClass}>
        <BrandArch s={16} c={isActive("/home") ? iconActive : iconInactive} />
      </Link>

      {/* 2. Notifications */}
      <Link href="/notifications" className={tabClass}>
        <div className="relative">
          <BellIcon
            className={`size-[18px] ${isActive("/notifications") || notifUnreadCount > 0 ? "text-ink" : "text-ink/35"}`}
          />
          <UnreadBadge
            count={notifUnreadCount}
            variant="dot"
            className="absolute -top-0.5 -right-0.5"
          />
        </div>
      </Link>

      {/* 3. People */}
      <button type="button" onClick={() => onTabClick("people")} className={tabClass}>
        <div className="relative">
          <LuMessageCircle size={18} color={peopleActive ? iconActive : iconInactive} />
          {hasDMUnread && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
      </button>

      {/* 4. Groups */}
      <button type="button" onClick={() => onTabClick("groups")} className={tabClass}>
        <div className="relative">
          <LuUsers size={18} color={groupsActive ? iconActive : iconInactive} />
          {hasGroupUnread && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
      </button>

      {/* 5. Profile — avatar or initials */}
      <Link href="/profile" className={tabClass}>
        <div className={`relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ${profileActive ? "ring-2 ring-ink/40" : ""}`}>
          {loading && !userAvatarUrl ? (
            <AvatarSkeleton size={24} />
          ) : userAvatarUrl ? (
            <Image src={userAvatarUrl} alt={userInitials} fill className="object-cover" sizes="24px" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center rounded-full font-sans text-[9px] font-bold ${profileActive ? "bg-ink text-cream" : "bg-ink/20 text-ink/60"}`}>
              {userInitials}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
