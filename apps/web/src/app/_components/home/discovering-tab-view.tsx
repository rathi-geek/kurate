"use client";

import { type RefObject } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { DiscoverFeed } from "@/app/_components/feed/discover-feed";
import { ChatBubble } from "@/app/_components/home/chat-bubble";
import { ChatInput } from "@/app/_components/home/chat-input";
import { QuickChips } from "@/app/_components/home/quick-chips";
import type { ContentThread } from "@/app/_libs/chat-types";
import type { FeedItem } from "@/app/_mocks/mock-data";
import { MOCK_THREADS } from "@/app/_mocks/mock-thread-data";

export interface ChatMessage {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
}

interface DiscoveringTabViewProps {
  isTyping: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onSend: (text: string) => void;
  onFeedItemClick: (item: FeedItem) => void;
  onFeedSave: (item: FeedItem) => void;
  onOpenThread: (threadId: string) => void;
}

export function DiscoveringTabView({
  isTyping,
  scrollRef,
  onSend,
  onFeedItemClick,
  onFeedSave,
  onOpenThread,
}: DiscoveringTabViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const recentThreads = MOCK_THREADS.slice(0, 3);

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {
            <AnimatePresence>
              {/* {messages.map((msg) => (
                <ChatBubble key={msg.id} role={msg.role}>
                  {msg.content}
                </ChatBubble>
              ))} */}
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
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: 0.2,
                    }}
                    className="bg-primary/40 h-2 w-2 rounded-full"
                  />
                  <motion.span
                    animate={prefersReducedMotion ? undefined : { scale: [0.8, 1, 0.8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: 0.4,
                    }}
                    className="bg-primary/40 h-2 w-2 rounded-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          }
        </div>
      </div>
      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        {/* <QuickChips visible={messages.length === 0} onSelect={(prompt) => onSend(prompt)} /> */}
        <div className="mx-auto max-w-2xl">
          <ChatInput onSend={onSend} placeholder="Ask me about any topic…" disabled={isTyping} />
        </div>
      </div>
    </>
  );
}
