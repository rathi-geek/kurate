"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { getLinkCopy } from "@/app/_libs/utils/getLinkCopy";
import { DomainIcon } from "@/components/icons";
import { Typewriter } from "@/components/ui/typewriter";
import { CyclingText } from "@/components/ui/cycling-text";

export interface UrlExtractPreviewMeta {
  title?: string | null;
  source?: string | null;
  previewImage?: string | null;
  contentType?: string | null;
  readTime?: number | string | null;
  description?: string | null;
}

export interface UrlExtractPreviewProps {
  url: string;
  isLoading: boolean;
  metadata?: UrlExtractPreviewMeta | null;
  extractionFailed?: boolean;
}

export function UrlExtractPreview({
  url,
  isLoading,
  metadata,
  extractionFailed,
}: UrlExtractPreviewProps) {
  const t = useTranslations("link_preview");
  const copy = getLinkCopy(url, t as (key: string) => string);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <DomainIcon url={url} />
        <div className="min-w-0 flex-1">
          <Typewriter text={copy.heading} className="text-foreground text-sm font-medium" />
          <p className="text-muted-foreground mt-0.5 text-xs">
            <CyclingText phrases={copy.subtitles} />
          </p>
        </div>
      </div>
    );
  }

  if (extractionFailed && !metadata) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <DomainIcon url={url} />
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground truncate text-sm font-mono">{url}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Could not load preview</p>
        </div>
      </div>
    );
  }

  if (metadata) {
    const metaRow = [
      metadata.source,
      metadata.contentType,
      metadata.readTime ? `${metadata.readTime} min` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <div className="flex items-start gap-3 px-4 py-3">
        {metadata.previewImage ? (
          <Image
            unoptimized
            src={metadata.previewImage}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <DomainIcon url={url} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-foreground line-clamp-2 text-sm font-medium">
            {metadata.title ?? url}
          </p>
          {metadata.description && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
              {metadata.description}
            </p>
          )}
          {metaRow && (
            <p className="text-muted-foreground mt-1 text-xs">{metaRow}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
