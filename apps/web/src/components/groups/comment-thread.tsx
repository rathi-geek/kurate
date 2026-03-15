"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { useComments } from "@/app/_libs/hooks/useComments";
import { ReplyInput } from "@/components/groups/reply-input";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { GroupRole, DropComment } from "@/app/_libs/types/groups";

interface CommentThreadProps {
  groupShareId: string;
  currentUserId: string;
  userRole: GroupRole;
  totalCommentCount?: number;
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
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply?: () => void;
  isReply?: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const t = useTranslations("groups");
  const [isEditing, setIsEditing] = useState(false);
  const isOwn = comment.user_id === currentUserId;

  const handleEditSubmit = (text: string) => {
    onEdit(comment.id, text);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={isReply ? "ml-8" : ""}>
        <ReplyInput
          initialValue={comment.comment_text}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isReply ? "ml-8" : ""}`}>
      {/* Avatar — others only */}
      {!isOwn && (
        <div className="shrink-0 mr-2 self-end">
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

      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {/* Name — others only */}
        {!isOwn && (
          <span className="text-[10px] text-muted-foreground font-medium px-1">
            {comment.author.display_name ?? comment.author.handle ?? t("anonymous")}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3 py-2 text-xs leading-relaxed break-words ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-surface border border-border/60 text-foreground rounded-tl-sm"
          }`}
        >
          {comment.comment_text}
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-2 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[9px] text-muted-foreground font-mono">
            {formatRelativeTime(comment.created_at)}
          </span>
          {!isReply && onReply && (
            <button
              type="button"
              onClick={onReply}
              className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("reply")}
            </button>
          )}
          {isOwn && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t("edit_comment_aria")}
              >
                <PencilIcon className="size-3 inline" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-[9px] text-muted-foreground hover:text-error-foreground transition-colors"
                aria-label={t("delete_comment_aria")}
              >
                <TrashIcon className="size-3 inline" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentThread({
  groupShareId,
  currentUserId,
  userRole: _userRole,
  totalCommentCount,
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
  } = useComments(groupShareId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const totalCount = totalCommentCount ?? comments.length;
  const showAll = !collapsed || comments.length <= 1;
  const visibleComments = showAll ? comments : [comments[comments.length - 1]!].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {/* Collapse toggle — show only when there are multiple comments */}
      {collapsed && totalCount > 1 && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="text-xs text-primary hover:text-primary/80 transition-colors text-left"
        >
          View all {totalCount} comments
        </button>
      )}

      {/* Load more — only when expanded */}
      {!collapsed && hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          {isFetchingNextPage ? t("loading") : t("load_more_comments")}
        </button>
      )}

      <div className="flex flex-col gap-3">
        {visibleComments.map((comment) => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              currentUserId={currentUserId}
              onEdit={(id, content) => editComment(id, content, currentUserId)}
              onDelete={(id) => deleteComment(id, currentUserId)}
              onReply={() => setReplyingTo(comment.id)}
            />

            {/* Replies */}
            {"replies" in comment &&
              comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onEdit={(id, content) => editComment(id, content, currentUserId)}
                  onDelete={(id) => deleteComment(id, currentUserId)}
                  isReply
                />
              ))}

            {/* Inline reply input */}
            {replyingTo === comment.id && (
              <div className="ml-8 mt-2">
                <ReplyInput
                  placeholder={t("reply_placeholder")}
                  onSubmit={(text) => {
                    addComment(text, currentUserId, comment.id);
                    setReplyingTo(null);
                  }}
                  onCancel={() => setReplyingTo(null)}
                  isLoading={isAdding}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <ReplyInput
        onSubmit={(text) => addComment(text, currentUserId, null)}
        isLoading={isAdding}
      />
    </div>
  );
}
