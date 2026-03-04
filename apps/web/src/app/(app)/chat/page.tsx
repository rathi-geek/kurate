"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { ROUTES } from "@/app/_libs/constants/routes";
import { ChatBubble } from "@/app/_components/chat/chat-bubble";
import { ChatInput } from "@/app/_components/chat/chat-input";
import { QuickChips } from "@/app/_components/chat/quick-chips";
import { ContentThreadPanel } from "@/app/_components/threads/ContentThreadPanel";
import { ThreadInfoPanel } from "@/app/_components/threads/ThreadInfoPanel";
import { PersonChatView } from "@/app/_components/person/PersonChatView";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import { MobileTabBar } from "@/app/_components/chat/MobileTabBar";
import { DiscoverFeed } from "@/app/_components/feed/discover-feed";
import { ArticleReader } from "@/app/_components/reader/article-reader";
import type { FeedItem } from "@/app/_libs/mock-data";
import { ThreadProvider, useThread } from "@/app/_libs/threadContext";
import { MOCK_THREADS } from "@/app/_libs/mockThreadData";
import { createClient } from "@/app/_libs/supabase/client";
import { springSnappy } from "@/app/_libs/utils/motion";
import type { ChatTab } from "@/app/_libs/chat-types";

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
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
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

  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<ChatTab>("discovering");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [readerItem, setReaderItem] = useState<FeedItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const activeThread = activeThreadId ? MOCK_THREADS.find((t) => t.id === activeThreadId) : null;
  const activeChatHandle = activePersonHandle ?? (() => {
    if (!activeThreadId) return null;
    const thread = MOCK_THREADS.find((t) => t.id === activeThreadId);
    if (!thread) return null;
    const others = thread.participants.filter((p) => p.userHandle !== "@vivek");
    return others.length === 1 ? others[0].userHandle : null;
  })();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.AUTH.LOGIN);
  }

  function handlePersonClick(handle: string) {
    openPerson(handle);
  }

  function handleOpenArticle(url: string) {
    window.open(url, "_blank", "noopener");
  }

  function handleFeedItemClick(item: FeedItem) {
    setReaderUrl(item.url);
    setReaderItem(item);
  }

  async function handleFeedSave(item: FeedItem) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
      { onConflict: "user_id,url" }
    );
    setVaultRefreshKey((k) => k + 1);
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
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const res = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlMatch[0] }),
              });
              const meta = res.ok ? await res.json() : { title: urlMatch[0], source: "", author: null, previewImage: null, contentType: "article", readTime: null };
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
                { onConflict: "user_id,url" }
              );
              if (!error) {
                setVaultRefreshKey((k) => k + 1);
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
            content: saved ? "Link saved to your vault." : "Vault save skipped (table may not exist yet).",
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
          .map((m) => ({ role: m.role === "system" ? "assistant" as const : "user" as const, content: m.content }));
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
              setMessages((prev) => [...prev, { id: msgId, role: "system", content: fullText, timestamp: new Date() }]);
              setIsTyping(false);
            } else {
              setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: fullText } : m)));
            }
          }
          if (firstChunk || !fullText.trim()) {
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "system", content: "I didn't get a response. Try again.", timestamp: new Date() },
            ]);
            setIsTyping(false);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "system", content: "Something went wrong. Try again.", timestamp: new Date() },
          ]);
          setIsTyping(false);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "system", content: "Something went wrong. Try again.", timestamp: new Date() },
        ]);
        setIsTyping(false);
      } finally {
        isStreamingRef.current = false;
      }
    },
    [activeTab, messages]
  );

  return (
    <div className="h-screen flex bg-background">
      <AppSidebar
        userEmail={userEmail}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onPersonClick={handlePersonClick}
        onGroupChatClick={() => {}}
        activeChatHandle={activeChatHandle}
      />

      <AnimatePresence>
        {activeThreadId && !activePersonHandle && (
          <ContentThreadPanel
            key={activeThreadId}
            threadId={activeThreadId}
            isFullScreen={isFullScreen}
            onClose={closeThread}
            onToggleFullScreen={toggleFullScreen}
            onToggleInfo={toggleInfo}
            onOpenArticle={handleOpenArticle}
            onSaveToVault={() => setVaultRefreshKey((k) => k + 1)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInfoOpen && activeThread && !activePersonHandle && (
          <ThreadInfoPanel key="info-panel" thread={activeThread} onClose={closeInfo} />
        )}
      </AnimatePresence>

      {activePersonHandle ? (
        <PersonChatView
          handle={activePersonHandle}
          onClose={closePerson}
          onOpenArticle={handleOpenArticle}
        />
      ) : (
        <main
          id="main-content"
          onClick={() => activeThreadId && closeThread()}
          className={`flex-1 flex flex-col overflow-hidden ${isFullScreen && activeThreadId ? "hidden" : ""}`}
        >
          <div className="shrink-0 hidden md:flex items-center justify-center py-3 border-b bg-background">
            <div className="relative inline-flex bg-muted rounded-full p-[3px]">
              {(["discovering", "logging"] as ChatTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                  className="relative px-5 py-1.5 cursor-pointer min-h-[44px]"
                  type="button"
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId={prefersReducedMotion ? undefined : "tab-pill"}
                      className="absolute inset-0 bg-background rounded-full shadow-sm"
                      transition={springSnappy}
                    />
                  )}
                  <span
                    className={`relative z-10 text-sm font-medium transition-colors ${
                      activeTab === tab ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tab === "discovering" ? "Discovering" : "Logging"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {activeTab === "logging" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="hidden md:block shrink-0">
                <ChatInput
                  onSend={handleSend}
                  placeholder="Paste a link to log it..."
                  disabled={isTyping}
                />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 pb-16 md:pb-0">
                <VaultLibrary
                  refreshKey={vaultRefreshKey}
                  onItemClick={(url) => handleOpenArticle(url)}
                  panelMode
                />
              </div>
              <div className="md:hidden shrink-0 border-t">
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
                <div className="max-w-2xl mx-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="space-y-10">
                      <DiscoverFeed
                        onItemClick={handleFeedItemClick}
                        onSave={handleFeedSave}
                      />
                      <div className="max-w-md mx-auto">
                        <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          Recent threads
                        </p>
                        <div className="space-y-2">
                          {MOCK_THREADS.slice(0, 3).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => openThread(t.id)}
                              className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <p className="font-sans text-sm font-semibold text-foreground truncate">
                                {t.contentTitle ?? "Untitled"}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground mt-0.5">
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
                          className="flex gap-1 p-4"
                        >
                          <motion.span
                            animate={prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                          />
                          <motion.span
                            animate={prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                          />
                          <motion.span
                            animate={prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>
              <div className="shrink-0 px-4 pb-2 space-y-2">
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
        </main>
      )}
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
    </div>
  );
}
