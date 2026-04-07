"use client";

import { EMOJI_ROWS } from "@kurate/utils";
import { SmileIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center justify-center transition-colors"
          aria-label="Add emoji">
          <SmileIcon className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-auto p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}>
        {EMOJI_ROWS.map((row, i) => (
          <div key={i} className="flex gap-0.5">
            {row.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                className="hover:bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:scale-125">
                {emoji}
              </button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
