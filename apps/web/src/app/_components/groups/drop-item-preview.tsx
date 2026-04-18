"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import type { GroupDrop } from "@kurate/types";
import { decodeHtmlEntities } from "@kurate/utils";

import { DomainIcon } from "@/components/icons";
import { ContentTypePill } from "@/components/ui/content-type-pill";

type DropItem = NonNullable<GroupDrop["item"]>;

interface DropItemPreviewProps {
  item: DropItem;
  mustReadCount: number;
  mustReadLabel: string;
  onLinkOpen: () => void;
}

export function DropItemPreview({
  item,
  mustReadCount,
  mustReadLabel,
  onLinkOpen,
}: DropItemPreviewProps) {
  const [imgError, setImgError] = useState(false);
  const metadata = item.raw_metadata as Record<string, string> | null;

  return (
    <>
      {item.preview_image_url && !imgError ? (
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkOpen}
          className="bg-surface relative -mx-4 mb-3 block h-[220px] overflow-hidden">
          <Image
            src={item.preview_image_url}
            alt={item.title ?? ""}
            fill
            unoptimized
            className="object-cover"
            onError={() => setImgError(true)}
          />
          <ContentTypePill contentType={item.content_type} className="absolute top-2 left-2" />
        </Link>
      ) : (
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkOpen}
          className="bg-muted/40 border-border/40 relative -mx-4 mb-3 flex h-[220px] items-center justify-center overflow-hidden border-b">
          <DomainIcon url={item.url} className="size-14" />
          <ContentTypePill contentType={item.content_type} className="absolute top-2 left-2" />
        </Link>
      )}

      <div className="mb-2">
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkOpen}
          className="text-foreground hover:text-primary line-clamp-2 text-base font-bold transition-colors">
          {decodeHtmlEntities(item.title) ?? item.url}
        </Link>

        {item.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {decodeHtmlEntities(item.description)}
          </p>
        )}

        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          {metadata?.source && (
            <>
              <span className="text-primary text-[8px]">●</span>
              <span>{metadata.source}</span>
            </>
          )}

          {metadata?.read_time && (
            <>
              <span>·</span>
              <span>{metadata.read_time}</span>
            </>
          )}

          {mustReadCount > 0 && (
            <span className="bg-warning-bg text-warning-foreground border-warning-foreground/20 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase">
              {mustReadLabel} · {mustReadCount}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
