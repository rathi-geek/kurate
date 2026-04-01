"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "@/i18n/use-translations";

import { SendIcon } from "@/components/icons";
import { track } from "@/app/_libs/utils/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReplyInputProps {
  placeholder?: string;
  initialValue?: string;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  squareTop?: boolean;
}

export function ReplyInput({
  placeholder,
  initialValue = "",
  onSubmit,
  onCancel,
  isLoading = false,
  squareTop = false,
}: ReplyInputProps) {
  const t = useTranslations("groups");
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        track("comment_posted");
        onSubmit(trimmed);
        setValue("");
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      track("comment_posted");
      onSubmit(trimmed);
      setValue("");
      if (!isLoading) {
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className={`flex flex-1 items-center gap-2 border bg-surface px-3 py-1.5 transition-[color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${squareTop ? "rounded-b-2xl rounded-t-none" : "rounded-full"}`}>
        <Input
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("comment_placeholder")}
          disabled={isLoading}
          className="flex-1 h-auto border-none bg-transparent px-0 py-0 shadow-none rounded-none focus-visible:border-transparent focus-visible:ring-0 text-sm"
        />
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="size-7 rounded-full shrink-0"
          aria-label={t("comment_submit")}
        >
          <SendIcon className="size-3.5" />
        </Button>
      </div>
      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="shrink-0 text-xs"
        >
          {t("cancel")}
        </Button>
      )}
    </div>
  );
}
