"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ThreadHeader } from "./ThreadHeader";
import { CommentList } from "./CommentList";
import { CommentInput } from "./CommentInput";
import { MOCK_THREADS, MOCK_THREAD_COMMENTS } from "@/app/_mocks/mock-thread-data";
import { springHeavy } from "@/app/_libs/utils/motion";
import type { ThreadComment } from "@/app/_libs/chat-types";

const CURRENT_USER_HANDLE = "@vivek";

interface ContentThreadPanelProps {
  threadId: string;
  isFullScreen: boolean;
  onClose: () => void;
  onToggleFullScreen: () => void;
  onToggleInfo: () => void;
  onOpenArticle?: (url: string) => void;
  onSaveToVault?: () => void;
}

export function ContentThreadPanel({
  threadId,
  isFullScreen,
  onClose,
  onToggleFullScreen,
  onToggleInfo,
  onOpenArticle,
}: ContentThreadPanelProps) {
  const thread = MOCK_THREADS.find((t) => t.id === threadId);
  const [comments, setComments] = useState<ThreadComment[]>(
    () => MOCK_THREAD_COMMENTS[threadId] ?? []
  );
  const prevThreadId = useRef(threadId);

  useEffect(() => {
    if (threadId !== prevThreadId.current) {
      setComments(MOCK_THREAD_COMMENTS[threadId] ?? []);
      prevThreadId.current = threadId;
    }
  }, [threadId]);

  const handleSend = useCallback(
    (text: string) => {
      const newComment: ThreadComment = {
        id: crypto.randomUUID(),
        threadId,
        senderHandle: CURRENT_USER_HANDLE,
        senderName: "You",
        content: text,
        reactions: [],
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, newComment]);
    },
    [threadId]
  );

  if (!thread) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={springHeavy}
        className="w-full max-w-[420px] sm:max-w-[420px] h-full border-l border-ink/[0.06] bg-white flex flex-col overflow-hidden shrink-0"
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="font-sans text-sm text-ink/30">Thread not found</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={springHeavy}
      className={`${isFullScreen ? "fixed inset-0 z-50" : ""} w-full max-w-[420px] sm:max-w-[420px] h-full border-l border-ink/[0.06] bg-white flex flex-col overflow-hidden shrink-0`}
    >
      <ThreadHeader
        thread={thread}
        isFullScreen={isFullScreen}
        onToggleFullScreen={onToggleFullScreen}
        onClose={onClose}
        onToggleInfo={onToggleInfo}
        onOpenArticle={onOpenArticle}
      />
      <CommentList
        comments={comments}
        currentUserHandle={CURRENT_USER_HANDLE}
      />
      <CommentInput onSend={handleSend} placeholder="Write your take..." />
    </motion.div>
  );
}
