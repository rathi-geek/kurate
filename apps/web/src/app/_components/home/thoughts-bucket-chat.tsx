"use client";

import { motion } from "framer-motion";
import { Virtuoso } from "react-virtuoso";

import { BUCKET_META, type ThoughtBucket } from "@kurate/utils";
import type { ThoughtMessage } from "@kurate/types";
import { ChevronLeftIcon } from "@/components/icons";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ThoughtBubble({ message, color }: { message: ThoughtMessage; color: string }) {
  return (
    <div className="flex justify-end py-0.5">
      <div className="max-w-[75%]">
        <div
          className="text-ink rounded-2xl rounded-br-sm px-3 py-2 text-sm"
          style={{ backgroundColor: color }}>
          <p className="leading-snug whitespace-pre-wrap">{message.text}</p>
          <div className="mt-0.5 flex justify-end">
            <span className="text-ink/40 text-[9px] leading-none">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThoughtsBucketChatProps {
  bucket: ThoughtBucket;
  onBack: () => void;
  searchQuery: string;
  extraMessages?: ThoughtMessage[];
}

export function ThoughtsBucketChat({
  bucket,
  onBack,
  searchQuery,
  extraMessages = [],
}: ThoughtsBucketChatProps) {
  const meta = BUCKET_META[bucket];

  const allMessages = extraMessages.filter((m) => m.bucket === bucket);
  const filtered = searchQuery.trim()
    ? allMessages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : allMessages;

  return (
    <motion.div
      className="bg-background absolute inset-0 z-10 flex flex-col"
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
          data={filtered}
          followOutput="smooth"
          itemContent={(_, m) => <ThoughtBubble message={m} color={`var(${meta.colorVar})`} />}
        />
      )}
    </motion.div>
  );
}
