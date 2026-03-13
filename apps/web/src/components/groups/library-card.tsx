"use client";

import { memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EngagementBar } from "@/components/groups/engagement-bar";
import type { GroupDrop } from "@/app/_libs/types/groups";

interface LibraryCardProps {
  drop: GroupDrop;
  currentUserId: string;
  groupId: string;
  groupSlug: string;
}

export const LibraryCard = memo(function LibraryCard({
  drop,
  currentUserId,
  groupId,
  groupSlug,
}: LibraryCardProps) {
  const router = useRouter();
  const t = useTranslations("groups");

  const handleClick = () => {
    // Navigate to group feed and scroll to the specific drop
    router.push(`/groups/${groupSlug}#drop-${drop.id}`);
  };

  return (
    <div
      className="rounded-card border bg-card hover:bg-surface transition-colors cursor-pointer overflow-hidden"
      onClick={handleClick}
      role="article"
      aria-label={drop.item.title ?? t("drop_aria_fallback")}
    >
      {/* Preview image */}
      {drop.item.preview_image ? (
        <div className="relative w-full aspect-video bg-surface">
          <Image
            src={drop.item.preview_image}
            alt={drop.item.title ?? ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="w-full aspect-video bg-surface" />
      )}

      <div className="p-3">
        {/* Title */}
        <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
          {drop.item.title ?? drop.item.url}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono mb-2 flex-wrap">
          {drop.item.source && <span>{drop.item.source}</span>}
          {drop.item.source && drop.item.read_time && <span>·</span>}
          {drop.item.read_time && <span>{drop.item.read_time}</span>}
        </div>

        <div
          className="border-t border-border/50 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
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
            // No commentCount / onCommentToggle — Library omits comments
          />
        </div>
      </div>
    </div>
  );
});
