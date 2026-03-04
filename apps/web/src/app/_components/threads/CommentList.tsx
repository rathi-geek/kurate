"use client";

import { useRef, useEffect } from "react";
import { CommentBubble } from "./CommentBubble";
import type { ThreadComment } from "@/app/_libs/chat-types";

interface CommentListProps {
  comments: ThreadComment[];
  currentUserHandle: string;
  onReply?: (comment: ThreadComment) => void;
}

export function CommentList({
  comments,
  currentUserHandle,
}: CommentListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  if (comments.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center justify-center text-center">
        <p className="font-sans text-sm text-ink/30 font-medium">No takes yet</p>
        <p className="font-sans text-xs text-ink/20 mt-1">Share your thoughts on this piece</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-2.5">
        {comments.map((c) => (
          <div key={c.id}>
            <CommentBubble comment={c} isOwn={c.senderHandle === currentUserHandle} />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
