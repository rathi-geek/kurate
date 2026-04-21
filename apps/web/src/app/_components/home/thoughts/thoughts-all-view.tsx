import { useEffect, useRef } from "react";

import { motion } from "framer-motion";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { getBucketDotColor } from "@kurate/utils";

import { useTranslations } from "@/i18n/use-translations";
import { PencilIcon, TrashIcon, ArrowRightLeftIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type DisplayMessage, formatTime } from "@/app/_components/home/thoughts/utils";
import type { BucketSummary } from "@kurate/hooks";

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

function ThoughtBubbleAll({
  message,
  onDelete,
  onEditStart,
  onMove,
  allBuckets,
  bucketLabel,
  bucketColor,
}: {
  message: DisplayMessage;
  onDelete?: (id: string) => void;
  onEditStart?: (id: string, text: string) => void;
  onMove?: (thoughtId: string, targetBucket: string) => void;
  allBuckets: BucketSummary[];
  bucketLabel: string;
  bucketColor: string;
}) {
  const t = useTranslations("thoughts");
  const color = bucketColor;

  const canEdit = onEditStart && !message._pending && !message._failed && !!message.text;
  const canDelete = onDelete && (!message._pending || message._failed);
  const canMove = onMove && !message._pending && !message._failed;

  return (
    <div className="group/msg flex items-end justify-end gap-1 px-5 py-0.5">
      {(canEdit || canDelete || canMove) && (
        <div className="flex shrink-0 items-center gap-1 self-center opacity-0 transition-opacity group-hover/msg:opacity-100">
          {canMove && (
            <MoveBucketMenu
              buckets={allBuckets}
              currentBucket={message.bucket}
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
          <p className="leading-snug whitespace-pre-wrap">{message.text || t("image_fallback")}</p>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <span className="text-ink/40 text-[9px]">{bucketLabel}</span>
            <span className="text-ink/40 flex items-center gap-1 text-[9px]">
              {formatTime(message.created_at)}
              {message._pending && <span aria-label={t("status_sending")}>⏱</span>}
              {message._failed && (
                <span aria-label={t("status_failed")} className="text-red-400">
                  !
                </span>
              )}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface ThoughtsAllViewProps {
  messages: DisplayMessage[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchMore: () => void;
  scrollToBottomTrigger?: number;
  onDelete?: (id: string) => void;
  onEditStart?: (id: string, text: string) => void;
  onMove?: (thoughtId: string, targetBucket: string) => void;
  allBuckets?: BucketSummary[];
  /** slug → { label, color } map */
  bucketMap: Record<string, { label: string; color: string }>;
}

export function ThoughtsAllView({
  messages,
  hasNextPage,
  isFetchingNextPage,
  onFetchMore,
  scrollToBottomTrigger,
  onDelete,
  onEditStart,
  onMove,
  allBuckets = [],
  bucketMap,
}: ThoughtsAllViewProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (scrollToBottomTrigger && messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottomTrigger]);

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data={messages}
      initialTopMostItemIndex={messages.length - 1}
      followOutput="smooth"
      startReached={() => {
        if (hasNextPage && !isFetchingNextPage) onFetchMore();
      }}
      itemContent={(_, m) => {
        const info = bucketMap[m.bucket] ?? { label: m.bucket, color: "#D1FAE5" };
        return (
          <ThoughtBubbleAll
            message={m}
            onDelete={onDelete}
            onEditStart={onEditStart}
            onMove={onMove}
            allBuckets={allBuckets}
            bucketLabel={info.label}
            bucketColor={info.color}
          />
        );
      }}
    />
  );
}
