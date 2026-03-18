"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { useComments } from "@/app/_libs/hooks/useComments";
import { ReplyInput } from "@/components/groups/reply-input";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { GroupRole, DropComment } from "@/app/_libs/types/groups";

interface CommentThreadProps {
  groupShareId: string;
  groupId?: string;
  currentUserId: string;
  userRole: GroupRole;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface CommentItemProps {
  comment: DropComment | DropComment["replies"][number];
  currentUserId: string;
  onEditStart: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReply?: (id: string, authorName: string, text: string) => void;
  isReply?: boolean;
  isContinuation?: boolean;
  quotedAuthor?: string;
  quotedText?: string;
}

function CommentItem({
  comment,
  currentUserId,
  onEditStart,
  onDelete,
  onReply,
  isReply = false,
  isContinuation = false,
  quotedAuthor,
  quotedText,
}: CommentItemProps) {
  const t = useTranslations("groups");
  const isOwn = comment.user_id === currentUserId;

  /* Actions shown on hover, outside the bubble */
  const actions = (
    <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity self-center shrink-0">
      {!isReply && onReply && (
        <button
          type="button"
          onClick={() => onReply(
            comment.id,
            comment.author.display_name ?? comment.author.handle ?? t("anonymous"),
            comment.comment_text,
          )}
          className="text-[9px] text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          {t("reply")}
        </button>
      )}
      {isOwn && (
        <>
          <button
            type="button"
            onClick={() => onEditStart(comment.id, comment.comment_text)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={t("edit_comment_aria")}
          >
            <PencilIcon className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="text-muted-foreground hover:text-error-foreground transition-colors p-1"
            aria-label={t("delete_comment_aria")}
          >
            <TrashIcon className="size-3" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className={`group/comment flex items-end gap-1 ${isOwn ? "justify-end" : "justify-start"} ${isReply ? "mt-2" : ""}`}>
      {/* Avatar — others only */}
      {!isOwn && (
        <div className="shrink-0">
          {comment.author.avatar_url ? (
            <Image
              src={comment.author.avatar_url}
              alt={comment.author.display_name ?? ""}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              {(comment.author.display_name ?? comment.author.handle ?? "?")[0]?.toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Own message: actions on left, then bubble */}
      {isOwn && actions}

      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {/* Name — others only, hidden for continuation runs */}
        {!isOwn && !isContinuation && (
          <span className="text-[10px] text-muted-foreground font-medium px-1">
            {comment.author.display_name ?? comment.author.handle ?? t("anonymous")}
          </span>
        )}

        {/* Bubble — time inside */}
        <div
          className={`rounded-2xl px-3 py-2 text-xs leading-relaxed break-words ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-surface border border-border/60 text-foreground rounded-tl-sm"
          }`}
        >
          {quotedAuthor && quotedText && (
            <div className={`mb-2 flex gap-2 rounded-lg px-2 py-1.5 ${isOwn ? "bg-primary-foreground/10" : "bg-muted/60"}`}>
              <div className={`w-0.5 shrink-0 rounded-full ${isOwn ? "bg-primary-foreground/50" : "bg-primary"}`} />
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold truncate ${isOwn ? "text-primary-foreground/80" : "text-primary"}`}>
                  {quotedAuthor}
                </p>
                <p className={`text-[10px] truncate mt-0.5 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {quotedText}
                </p>
              </div>
            </div>
          )}
          <span className="break-words">
            {comment.comment_text}
            <span className={`inline-block align-bottom ml-2 text-[9px] font-mono leading-none ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
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

export function CommentThread({
  groupShareId,
  groupId,
  currentUserId,
  userRole: _userRole,
}: CommentThreadProps) {
  const t = useTranslations("groups");
  const {
    comments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addComment,
    editComment,
    deleteComment,
    isAdding,
  } = useComments(groupShareId, groupId);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string; text: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) fetchNextPage(); },
      { rootMargin: "60px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col gap-3">
      <div className="no-scrollbar max-h-[300px] overflow-y-auto flex flex-col">
        {comments.map((comment, index) => {
          const prev = comments[index - 1];
          const isContinuation = !!prev && prev.user_id === comment.user_id;
          return (
          <div key={comment.id} className={isContinuation ? "mt-1" : index === 0 ? "" : "mt-3"}>
            <CommentItem
              comment={comment}
              currentUserId={currentUserId}
              isContinuation={isContinuation}
              onEditStart={(id, text) => setEditingComment({ id, text })}
              onDelete={(id) => deleteComment(id, currentUserId)}
              onReply={(id, authorName, text) => setReplyingTo({ id, authorName, text })}
            />

            {/* Replies */}
            {"replies" in comment &&
              comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onEditStart={(id, text) => setEditingComment({ id, text })}
                  onDelete={(id) => deleteComment(id, currentUserId)}
                  isReply
                  quotedAuthor={comment.author.display_name ?? comment.author.handle ?? t("anonymous")}
                  quotedText={comment.comment_text}
                />
              ))}

          </div>
          );
        })}
        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
      </div>

      <div className="flex flex-col gap-0">
        {/* WhatsApp-style reply/edit context banner */}
        {(replyingTo || editingComment) && (
          <div className="relative flex items-stretch gap-2 rounded-t-2xl border border-b-0 border-border bg-muted/60 px-4 py-3">
            {/* Left accent */}
            <div className="w-0.5 shrink-0 rounded-full bg-primary" />
            <div className="flex-1 min-w-0 pl-2">
              <p className="text-[11px] font-semibold text-primary truncate">
                {replyingTo ? replyingTo.authorName : t("editing")}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {replyingTo ? replyingTo.text : editingComment?.text}
              </p>
            </div>
            {/* × dismiss — circular */}
            <button
              type="button"
              onClick={() => { setReplyingTo(null); setEditingComment(null); }}
              className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30 hover:text-foreground transition-colors text-[12px] leading-none"
              aria-label="dismiss"
            >
              ×
            </button>
          </div>
        )}
        <ReplyInput
          key={editingComment ? `edit-${editingComment.id}` : replyingTo ? `reply-${replyingTo.id}` : "new"}
          initialValue={editingComment?.text}
          placeholder={replyingTo ? `${t("reply_to")} ${replyingTo.authorName}…` : undefined}
          squareTop={!!(replyingTo || editingComment)}
          onSubmit={(text) => {
            if (editingComment) {
              editComment(editingComment.id, text, currentUserId);
              setEditingComment(null);
            } else {
              addComment(text, currentUserId, replyingTo?.id ?? null);
              setReplyingTo(null);
            }
          }}
          isLoading={isAdding}
        />
      </div>
    </div>
  );
}
