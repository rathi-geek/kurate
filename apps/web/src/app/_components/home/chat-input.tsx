"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
  type MutableRefObject,
} from "react";


import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/i18n/use-translations";

import { Input } from "@/components/ui/input";

import { cn } from "@/app/_libs/utils/cn";
import { LinkIcon, PlusIcon } from "@/components/icons";

const URL_REGEX = /https?:\/\/[^\s]+/;

export interface ChatInputProps {
  onSend: (message: string) => void;
  onUrlChange?: (url: string | null) => void;
  placeholder?: string;
  /** Placeholder shown when a URL is locked in and the user is typing a note */
  notePlaceholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Set to false to hide the + send button (e.g. when the parent provides its own Post action) */
  showPlusIcon?: boolean;
  /** When true: hides the link icon and shrinks the input when empty and unfocused */
  collapsible?: boolean;
  /** When provided, shows a camera icon button that opens a file picker (currently hidden) */
  onMediaSelect?: (file: File) => void;
}

function assignInputRef(
  instance: HTMLInputElement | null,
  localRef: MutableRefObject<HTMLInputElement | null>,
  forwarded: ForwardedRef<HTMLInputElement>,
) {
  localRef.current = instance;
  if (typeof forwarded === "function") forwarded(instance);
  else if (forwarded) (forwarded as MutableRefObject<HTMLInputElement | null>).current = instance;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(function ChatInput(
  { onSend, onUrlChange, placeholder, notePlaceholder = "Add a note…", disabled, autoFocus, showPlusIcon = true, collapsible = false, onMediaSelect: _onMediaSelect },
  ref,
) {
  // eslint-disable-next-line no-console
  console.log('[ChatInput] render', { disabled, collapsible });

  const t = useTranslations("chat");
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [lockedUrl, setLockedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resolvedPlaceholder = lockedUrl ? notePlaceholder : (placeholder ?? t("placeholder"));
  const isUrl = lockedUrl !== null;
  const hasText = value.trim().length > 0;
  const isCollapsed = collapsible && !focused && !hasText && !lockedUrl;

  // Detect URL in value — only when no URL is already locked
  useEffect(() => {
    if (!onUrlChange || lockedUrl) return;
    const timer = setTimeout(() => {
      const match = value.match(URL_REGEX);
      if (match) {
        const url = match[0];
        // Strip the URL from value, keep remaining text as note pre-fill
        const remaining = value.replace(url, "").trim();
        setValue(remaining);
        setLockedUrl(url);
        onUrlChange(url);
      } else {
        onUrlChange(null);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [value, onUrlChange, lockedUrl]);

  const showSendButton = hasText || focused || !!lockedUrl;

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
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed && !lockedUrl) return;
    // When in URL mode, send the note text (may be empty); parent handles lockedUrl via previewUrl
    onSend(trimmed);
    setValue("");
    setLockedUrl(null);
  }, [value, lockedUrl, disabled, onSend]);

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
      {/* Media upload hidden — feature not enabled */}

      {/* Left: link icon — always visible */}
      <LinkIcon className="text-muted-foreground ml-1 size-[15px] shrink-0" />

      {/* Center: text input (shadcn Input, borderless to match wrapper) */}
      <Input
        ref={(el) => assignInputRef(el, inputRef, ref)}
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
          "min-h-0 flex-1 border-0 bg-transparent px-2 py-1.5 shadow-none",
          isCollapsed ? "h-8" : "h-10",
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
            disabled={(!hasText && !lockedUrl) || disabled}
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
});
