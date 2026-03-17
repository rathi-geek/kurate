"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { CommentInput, type ReplyContext } from "@/app/_components/threads/CommentInput";
import { CommentList } from "@/app/_components/threads/CommentList";
import type { ThreadComment } from "@/app/_libs/chat-types";
import { MOCK_CONTACTS } from "@/app/_libs/contacts";
import { springSnappy } from "@/app/_libs/utils/motion";
import { getDMMessages } from "@/app/_mocks/mock-dm-messages";
import { getSharedContentForPerson } from "@/app/_mocks/mock-person-content";

import { SharedContentStrip } from "./SharedContentStrip";

interface PersonChatViewProps {
  handle: string;
  onClose: () => void;
  onOpenArticle: (url: string) => void;
}

export function PersonChatView({ handle, onClose, onOpenArticle }: PersonChatViewProps) {
  const contact = MOCK_CONTACTS.find((c) => c.handle === handle);
  const name = contact?.name ?? handle.slice(1);
  const initial = name[0]?.toUpperCase() ?? "?";

  const items = getSharedContentForPerson(handle);
  const [messages, setMessages] = useState<ThreadComment[]>(() => getDMMessages(handle));
  const [vaultOpen, setVaultOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyContext | null>(null);

  const handleSend = useCallback(
    (text: string) => {
      const newMsg: ThreadComment = {
        id: `dm-new-${Date.now()}`,
        threadId: `dm-${handle}`,
        senderHandle: "@vivek",
        senderName: "You",
        content: text,
        reactions: [],
        replyTo: replyTo
          ? { id: replyTo.id, senderName: replyTo.senderName, content: replyTo.content }
          : null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setReplyTo(null);
    },
    [handle, replyTo],
  );

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className="bg-background flex flex-1 flex-col overflow-hidden">
      <header className="border-ink/[0.08] flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3">
        <button
          onClick={() => (vaultOpen ? setVaultOpen(false) : onClose())}
          className="hover:bg-ink/[0.05] flex h-10 min-h-[44px] w-10 min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
          type="button"
          aria-label="Back">
          <svg
            width={20}
            height={20}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <div className="bg-teal text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-ink truncate font-sans text-base leading-tight font-bold">{name}</h2>
          {items.length > 0 && (
            <button
              onClick={() => setVaultOpen((v) => !v)}
              type="button"
              className={`mt-1 flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-xs font-bold transition-all ${
                vaultOpen
                  ? "bg-teal text-primary-foreground"
                  : "bg-ink/[0.06] text-ink/50 hover:bg-ink/[0.1]"
              }`}>
              Shared Vault
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${vaultOpen ? "bg-white/20" : "bg-ink/[0.08] text-ink/40"}`}>
                {items.length}
              </span>
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {vaultOpen ? (
          <motion.div
            key="vault"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springSnappy}
            className="flex-1 overflow-hidden">
            <SharedContentStrip
              items={items}
              expanded
              onToggleExpand={() => setVaultOpen(false)}
              onCardClick={(item) => onOpenArticle(item.contentUrl)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={springSnappy}
            className="flex flex-1 flex-col overflow-hidden">
            <CommentList comments={messages} currentUserHandle="@vivek" onReply={() => {}} />
            <CommentInput
              onSend={handleSend}
              placeholder={`Message ${name}...`}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
