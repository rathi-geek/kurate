"use client";

import { useEffect } from "react";

import { db } from "@/app/_libs/db";

const PENDING_TIMEOUT_MS = 30_000;
const CHECK_INTERVAL_MS = 5_000;

/**
 * Sweeps pending_links and pending_thoughts every few seconds.
 * Any item stuck in "sending" for longer than PENDING_TIMEOUT_MS
 * is transitioned to "failed" so the user can dismiss it.
 */
export function usePendingItemTimeout() {
  useEffect(() => {
    const id = setInterval(async () => {
      const cutoff = new Date(Date.now() - PENDING_TIMEOUT_MS).toISOString();

      const staleLinks = await db.pending_links
        .where("status")
        .equals("sending")
        .filter((l) => l.createdAt < cutoff)
        .toArray();

      const staleThoughts = await db.pending_thoughts
        .where("status")
        .equals("sending")
        .filter((t) => t.createdAt < cutoff)
        .toArray();

      if (staleLinks.length) {
        await db.pending_links.bulkUpdate(
          staleLinks.map((l) => ({ key: l.tempId, changes: { status: "failed" as const } })),
        );
      }

      if (staleThoughts.length) {
        await db.pending_thoughts.bulkUpdate(
          staleThoughts.map((t) => ({ key: t.tempId, changes: { status: "failed" as const } })),
        );
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);
}
