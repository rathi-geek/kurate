import type { Tables } from "./database.types";

export type GroupRole = "owner" | "admin" | "member";

// Friendly profile shape used across group features.
// DB stores first_name + last_name separately; we combine into display_name.
// DB has a typo: avtar_url (not avatar_url); we alias it as avatar_url here.
export type GroupProfile = {
  id: string;
  display_name: string | null; // computed: first_name + " " + last_name
  avatar_path: string | null; // 'bucket_name/file_path' from _avatar_path() RPC helper
  handle: string | null;
};

// Composed shape returned by useGroupFeed query
// Base table: group_posts (replaces group_shares)
export type GroupDrop = Tables<"group_posts"> & {
  sharer: GroupProfile;
  content: string | null;
  // item is null for text-only posts (logged_item_id is nullable)
  item: Pick<
    Tables<"logged_items">,
    "url" | "title" | "preview_image_url" | "content_type" | "raw_metadata" | "description"
  > | null;
  engagement: {
    like: { count: number; didReact: boolean; reactors: GroupProfile[] };
    mustRead: { count: number; didReact: boolean; reactors: GroupProfile[] };
    readBy: { count: number; didReact: boolean; reactors: GroupProfile[] };
  };
  commentCount: number;
  seenAt: string | null;           // from group_post_last_seen (current user only, via RLS)
  latestCommentAt: string | null;  // created_at of the most recent comment
  latestComment: { text: string; authorName: string | null; authorAvatarPath: string | null } | null;
};

// Composed comment — flat shape matching get_group_post_comments RPC
// Base table: group_posts_comments (replaces comments)
export type DropComment = Tables<"group_posts_comments"> & {
  author_id: string;
  author_display_name: string | null;
  author_avatar_path: string | null;
  author_handle: string;
};

// Composed member — flat shape matching get_group_members RPC
// Base table: conversation_members (replaces group_members)
export type GroupMember = Tables<"conversation_members"> & {
  profile_id: string;
  profile_display_name: string | null;
  profile_avatar_path: string | null;
  profile_handle: string;
};

// Conversation (group) with derived slug
export type GroupWithSlug = Tables<"conversations"> & {
  slug: string; // derived from slugified group_name
};
