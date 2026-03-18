"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EngagementBar } from "@/components/groups/engagement-bar";
import { ContentTypePill } from "@/components/ui/content-type-pill";
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
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    // Navigate to group feed and scroll to the specific drop
    router.push(`/groups/${groupSlug}#drop-${drop.id}`);
  };

  return (
    <div
      className="flex h-full flex-col rounded-card border bg-card overflow-hidden transition-colors hover:bg-surface cursor-pointer"
      onClick={handleClick}
      role="article"
      aria-label={drop.item?.title ?? drop.note ?? t("drop_aria_fallback")}
    >
      {/* Preview image (link drops only) */}
      {drop.item?.preview_image_url && !imgError ? (
        <div className="relative w-full shrink-0 aspect-video bg-surface overflow-hidden">
          <Image
            src={drop.item.preview_image_url}
            alt={drop.item.title ?? ""}
            fill
            unoptimized
            className="object-cover"
            onError={() => { console.log("[LibraryCard] image error for:", drop.item?.preview_image_url); setImgError(true); }}
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
            <p className="text-foreground line-clamp-2 mb-1 text-sm font-medium">
              {drop.item.title ?? drop.item.url}
            </p>
            <div className="mb-2 flex flex-wrap items-center gap-1 font-mono text-[11px] text-muted-foreground">
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
        {!drop.item && drop.note && (
          <p className="text-foreground line-clamp-3 mb-2 text-sm">{drop.note}</p>
        )}

        <div
          className="mt-auto border-t border-border/50 pt-2"
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
