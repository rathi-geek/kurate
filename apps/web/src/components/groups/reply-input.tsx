"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

import { SendIcon } from "@/components/icons";

interface ReplyInputProps {
  placeholder?: string;
  initialValue?: string;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReplyInput({
  placeholder,
  initialValue = "",
  onSubmit,
  onCancel,
  isLoading = false,
}: ReplyInputProps) {
  const t = useTranslations("groups");
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onSubmit(trimmed);
        setValue("");
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setValue("");
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-1 items-end gap-2 rounded-full border bg-surface px-3 py-1.5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("comment_placeholder")}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm outline-none max-h-24 disabled:opacity-50"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="shrink-0 text-primary disabled:opacity-40 transition-opacity pb-0.5"
          aria-label={t("comment_submit")}
        >
          <SendIcon className="size-4" />
        </button>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          {t("cancel")}
        </button>
      )}
    </div>
  );
}
