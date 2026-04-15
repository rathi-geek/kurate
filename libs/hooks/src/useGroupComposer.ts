"use client";

import { useCallback, useRef } from "react";

import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { ContentType, Database, GroupDrop, GroupProfile } from "@kurate/types";

import type { PendingDB, PendingGroupPostRow } from "./types/pending-db";

type ToastFn = (msg: string, opts?: { description?: string }) => void;
type TrackFn = (event: string, props?: Record<string, unknown>) => void;

/** Matches `apps/web/src/app/_libs/hooks/useSaveItem.ts:UpsertLoggedItemInput`. */
export interface UpsertLoggedItemInput {
  url: string;
  title?: string | null;
  content_type?: ContentType | null;
  preview_image_url?: string | null;
  description?: string | null;
  source?: string | null;
  read_time?: string | null;
  tags?: string[] | null;
}

/** Metadata accepted by the composer when posting a link (subset of useExtractMetadata's shape). */
export interface ComposerLinkMeta {
  title?: string | null;
  description?: string | null;
  content_type?: ContentType | null;
  preview_image?: string | null;
  source?: string | null;
  read_time?: string | number | null;
}

export interface ComposerSendOptions {
  /** If present, post is treated as a link share. Otherwise it's a text-only post. */
  url?: string | null;
  meta?: ComposerLinkMeta | null;
}

export interface UseGroupComposerConfig {
  groupId: string;
  currentUserId: string;
  supabase: SupabaseClient<Database>;
  /** Platform-specific upsert into logged_items (web/mobile each binds its own supabase client). */
  upsertLoggedItem: (input: UpsertLoggedItemInput) => Promise<string>;
  /** Used to seed the feed cache on confirm so the post stays visible after the
   * pending-linger expires, without waiting for a realtime round-trip. */
  currentUserProfile?: GroupProfile | null;
  platform?: {
    pendingDb?: PendingDB;
    onToast?: ToastFn;
    onTrack?: TrackFn;
    generateTempId?: () => string;
  };
  /** Synchronously called after the pending row is added — caller bumps the sidebar here. */
  onPosted?: (row: PendingGroupPostRow) => void;
}

/** Builds a GroupDrop-shape row from the pending row + confirmed server id,
 * suitable for optimistic insertion into the `queryKeys.groups.feed` cache. */
function buildOptimisticDrop(
  row: PendingGroupPostRow,
  serverId: string,
  sharer: GroupProfile,
): GroupDrop {
  return {
    id: serverId,
    convo_id: row.convo_id,
    logged_item_id: row.logged_item_id,
    shared_by: row.shared_by,
    note: row.note,
    content: row.content,
    shared_at: row.createdAt,
    sharer,
    item: row.url
      ? {
          url: row.url,
          title: row.title ?? row.url,
          preview_image_url: row.previewImage ?? null,
          content_type: (row.contentType ?? "article") as ContentType,
          raw_metadata: row.source ? { source: row.source } : null,
          description: null,
        }
      : null,
    engagement: {
      like: { count: 0, didReact: false, reactors: [] },
      mustRead: { count: 0, didReact: false, reactors: [] },
      readBy: { count: 0, didReact: false, reactors: [] },
    },
    commentCount: 0,
    seenAt: null,
    latestCommentAt: null,
    latestComment: null,
  };
}

function fallbackUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface UseGroupComposerReturn {
  handleSend: (text: string, opts?: ComposerSendOptions) => Promise<void>;
  retry: (tempId: string) => Promise<void>;
}

export function useGroupComposer(
  config: UseGroupComposerConfig,
): UseGroupComposerReturn {
  const {
    groupId,
    currentUserId,
    supabase,
    upsertLoggedItem,
    currentUserProfile,
    platform,
    onPosted,
  } = config;

  const queryClient = useQueryClient();
  const generateId = platform?.generateTempId ?? fallbackUUID;
  const pendingDb = platform?.pendingDb;
  const onToast = platform?.onToast;
  const onTrack = platform?.onTrack;

  // Keep the latest config in a ref so retry() always has fresh deps.
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;
  const upsertRef = useRef(upsertLoggedItem);
  upsertRef.current = upsertLoggedItem;
  const profileRef = useRef(currentUserProfile ?? null);
  profileRef.current = currentUserProfile ?? null;

  /** Prepend a newly-confirmed row to the feed infinite query cache so the
   * pending → confirmed morph has a real server row waiting once the linger
   * period ends. Pure cache mutation — no refetch, no flicker. */
  const seedFeedCache = useCallback(
    (row: PendingGroupPostRow, serverId: string) => {
      const profile = profileRef.current ?? {
        id: currentUserId,
        display_name: null,
        avatar_path: null,
        handle: null,
      };
      const drop = buildOptimisticDrop(row, serverId, profile);

      queryClient.setQueryData<InfiniteData<GroupDrop[]>>(
        queryKeys.groups.feed(row.convo_id),
        (old) => {
          if (!old) return old;
          // If the server row is already present (e.g. realtime raced us), bail.
          const exists = old.pages.some((page) =>
            page.some((d) => d.id === serverId),
          );
          if (exists) return old;
          const [firstPage = [], ...rest] = old.pages;
          return {
            ...old,
            pages: [[drop, ...firstPage], ...rest],
          };
        },
      );
    },
    [queryClient, currentUserId],
  );

  /** Performs the actual supabase insert + status update for a stored pending row. Used by both initial send and retry. */
  const submitRow = useCallback(
    async (row: PendingGroupPostRow): Promise<void> => {
      try {
        let insertedId: string;

        if (row.url) {
          // Link post — upsert logged_items first, then insert group_posts row.
          const loggedItemId =
            row.logged_item_id
            ?? (await upsertRef.current({
              url: row.url,
              title: row.title,
              description: null,
              content_type: (row.contentType ?? null) as ContentType | null,
              preview_image_url: row.previewImage,
              source: row.source,
              read_time: null,
            }));

          const { data, error } = await supabaseRef.current
            .from("group_posts")
            .insert({
              convo_id: row.convo_id,
              logged_item_id: loggedItemId,
              shared_by: row.shared_by,
              note: row.note,
            })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          insertedId = data.id;
          onTrack?.("group_post_created", {
            content_type: row.contentType ?? "article",
          });
        } else {
          // Text post.
          const { data, error } = await supabaseRef.current
            .from("group_posts")
            .insert({
              convo_id: row.convo_id,
              shared_by: row.shared_by,
              content: row.content,
            })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          insertedId = data.id;
          onTrack?.("group_text_post_created", {});
        }

        // Seed the feed cache BEFORE flipping the pending row to "confirmed".
        // The wrapper's dedup filter will hide the cached row while the pending
        // entry is still present; once linger expires and pending is removed,
        // the seeded row appears and Framer morphs via shared layoutId.
        seedFeedCache(row, insertedId);

        await pendingDb?.updatePendingGroupPostStatus(
          row.tempId,
          "confirmed",
          insertedId,
        );
      } catch (err) {
        console.error("[useGroupComposer] submit failed:", err);
        await pendingDb?.updatePendingGroupPostStatus(row.tempId, "failed");
      }
    },
    [pendingDb, onTrack, seedFeedCache],
  );

  const handleSend = useCallback(
    async (text: string, opts?: ComposerSendOptions): Promise<void> => {
      if (!currentUserId || !groupId) return;

      const url = opts?.url?.trim() || null;
      const meta = opts?.meta ?? null;
      const trimmedText = text.trim();

      if (!url && !trimmedText) return;

      // Dedup link posts — same URL still in "sending" state for this group.
      if (url && pendingDb) {
        const existing = await pendingDb.getPendingGroupPostsForGroup(groupId);
        if (existing.some((p) => p.url === url && p.status === "sending")) {
          onToast?.("Already sharing this link", {
            description: "We're still posting your previous share.",
          });
          return;
        }
      }

      const tempId = generateId();
      const createdAt = new Date().toISOString();

      const row: PendingGroupPostRow = {
        tempId,
        convo_id: groupId,
        shared_by: currentUserId,
        content: url ? null : trimmedText,
        logged_item_id: null,
        note: url ? (trimmedText || null) : null,
        url,
        title: meta?.title ?? (url ?? null),
        previewImage: meta?.preview_image ?? null,
        source: meta?.source ?? null,
        contentType: meta?.content_type ?? (url ? "article" : null),
        serverId: null,
        createdAt,
        status: "sending",
      };

      // 1. Persist the pending row (best-effort — UI can still post if Dexie is unavailable).
      if (pendingDb) {
        try {
          await pendingDb.addPendingGroupPost(row);
        } catch (err) {
          console.error("[useGroupComposer] addPendingGroupPost failed:", err);
        }
      }

      // 2. Bump the sidebar synchronously so the group jumps to top.
      onPosted?.(row);

      // 3. Fire-and-forget the API call. submitRow handles status updates.
      void submitRow(row);
    },
    [
      currentUserId,
      groupId,
      generateId,
      pendingDb,
      onToast,
      onPosted,
      submitRow,
    ],
  );

  const retry = useCallback(
    async (tempId: string): Promise<void> => {
      if (!pendingDb) return;
      const all = await pendingDb.getPendingGroupPostsForGroup(groupId);
      const row = all.find((r) => r.tempId === tempId);
      if (!row) return;
      await pendingDb.updatePendingGroupPostStatus(tempId, "sending");
      void submitRow({ ...row, status: "sending" });
    },
    [pendingDb, groupId, submitRow],
  );

  return { handleSend, retry };
}
