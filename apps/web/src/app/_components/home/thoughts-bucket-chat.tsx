"use client";

import { memo } from "react";

import type { ThoughtMessage } from "@kurate/types";
import { BUCKET_META, type ThoughtBucket } from "@kurate/utils";
import { motion } from "framer-motion";
import { Virtuoso } from "react-virtuoso";

import { ChevronLeftIcon, TrashIcon } from "@/components/icons";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type DisplayMessage = ThoughtMessage & { _pending?: boolean; _failed?: boolean };

function ThoughtBubble({
  message,
  color,
  onDelete,
}: {
  message: DisplayMessage;
  color: string;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="group/msg relative flex justify-end py-0.5">
      {/* Hover delete pill — left of bubble */}
      {onDelete && (!message._pending || message._failed) && (
        <div
          className="absolute top-1/2 right-full mr-1.5 z-10 flex -translate-y-1/2 items-center rounded-full border border-border/50 bg-white px-2 py-1 opacity-0 shadow-md transition-opacity group-hover/msg:opacity-100">
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete thought">
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="max-w-[75%]">
        <motion.div
          className="text-ink rounded-2xl rounded-br-sm px-3 py-2 text-sm"
          style={{ backgroundColor: color }}
          animate={{ opacity: message._pending || message._failed ? 0.7 : 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}>
          <p className="leading-snug whitespace-pre-wrap">{message.text}</p>
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <span className="text-ink/40 text-[9px] leading-none">
              {formatTime(message.createdAt)}
            </span>
            {message._pending && (
              <span className="text-[9px] leading-none" aria-label="Sending">
                ⏱
              </span>
            )}
            {message._failed && (
              <span className="text-[9px] leading-none text-red-400" aria-label="Failed to send">
                !
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface ThoughtsBucketChatProps {
  bucket: ThoughtBucket;
  onBack: () => void;
  searchQuery: string;
  extraMessages?: DisplayMessage[];
  onDelete?: (id: string) => void;
}

export const ThoughtsBucketChat = memo(function ThoughtsBucketChat({
  bucket,
  onBack,
  searchQuery,
  extraMessages = [],
  onDelete,
}: ThoughtsBucketChatProps) {
  const meta = BUCKET_META[bucket];

  const allMessages = extraMessages.filter((m) => m.bucket === bucket);
  const filtered = searchQuery.trim()
    ? allMessages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : allMessages;

  return (
    <motion.div
      className="bg-background absolute inset-0 z-10 flex flex-col pt-4"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 34 }}>
      {/* Floating back button — stays fixed while scrolling */}
      <button
        type="button"
        onClick={onBack}
        className="bg-background/80 hover:bg-surface absolute top-4 left-4 z-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors"
        aria-label="Back">
        <ChevronLeftIcon className="text-ink/60 size-5" />
      </button>

      {/* Message list */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <p className="text-ink/40 text-sm">
            {searchQuery ? "No matching thoughts" : "No thoughts yet — start typing below"}
          </p>
        </div>
      ) : (
        <Virtuoso
          className="flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data={filtered as DisplayMessage[]}
          initialTopMostItemIndex={filtered.length - 1}
          followOutput="smooth"
          itemContent={(_, m) => (
            <ThoughtBubble
              message={m}
              color={`var(${meta.colorVar})`}
              onDelete={onDelete}
            />
          )}
        />
      )}
    </motion.div>
  );
});
