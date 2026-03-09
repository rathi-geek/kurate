"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { SlidingTabs } from "@/components/ui/sliding-tabs";

import { MobileTabBar } from "@/app/_components/chat/MobileTabBar";
import { ChatBubble } from "@/app/_components/chat/chat-bubble";
import { ChatInput } from "@/app/_components/chat/chat-input";
import { QuickChips } from "@/app/_components/chat/quick-chips";
import { DiscoverFeed } from "@/app/_components/feed/discover-feed";
import { PersonChatView } from "@/app/_components/person/PersonChatView";
import { ArticleReader } from "@/app/_components/reader/article-reader";
import { ContentThreadPanel } from "@/app/_components/threads/ContentThreadPanel";
import { ThreadInfoPanel } from "@/app/_components/threads/ThreadInfoPanel";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import type { ChatTab } from "@/app/_libs/chat-types";
import { useSidebarOverrides } from "@/app/_libs/sidebar-overrides-context";
import { createClient } from "@/app/_libs/supabase/client";
import { ThreadProvider, useThread } from "@/app/_libs/threadContext";
import type { FeedItem } from "@/app/_mocks/mock-data";
import { MOCK_THREADS } from "@/app/_mocks/mock-thread-data";

interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  return (
    <ThreadProvider>
      <ChatPageInner />
    </ThreadProvider>
  );
}

function ChatPageInner() {
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations("chat");
  const {
    activeThreadId,
    isFullScreen,
    isInfoOpen,
    activePersonHandle,
    openThread,
    closeThread,
    toggleFullScreen,
    toggleInfo,
    closeInfo,
    openPerson,
    closePerson,
  } = useThread();

  const [activeTab, setActiveTab] = useState<ChatTab>("discovering");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);
  const [_vaultPulse, setVaultPulse] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [readerItem, setReaderItem] = useState<FeedItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  const activeThread = activeThreadId ? MOCK_THREADS.find((t) => t.id === activeThreadId) : null;
  const activeChatHandle =
    activePersonHandle ??
    (() => {
      if (!activeThreadId) return null;
      const thread = MOCK_THREADS.find((t) => t.id === activeThreadId);
      if (!thread) return null;
      const others = thread.participants.filter((p) => p.userHandle !== "@vivek");
      return others.length === 1 ? others[0].userHandle : null;
    })();

  const sidebarOverrides = useMemo(
    () => ({
      mobileOpen: mobileMenuOpen,
      onMobileClose: () => setMobileMenuOpen(false),
      onPersonClick: (handle: string) => openPerson(handle),
      onGroupChatClick: () => {},
      activeChatHandle: activeChatHandle ?? undefined,
    }),
    [mobileMenuOpen, activeChatHandle, openPerson],
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
      if (activeTab === "logging") {
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
            value={activeTab}
            onChange={(v) => setActiveTab(v as ChatTab)}
            tabs={[
              { value: "discovering", label: t("tab_discovering") },
              {
                value: "logging",
                label: t("tab_logging"),
              },
            ]}
          />
        </div>

        {activeTab === "logging" ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="hidden shrink-0 md:block">
              <ChatInput
                onSend={handleSend}
                placeholder="Paste a link to log it..."
                disabled={isTyping}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
              <VaultLibrary
                refreshKey={vaultRefreshKey}
                onItemClick={(url) => handleOpenArticle(url)}
                panelMode
              />
            </div>
            <div className="shrink-0 border-t md:hidden">
              <ChatInput
                onSend={handleSend}
                placeholder="Paste a link to log it..."
                disabled={isTyping}
              />
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
              <div className="mx-auto max-w-2xl space-y-4">
                {messages.length === 0 ? (
                  <div className="space-y-10">
                    <DiscoverFeed onItemClick={handleFeedItemClick} onSave={handleFeedSave} />
                    <div className="mx-auto max-w-md">
                      <p className="text-muted-foreground mb-3 font-mono text-xs font-bold tracking-widest uppercase">
                        Recent threads
                      </p>
                      <div className="space-y-2">
                        {MOCK_THREADS.slice(0, 3).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => openThread(t.id)}
                            className="rounded-card border-border bg-card hover:bg-surface w-full border p-3 text-left transition-colors">
                            <p className="text-foreground truncate font-sans text-sm font-semibold">
                              {t.contentTitle ?? "Untitled"}
                            </p>
                            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                              with {t.participants.map((p) => p.userName).join(", ")}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <ChatBubble key={msg.id} role={msg.role}>
                        {msg.content}
                      </ChatBubble>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                        className="flex gap-1 p-4">
                        <motion.span
                          animate={prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="bg-primary/40 h-2 w-2 rounded-full"
                        />
                        <motion.span
                          animate={prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                          className="bg-primary/40 h-2 w-2 rounded-full"
                        />
                        <motion.span
                          animate={prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                          className="bg-primary/40 h-2 w-2 rounded-full"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
            <div className="shrink-0 space-y-2 px-4 pb-2">
              <QuickChips
                visible={messages.length === 0}
                onSelect={(prompt) => handleSend(prompt)}
              />
              <ChatInput
                onSend={handleSend}
                placeholder="Ask me about any topic..."
                disabled={isTyping}
              />
            </div>
          </>
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
