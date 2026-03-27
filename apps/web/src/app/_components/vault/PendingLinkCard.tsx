"use client";

import { ContentTypePill } from "@/components/ui/content-type-pill";
import type { PendingLink } from "@/app/_libs/db";

export function PendingLinkCard({ link }: { link: PendingLink }) {
  return (
    <div className="rounded-card border-border bg-card relative flex h-full min-h-0 flex-col overflow-hidden border opacity-70">
      {/* Image / type badge area */}
      <div className="relative h-[150px] w-full shrink-0 overflow-hidden">
        {link.previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.previewImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <ContentTypePill contentType={link.contentType as "article" | "video" | "podcast"} />
          </div>
        )}

        {/* Sending indicator — clock icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="text-2xl" aria-label="Sending">⏱</span>
        </div>

        {link.status === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-2xl text-red-400" aria-label="Failed to send">!</span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h3 className="text-foreground line-clamp-2 shrink-0 font-sans text-sm leading-snug font-bold">
          {link.title || link.url}
        </h3>

        <div className="min-h-0 flex-1" />

        <p className="text-muted-foreground mt-1.5 shrink-0 font-mono text-xs">
          {link.source ?? "—"}
          {link.readTime && <> · {link.readTime}</>}
        </p>
      </div>
    </div>
  );
}
