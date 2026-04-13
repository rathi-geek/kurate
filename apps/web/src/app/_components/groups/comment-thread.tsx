"use client";

import { useEffect, useRef, useState } from "react";

import type { GroupRole } from "@kurate/types";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import { CommentItem, type CommentItemProps } from "@/app/_components/groups/comment-item";
import { ReplyInput } from "@/app/_components/groups/reply-input";
import { useComments } from "@/app/_libs/hooks/useComments";
import { useTranslations } from "@/i18n/use-translations";

interface CommentThreadProps {
  groupShareId: string;
  groupId?: string;
  currentUserId: string;
  userRole: GroupRole;
  lastSeenAt?: string | null;
  onCommentAdded?: () => void;
  currentUserProfile?: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
    handle: string;
  };
}

export function CommentThread({
  groupShareId,
  groupId,
  currentUserId,
  userRole: _userRole,
  lastSeenAt,
  onCommentAdded,
  currentUserProfile,
}: CommentThreadProps) {
  const t = useTranslations("groups");
  const {
    comments,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addComment,
    editComment,
    deleteComment,
    isAdding,
  } = useComments(groupShareId, groupId, currentUserProfile);
  const [listHeight, setListHeight] = useState(0);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
    text: string;
  } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const threadBottomRef = useRef<HTMLDivElement>(null);

  // ── Unread divider ──────────────────────────────────────────────────
  // Find the first comment newer than lastSeenAt (snapshot from before markPostSeen).
  const unreadStartIndex = (() => {
    if (comments.length === 0) return -1;
    // Never seen → all comments are unread (but only count others' messages)
    if (lastSeenAt === null || lastSeenAt === undefined) {
      const idx = comments.findIndex((c) => c.user_id !== currentUserId);
      return idx; // -1 if all comments are own
    }
    // Find first comment from another user that's newer than lastSeenAt
    const idx = comments.findIndex((c) => c.created_at > lastSeenAt && c.user_id !== currentUserId);
    return idx; // -1 means all seen
  })();
  const unreadCount =
    unreadStartIndex >= 0
      ? comments.slice(unreadStartIndex).filter((c) => c.user_id !== currentUserId).length
      : 0;

  // Scroll to the divider (or bottom if no divider) once on open.
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (isLoading || comments.length === 0 || hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    const scrollTarget =
      unreadStartIndex > 0
        ? Math.max(0, unreadStartIndex - 1) // one item above divider for context
        : comments.length - 1;
    virtuosoRef.current?.scrollToIndex({
      index: scrollTarget,
      align: unreadStartIndex > 0 ? "start" : "end",
      behavior: "smooth",
    });
  }, [isLoading, comments.length, unreadStartIndex]);

  // Scroll the main feed so the input is visible when the thread first opens.
  // Delay by 220ms to fire after the AnimatePresence height animation (200ms) finishes.
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = threadBottomRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Only scroll if the bottom of the element is below the 80vh mark
      // (scrollMarginBottom: 20vh means the target position is 80vh)
      if (rect.bottom > window.innerHeight * 0.8) {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 220);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="border-border border-t-primary size-5 animate-spin rounded-full border-2" />
        </div>
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          totalListHeightChanged={(h) => setListHeight(h)}
          style={{ height: Math.min(listHeight || comments.length * 56, 250) }}
          data={comments}
          initialTopMostItemIndex={comments.length > 0 ? comments.length - 1 : 0}
          followOutput="smooth"
          startReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          itemContent={(index, comment) => {
            const prev = comments[index - 1];
            const isContinuation = !!prev && prev.user_id === comment.user_id;
            const spacing: CommentItemProps["spacing"] = isContinuation
              ? "compact"
              : index === 0
                ? "none"
                : "normal";
            const showDivider = index === unreadStartIndex && unreadCount > 0;
            return (
              <div>
                {showDivider && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="border-primary/40 flex-1 border-t" />
                    <span className="text-primary text-[10px] font-semibold whitespace-nowrap">
                      {unreadCount === 1
                        ? t("new_message_singular")
                        : t("new_messages", { count: unreadCount })}
                    </span>
                    <div className="border-primary/40 flex-1 border-t" />
                  </div>
                )}
                <CommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  isContinuation={isContinuation}
                  spacing={spacing}
                  onEditStart={(id, text) => setEditingComment({ id, text })}
                  onDelete={(id) => deleteComment(id, currentUserId)}
                  onReply={(id, authorName, text) => setReplyingTo({ id, authorName, text })}
                  allComments={comments}
                />
              </div>
            );
          }}
        />
      )}

      <div
        ref={threadBottomRef}
        className="flex flex-col gap-0"
        style={{ scrollMarginBottom: "20vh" }}>
        {/* WhatsApp-style reply/edit context banner */}
        {(replyingTo || editingComment) && (
          <div className="border-border bg-muted/60 relative flex items-stretch gap-2 rounded-t-2xl border border-b-0 px-4 py-3">
            {/* Left accent */}
            <div className="bg-primary w-0.5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 pl-2">
              <p className="text-primary truncate text-[11px] font-semibold">
                {replyingTo ? replyingTo.authorName : t("editing")}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                {replyingTo ? replyingTo.text : editingComment?.text}
              </p>
            </div>
            {/* × dismiss — circular */}
            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setEditingComment(null);
              }}
              className="bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30 hover:text-foreground absolute top-2 right-2 flex size-5 items-center justify-center rounded-full text-[12px] leading-none transition-colors"
              aria-label="dismiss">
              ×
            </button>
          </div>
        )}
        <ReplyInput
          key={
            editingComment
              ? `edit-${editingComment.id}`
              : replyingTo
                ? `reply-${replyingTo.id}`
                : "new"
          }
          initialValue={editingComment?.text}
          placeholder={replyingTo ? `${t("reply_to")} ${replyingTo.authorName}…` : undefined}
          squareTop={!!(replyingTo || editingComment)}
          onSubmit={(text) => {
            if (editingComment) {
              editComment(editingComment.id, text, currentUserId);
              setEditingComment(null);
            } else {
              addComment(text, currentUserId, replyingTo?.id ?? null);
              onCommentAdded?.();
              setReplyingTo(null);
              // Scroll to bottom so the new comment is visible
              requestAnimationFrame(() => {
                virtuosoRef.current?.scrollToIndex({
                  index: "LAST",
                  align: "end",
                  behavior: "smooth",
                });
              });
            }
          }}
          isLoading={isAdding}
        />
      </div>
    </div>
  );
}
