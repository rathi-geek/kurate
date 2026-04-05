import { useEffect, useRef } from "react";

import { motion } from "framer-motion";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { BUCKET_META } from "@kurate/utils";

import { useTranslations } from "@/i18n/use-translations";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { type DisplayMessage, formatTime } from "@/app/_components/home/thoughts/utils";

function ThoughtBubbleAll({
  message,
  onDelete,
  onEditStart,
}: {
  message: DisplayMessage;
  onDelete?: (id: string) => void;
  onEditStart?: (id: string, text: string) => void;
}) {
  const t = useTranslations("thoughts");
  const meta = BUCKET_META[message.bucket];

  const canEdit = onEditStart && !message._pending && !message._failed && !!message.text;
  const canDelete = onDelete && (!message._pending || message._failed);

  return (
    <div className="group/msg flex items-end justify-end gap-1 px-5 py-0.5">
      {(canEdit || canDelete) && (
        <div className="flex shrink-0 items-center gap-1 self-center opacity-0 transition-opacity group-hover/msg:opacity-100">
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
          style={{ backgroundColor: `var(${meta.colorVar})` }}
          animate={{ opacity: message._pending || message._failed ? 0.7 : 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}>
          <p className="leading-snug whitespace-pre-wrap">{message.text || t("image_fallback")}</p>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <span className="text-ink/40 text-[9px]">{meta.label}</span>
            <span className="text-ink/40 flex items-center gap-1 text-[9px]">
              {formatTime(message.createdAt)}
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
}

export function ThoughtsAllView({
  messages,
  hasNextPage,
  isFetchingNextPage,
  onFetchMore,
  scrollToBottomTrigger,
  onDelete,
  onEditStart,
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
      itemContent={(_, m) => (
        <ThoughtBubbleAll message={m} onDelete={onDelete} onEditStart={onEditStart} />
      )}
    />
  );
}
