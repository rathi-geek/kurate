"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

import { cn } from "@/app/_libs/utils/cn";
import { LinkIcon, PlusIcon } from "@/components/icons";

const URL_REGEX = /https?:\/\/[^\s]+/;

interface ChatInputProps {
  onSend: (message: string) => void;
  onUrlChange?: (url: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Set to false to hide the + send button (e.g. when the parent provides its own Post action) */
  showPlusIcon?: boolean;
}

export function ChatInput({ onSend, onUrlChange, placeholder, disabled, autoFocus, showPlusIcon = true }: ChatInputProps) {
  const t = useTranslations("chat");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUrl = URL_REGEX.test(value);
  const hasText = value.trim().length > 0;

  // Notify parent of URL presence (debounced 150ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const match = value.match(URL_REGEX);
      onUrlChange?.(match ? match[0] : null);
    }, 150);
    return () => clearTimeout(timer);
  }, [value, onUrlChange]);

  const showSendButton = hasText || focused;

  // Global Ctrl+V / Cmd+V — focus input and paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement === inputRef.current || disabled) return;
      const text = e.clipboardData?.getData("text");
      if (text) {
        inputRef.current?.focus();
        setValue(text);
        e.preventDefault();
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const boxShadow = isUrl
    ? "0 6px 24px rgba(0,0,0,0.12), 0 0 0 2px hsl(var(--primary) / 0.18)"
    : focused
      ? "0 0 0 3px hsl(var(--primary) / 0.12)"
      : "0 1px 2px 0 rgb(0 0 0 / 0.04)";

  return (
    <motion.div
      className={cn(
        "bg-card flex items-center gap-1 rounded-full border-0 p-2 shadow-lg",
        disabled && "pointer-events-none opacity-50",
      )}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              marginLeft: isUrl || focused ? -10 : 0,
              marginRight: isUrl || focused ? -10 : 0,
            }
      }
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      style={{ boxShadow, transition: "box-shadow 0.3s ease-out" }}>
      {/* Left: link icon — visible when empty (stays visible when focused) */}
      <AnimatePresence>
        <motion.button
          key="link-icon"
          type="button"
          disabled={disabled}
          aria-label="Link"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.15 }}
          className="rounded-button text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center transition-colors">
          <LinkIcon className="size-[15px]" />
        </motion.button>
      </AnimatePresence>

      {/* Center: text input (shadcn Input, borderless to match wrapper) */}
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "h-10 min-h-0 flex-1 border-0 bg-transparent px-2 py-1.5 shadow-none",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
        )}
      />

      {/* Right: + (add/send) button — when focused or has text, and showPlusIcon is true */}
      <AnimatePresence>
        {showPlusIcon && showSendButton && (
          <motion.button
            key="add-btn"
            type="button"
            onClick={handleSubmit}
            whileTap={{ scale: 0.88 }}
            disabled={!hasText || disabled}
            aria-label={t("send_label")}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.15 }}
            className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-35">
            <PlusIcon className="size-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
