"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ReplyContext {
  id: string;
  senderName: string;
  content: string;
}

interface CommentInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: ReplyContext | null;
  onCancelReply?: () => void;
}

export function CommentInput({
  onSend,
  placeholder = "Write your take...",
  disabled,
  replyTo,
  onCancelReply,
}: CommentInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [value]);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    onCancelReply?.();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="shrink-0 border-t border-ink/[0.06] bg-white/60">
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 pt-2.5 pb-0">
              <div className="flex-1 min-w-0 border-l-[3px] border-teal/50 pl-2.5 py-1">
                <p className="font-sans text-[11px] font-bold text-teal truncate">{replyTo.senderName}</p>
                <p className="font-sans text-[11px] text-ink/50 truncate">{replyTo.content.slice(0, 50)}...</p>
              </div>
              <button
                onClick={onCancelReply}
                className="shrink-0 p-1 text-ink/40 hover:text-ink cursor-pointer"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex gap-2 px-4 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-xl border border-ink/10 bg-ink/[0.03] px-3 py-2 font-sans text-[13px] text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="shrink-0 px-4 py-2 rounded-xl bg-teal text-primary-foreground font-sans text-[12px] font-semibold disabled:opacity-40 cursor-pointer hover:opacity-90 transition-opacity"
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
