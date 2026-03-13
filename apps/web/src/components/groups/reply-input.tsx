"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t("comment_placeholder")}
        rows={1}
        className="min-h-0 resize-none text-sm"
        disabled={isLoading}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? t("submitting") : t("comment_submit")}
        </Button>
      </div>
    </div>
  );
}
