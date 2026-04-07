"use client";

import { useTranslations } from "@/i18n/use-translations";
import { toast } from "sonner";

import { useDropEngagement } from "@/app/_libs/hooks/useDropEngagement";
import { track } from "@/app/_libs/utils/analytics";
import { useVaultToggle } from "@/app/_libs/hooks/useVaultToggle";
import {
  HeartIcon,
  StarIcon,
  BookmarkIcon,
  MessageCircleIcon,
  ExternalLinkIcon,
} from "@/components/icons";
import type { GroupDrop } from "@kurate/types";
import type { SaveItemInput } from "@/app/_libs/hooks/useSaveItem";

interface EngagementBarProps {
  groupPostId: string;
  groupId: string;
  url: string;
  currentUserId: string;
  engagement: GroupDrop["engagement"];
  itemData?: Omit<SaveItemInput, "url" | "save_source">;
  commentCount?: number;
  hasNewComments?: boolean;
  onCommentIconClick?: () => void;
  source: "group_feed" | "group_library";
  showSaveToVault?: boolean;
  context?: "group" | "discovery";
}

export function EngagementBar({
  groupPostId,
  groupId,
  url,
  currentUserId,
  engagement,
  itemData,
  commentCount,
  hasNewComments,
  onCommentIconClick,
  source,
  showSaveToVault = true,
  context = "group",
}: EngagementBarProps) {
  const t = useTranslations("groups");
  const { toggleReaction } = useDropEngagement();
  const { isSaved, toggle: toggleVaultBase } = useVaultToggle(currentUserId, url, groupId);

  const toggleVault = (data?: Parameters<typeof toggleVaultBase>[0]) => {
    const willSave = !isSaved;
    toggleVaultBase(data);
    toast.success(willSave ? "Saved to vault" : "Removed from vault");
    if (willSave) track("item_saved_from_group");
  };

  const handleReaction = (
    type: "like" | "must_read",
    didReact: boolean,
  ) => {
    toggleReaction({
      groupPostId,
      groupId,
      reactionType: type,
      currentUserId,
      didReact,
    });
    track(didReact ? "reaction_removed" : "reaction_added", { type, source });
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

      {/* Bookmark / Vault toggle */}
      {showSaveToVault && (
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
      )}

      {/* Comments toggle / View in group */}
      {commentCount !== undefined && (
        <button
          type="button"
          onClick={() => {
            track(context === "discovery" ? "discovery_view_in_group" : "comment_thread_opened");
            onCommentIconClick?.();
          }}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded-badge text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          aria-label={context === "discovery" ? "View in group" : "Toggle comments"}
        >
          {context === "discovery" ? (
            <>
              <MessageCircleIcon className="size-[14px]" filled={false} />
              {commentCount > 0 && (
                <span className="font-mono">{commentCount}</span>
              )}
              <ExternalLinkIcon className="size-[12px]" />
            </>
          ) : (
            <>
              <MessageCircleIcon
                className={`size-[14px] ${hasNewComments ? "text-green-600" : ""}`}
                filled={hasNewComments}
              />
              {commentCount > 0 && (
                <span className="font-mono">{commentCount}</span>
              )}
            </>
          )}
        </button>
      )}
    </div>
  );
}
