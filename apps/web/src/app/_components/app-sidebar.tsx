"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrandStar,
  BrandArch,
  BrandConcentricArch,
  BrandCircle,
  Arrow,
} from "@/components/brand";
import { MOCK_CONTACTS, MOCK_GROUPS } from "@/app/_libs/contacts";

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
  { href: "/chat", label: "Home", Icon: BrandArch, iconSize: 14, disabled: false },
  { href: "/profile", label: "Profile", Icon: BrandCircle, iconSize: 12, disabled: false },
] as const;

interface AppSidebarProps {
  userEmail?: string;
  onLogout?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onPersonClick?: (handle: string) => void;
  onGroupChatClick?: (groupName: string) => void;
  activeChatHandle?: string | null;
}

export function AppSidebar({
  userEmail,
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
    if (href === "/chat") return pathname === "/chat" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <motion.div
        animate={{ width: collapsed ? 60 : 220 }}
        transition={springSnappy}
        className="shrink-0 bg-white border-r border-ink/8 hidden sm:flex flex-col h-full overflow-hidden"
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center gap-2 px-3 py-5 min-w-0">
          <div className="shrink-0 ml-1">
            <BrandConcentricArch s={20} c="#1A1A1A" />
          </div>
          {!collapsed && (
            <span className="font-sans font-black text-[18px] text-ink flex-1 truncate">
              Kurate
            </span>
          )}
          <motion.button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 p-1.5 rounded hover:bg-ink/6 transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={springSnappy}
              width={12}
              height={12}
              viewBox="0 0 12 12"
              fill="none"
            >
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
        <div className={collapsed ? "px-2 mb-3" : "px-3 mb-3"}>
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
                    className={`font-sans text-[12px] ${
                      active ? "font-bold text-ink" : "font-semibold text-ink/55"
                    }`}
                  >
                    {label}
                  </span>
                </>
              );

              return disabled ? (
                <div key={href} className={itemClass} style={{ borderRadius: 6 }}>
                  {content}
                </div>
              ) : (
                <Link key={href} href={href as never} title={label} className={itemClass} style={{ borderRadius: 6 }}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-ink/6 mb-3" />

        {/* Scrollable middle section */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* People */}
          <div className={collapsed ? "px-2 mt-4" : "px-3 mt-5"}>
            {!collapsed && (
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/25 px-3 mb-2">
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
                    className={`w-full flex items-center justify-center py-1.5 transition-colors cursor-pointer rounded-md ${
                      isActivePerson ? "bg-teal/10" : "hover:bg-ink/4"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className="w-[26px] h-[26px] bg-ink text-cream flex items-center justify-center font-sans text-[10px] font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        {p.name[0]}
                      </div>
                      {p.online && (
                        <div
                          className="absolute -bottom-px -right-px w-[7px] h-[7px] bg-teal border-2 border-white"
                          style={{ borderRadius: "50%" }}
                        />
                      )}
                    </div>
                  </button>
                ) : (
                  <button
                    key={p.handle}
                    onClick={() => onPersonClick?.(p.handle)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer text-left ${
                      isActivePerson ? "bg-teal/10" : "hover:bg-ink/4"
                    }`}
                    style={{ borderRadius: 6 }}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-[26px] h-[26px] bg-ink text-cream flex items-center justify-center font-sans text-[10px] font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        {p.name[0]}
                      </div>
                      {p.online && (
                        <div
                          className="absolute -bottom-px -right-px w-[7px] h-[7px] bg-teal border-2 border-white"
                          style={{ borderRadius: "50%" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-sans text-[12px] font-bold text-ink">
                        {p.name}
                      </div>
                      <div className="font-mono text-[9px] text-ink/35">
                        {p.handle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Groups */}
          <div className={collapsed ? "px-2 mt-4" : "px-3 mt-5"}>
            {!collapsed && (
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/25 px-3 mb-2">
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
                    className="w-full flex items-center justify-center py-1.5 hover:bg-ink/4 transition-colors cursor-pointer rounded-md"
                  >
                    <div
                      className="w-7 h-7 flex items-center justify-center"
                      style={{ borderRadius: 8, backgroundColor: `${g.color}20` }}
                    >
                      <BrandStar s={10} c={g.color} />
                    </div>
                  </button>
                ) : (
                  <div
                    key={g.name}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ink/4 transition-colors cursor-pointer text-left group/grp"
                    style={{ borderRadius: 6 }}
                  >
                    <Link
                      href={`/groups/${g.slug}` as never}
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <div
                        className="w-7 h-7 shrink-0 flex items-center justify-center"
                        style={{ borderRadius: 8, backgroundColor: `${g.color}20` }}
                      >
                        <BrandStar s={10} c={g.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-sans text-[12px] font-bold text-ink truncate">
                          {g.name}
                        </div>
                        <div className="font-mono text-[9px] text-ink/35">
                          {g.members} members
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => onGroupChatClick?.(g.name)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center opacity-0 group-hover/grp:opacity-100 hover:bg-ink/8 transition-all cursor-pointer"
                      style={{ borderRadius: "50%" }}
                      title={`Chat in ${g.name}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" opacity={0.4}>
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t border-ink/6 ${collapsed ? "px-2 py-3 space-y-1" : "px-3 py-4"}`}>
          {!collapsed && userEmail && (
            <div className="font-mono text-[10px] text-ink/30 truncate mb-2">
              {userEmail}
            </div>
          )}
          <button
            onClick={onLogout}
            className={`flex items-center cursor-pointer hover:bg-ink/4 transition-colors ${
              collapsed ? "justify-center p-2 w-full" : "gap-1.5 px-3 py-1.5"
            }`}
            style={{ borderRadius: 6 }}
            title={collapsed ? "Log out" : undefined}
          >
            <Arrow s={12} d="r" />
            {!collapsed && (
              <span className="font-sans text-[11px] font-semibold text-ink/40 hover:text-ink/60">
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
              className="sm:hidden fixed inset-0 z-40 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: springGentle }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />

            {/* Drawer panel */}
            <motion.div
              className="sm:hidden fixed inset-y-0 left-0 z-50 bg-white flex flex-col overflow-hidden"
              style={{
                width: 280,
                borderRight: "1.5px solid rgba(26,26,26,0.08)",
              }}
              initial={{ x: -280 }}
              animate={{ x: 0, transition: springGentle }}
              exit={{ x: -280, transition: springGentle }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-5 shrink-0">
                <div className="shrink-0 ml-1">
                  <BrandConcentricArch s={20} c="#1A1A1A" />
                </div>
                <span className="font-sans font-black text-[18px] text-ink flex-1 truncate">
                  Kurate
                </span>
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded hover:bg-ink/6 transition-colors cursor-pointer"
                  title="Close"
                >
                  <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="#1A1A1A" strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
                  </svg>
                </button>
              </div>

              {/* Nav */}
              <div className="px-3 mb-3 shrink-0">
                <div className="space-y-0.5">
                  {NAV_ITEMS.map(({ href, label, Icon, iconSize, disabled }) => {
                    const active = isActive(href);
                    const itemClass = `w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${
                      disabled ? "cursor-default opacity-40" : "transition-colors hover:bg-ink/4"
                    } ${active ? "bg-ink/8" : ""}`;

                    return disabled ? (
                      <div key={href} className={itemClass} style={{ borderRadius: 6 }}>
                        <Icon s={iconSize} c="rgba(26,26,26,0.35)" />
                        <span className="font-sans text-[13px] font-semibold text-ink/55">{label}</span>
                      </div>
                    ) : (
                      <Link key={href} href={href as never} className={itemClass} style={{ borderRadius: 6 }} onClick={onMobileClose}>
                        <Icon s={iconSize} c={active ? "#1A1A1A" : "rgba(26,26,26,0.35)"} />
                        <span className={`font-sans text-[13px] ${active ? "font-bold text-ink" : "font-semibold text-ink/55"}`}>
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mx-4 border-t border-ink/6 mb-3 shrink-0" />

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* People */}
                <div className="px-3 mt-5">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/25 px-3 mb-2">
                    People
                  </p>
                  <div className="space-y-0.5">
                    {MOCK_CONTACTS.map((p) => (
                      <button
                        key={p.handle}
                        onClick={() => { onPersonClick?.(p.handle); onMobileClose?.(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-ink/4 transition-colors cursor-pointer text-left"
                        style={{ borderRadius: 6 }}
                      >
                        <div className="relative shrink-0">
                          <div
                            className="w-[30px] h-[30px] bg-ink text-cream flex items-center justify-center font-sans text-[11px] font-bold"
                            style={{ borderRadius: "50%" }}
                          >
                            {p.name[0]}
                          </div>
                          {p.online && (
                            <div
                              className="absolute -bottom-px -right-px w-[8px] h-[8px] bg-teal border-2 border-white"
                              style={{ borderRadius: "50%" }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-[13px] font-bold text-ink">{p.name}</div>
                          <div className="font-mono text-[10px] text-ink/35">{p.handle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Groups */}
                <div className="px-3 mt-5">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/25 px-3 mb-2">
                    Groups
                  </p>
                  <div className="space-y-0.5">
                    {MOCK_GROUPS.map((g) => (
                      <Link
                        key={g.name}
                        href={`/groups/${g.slug}` as never}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-ink/4 transition-colors cursor-pointer text-left"
                        style={{ borderRadius: 6 }}
                        onClick={onMobileClose}
                      >
                        <div
                          className="w-8 h-8 shrink-0 flex items-center justify-center"
                          style={{ borderRadius: 8, backgroundColor: `${g.color}20` }}
                        >
                          <BrandStar s={12} c={g.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-[13px] font-bold text-ink truncate">{g.name}</div>
                          <div className="font-mono text-[10px] text-ink/35">{g.members} members</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-ink/6 px-5 py-4 shrink-0">
                {userEmail && (
                  <div className="font-mono text-[10px] text-ink/30 truncate mb-2">{userEmail}</div>
                )}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-ink/4 transition-colors"
                  style={{ borderRadius: 6 }}
                >
                  <Arrow s={12} d="r" />
                  <span className="font-sans text-[11px] font-semibold text-ink/40">Log out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
