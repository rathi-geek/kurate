"use client";

import { Suspense, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { SlidingTabs } from "@/components/ui/sliding-tabs";

import { DiscoveringTabView } from "@/app/_components/home/discovering-tab-view";
import { VaultTabView } from "@/app/_components/home/vault-tab-view";
import { HomeTab } from "@/app/_libs/chat-types";
import { MediaPlayerProvider } from "@/app/_libs/context/MediaPlayerContext";
import { useSidebarOverrides } from "@/app/_libs/sidebar-overrides-context";
import { ThreadProvider, useThread } from "@/app/_libs/threadContext";
import { springGentle } from "@/app/_libs/utils/motion";

export default function HomePage() {
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
  const t = useTranslations("chat");
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const { activeThreadId, isFullScreen, closeThread, openPerson } = useThread();

  // Initialise tab from URL — fallback to DISCOVERING for unknown values
  const tabFromUrl = searchParams.get("tab");
  const initialTab = tabFromUrl === HomeTab.VAULT ? HomeTab.VAULT : HomeTab.DISCOVERING;
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab);

  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarOverrides = useMemo(
    () => ({
      mobileOpen: mobileMenuOpen,
      onMobileClose: () => setMobileMenuOpen(false),
      onPersonClick: (handle: string) => openPerson(handle),
      onGroupChatClick: () => {},
    }),
    [mobileMenuOpen, openPerson],
  );
  useSidebarOverrides(sidebarOverrides);

  function handleTabChange(tab: HomeTab) {
    setActiveTab(tab);
    setIsScrolledDown(false);
    router.replace(`?tab=${tab}`);
  }

  function handleScrollDirectionChange(dir: "up" | "down") {
    setIsScrolledDown(dir === "down");
  }

  return (
    <MediaPlayerProvider>
      <div
        onClick={() => activeThreadId && closeThread()}
        className={`flex h-full flex-col overflow-hidden ${isFullScreen && activeThreadId ? "hidden" : ""}`}>
        {/* Top tab bar — slides up on scroll down */}
        <motion.div
          className="bg-background overflow-hidden"
          animate={prefersReducedMotion ? undefined : { height: isScrolledDown ? 0 : "auto" }}
          transition={springGentle}>
          <div className="shrink-0 items-center justify-center py-3 pt-0 sm:flex sm:pt-3">
            <SlidingTabs
              value={activeTab}
              onChange={(v) => handleTabChange(v as HomeTab)}
              tabs={[
                { value: HomeTab.DISCOVERING, label: t("tab_discovering") },
                { value: HomeTab.VAULT, label: t("tab_vault") },
              ]}
            />
          </div>
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
