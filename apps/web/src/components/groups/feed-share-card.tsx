"use client";

import { memo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { EngagementBar } from "@/components/groups/engagement-bar";
import { CommentThread } from "@/components/groups/comment-thread";
import { TrashIcon } from "@/components/icons";
import type { GroupDrop, GroupRole } from "@/app/_libs/types/groups";

interface FeedShareCardProps {
  drop: GroupDrop;
  currentUserId: string;
  groupId: string;
  userRole: GroupRole;
  onDelete?: (dropId: string) => void;
  isCommentExpanded: boolean;
  onCommentToggle: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const FeedShareCard = memo(function FeedShareCard({
  drop,
  currentUserId,
  groupId,
  userRole,
  onDelete,
  isCommentExpanded,
  onCommentToggle,
}: FeedShareCardProps) {
  const t = useTranslations("groups");
  const isSharer = drop.sharer.id === currentUserId;
  const hasMustRead = drop.engagement.mustRead.count > 0;

  return (
    <article
      id={`drop-${drop.id}`}
      className={`rounded-card border bg-card transition-colors ${
        hasMustRead ? "border-warning-foreground/30 bg-warning-bg/40" : "border-border"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {drop.sharer.avatar_url ? (
              <Image
                src={drop.sharer.avatar_url}
                alt={drop.sharer.display_name ?? ""}
                width={32}
                height={32}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {(drop.sharer.display_name ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-sm font-medium text-foreground">
                {drop.sharer.display_name ?? t("anonymous")}
              </span>
              <span className="text-xs text-muted-foreground font-mono ml-2">
                {formatRelativeTime(drop.shared_at)}
              </span>
            </div>
          </div>

          {/* Delete — sharer only */}
          {(isSharer || userRole === "owner") && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(drop.id)}
              className="shrink-0 p-1 rounded-badge text-muted-foreground hover:text-error-foreground hover:bg-error-bg transition-colors"
              aria-label={t("delete_drop_aria")}
            >
              <TrashIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Preview image */}
        {drop.item.preview_image && (
          <a
            href={drop.item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-3 rounded-card overflow-hidden relative h-[180px] bg-surface"
          >
            <Image
              src={drop.item.preview_image}
              alt={drop.item.title ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </a>
        )}

        {/* Title & metadata */}
        <div className="mb-2">
          <a
            href={drop.item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
          >
            {drop.item.title ?? drop.item.url}
          </a>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-mono flex-wrap">
            {drop.item.source && <span>{drop.item.source}</span>}
            {drop.item.source && drop.item.read_time && <span>·</span>}
            {drop.item.read_time && <span>{drop.item.read_time}</span>}
          </div>
        </div>

        {/* Sharer note */}
        {drop.note && (
          <p className="text-xs text-muted-foreground italic mb-3 leading-relaxed">
            &ldquo;{drop.note}&rdquo;
          </p>
        )}

        <div className="border-t border-border/50 pt-2">
          <EngagementBar
            groupShareId={drop.id}
            groupId={groupId}
            url={drop.item.url}
            currentUserId={currentUserId}
            engagement={drop.engagement}
            itemData={{
              title: drop.item.title,
              source: drop.item.source,
              preview_image: drop.item.preview_image,
              content_type: drop.item.content_type as "article" | "video" | "podcast",
              read_time: drop.item.read_time,
            }}
            commentCount={drop.commentCount}
            onCommentToggle={onCommentToggle}
          />
        </div>
      </div>

      {/* Comment thread */}
      {isCommentExpanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <CommentThread
            groupShareId={drop.id}
            currentUserId={currentUserId}
            userRole={userRole}
            isExpanded={isCommentExpanded}
            onCollapse={onCommentToggle}
          />
        </div>
      )}
    </article>
  );
});
