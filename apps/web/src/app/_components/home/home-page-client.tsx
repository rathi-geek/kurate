"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { HomeTab } from "@kurate/types";
import { motion } from "framer-motion";

import { DiscoveringTabView } from "@/app/_components/home/discovering-tab-view";
import { HomeTabHeader } from "@/app/_components/home/home-tab-header";
import { VaultTabView } from "@/app/_components/home/vault-tab-view";
import { MediaPlayerProvider } from "@/app/_libs/context/MediaPlayerContext";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useSidebarOverrides } from "@/app/_libs/sidebar-overrides-context";
import { ThreadProvider, useThread } from "@/app/_libs/threadContext";
import { track } from "@/app/_libs/utils/analytics";
import { springGentle } from "@/app/_libs/utils/motion";

export function HomePageClient() {
  return (
    <ThreadProvider>
      {/* useSearchParams requires Suspense in App Router */}
      <Suspense fallback={null}>
        <HomePageInner />
      </Suspense>
    </ThreadProvider>
  );
}

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useSafeReducedMotion();

  const { activeThreadId, isFullScreen, closeThread, openPerson } = useThread();

  // Initialise tab from URL — fallback to DISCOVERING for unknown values
  const tabFromUrl = searchParams.get("tab");
  const initialTab = tabFromUrl === HomeTab.DISCOVERING ? HomeTab.DISCOVERING : HomeTab.VAULT;
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab);
  const lastTrackedTabRef = useRef<HomeTab | null>(null);

  const [isScrolledDown, setIsScrolledDown] = useState(false);

  const sidebarOverrides = useMemo(
    () => ({
      onPersonClick: (handle: string) => openPerson(handle),
      onGroupChatClick: () => {},
    }),
    [openPerson],
  );
  useSidebarOverrides(sidebarOverrides);

  function handleTabChange(tab: HomeTab) {
    setActiveTab(tab);
    setIsScrolledDown(false);
    router.replace(`?tab=${tab}`);
  }

  useEffect(() => {
    if (lastTrackedTabRef.current === activeTab) return;
    lastTrackedTabRef.current = activeTab;
    track(activeTab === HomeTab.VAULT ? "vault_view" : "discover_view");
  }, [activeTab]);

  function handleScrollDirectionChange(dir: "up" | "down") {
    setIsScrolledDown(dir === "down");
  }

  return (
    <MediaPlayerProvider>
      <div
        role="button"
        tabIndex={0}
        onClick={() => activeThreadId && closeThread()}
        onKeyDown={(e) => {
          if (activeThreadId && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            closeThread();
          }
        }}
        className={`m mx-auto flex h-full max-w-7xl flex-col overflow-hidden ${isFullScreen && activeThreadId ? "hidden" : ""}`}>
        {/* Top tab bar — slides up on scroll down */}
        <motion.div
          className="bg-background overflow-hidden"
          animate={prefersReducedMotion ? undefined : { height: isScrolledDown ? 0 : "auto" }}
          transition={springGentle}>
          <HomeTabHeader activeTab={activeTab} onChange={handleTabChange} />
        </motion.div>

        {/* Tab panels — both mounted, CSS-hidden when inactive */}
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeTab !== HomeTab.VAULT ? "hidden" : ""}`}
          aria-hidden={activeTab !== HomeTab.VAULT}>
          <VaultTabView
            onNavigateToDiscover={() => handleTabChange(HomeTab.DISCOVERING)}
            onScrollDirectionChange={handleScrollDirectionChange}
          />
        </div>
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeTab !== HomeTab.DISCOVERING ? "hidden" : ""}`}
          aria-hidden={activeTab !== HomeTab.DISCOVERING}>
          <DiscoveringTabView onScrollDirectionChange={handleScrollDirectionChange} />
        </div>
      </div>
    </MediaPlayerProvider>
  );
}
