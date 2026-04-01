"use client";

import type { Json } from "@kurate/types";
import type { GroupDrop } from "@kurate/types";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

export type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar: { file_path: string; bucket_name: string } | null;
  handle: string | null;
};

function toProfile(p: ProfileRow | null) {
  if (!p) return null;
  return {
    id: p.id,
    display_name:
      [p.first_name, p.last_name].filter(Boolean).join(" ") || p.handle || null,
    avatar_url: p.avatar ? mediaToUrl(p.avatar) : null,
    handle: p.handle ?? null,
  };
}

export type GroupPostRow = {
  id: string;
  convo_id: string;
  logged_item_id: string | null;
  shared_by: string;
  note: string | null;
  content: string | null;
  shared_at: string;
  sharer: ProfileRow | ProfileRow[] | null;
  item: {
    url: string | null;
    title: string | null;
    preview_image_url: string | null;
    content_type: string | null;
    raw_metadata: Json | null;
    description: string | null;
  } | Array<{
    url: string | null;
    title: string | null;
    preview_image_url: string | null;
    content_type: string | null;
    raw_metadata: Json | null;
    description: string | null;
  }> | null;
  likes: Array<{ id: string; user_id: string; liker: ProfileRow | null }> | null;
  must_reads: Array<{ id: string; user_id: string; reader: ProfileRow | null }> | null;
  comments: Array<{
    id: string;
    comment_text: string;
    created_at: string;
    user_id: string;
    author: ProfileRow | ProfileRow[] | null;
  }> | null;
};

export function mapRowToGroupDrop(row: GroupPostRow, currentUserId: string): GroupDrop {
  const rawLikes = (row.likes ?? []) as Array<{ id: string; user_id: string; liker: ProfileRow | null }>;
  const rawMustReads = (row.must_reads ?? []) as Array<{ id: string; user_id: string; reader: ProfileRow | null }>;
  const rawItem = Array.isArray(row.item) ? row.item[0] : row.item;
  const rawSharer = Array.isArray(row.sharer) ? row.sharer[0] : row.sharer;

  const engagement = {
    like: {
      count: rawLikes.length,
      didReact: rawLikes.some((r) => r.user_id === currentUserId),
      reactors: rawLikes.map((r) => toProfile(r.liker)).filter(Boolean) as GroupDrop["engagement"]["like"]["reactors"],
    },
    mustRead: {
      count: rawMustReads.length,
      didReact: rawMustReads.some((r) => r.user_id === currentUserId),
      reactors: rawMustReads.map((r) => toProfile(r.reader)).filter(Boolean) as GroupDrop["engagement"]["mustRead"]["reactors"],
    },
    readBy: { count: 0, didReact: false, reactors: [] },
  };

  const allComments = Array.isArray(row.comments) ? row.comments : [];
  const latestComment = (() => {
    if (!allComments.length) return null;
    const latest = [...allComments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]!;
    const rawAuthor = Array.isArray(latest.author) ? latest.author[0] : latest.author;
    return {
      text: latest.comment_text,
      authorName: rawAuthor
        ? [rawAuthor.first_name, rawAuthor.last_name].filter(Boolean).join(" ") || rawAuthor.handle || null
        : null,
    };
  })();

  return {
    id: row.id,
    convo_id: row.convo_id,
    logged_item_id: row.logged_item_id,
    shared_by: row.shared_by,
    note: row.note,
    content: row.content ?? null,
    shared_at: row.shared_at,
    sharer: {
      id: rawSharer?.id ?? row.shared_by,
      display_name: rawSharer
        ? [rawSharer.first_name, rawSharer.last_name].filter(Boolean).join(" ") || rawSharer.handle || null
        : null,
      avatar_url: rawSharer?.avatar
        ? mediaToUrl(rawSharer.avatar as { file_path: string; bucket_name: string })
        : null,
      handle: rawSharer?.handle ?? "",
    },
    item: rawItem
      ? {
          url: rawItem.url ?? "",
          title: rawItem.title ?? "",
          preview_image_url: rawItem.preview_image_url ?? null,
          content_type: (rawItem.content_type ?? "article") as "article" | "video" | "podcast",
          raw_metadata: rawItem.raw_metadata ?? null,
          description: rawItem.description ?? null,
        }
      : null,
    engagement,
    commentCount: allComments.length,
    seenAt: null,
    latestCommentAt: allComments.length > 0
      ? [...allComments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]!.created_at
      : null,
    latestComment,
  } satisfies GroupDrop;
}

export const GROUP_POST_SELECT = `
  id,
  convo_id,
  logged_item_id,
  shared_by,
  note,
  content,
  shared_at,
  sharer:profiles!group_posts_shared_by_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle),
  item:logged_items!group_posts_logged_item_id_fkey(url, title, preview_image_url, content_type, raw_metadata, description),
  likes:group_posts_likes(id, user_id, liker:profiles!group_posts_likes_user_id_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)),
  must_reads:group_posts_must_reads(id, user_id, reader:profiles!group_posts_must_reads_user_id_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle)),
  comments:group_posts_comments(id, comment_text, created_at, user_id, author:profiles!group_posts_comments_user_id_fkey(id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle))
`;
