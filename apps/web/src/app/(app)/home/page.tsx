"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { SlidingTabs } from "@/components/ui/sliding-tabs";

import { MobileTabBar } from "@/app/_components/home/MobileTabBar";
import { DiscoveringTabView } from "@/app/_components/home/discovering-tab-view";
import { LoggingTabView } from "@/app/_components/home/logging-tab-view";
import { ArticleReader } from "@/app/_components/reader/article-reader";
import { HomeTab } from "@/app/_libs/chat-types";
import { useSidebarOverrides } from "@/app/_libs/sidebar-overrides-context";
import { createClient } from "@/app/_libs/supabase/client";
import { ThreadProvider, useThread } from "@/app/_libs/threadContext";
import type { FeedItem } from "@/app/_mocks/mock-data";

interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);
  const [_vaultPulse, setVaultPulse] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [readerItem, setReaderItem] = useState<FeedItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

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

  function handleOpenArticle(url: string) {
    window.open(url, "_blank", "noopener");
  }

  function handleFeedItemClick(item: FeedItem) {
    setReaderUrl(item.url);
    setReaderItem(item);
  }

  async function handleFeedSave(item: FeedItem) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("logged_items").upsert(
      {
        user_id: user.id,
        url: item.url,
        title: item.title,
        source: item.hostname ?? null,
        author: null,
        preview_image: item.imageUrl ?? null,
        content_type: item.contentType,
        read_time: item.readTime ?? null,
        save_source: "feed",
        shared_to_groups: [],
      },
      { onConflict: "user_id,url" },
    );
    setVaultRefreshKey((k) => k + 1);
    setVaultPulse(true);
  }

  const handleSend = useCallback(
    async (text: string) => {
      if (activeTab === HomeTab.VAULT) {
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          setIsTyping(true);
          let saved = false;
          try {
            const supabase = createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              const res = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlMatch[0] }),
              });
              const meta = res.ok
                ? await res.json()
                : {
                    title: urlMatch[0],
                    source: "",
                    author: null,
                    previewImage: null,
                    contentType: "article",
                    readTime: null,
                  };
              const { error } = await supabase.from("logged_items").upsert(
                {
                  user_id: user.id,
                  url: urlMatch[0],
                  title: meta.title ?? urlMatch[0],
                  source: meta.source ?? null,
                  author: meta.author ?? null,
                  preview_image: meta.previewImage ?? null,
                  content_type: meta.contentType ?? "article",
                  read_time: meta.readTime ?? null,
                  save_source: "logged",
                  shared_to_groups: [],
                },
                { onConflict: "user_id,url" },
              );
              if (!error) {
                setVaultRefreshKey((k) => k + 1);
                setVaultPulse(true);
                saved = true;
              }
            }
          } catch {
            // Table may not exist
          }
          setIsTyping(false);
          const sysMsg: Message = {
            id: crypto.randomUUID(),
            role: "system",
            content: saved
              ? "Link saved to your vault."
              : "Vault save skipped (table may not exist yet).",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, sysMsg]);
        } else {
          const sysMsg: Message = {
            id: crypto.randomUUID(),
            role: "system",
            content: "Paste a link to save it to your vault.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, sysMsg]);
        }
        return;
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      isStreamingRef.current = true;

      try {
        const history = messages
          .filter((m) => m.content.trim() !== "")
          .map((m) => ({
            role: m.role === "system" ? ("assistant" as const) : ("user" as const),
            content: m.content,
          }));
        history.push({ role: "user" as const, content: text });

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = "";
          const msgId = crypto.randomUUID();
          let firstChunk = true;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
            if (firstChunk) {
              firstChunk = false;
              setMessages((prev) => [
                ...prev,
                { id: msgId, role: "system", content: fullText, timestamp: new Date() },
              ]);
              setIsTyping(false);
            } else {
              setMessages((prev) =>
                prev.map((m) => (m.id === msgId ? { ...m, content: fullText } : m)),
              );
            }
          }
          if (firstChunk || !fullText.trim()) {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "system",
                content: "I didn't get a response. Try again.",
                timestamp: new Date(),
              },
            ]);
            setIsTyping(false);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "system",
              content: "Something went wrong. Try again.",
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: "Something went wrong. Try again.",
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
      } finally {
        isStreamingRef.current = false;
      }
    },
    [activeTab, messages],
  );

  return (
    <>
      <div
        onClick={() => activeThreadId && closeThread()}
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${isFullScreen && activeThreadId ? "hidden" : ""}`}>
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

        {activeTab === HomeTab.VAULT ? (
          <LoggingTabView
            onSend={handleSend}
            disabled={isTyping}
            vaultRefreshKey={vaultRefreshKey}
            onOpenArticle={handleOpenArticle}
          />
        ) : (
          <DiscoveringTabView
            messages={messages}
            isTyping={isTyping}
            scrollRef={scrollRef}
            onSend={handleSend}
            onFeedItemClick={handleFeedItemClick}
            onFeedSave={handleFeedSave}
            onOpenThread={openThread}
          />
        )}
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
    </>
  );
}
