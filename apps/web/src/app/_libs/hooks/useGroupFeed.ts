"use client";

import { useEffect, useMemo } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import {
  fetchGroupFeedPage as fetchGroupFeedPageShared,
  useGroupFeed as useSharedGroupFeed,
} from "@kurate/hooks";

import { db } from "@/app/_libs/db";
import { webPendingDb } from "@/app/_libs/db/pending-db";
import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

/** How long (ms) a confirmed pending row stays in Dexie before cleanup, so the
 * morph from pending → confirmed feels intentional rather than abrupt. */
const CONFIRMED_LINGER_MS = 2000;

/** Web wrapper around the shared `useGroupFeed`. Sources pending posts from Dexie
 * via `useLiveQuery`, hands them to the shared hook for merging, and runs the
 * confirm-on-server + linger cleanup side effects (Dexie writes — DB-specific). */
export function useGroupFeed(groupId: string, currentUserId: string) {
  const pendingPosts = useLiveQuery(
    () => db.pending_group_posts.where("convo_id").equals(groupId).toArray(),
    [groupId],
  );

  const result = useSharedGroupFeed(supabase, groupId, currentUserId, pendingPosts ?? []);

  // Mark "sending" pending rows as confirmed once their server row appears.
  useEffect(() => {
    if (!pendingPosts?.length || !result.drops.length) return;
    const serverIds = new Set(result.drops.map((d) => d.id));
    const toConfirm = pendingPosts.filter(
      (p) => p.status === "sending" && p.serverId && serverIds.has(p.serverId),
    );
    if (!toConfirm.length) return;
    void Promise.all(
      toConfirm.map((p) =>
        webPendingDb.updatePendingGroupPostStatus(p.tempId, "confirmed"),
      ),
    );
  }, [result.drops, pendingPosts]);

  // 2s linger after confirmation, then drop the pending row from Dexie.
  // The `useLiveQuery` will then remove it from the merged feed entries.
  useEffect(() => {
    if (!pendingPosts?.length) return;
    const confirmed = pendingPosts.filter((p) => p.status === "confirmed");
    if (!confirmed.length) return;
    const t = setTimeout(() => {
      void Promise.all(
        confirmed.map((p) => webPendingDb.deletePendingGroupPost(p.tempId)),
      );
    }, CONFIRMED_LINGER_MS);
    return () => clearTimeout(t);
  }, [pendingPosts]);

  return useMemo(() => ({ ...result, pendingPosts: pendingPosts ?? [] }), [result, pendingPosts]);
}

// ── Sidebar / app-shell prefetch shims ─────────────────────────────────
// These keep the `(groupId, userId, cursor)` signature their callers expect
// while delegating to the shared lib version that takes `(supabase, …)`.

export const fetchGroupFeedPage = (
  groupId: string,
  currentUserId: string,
  cursor: string | null,
) => fetchGroupFeedPageShared(supabase, groupId, currentUserId, cursor);
