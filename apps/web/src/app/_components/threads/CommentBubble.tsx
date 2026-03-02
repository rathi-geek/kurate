"use client";

import type { ThreadComment } from "@/app/_libs/chat-types";

interface CommentBubbleProps {
  comment: ThreadComment;
  isOwn: boolean;
}

export function CommentBubble({ comment, isOwn }: CommentBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isOwn ? "bg-teal text-primary-foreground" : "bg-ink/[0.06] text-ink"
        }`}
      >
        <p className="font-sans text-[12px] font-medium text-ink/40 mb-0.5">
          {comment.senderName}
        </p>
        <p className="font-sans text-[13px] leading-snug whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
