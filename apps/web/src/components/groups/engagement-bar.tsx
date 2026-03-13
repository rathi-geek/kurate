"use client";

import { useTranslations } from "next-intl";

import { useDropEngagement } from "@/app/_libs/hooks/useDropEngagement";
import { useVaultToggle } from "@/app/_libs/hooks/useVaultToggle";
import {
  HeartIcon,
  StarIcon,
  CheckIcon,
  BookmarkIcon,
  MessageCircleIcon,
} from "@/components/icons";
import type { GroupDrop } from "@/app/_libs/types/groups";
import type { SaveItemInput } from "@/app/_libs/hooks/useSaveItem";

interface EngagementBarProps {
  groupShareId: string;
  groupId: string;
  url: string;
  currentUserId: string;
  engagement: GroupDrop["engagement"];
  itemData?: Omit<SaveItemInput, "url" | "save_source">;
  commentCount?: number;
  onCommentToggle?: () => void;
}

export function EngagementBar({
  groupShareId,
  groupId,
  url,
  currentUserId,
  engagement,
  itemData,
  commentCount,
  onCommentToggle,
}: EngagementBarProps) {
  const t = useTranslations("groups");
  const { toggleReaction } = useDropEngagement();
  const { isSaved, toggle: toggleVault } = useVaultToggle(currentUserId, url);

  const handleReaction = (
    type: "like" | "must_read" | "read_by",
    didReact: boolean,
  ) => {
    toggleReaction({
      groupShareId,
      groupId,
      reactionType: type,
      currentUserId,
      didReact,
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Like */}
      <button
        type="button"
        onClick={() => handleReaction("like", engagement.like.didReact)}
        className={`flex items-center gap-1 px-2 py-1 rounded-badge text-xs transition-colors hover:bg-surface ${
          engagement.like.didReact
            ? "text-red-500"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("reaction_like_aria")}
        aria-pressed={engagement.like.didReact}
      >
        <HeartIcon
          className="size-[14px]"
          filled={engagement.like.didReact}
        />
        {engagement.like.count > 0 && (
          <span className="font-mono">{engagement.like.count}</span>
        )}
      </button>

      {/* Must Read */}
      <button
        type="button"
        onClick={() => handleReaction("must_read", engagement.mustRead.didReact)}
        className={`flex items-center gap-1 px-2 py-1 rounded-badge text-xs transition-colors hover:bg-surface ${
          engagement.mustRead.didReact
            ? "text-warning-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("reaction_must_read_aria")}
        aria-pressed={engagement.mustRead.didReact}
      >
        <StarIcon
          className="size-[14px]"
          filled={engagement.mustRead.didReact}
        />
        {engagement.mustRead.count > 0 && (
          <span className="font-mono">{engagement.mustRead.count}</span>
        )}
      </button>

      {/* Read By */}
      <button
        type="button"
        onClick={() => handleReaction("read_by", engagement.readBy.didReact)}
        className={`flex items-center gap-1 px-2 py-1 rounded-badge text-xs transition-colors hover:bg-surface ${
          engagement.readBy.didReact
            ? "text-success-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={t("reaction_read_by_aria")}
        aria-pressed={engagement.readBy.didReact}
      >
        <CheckIcon
          className="size-[14px]"
          filled={engagement.readBy.didReact}
        />
        {engagement.readBy.count > 0 && (
          <span className="font-mono">{engagement.readBy.count}</span>
        )}
      </button>

      {/* Bookmark / Vault toggle */}
      <button
        type="button"
        onClick={() => toggleVault(itemData)}
        className={`flex items-center gap-1 px-2 py-1 rounded-badge text-xs transition-colors hover:bg-surface ${
          isSaved
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={isSaved ? t("bookmark_remove_aria") : t("bookmark_save_aria")}
        aria-pressed={isSaved}
      >
        <BookmarkIcon className="size-[14px]" filled={isSaved} />
      </button>

      {/* Comments — Feed only */}
      {onCommentToggle !== undefined && (
        <button
          type="button"
          onClick={onCommentToggle}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded-badge text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          aria-label={t("comment_aria")}
        >
          <MessageCircleIcon className="size-[14px]" />
          {(commentCount ?? 0) > 0 && (
            <span className="font-mono">{commentCount}</span>
          )}
        </button>
      )}
    </div>
  );
}
