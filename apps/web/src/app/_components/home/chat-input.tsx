"use client";

import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/app/_libs/utils/cn";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, placeholder, disabled, autoFocus }: ChatInputProps) {
  const t = useTranslations("chat");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className={cn(
        "rounded-input bg-card flex items-center gap-1 border-0 px-2 py-1.5",
        "transition-[box-shadow] duration-300 ease-out",
        disabled && "pointer-events-none opacity-50",
      )}
      style={{
        boxShadow: focused
          ? "0 0 0 3px hsl(var(--primary) / 0.12)"
          : "0 1px 2px 0 rgb(0 0 0 / 0.04)",
      }}>
      {/* Left: Add button */}
      <button
        type="button"
        disabled={disabled}
        aria-label={t("add_label")}
        className="rounded-button text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center transition-colors">
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Divider */}
      <div className="bg-border h-4 w-px shrink-0" aria-hidden="true" />

      {/* Center: textarea */}
      <input
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={1}
        style={{ outline: "none", resize: "none" }}
        className="text-foreground placeholder:text-muted-foreground max-h-[120px] flex-1 bg-transparent px-2 py-1.5 font-sans text-sm"
      />

      {/* Send button */}
      <motion.button
        type="button"
        onClick={handleSubmit}
        whileTap={{ scale: 0.88 }}
        disabled={!value.trim() || disabled}
        aria-label={t("send_label")}
        className="rounded-button bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center transition-opacity disabled:cursor-not-allowed disabled:opacity-35">
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </motion.button>
    </div>
  );
}
