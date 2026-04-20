import type { Database, GroupDrop, GroupProfile } from "@kurate/types";

type ContentType = Database["public"]["Enums"]["content_type_enum"];

/** Flat row shape returned by both `get_group_feed_page` and `get_discovery_feed_page` RPCs. */
export type FeedRow =
  Database["public"]["Functions"]["get_group_feed_page"]["Returns"][number];

export function mapFeedRowToGroupDrop(
  row: FeedRow,
  reactors?: {
    like: Map<string, GroupProfile[]>;
    mustRead: Map<string, GroupProfile[]>;
  },
): GroupDrop {
  return {
    id: row.id,
    convo_id: row.convo_id,
    logged_item_id: row.logged_item_id,
    shared_by: row.shared_by,
    note: row.note,
    content: row.content ?? null,
    shared_at: row.shared_at,
    sharer: {
      id: row.sharer_id ?? row.shared_by,
      display_name: row.sharer_display_name ?? null,
      avatar_path: row.sharer_avatar_path,
      handle: row.sharer_handle ?? null,
    },
    item:
      row.item_url != null
        ? {
            url: row.item_url ?? "",
            title: row.item_title ?? null,
            preview_image_url: row.item_preview_image ?? null,
            content_type: (row.item_content_type ?? "article") as ContentType,
            raw_metadata: row.item_raw_metadata ?? null,
            description: row.item_description ?? null,
          }
        : null,
    engagement: {
      like: {
        count: Number(row.like_count),
        didReact: row.did_like ?? false,
        reactors: reactors?.like.get(row.id) ?? [],
      },
      mustRead: {
        count: Number(row.must_read_count),
        didReact: row.did_must_read ?? false,
        reactors: reactors?.mustRead.get(row.id) ?? [],
      },
      readBy: { count: 0, didReact: false, reactors: [] },
    },
    commentCount: Number(row.comment_count),
    seenAt: row.seen_at ?? null,
    latestCommentAt: null,
    latestComment: null,
  };
}
