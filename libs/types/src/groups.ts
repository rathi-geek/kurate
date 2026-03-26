import type { Tables } from "./database.types";

export type GroupRole = "owner" | "admin" | "member";

// Friendly profile shape used across group features.
// DB stores first_name + last_name separately; we combine into display_name.
// DB has a typo: avtar_url (not avatar_url); we alias it as avatar_url here.
export type GroupProfile = {
  id: string;
  display_name: string | null; // computed: first_name + " " + last_name
  avatar_url: string | null; // aliased from avtar_url (DB typo)
  handle: string | null;
};

// Composed shape returned by useGroupFeed query
// Base table: group_posts (replaces group_shares)
export type GroupDrop = Tables<"group_posts"> & {
  sharer: GroupProfile;
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
  latestComment: { text: string; authorName: string | null } | null;
};

// Composed comment with replies
// Base table: group_posts_comments (replaces comments)
export type DropComment = Tables<"group_posts_comments"> & {
  author: GroupProfile;
  replies: (Tables<"group_posts_comments"> & {
    author: GroupProfile;
  })[];
};

// Base table: conversation_members (replaces group_members)
export type GroupMember = Tables<"conversation_members"> & {
  profile: GroupProfile;
};

// Conversation (group) with derived slug
export type GroupWithSlug = Tables<"conversations"> & {
  slug: string; // derived from slugified group_name
};
