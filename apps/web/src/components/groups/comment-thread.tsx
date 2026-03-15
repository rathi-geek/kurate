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
  const isAuthor = comment.user_id === currentUserId;

  const handleEditSubmit = (text: string) => {
    onEdit(comment.id, text);
    setIsEditing(false);
  };

  return (
    <div className={`flex gap-2 ${isReply ? "ml-8" : ""}`}>
      {/* Avatar */}
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

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">
            {comment.author.display_name ?? comment.author.handle ?? t("anonymous")}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>

        {isEditing ? (
          <ReplyInput
            initialValue={comment.content}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <p className="text-xs text-foreground mt-0.5 break-words">{comment.content}</p>
        )}

        <div className="flex items-center gap-2 mt-1">
          {!isReply && onReply && (
            <button
              type="button"
              onClick={onReply}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("reply")}
            </button>
          )}
          {isAuthor && !isEditing && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t("edit_comment_aria")}
              >
                <PencilIcon className="size-3 inline" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-[10px] text-muted-foreground hover:text-error-foreground transition-colors"
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

  return (
    <div className="flex flex-col gap-3">
      {/* Load more — older comments above */}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          {isFetchingNextPage ? t("loading") : t("load_more_comments")}
        </button>
      )}

      <div className="flex flex-col gap-3">
        {comments.map((comment) => (
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
