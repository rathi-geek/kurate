"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

import { MOCK_CONTACTS, MOCK_GROUPS } from "@/app/_libs/contacts";
import { Arrow, BrandArch, BrandCircle, BrandConcentricArch, BrandStar } from "@/components/brand";

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
  { href: "/home", label: "Home", Icon: BrandArch, iconSize: 14, disabled: false },
  { href: "/profile", label: "Profile", Icon: BrandCircle, iconSize: 12, disabled: false },
] as const;

interface AppSidebarProps {
  userEmail?: string;
  userName?: string;
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
  onLogout,
  mobileOpen = false,
  onMobileClose,
  onPersonClick,
  onGroupChatClick,
  activeChatHandle,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
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
            <span className="text-ink flex-1 truncate font-sans text-lg font-black">
              Kurate
            </span>
          )}
          <motion.button
            onClick={() => setCollapsed((c) => !c)}
            className="hover:bg-ink/6 shrink-0 cursor-pointer rounded p-1.5 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
            {NAV_ITEMS.map(({ href, label, Icon, iconSize, disabled }) => {
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
          {/* People */}
          <div className={collapsed ? "mt-4 px-2" : "mt-5 px-3"}>
            {!collapsed && (
              <p className="text-ink/25 mb-2 px-3 font-mono text-xs font-bold tracking-widest uppercase">
                People
              </p>
            )}
            <div className="space-y-0.5">
              {MOCK_CONTACTS.map((p) => {
                const isActivePerson = activeChatHandle === p.handle;
                return collapsed ? (
                  <button
                    key={p.handle}
                    title={`${p.name} ${p.handle}`}
                    onClick={() => onPersonClick?.(p.handle)}
                    className={`flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors ${
                      isActivePerson ? "bg-teal/10" : "hover:bg-ink/4"
                    }`}>
                    <div className="relative">
                      <div className="bg-ink text-cream flex h-[26px] w-[26px] items-center justify-center font-sans text-xs font-bold rounded-full">
                        {p.name[0]}
                      </div>
                      {p.online && (
                        <div className="bg-teal absolute -right-px -bottom-px h-[7px] w-[7px] border-2 border-white rounded-full"
                        />
                      )}
                    </div>
                  </button>
                ) : (
                  <button
                    key={p.handle}
                    onClick={() => onPersonClick?.(p.handle)}
                    className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors rounded-badge ${
                      isActivePerson ? "bg-teal/10" : "hover:bg-ink/4"
                    }`}>
                    <div className="relative shrink-0">
                      <div
                        className="bg-ink text-cream flex h-[26px] w-[26px] items-center justify-center font-sans text-xs font-bold rounded-full">
                        {p.name[0]}
                      </div>
                      {p.online && (
                        <div
                          className="bg-teal absolute -right-px -bottom-px h-[7px] w-[7px] border-2 border-white rounded-full"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-ink font-sans text-xs font-bold">{p.name}</div>
                      <div className="text-ink/35 font-mono text-xs">{p.handle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Groups */}
          <div className={collapsed ? "mt-4 px-2" : "mt-5 px-3"}>
            {!collapsed && (
              <p className="text-ink/25 mb-2 px-3 font-mono text-xs font-bold tracking-widest uppercase">
                Groups
              </p>
            )}
            <div className="space-y-0.5">
              {MOCK_GROUPS.map((g) =>
                collapsed ? (
                  <button
                    key={g.name}
                    title={`Chat: ${g.name}`}
                    onClick={() => onGroupChatClick?.(g.name)}
                    className="hover:bg-ink/4 flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors">
                    {/* Dynamic group color — cannot use static token */}
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${g.color}20` }}>
                      <BrandStar s={10} c={g.color} />
                    </div>
                  </button>
                ) : (
                  <div
                    key={g.name}
                    className="hover:bg-ink/4 group/grp flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors rounded-badge">
                    <Link
                      href={`/groups/${g.slug}` as never}
                      className="flex min-w-0 flex-1 items-center gap-2.5">
                      {/* Dynamic group color — cannot use static token */}
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${g.color}20` }}>
                        <BrandStar s={10} c={g.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink truncate font-sans text-xs font-bold">
                          {g.name}
                        </div>
                        <div className="text-ink/35 font-mono text-xs">{g.members} members</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => onGroupChatClick?.(g.name)}
                      className="hover:bg-ink/8 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center opacity-0 transition-all group-hover/grp:opacity-100 rounded-full"
                      title={`Chat in ${g.name}`}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#1A1A1A"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity={0.4}>
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-ink/6 border-t ${collapsed ? "space-y-1 px-2 py-3" : "px-3 py-4"}`}>
          {!collapsed && (userName || userEmail) && (
            <div className="mb-2">
              {userName && (
                <div className="text-ink/70 truncate font-sans text-xs font-semibold">{userName}</div>
              )}
              {userEmail && (
                <div className="text-ink/30 truncate font-mono text-xs">{userEmail}</div>
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            className={`hover:bg-ink/4 flex cursor-pointer items-center transition-colors rounded-badge ${
              collapsed ? "w-full justify-center p-2" : "gap-1.5 px-3 py-1.5"
            }`}
            title={collapsed ? "Log out" : undefined}>
            <Arrow s={12} d="r" />
            {!collapsed && (
              <span className="text-ink/40 hover:text-ink/60 font-sans text-xs font-semibold">
                Log out
              </span>
            )}
          </button>
        </div>
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
                  onClick={onMobileClose}
                  className="hover:bg-ink/6 cursor-pointer rounded p-1.5 transition-colors"
                  title="Close">
                  <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 3l8 8M11 3l-8 8"
                      stroke="#1A1A1A"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      opacity={0.4}
                    />
                  </svg>
                </button>
              </div>

              {/* Nav */}
              <div className="mb-3 shrink-0 px-3">
                <div className="space-y-0.5">
                  {NAV_ITEMS.map(({ href, label, Icon, iconSize, disabled }) => {
                    const active = isActive(href);
                    const itemClass = `w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${
                      disabled ? "cursor-default opacity-40" : "transition-colors hover:bg-ink/4"
                    } ${active ? "bg-ink/8" : ""}`;

                    return disabled ? (
                      <div key={href} className={`${itemClass} rounded-badge`}>
                        <Icon s={iconSize} c="rgba(26,26,26,0.35)" />
                        <span className="text-ink/55 font-sans text-sm font-semibold">
                          {label}
                        </span>
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
                {/* People */}
                <div className="mt-5 px-3">
                  <p className="text-ink/25 mb-2 px-3 font-mono text-xs font-bold tracking-widest uppercase">
                    People
                  </p>
                  <div className="space-y-0.5">
                    {MOCK_CONTACTS.map((p) => (
                      <button
                        key={p.handle}
                        onClick={() => {
                          onPersonClick?.(p.handle);
                          onMobileClose?.();
                        }}
                        className="hover:bg-ink/4 flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-badge">
                        <div className="relative shrink-0">
                          <div className="bg-ink text-cream flex h-[30px] w-[30px] items-center justify-center font-sans text-xs font-bold rounded-full">
                            {p.name[0]}
                          </div>
                          {p.online && (
                            <div
                              className="bg-teal absolute -right-px -bottom-px h-[8px] w-[8px] border-2 border-white rounded-full"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-ink font-sans text-sm font-bold">{p.name}</div>
                          <div className="text-ink/35 font-mono text-xs">{p.handle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Groups */}
                <div className="mt-5 px-3">
                  <p className="text-ink/25 mb-2 px-3 font-mono text-xs font-bold tracking-widest uppercase">
                    Groups
                  </p>
                  <div className="space-y-0.5">
                    {MOCK_GROUPS.map((g) => (
                      <Link
                        key={g.name}
                        href={`/groups/${g.slug}` as never}
                        className="hover:bg-ink/4 flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-badge"
                        onClick={onMobileClose}>
                        {/* Dynamic group color — cannot use static token */}
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${g.color}20` }}>
                          <BrandStar s={12} c={g.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-ink truncate font-sans text-sm font-bold">
                            {g.name}
                          </div>
                          <div className="text-ink/35 font-mono text-xs">
                            {g.members} members
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-ink/6 shrink-0 border-t px-5 py-4">
                {(userName || userEmail) && (
                  <div className="mb-2">
                    {userName && (
                      <div className="text-ink/70 truncate font-sans text-xs font-semibold">{userName}</div>
                    )}
                    {userEmail && (
                      <div className="text-ink/30 truncate font-mono text-xs">{userEmail}</div>
                    )}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="hover:bg-ink/4 flex cursor-pointer items-center gap-1.5 px-3 py-1.5 transition-colors rounded-badge">
                  <Arrow s={12} d="r" />
                  <span className="text-ink/40 font-sans text-xs font-semibold">Log out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
