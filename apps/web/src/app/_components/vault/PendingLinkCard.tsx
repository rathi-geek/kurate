"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { ContentTypePill } from "@/components/ui/content-type-pill";
import { CloseIcon } from "@/components/icons";
import type { PendingLink } from "@/app/_libs/db";

interface PendingLinkCardProps {
  link: PendingLink;
  onDismiss?: (tempId: string) => void;
}

const opacityByStatus = {
  sending: 0.7,
  confirmed: 1,
  failed: 0.5,
} as const;

export function PendingLinkCard({ link, onDismiss }: PendingLinkCardProps) {
  const isFailed = link.status === "failed";
  const isConfirmed = link.status === "confirmed";

  return (
    <motion.div
      className="rounded-card border-border bg-card relative flex h-full min-h-0 flex-col overflow-hidden border"
      animate={{ opacity: opacityByStatus[link.status] }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
    >
      {/* Dismiss button — sending & failed only */}
      {onDismiss && !isConfirmed && (
        <button
          type="button"
          onClick={() => onDismiss(link.tempId)}
          className="absolute top-2 right-2 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          aria-label="Dismiss"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Image / type badge area */}
      <div className="relative h-[150px] w-full shrink-0 overflow-hidden">
        {link.previewImage ? (
          <Image
            src={link.previewImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : link.description ? (
          <div className="bg-muted relative flex h-full w-full items-center justify-center overflow-hidden px-4 py-3">
            <p className="text-muted-foreground relative z-10 line-clamp-4 text-center text-xs leading-relaxed">
              {link.description}
            </p>
            <ContentTypePill
              contentType={link.contentType}
              className="absolute top-2 left-2"
            />
          </div>
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <ContentTypePill contentType={link.contentType} />
          </div>
        )}

        {/* Status overlays */}
        {link.status === "sending" && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-2xl" aria-label="Sending">⏱</span>
          </motion.div>
        )}

        {isConfirmed && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <span className="text-2xl" aria-label="Saved">✓</span>
          </motion.div>
        )}

        {isFailed && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
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
    </motion.div>
  );
}
