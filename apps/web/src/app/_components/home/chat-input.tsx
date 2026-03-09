"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({
  onSend,
  placeholder,
  disabled,
  autoFocus,
}: ChatInputProps) {
  const t = useTranslations("chat");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="p-4 border-t bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end gap-2 bg-card border rounded-card p-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={resolvedPlaceholder}
            disabled={disabled}
            autoFocus={autoFocus}
            rows={1}
            className="
              flex-1 resize-none
              text-sm
              bg-transparent
              py-2 px-3
              max-h-[120px]
              focus:outline-none
            "
          />
          <motion.button
            onClick={handleSubmit}
            whileTap={{ scale: 0.9 }}
            disabled={!value.trim() || disabled}
            className="
              w-10 h-10 rounded-full
              bg-primary text-primary-foreground
              flex items-center justify-center
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5V19M5 12H19" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
