"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommentList } from "@/app/_components/threads/CommentList";
import { CommentInput, type ReplyContext } from "@/app/_components/threads/CommentInput";
import { SharedContentStrip } from "./SharedContentStrip";
import { getSharedContentForPerson } from "@/app/_libs/mockPersonContent";
import { getDMMessages } from "@/app/_libs/mockDMMessages";
import { MOCK_CONTACTS } from "@/app/_libs/contacts";
import { springSnappy } from "@/app/_libs/utils/motion";
import type { ThreadComment } from "@/app/_libs/chat-types";

interface PersonChatViewProps {
  handle: string;
  onClose: () => void;
  onOpenArticle: (url: string) => void;
}

export function PersonChatView({
  handle,
  onClose,
  onOpenArticle,
}: PersonChatViewProps) {
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
    [handle, replyTo]
  );

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col overflow-hidden bg-background"
    >
      <header className="shrink-0 bg-white px-4 py-3 flex items-center gap-3 border-b border-ink/[0.08]">
        <button
          onClick={() => (vaultOpen ? setVaultOpen(false) : onClose())}
          className="shrink-0 w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-ink/[0.05] transition-colors rounded-full min-h-[44px] min-w-[44px]"
          type="button"
          aria-label="Back"
        >
          <svg width={20} height={20} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <div className="w-10 h-10 bg-teal text-primary-foreground flex items-center justify-center font-sans text-sm font-bold shrink-0 rounded-full">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-base font-bold text-ink leading-tight truncate">
            {name}
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => setVaultOpen((v) => !v)}
              type="button"
              className={`flex items-center gap-1.5 mt-1 px-2.5 py-1.5 rounded-full font-mono text-xs font-bold cursor-pointer transition-all min-h-[44px] ${
                vaultOpen ? "bg-teal text-primary-foreground" : "bg-ink/[0.06] text-ink/50 hover:bg-ink/[0.1]"
              }`}
            >
              Shared Vault
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded-full ${vaultOpen ? "bg-white/20" : "bg-ink/[0.08] text-ink/40"}`}>
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
            className="flex-1 overflow-hidden"
          >
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
            className="flex-1 flex flex-col overflow-hidden"
          >
            <CommentList
              comments={messages}
              currentUserHandle="@vivek"
              onReply={() => {}}
            />
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
