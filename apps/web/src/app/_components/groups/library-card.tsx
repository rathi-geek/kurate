"use client";

import { memo, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import type { GroupDrop } from "@kurate/types";
import { decodeHtmlEntities } from "@kurate/utils";

import { ContentTypePill } from "@/components/ui/content-type-pill";

import { EngagementBar } from "@/app/_components/groups/engagement-bar";
import { useTranslations } from "@/i18n/use-translations";

interface LibraryCardProps {
  drop: GroupDrop;
  currentUserId: string;
  groupId: string;
  onNavigateToFeed?: () => void;
}

export const LibraryCard = memo(function LibraryCard({
  drop,
  currentUserId,
  groupId,
  onNavigateToFeed,
}: LibraryCardProps) {
  const router = useRouter();
  const t = useTranslations("groups");
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    // Switch to feed view, then navigate with hash to scroll to the drop
    onNavigateToFeed?.();
    router.push(`/groups/${groupId}#drop-${drop.id}`);
  };

  return (
    <div
      className="rounded-card bg-card hover:bg-surface flex h-full cursor-pointer flex-col overflow-hidden border transition-colors"
      onClick={handleClick}
      role="article"
      aria-label={decodeHtmlEntities(drop.item?.title) ?? drop.content ?? drop.note ?? t("drop_aria_fallback")}>
      {/* Preview image (link drops only) */}
      {drop.item?.preview_image_url && !imgError ? (
        <div className="bg-surface overflow-hidden relative aspect-video w-full shrink-0">
          <Image
            src={drop.item.preview_image_url}
            alt={drop.item.title ?? ""}
            fill
            unoptimized
            className="object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : drop.item ? (
        <div className="bg-muted/40 flex aspect-video w-full shrink-0 items-center justify-center">
          <ContentTypePill contentType={drop.item.content_type} />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col p-3">
        {/* Link drop content */}
        {drop.item && (
          <>
            <p className="text-foreground mb-1 line-clamp-2 text-sm font-medium">
              {decodeHtmlEntities(drop.item.title) ?? drop.item.url}
            </p>
            <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-1 font-mono text-[11px]">
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
        {!drop.item && (drop.content || drop.note) && (
          <p className="text-foreground mb-2 line-clamp-3 text-sm">{drop.content ?? drop.note}</p>
        )}

        <div
          className="border-border/50 mt-auto border-t pt-2"
          onClick={(e) => e.stopPropagation()}>
          <EngagementBar
            groupPostId={drop.id}
            groupId={groupId}
            source="group_library"
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
