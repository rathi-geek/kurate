"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { toast } from "sonner";
import { SlidingTabs } from "@/components/ui/sliding-tabs";

import { MobileTabBar } from "@/app/_components/home/MobileTabBar";
import { DiscoveringTabView } from "@/app/_components/home/discovering-tab-view";
import { VaultTabView } from "@/app/_components/home/vault-tab-view";
import { ArticleReader } from "@/app/_components/reader/article-reader";
import { PodcastPlayer } from "@/app/_components/reader/PodcastPlayer";
import { VideoPlayer } from "@/app/_components/reader/VideoPlayer";
import { HomeTab } from "@/app/_libs/chat-types";
import { useSaveItem } from "@/app/_libs/hooks/useSaveItem";
import { useSidebarOverrides } from "@/app/_libs/sidebar-overrides-context";
import { ThreadProvider, useThread } from "@/app/_libs/threadContext";
import type { FeedItem } from "@/app/_mocks/mock-data";
import type { SourceRect, VaultItem } from "@/app/_libs/types/vault";

export default function HomePage() {
  return (
    <ThreadProvider>
      <HomePageInner />
    </ThreadProvider>
  );
}

function HomePageInner() {
  const t = useTranslations("chat");
  const { activeThreadId, isFullScreen, openThread, closeThread, openPerson } = useThread();

  const [activeTab, setActiveTab] = useState<HomeTab>(HomeTab.DISCOVERING);

  const saveItem = useSaveItem();
  const [isTyping, setIsTyping] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [readerItem, setReaderItem] = useState<FeedItem | null>(null);
  const [videoItem, setVideoItem] = useState<VaultItem | null>(null);
  const [videoSourceRect, setVideoSourceRect] = useState<SourceRect | null>(null);
  const [podcastItem, setPodcastItem] = useState<VaultItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  function handleVaultItemClick(item: VaultItem, sourceRect?: SourceRect) {
    if (item.content_type === "article") {
      setReaderUrl(item.url);
      setReaderItem({
        id: item.id ?? "",
        url: item.url,
        title: item.title ?? "",
        hostname: item.source ?? "",
        readTime: item.read_time != null ? Number(item.read_time) : undefined,
        contentType: "article",
      });
    } else if (item.content_type === "video") {
      setVideoItem(item);
      setVideoSourceRect(sourceRect ?? null);
    } else if (item.content_type === "podcast") {
      setPodcastItem(item);
    } else {
      window.open(item.url, "_blank", "noopener");
    }
  }

  function handleFeedItemClick(item: FeedItem) {
    setReaderUrl(item.url);
    setReaderItem(item);
  }

  async function handleFeedSave(item: FeedItem) {
    await saveItem.mutateAsync({
      url: item.url,
      title: item.title,
      source: item.hostname ?? null,
      preview_image: item.imageUrl ?? null,
      content_type: item.contentType as "article" | "video" | "podcast",
      read_time: item.readTime != null ? String(item.readTime) : null,
      save_source: "feed",
    });
  }

  const handleSend = useCallback(
    async (text: string) => {
      if (activeTab !== HomeTab.VAULT) return;

      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return;

      setIsTyping(true);
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlMatch[0] }),
        });
        const meta = res.ok
          ? await res.json()
          : { title: urlMatch[0], source: "", author: null, previewImage: null, contentType: "article", readTime: null };

        const result = await saveItem.mutateAsync({
          url: urlMatch[0],
          title: meta.title ?? urlMatch[0],
          source: meta.source ?? null,
          author: meta.author ?? null,
          preview_image: meta.previewImage ?? null,
          content_type: meta.contentType ?? "article",
          read_time: meta.readTime != null ? String(meta.readTime) : null,
          save_source: "logged",
        });

        if (result === "duplicate") {
          toast("Already in your Vault", { description: "This link has been saved before." });
        }
      } catch {
        // network error
      } finally {
        setIsTyping(false);
      }
    },
    [activeTab, saveItem],
  );

  return (
    <>
      <div
        onClick={() => activeThreadId && closeThread()}
        className={`flex h-full flex-col overflow-hidden ${isFullScreen && activeThreadId ? "hidden" : ""}`}>
        <div className="border-border hidden shrink-0 items-center justify-center border-b py-3 sm:flex md:flex">
          <SlidingTabs
            value={activeTab as HomeTab}
            onChange={(v) => setActiveTab(v as HomeTab)}
            tabs={[
              { value: HomeTab.DISCOVERING, label: t("tab_discovering") },
              { value: HomeTab.VAULT, label: t("tab_vault") },
            ]}
          />
        </div>

        {/* Keep both tab panels mounted; hide inactive with CSS to preserve state (scroll, form input, etc.) */}
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeTab !== HomeTab.VAULT ? "hidden" : ""}`}
          aria-hidden={activeTab !== HomeTab.VAULT}
        >
          <VaultTabView
            onSend={handleSend}
            disabled={isTyping}
            onItemClick={handleVaultItemClick}
            onNavigateToDiscover={() => setActiveTab(HomeTab.DISCOVERING)}
          />
        </div>
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${activeTab !== HomeTab.DISCOVERING ? "hidden" : ""}`}
          aria-hidden={activeTab !== HomeTab.DISCOVERING}
        >
          <DiscoveringTabView
            isTyping={isTyping}
            scrollRef={scrollRef}
            onSend={handleSend}
            onFeedItemClick={handleFeedItemClick}
            onFeedSave={handleFeedSave}
            onOpenThread={openThread}
          />
        </div>
        <MobileTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMenuOpen={() => setMobileMenuOpen(true)}
        />
      </div>

      <ArticleReader
        url={readerUrl}
        title={readerItem?.title}
        hostname={readerItem?.hostname}
        readTime={readerItem?.readTime}
        onClose={() => {
          setReaderUrl(null);
          setReaderItem(null);
        }}
      />
      {videoItem && (
        <VideoPlayer
          url={videoItem.url}
          title={videoItem.title}
          initialRect={videoSourceRect}
          onClose={() => {
            setVideoItem(null);
            setVideoSourceRect(null);
          }}
        />
      )}
      {podcastItem && (
        <PodcastPlayer
          url={podcastItem.url}
          title={podcastItem.title}
          source={podcastItem.source}
          onClose={() => setPodcastItem(null)}
        />
      )}
    </>
  );
}
