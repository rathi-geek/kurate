"use client";

import { memo } from "react";

import type { BucketSummary } from "@kurate/hooks";
import type { ThoughtMessage } from "@kurate/types";
import { getBucketDotColor } from "@kurate/utils";
import { motion } from "framer-motion";
import { Virtuoso } from "react-virtuoso";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { ArrowRightLeftIcon, ChevronLeftIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type DisplayMessage = ThoughtMessage & { _pending?: boolean; _failed?: boolean };

function MoveBucketMenu({
  buckets,
  currentBucket,
  onMove,
}: {
  buckets: BucketSummary[];
  currentBucket: string;
  onMove: (targetBucket: string) => void;
}) {
  const t = useTranslations("thoughts");
  const others = buckets.filter((b) => b.bucket !== currentBucket);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label={t("move_aria")}>
          <ArrowRightLeftIcon className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-44 p-1">
        {others.map((b) => (
          <button
            key={b.bucket}
            type="button"
            onClick={() => onMove(b.bucket)}
            className="text-foreground hover:bg-accent/40 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors">
            <span
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: getBucketDotColor(b.color) }}
            />
            {b.bucketLabel}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ThoughtBubble({
  message,
  color,
  onDelete,
  onEditStart,
  onMove,
  allBuckets,
  currentBucket,
}: {
  message: DisplayMessage;
  color: string;
  onDelete?: (id: string) => void;
  onEditStart?: (id: string, text: string) => void;
  onMove?: (thoughtId: string, targetBucket: string) => void;
  allBuckets: BucketSummary[];
  currentBucket: string;
}) {
  const t = useTranslations("thoughts");

  const canEdit = onEditStart && !message._pending && !message._failed && !!message.text;
  const canDelete = onDelete && (!message._pending || message._failed);
  const canMove = onMove && !message._pending && !message._failed;

  return (
    <div className="group/msg flex items-end justify-end gap-1 py-0.5">
      {(canEdit || canDelete || canMove) && (
        <div className="flex shrink-0 items-center gap-1 self-center opacity-0 transition-opacity group-hover/msg:opacity-100">
          {canMove && (
            <MoveBucketMenu
              buckets={allBuckets}
              currentBucket={currentBucket}
              onMove={(target) => onMove(message.id, target)}
            />
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEditStart(message.id, message.text)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              aria-label={t("edit_aria")}>
              <PencilIcon className="size-3" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="text-muted-foreground hover:text-destructive p-1 transition-colors"
              aria-label={t("delete_aria")}>
              <TrashIcon className="size-3" />
            </button>
          )}
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
              {formatTime(message.created_at)}
            </span>
            {message._pending && (
              <span className="text-[9px] leading-none" aria-label={t("status_sending")}>
                ⏱
              </span>
            )}
            {message._failed && (
              <span
                className="text-[9px] leading-none text-red-400"
                aria-label={t("status_failed")}>
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
  bucket: string;
  bucketLabel: string;
  color: string;
  onBack: () => void;
  searchQuery: string;
  extraMessages?: DisplayMessage[];
  onDelete?: (id: string) => void;
  onEditStart?: (id: string, text: string) => void;
  onMove?: (thoughtId: string, targetBucket: string) => void;
  allBuckets?: BucketSummary[];
}

export const ThoughtsBucketChat = memo(function ThoughtsBucketChat({
  bucket,
  bucketLabel,
  color,
  onBack,
  searchQuery,
  extraMessages = [],
  onDelete,
  onEditStart,
  onMove,
  allBuckets = [],
}: ThoughtsBucketChatProps) {
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
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="bg-background/80 hover:bg-surface flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors"
          aria-label="Back">
          <ChevronLeftIcon className="text-ink/60 size-5" />
        </button>

        <p className="text-ink text-base font-semibold">{bucketLabel}</p>
      </div>

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
              color={color}
              onDelete={onDelete}
              onEditStart={onEditStart}
              onMove={onMove}
              allBuckets={allBuckets}
              currentBucket={bucket}
            />
          )}
        />
      )}
    </motion.div>
  );
});
