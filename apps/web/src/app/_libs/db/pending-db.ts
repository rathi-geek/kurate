import type {
  PendingDB,
  PendingGroupPostRow,
  PendingLinkRow,
  PendingThoughtRow,
} from "@kurate/hooks";
import type { ThoughtBucket } from "@kurate/utils";

import { db, type PendingLink, type PendingThought } from "@/app/_libs/db";

/**
 * Web implementation of the shared `PendingDB` interface — Dexie-backed.
 *
 * Group post methods are the primary use case (consumed by `useGroupComposer`).
 * Link/thought methods are also implemented so vault could lift onto this adapter
 * in a follow-up; vault's own composer (`apps/web/src/app/_libs/hooks/useVaultComposer.ts`)
 * still calls Dexie directly today.
 */
export const webPendingDb: PendingDB = {
  // ── Group posts ──────────────────────────────────────────────
  addPendingGroupPost: async (row: PendingGroupPostRow) => {
    await db.pending_group_posts.add(row);
  },
  updatePendingGroupPostStatus: async (tempId, status, serverId) => {
    const changes: Partial<PendingGroupPostRow> = {
      status: status as PendingGroupPostRow["status"],
    };
    if (serverId !== undefined) changes.serverId = serverId;
    await db.pending_group_posts.update(tempId, changes);
  },
  deletePendingGroupPost: async (tempId) => {
    await db.pending_group_posts.delete(tempId);
  },
  getAllPendingGroupPosts: async () => db.pending_group_posts.toArray(),
  getPendingGroupPostsForGroup: async (groupId) =>
    db.pending_group_posts.where("convo_id").equals(groupId).toArray(),

  // ── Links ────────────────────────────────────────────────────
  addPendingLink: async (row: PendingLinkRow) => {
    const dexieRow: PendingLink = {
      ...row,
      contentType: row.contentType ?? "link",
    };
    await db.pending_links.add(dexieRow);
  },
  getPendingLinkByUrl: async (url) => {
    const row = await db.pending_links.where("url").equals(url).first();
    return (row ?? null) as PendingLinkRow | null;
  },
  updatePendingLinkStatus: async (tempId, status) => {
    await db.pending_links.update(tempId, {
      status: status as PendingLink["status"],
    });
  },
  deletePendingLink: async (tempId) => {
    await db.pending_links.delete(tempId);
  },
  getAllPendingLinks: async () =>
    (await db.pending_links.toArray()) as PendingLinkRow[],

  // ── Thoughts ─────────────────────────────────────────────────
  addPendingThought: async (row: PendingThoughtRow) => {
    const dexieRow: PendingThought = {
      ...row,
      bucket: row.bucket as ThoughtBucket,
    };
    await db.pending_thoughts.add(dexieRow);
  },
  updatePendingThoughtStatus: async (tempId, status) => {
    await db.pending_thoughts.update(tempId, {
      status: status as PendingThought["status"],
    });
  },
  deletePendingThought: async (tempId) => {
    await db.pending_thoughts.delete(tempId);
  },
  getAllPendingThoughts: async () =>
    (await db.pending_thoughts.toArray()) as PendingThoughtRow[],
};
