"use client";

import { memo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { EngagementBar } from "@/components/groups/engagement-bar";
import { CommentThread } from "@/components/groups/comment-thread";
import { TrashIcon } from "@/components/icons";
import type { GroupDrop, GroupProfile, GroupRole } from "@/app/_libs/types/groups";

interface FeedShareCardProps {
  drop: GroupDrop;
  currentUserId: string;
  groupId: string;
  userRole: GroupRole;
  onDelete?: (dropId: string) => void;
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

function ReactionPill({ reactors, label }: { reactors: GroupProfile[]; label: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface border border-border/50 text-[11px] text-muted-foreground">
      <div className="flex -space-x-1">
        {reactors.slice(0, 3).map((r) => (
          <div
            key={r.id}
            className="size-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center ring-1 ring-card"
          >
            {(r.display_name ?? r.handle ?? "?")[0]?.toUpperCase()}
          </div>
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
  onDelete,
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
                {(drop.sharer.display_name ?? drop.sharer.handle ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-sm font-semibold text-foreground">
                {drop.sharer.display_name ?? drop.sharer.handle ?? t("anonymous")}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                dropped · {formatRelativeTime(drop.shared_at)}
              </span>
            </div>
          </div>

          {/* Delete — sharer or owner only */}
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

        {/* Link drop: full-width preview image + title */}
        {drop.item && (
          <>
            {drop.item.preview_image_url && (
              <a
                href={drop.item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="-mx-4 block mb-3 overflow-hidden relative h-[220px] bg-surface"
              >
                <Image
                  src={drop.item.preview_image_url}
                  alt={drop.item.title ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </a>
            )}
            <div className="mb-2">
              <a
                href={drop.item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-base text-foreground hover:text-primary transition-colors line-clamp-2"
              >
                {drop.item.title ?? drop.item.url}
              </a>
              <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[11px] text-muted-foreground font-mono">
                {(drop.item.raw_metadata as Record<string, string> | null)?.source && (
                  <>
                    <span className="text-primary text-[8px]">●</span>
                    <span>{(drop.item.raw_metadata as Record<string, string>).source}</span>
                  </>
                )}
                {(drop.item.raw_metadata as Record<string, string> | null)?.read_time && (
                  <>
                    <span>·</span>
                    <span>{(drop.item.raw_metadata as Record<string, string>).read_time}</span>
                  </>
                )}
                {drop.item.content_type && (
                  <span className="uppercase text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full border border-border bg-surface">
                    {drop.item.content_type}
                  </span>
                )}
                {drop.engagement.mustRead.count > 0 && (
                  <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-warning-bg text-warning-foreground border border-warning-foreground/20">
                    MUST READ · {drop.engagement.mustRead.count}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Text-only drop */}
        {!drop.item && drop.content && (
          <p className="text-sm text-foreground leading-relaxed mb-2">{drop.content}</p>
        )}

        {/* Sharer note with left border */}
        {drop.note && (
          <blockquote className="border-l-2 border-border pl-3 my-3 text-xs text-muted-foreground italic leading-relaxed">
            {drop.note}
          </blockquote>
        )}

        {/* Reaction summary pills */}
        {(drop.engagement.like.count > 0 || drop.engagement.mustRead.count > 0) && (
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {drop.engagement.like.count > 0 && (
              <ReactionPill reactors={drop.engagement.like.reactors} label="liked" />
            )}
            {drop.engagement.mustRead.count > 0 && (
              <ReactionPill reactors={drop.engagement.mustRead.reactors} label="must read" />
            )}
          </div>
        )}

        <div className="border-t border-border/50 pt-2">
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
                    read_time: (drop.item.raw_metadata as Record<string, string> | null)?.read_time,
                  }
                : undefined
            }
            commentCount={drop.commentCount}
          />
        </div>
      </div>

      {/* Comment thread — always visible */}
      <div className="border-t border-border/50 px-4 pb-4 pt-3">
        <CommentThread
          groupShareId={drop.id}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      </div>
    </article>
  );
});
