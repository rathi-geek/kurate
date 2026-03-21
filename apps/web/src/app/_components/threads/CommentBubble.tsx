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
        className={`max-w-[85%] rounded-card px-4 py-2.5 ${
          isOwn ? "bg-teal text-primary-foreground" : "bg-ink/[0.06] text-ink"
        }`}
      >
        <p className="font-sans text-xs font-medium text-ink/40 mb-0.5">
          {comment.senderName}
        </p>
        <p className="font-sans text-sm leading-snug whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
