"use client";

import { memo, useEffect, useRef, useState } from "react";

import Image from "next/image";

import type { GroupDrop, GroupProfile, GroupRole } from "@kurate/types";
import { AnimatePresence, motion } from "framer-motion";

import { useRouter } from "next/navigation";

import { CommentThread } from "@/app/_components/groups/comment-thread";
import { DropItemPreview } from "@/app/_components/groups/drop-item-preview";
import { EngagementBar } from "@/app/_components/groups/engagement-bar";
import { VaultShareModal } from "@/app/_components/vault/VaultShareModal";
import { useRefreshLoggedItem } from "@/app/_libs/hooks/useRefreshLoggedItem";
import { track } from "@/app/_libs/utils/analytics";
import { formatRelativeTime } from "@kurate/utils";
import { ChevronDownIcon, ShareIcon, TrashIcon } from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

interface FeedShareCardProps {
  drop: GroupDrop;
  currentUserId: string;
  groupId: string;
  userRole: GroupRole;
  currentUserProfile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    handle: string;
  };
  onDelete?: (dropId: string) => void;
  markPostSeen?: (postId: string, seenAt: string) => void;
  context?: "group" | "discovery";
}

function ReactionPill({ reactors, label }: { reactors: GroupProfile[]; label: string }) {
  return (
    <div className="bg-surface border-border/50 text-muted-foreground flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]">
      <div className="flex -space-x-1">
        {reactors.slice(0, 3).map((r) => (
          r.avatar_url ? (
            <Image
              key={r.id}
              src={r.avatar_url}
              alt={r.display_name ?? ""}
              width={16}
              height={16}
              className="ring-card size-4 rounded-full object-cover ring-1"
            />
          ) : (
            <div
              key={r.id}
              className="bg-primary text-primary-foreground ring-card flex size-4 items-center justify-center rounded-full text-[8px] font-bold ring-1">
              {(r.display_name ?? r.handle ?? "?")[0]?.toUpperCase()}
            </div>
          )
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}

export const FeedShareCard = memo(function FeedShareCard({
  drop,
  currentUserId,
  groupId,
  userRole,
  currentUserProfile,
  onDelete,
  markPostSeen,
  context = "group",
}: FeedShareCardProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const isDiscovery = context === "discovery";
  const isSharer = drop.sharer.id === currentUserId;
  const hasMustRead = drop.engagement.mustRead.count > 0;
  const [showComments, setShowComments] = useState(false);
  // Seen status comes from the feed query (embedded via LEFT JOIN) — no separate query needed
  // Discovery context has no real-time subscriptions, so skip new-comment tracking
  const hasNewComments =
    !isDiscovery &&
    !showComments &&
    !!drop.latestCommentAt &&
    (drop.seenAt === null || drop.latestCommentAt > drop.seenAt);
  // Snapshot seenAt at the moment the thread opens — used for the "N new messages" divider.
  // Must be captured BEFORE markPostSeen overwrites drop.seenAt.
  const unreadDividerAtRef = useRef<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Track latest values for the IntersectionObserver closure (avoids stale captures)
  const latestCommentAtRef = useRef(drop.latestCommentAt);
  latestCommentAtRef.current = drop.latestCommentAt;

  const handleLinkOpen = () => {
    if (!drop.item) return;
    track("link_opened", {
      context: "group_feed",
      content_type: drop.item.content_type,
      source: (drop.item.raw_metadata as Record<string, string> | null)?.source ?? null,
    });
  };

  useRefreshLoggedItem(
    drop.item
      ? {
          id: drop.logged_item_id ?? "",
          url: drop.item.url,
          title: drop.item.title ?? null,
          preview_image_url: drop.item.preview_image_url ?? null,
        }
      : null,
  );

  useEffect(() => {
    if (!showComments) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          // Persist latest timestamp before closing so DB is up-to-date on reopen
          if (latestCommentAtRef.current) markPostSeen?.(drop.id, latestCommentAtRef.current);
          unreadDividerAtRef.current = null;
          setShowComments(false);
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showComments]);

  // Keep seenAt up-to-date whenever the thread is open and new comments arrive
  // (covers others' realtime messages while the thread is open)
  useEffect(() => {
    if (!showComments || !drop.latestCommentAt || !markPostSeen) return;
    markPostSeen(drop.id, drop.latestCommentAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments, drop.latestCommentAt]);

  return (
    <div ref={cardRef}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex min-w-0 items-center gap-2">
            {drop.sharer.avatar_url ? (
              <Image
                src={drop.sharer.avatar_url}
                alt={drop.sharer.display_name ?? ""}
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {(drop.sharer.display_name ?? drop.sharer.handle ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-foreground text-sm font-semibold">
                {isSharer
                  ? "YOU"
                  : (drop.sharer.display_name ?? drop.sharer.handle ?? t("anonymous"))}
              </span>
              <span className="text-muted-foreground ml-1.5 text-xs">
                dropped · {formatRelativeTime(drop.shared_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Share — visible when drop has a linked item */}
          {drop.item && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded-badge text-muted-foreground hover:text-foreground hover:bg-ink/6 shrink-0 p-1 transition-colors"
              aria-label="Share">
              <ShareIcon className="size-3.5" />
            </button>
          )}

          {/* Delete — sharer or owner only */}
          {(isSharer || userRole === "owner") && onDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleting(true);
                onDelete(drop.id);
              }}
              className={`rounded-badge shrink-0 p-1 transition-colors ${
                isDeleting
                  ? "text-muted-foreground/40 pointer-events-none"
                  : "text-muted-foreground hover:text-error-foreground hover:bg-error-bg"
              }`}
              aria-label={t("delete_drop_aria")}>
              <TrashIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <motion.article
        id={`drop-${drop.id}`}
        whileHover={{ boxShadow: "0 8px 20px rgba(0,0,0,0.09)", transition: { duration: 0.15 } }}
        className={`rounded-card bg-card overflow-hidden border shadow-sm transition-colors ${
          hasMustRead ? "border-warning-foreground/30 bg-warning-bg/40" : "border-border"
        }`}>
        <div className="p-4 pt-0">
          {/* Sharer note — green tinted card */}
          {drop.note && (
            <div className="py-2">
              <p className="text-ink text-md leading-relaxed italic">{drop.note}</p>
            </div>
          )}
          {/* Link drop: full-width preview image + title */}
          {drop.item && (
            <DropItemPreview
              item={drop.item}
              mustReadCount={drop.engagement.mustRead.count}
              mustReadLabel={t("must_read")}
              onLinkOpen={handleLinkOpen}
            />
          )}

          {/* Text-only drop */}
          {!drop.item && drop.content && (
            <p className="text-foreground pt-4 pb-2 text-base leading-relaxed">{drop.content}</p>
          )}

          {/* Reaction summary pills */}
          {(drop.engagement.like.count > 0 || drop.engagement.mustRead.count > 0) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {drop.engagement.like.count > 0 && (
                <ReactionPill reactors={drop.engagement.like.reactors} label="liked" />
              )}
              {drop.engagement.mustRead.count > 0 && (
                <ReactionPill reactors={drop.engagement.mustRead.reactors} label="recommended" />
              )}
            </div>
          )}

          <div className="border-border/50 border-t pt-2">
            <EngagementBar
              groupPostId={drop.id}
              groupId={groupId}
              url={drop.item?.url ?? ""}
              currentUserId={currentUserId}
              engagement={drop.engagement}
              itemData={
                drop.item
                  ? {
                      title: drop.item.title,
                      source: (drop.item.raw_metadata as Record<string, string> | null)?.source,
                      preview_image: drop.item.preview_image_url,
                      content_type: drop.item.content_type as "article" | "video" | "podcast",
                      read_time: (drop.item.raw_metadata as Record<string, string> | null)
                        ?.read_time,
                    }
                  : undefined
              }
              source="group_feed"
              commentCount={drop.commentCount}
              hasNewComments={hasNewComments}
              showSaveToVault={!!drop.item}
              context={context}
              onCommentIconClick={
                isDiscovery
                  ? () => {
                      track("discovery_view_in_group", { postId: drop.id });
                      router.push(`/groups/${drop.convo_id}#drop-${drop.id}`);
                    }
                  : () => {
                      const opening = !showComments;
                      if (opening) {
                        unreadDividerAtRef.current = drop.seenAt;
                        if (drop.latestCommentAt) markPostSeen?.(drop.id, drop.latestCommentAt);
                      } else {
                        // Closing: persist latest timestamp so DB is up-to-date on reopen
                        if (drop.latestCommentAt) markPostSeen?.(drop.id, drop.latestCommentAt);
                        unreadDividerAtRef.current = null;
                      }
                      setShowComments((v) => !v);
                    }
              }
            />
          </div>
        </div>

        {/* Latest comment preview — visible when thread is closed (group context only) */}
        {!isDiscovery && !showComments && drop.latestComment && (
          <button
            type="button"
            onClick={() => {
              unreadDividerAtRef.current = drop.seenAt;
              if (drop.latestCommentAt) markPostSeen?.(drop.id, drop.latestCommentAt);
              setShowComments(true);
            }}
            className="border-border/50 hover:bg-muted/30 w-full border-t px-4 py-3 text-left transition-colors">
            <div className="flex items-center gap-2">
              {/* Avatar */}
              {drop.latestComment.authorAvatarUrl ? (
                <Image
                  src={drop.latestComment.authorAvatarUrl}
                  alt={drop.latestComment.authorName ?? ""}
                  width={24}
                  height={24}
                  className="size-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  {(drop.latestComment.authorName ?? "?")[0]?.toUpperCase()}
                </div>
              )}
              {/* Author + extra count + text */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs leading-relaxed">
                  <span className="text-foreground font-semibold">
                    {drop.latestComment.authorName}
                  </span>
                  {drop.commentCount > 1 && (
                    <span className="text-muted-foreground ml-1 text-[10px]">
                      +{drop.commentCount - 1} more
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {drop.latestComment.text}
                </p>
              </div>
              {/* Chevron */}
              <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" />
            </div>
          </button>
        )}

        {/* Comment thread — shown on demand (group context only) */}
        <AnimatePresence>
          {!isDiscovery && showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="border-border/50 overflow-hidden border-t">
              <div className="px-4 pt-3 pb-4">
                <CommentThread
                  groupShareId={drop.id}
                  groupId={groupId}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  lastSeenAt={unreadDividerAtRef.current}
                  currentUserProfile={
                    currentUserProfile ??
                    (drop.sharer.id === currentUserId
                      ? {
                          id: currentUserId,
                          display_name: drop.sharer.display_name ?? null,
                          avatar_url: drop.sharer.avatar_url ?? null,
                          handle: drop.sharer.handle ?? "",
                        }
                      : undefined)
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {drop.item && (
        <VaultShareModal
          open={shareOpen}
          item={null}
          loggedItemId={drop.logged_item_id ?? undefined}
          excludeGroupId={groupId}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
});
