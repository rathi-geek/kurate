"use client";

import Image from "next/image";

import type { DropComment } from "@kurate/types";
import { formatRelativeTime } from "@kurate/utils";

import { PencilIcon, TrashIcon } from "@/components/icons";
import { avatarUrl } from "@/app/_libs/utils/getMediaUrl";
import { useTranslations } from "@/i18n/use-translations";

const URL_PATTERN = /https?:\/\/[^\s]+/g;

export function renderTextWithLinks(text: string, isOwn: boolean): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline break-all ${isOwn ? "text-primary-foreground/90 hover:text-primary-foreground" : "text-primary hover:text-primary/80"}`}>
        {url}
      </a>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export interface CommentItemProps {
  comment: DropComment;
  currentUserId: string;
  onEditStart: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReply?: (id: string, authorName: string, text: string) => void;
  isContinuation?: boolean;
  spacing?: "none" | "compact" | "normal";
  allComments?: DropComment[];
}

export function CommentItem({
  comment,
  currentUserId,
  onEditStart,
  onDelete,
  onReply,
  isContinuation = false,
  spacing = "none",
  allComments = [],
}: CommentItemProps) {
  const t = useTranslations("groups");
  const isOwn = comment.user_id === currentUserId;

  // Look up parent comment for quoted context (DM-style)
  const parentComment = comment.parent_comment_id
    ? allComments.find((c) => c.id === comment.parent_comment_id)
    : null;
  const quotedAuthor = parentComment
    ? (parentComment.author_display_name ?? parentComment.author_handle ?? t("anonymous"))
    : undefined;
  const quotedText = parentComment?.comment_text;

  /* Actions shown on hover, outside the bubble */
  const actions = (
    <div className="flex shrink-0 items-center gap-1 self-center opacity-0 transition-opacity group-hover/comment:opacity-100">
      {onReply && (
        <button
          type="button"
          onClick={() =>
            onReply(
              comment.id,
              comment.author_display_name ?? comment.author_handle ?? t("anonymous"),
              comment.comment_text,
            )
          }
          className="text-muted-foreground hover:text-foreground px-1 text-[9px] transition-colors">
          {t("reply")}
        </button>
      )}
      {isOwn && (
        <>
          <button
            type="button"
            onClick={() => onEditStart(comment.id, comment.comment_text)}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            aria-label={t("edit_comment_aria")}>
            <PencilIcon className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="text-muted-foreground hover:text-error-foreground p-1 transition-colors"
            aria-label={t("delete_comment_aria")}>
            <TrashIcon className="size-3" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div
      className={`group/comment flex items-end gap-1 ${isOwn ? "justify-end" : "justify-start"} ${
        spacing === "compact" ? "pt-1" : spacing === "normal" ? "pt-3" : ""
      }`}>
      {/* Avatar — others only */}
      {!isOwn && (
        <div className="shrink-0">
          {avatarUrl(comment.author_avatar_path) ? (
            <Image
              src={avatarUrl(comment.author_avatar_path)!}
              alt={comment.author_display_name ?? ""}
              width={24}
              height={24}
              className="size-6 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-[10px] font-bold">
              {(comment.author_display_name ?? comment.author_handle ?? "?")[0]?.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Own message: actions on left, then bubble */}
      {isOwn && actions}

      <div className={`flex max-w-[75%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {/* Name — others only, hidden for continuation runs */}
        {!isOwn && !isContinuation && (
          <span className="text-muted-foreground px-1 text-[10px] font-medium">
            {comment.author_display_name ?? comment.author_handle ?? t("anonymous")}
          </span>
        )}

        {/* Bubble — time inside */}
        <div
          className={`rounded-2xl px-3 py-2 text-xs leading-relaxed break-words ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-surface border-border/60 text-foreground rounded-tl-sm border"
          }`}>
          {quotedAuthor && quotedText && (
            <div
              className={`mb-2 flex gap-2 rounded-lg px-2 py-1.5 ${isOwn ? "bg-primary-foreground/10" : "bg-muted/60"}`}>
              <div
                className={`w-0.5 shrink-0 rounded-full ${isOwn ? "bg-primary-foreground/50" : "bg-primary"}`}
              />
              <div className="min-w-0">
                <p
                  className={`truncate text-[10px] font-semibold ${isOwn ? "text-primary-foreground/80" : "text-primary"}`}>
                  {quotedAuthor}
                </p>
                <p
                  className={`mt-0.5 truncate text-[10px] ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {quotedText}
                </p>
              </div>
            </div>
          )}
          <span className="break-words">
            {renderTextWithLinks(comment.comment_text, isOwn)}
            <span
              className={`ml-2 inline-block align-bottom font-mono text-[9px] leading-none ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              {formatRelativeTime(comment.created_at)}
            </span>
          </span>
        </div>
      </div>

      {/* Others' message: actions on right */}
      {!isOwn && actions}
    </div>
  );
}
