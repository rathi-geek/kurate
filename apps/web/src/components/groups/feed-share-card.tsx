"use client";

import { memo, useEffect, useRef, useState } from "react";

import Image from "next/image";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import type { GroupDrop, GroupProfile, GroupRole } from "@/app/_libs/types/groups";
import { CommentThread } from "@/components/groups/comment-thread";
import { EngagementBar } from "@/components/groups/engagement-bar";
import { ChevronDownIcon, TrashIcon } from "@/components/icons";

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
    <div className="bg-surface border-border/50 text-muted-foreground flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]">
      <div className="flex -space-x-1">
        {reactors.slice(0, 3).map((r) => (
          <div
            key={r.id}
            className="bg-primary text-primary-foreground ring-card flex size-4 items-center justify-center rounded-full text-[8px] font-bold ring-1">
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
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showComments) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) setShowComments(false);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showComments]);

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
                className="shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {(drop.sharer.display_name ?? drop.sharer.handle ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-foreground text-sm font-semibold">
                {drop.sharer.display_name ?? drop.sharer.handle ?? t("anonymous")}
              </span>
              <span className="text-muted-foreground ml-1.5 text-xs">
                dropped · {formatRelativeTime(drop.shared_at)}
              </span>
            </div>
          </div>
        </div>

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

      <motion.article
        id={`drop-${drop.id}`}
        initial={{ y: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
        whileHover={{
          y: -6,
          boxShadow: "0 18px 38px rgba(0,0,0,0.12), 0 6px 14px rgba(0,0,0,0.07)",
          transition: { type: "spring", stiffness: 280, damping: 22 },
        }}
        className={`rounded-card bg-card overflow-hidden border transition-colors ${
          hasMustRead ? "border-warning-foreground/30 bg-warning-bg/40" : "border-border"
        }`}
        style={{ transformStyle: "preserve-3d" }}>
        <div className="p-4 pt-0">
          {/* Sharer note — green tinted card */}
          {drop.note && (
            <div className="py-2">
              <p className="text-ink text-md leading-relaxed italic">Note: {drop.note}</p>
            </div>
          )}
          {/* Link drop: full-width preview image + title */}
          {drop.item && (
            <>
              {drop.item.preview_image_url && (
                <a
                  href={drop.item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface relative -mx-4 mb-3 block h-[220px] overflow-hidden">
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
                  className="text-foreground hover:text-primary line-clamp-2 text-base font-bold transition-colors">
                  {drop.item.title ?? drop.item.url}
                </a>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
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
                    <span className="border-border bg-surface rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                      {drop.item.content_type}
                    </span>
                  )}
                  {drop.engagement.mustRead.count > 0 && (
                    <span className="bg-warning-bg text-warning-foreground border-warning-foreground/20 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-widest">
                      MUST READ · {drop.engagement.mustRead.count}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Text-only drop — content field added in pending DB migration (Phase 2) */}
          {!drop.item && (drop as GroupDrop & { content?: string }).content && (
            <p className="text-foreground mb-2 text-sm leading-relaxed">
              {(drop as GroupDrop & { content?: string }).content}
            </p>
          )}

          {/* Reaction summary pills */}
          {(drop.engagement.like.count > 0 || drop.engagement.mustRead.count > 0) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {drop.engagement.like.count > 0 && (
                <ReactionPill reactors={drop.engagement.like.reactors} label="liked" />
              )}
              {drop.engagement.mustRead.count > 0 && (
                <ReactionPill reactors={drop.engagement.mustRead.reactors} label="must read" />
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
              commentCount={drop.commentCount}
              onCommentIconClick={() => setShowComments((v) => !v)}
            />
          </div>
        </div>

        {/* Latest comment preview — visible when thread is closed */}
        {!showComments && drop.latestComment && (
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="border-border/50 hover:bg-muted/30 w-full border-t px-4 py-3 text-left transition-colors">
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <div className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                {(drop.latestComment.authorName ?? "?")[0]?.toUpperCase()}
              </div>
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

        {/* Comment thread — shown on demand */}
        <AnimatePresence>
          {showComments && (
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
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    </div>
  );
});
