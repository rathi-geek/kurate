"use client";

import { motion } from "framer-motion";
import { springSnappy } from "@/app/_libs/utils/motion";
import type { ChatTab } from "@/app/_libs/chat-types";

interface MobileTabBarProps {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  onMenuOpen: () => void;
}

export function MobileTabBar({ activeTab, onTabChange, onMenuOpen }: MobileTabBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-14 items-stretch">
        <button
          onClick={onMenuOpen}
          className="w-14 shrink-0 flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[56px] min-w-[44px]"
          aria-label="Open menu"
          type="button"
        >
          <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
            <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
          </svg>
        </button>
        <button
          onClick={() => onTabChange("discovering")}
          className="flex-1 flex flex-col items-center justify-center gap-1 relative cursor-pointer min-h-[56px] min-w-[44px]"
          type="button"
        >
          {activeTab === "discovering" && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute top-0 left-0 right-0 h-[2px] bg-primary"
              transition={springSnappy}
            />
          )}
          <CompassIcon active={activeTab === "discovering"} />
          <span
            className={`font-sans text-xs font-semibold transition-colors ${
              activeTab === "discovering" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Discovering
          </span>
        </button>
        <button
          onClick={() => onTabChange("logging")}
          className="flex-1 flex flex-col items-center justify-center gap-1 relative cursor-pointer min-h-[56px] min-w-[44px]"
          type="button"
        >
          {activeTab === "logging" && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute top-0 left-0 right-0 h-[2px] bg-primary"
              transition={springSnappy}
            />
          )}
          <LinkIcon active={activeTab === "logging"} />
          <span
            className={`font-sans text-xs font-semibold transition-colors ${
              activeTab === "logging" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Logging
          </span>
        </button>
      </div>
    </div>
  );
}

function CompassIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      className={`transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M13.5 6.5L11 11L6.5 13.5L9 9L13.5 6.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <path d="M8.5 11.5a4.5 4.5 0 006.364 0l2-2a4.5 4.5 0 00-6.364-6.364L9.432 4.204" />
      <path d="M11.5 8.5a4.5 4.5 0 00-6.364 0l-2 2a4.5 4.5 0 006.364 6.364l1.068-1.068" />
    </svg>
  );
}
