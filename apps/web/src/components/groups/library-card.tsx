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
      aria-label={drop.item?.title ?? drop.content ?? t("drop_aria_fallback")}
    >
      {/* Preview image (link drops only) */}
      {drop.item?.preview_image_url ? (
        <div className="relative w-full aspect-video bg-surface">
          <Image
            src={drop.item.preview_image_url}
            alt={drop.item.title ?? ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />
        </div>
      ) : drop.item ? (
        <div className="w-full aspect-video bg-surface" />
      ) : null}

      <div className="p-3">
        {/* Link drop content */}
        {drop.item && (
          <>
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
              {drop.item.title ?? drop.item.url}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono mb-2 flex-wrap">
              {(drop.item.raw_metadata as Record<string, string> | null)?.source && (
                <span>{(drop.item.raw_metadata as Record<string, string>).source}</span>
              )}
              {(drop.item.raw_metadata as Record<string, string> | null)?.source &&
                (drop.item.raw_metadata as Record<string, string> | null)?.read_time && (
                <span>·</span>
              )}
              {(drop.item.raw_metadata as Record<string, string> | null)?.read_time && (
                <span>{(drop.item.raw_metadata as Record<string, string>).read_time}</span>
              )}
            </div>
          </>
        )}

        {/* Text-only drop content */}
        {!drop.item && drop.content && (
          <p className="text-sm text-foreground line-clamp-3 mb-2">{drop.content}</p>
        )}

        <div
          className="border-t border-border/50 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
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
            // No commentCount — Library omits comments
          />
        </div>
      </div>
    </div>
  );
});
