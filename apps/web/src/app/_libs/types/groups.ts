import type { Tables } from "@/app/_libs/types/database.types";

export type GroupRole = "owner" | "admin" | "member";

// Friendly profile shape used across group features.
// DB stores first_name + last_name separately; we combine into display_name.
// DB has a typo: avtar_url (not avatar_url); we alias it as avatar_url here.
export type GroupProfile = {
  id: string;
  display_name: string | null; // computed: first_name + " " + last_name
  avatar_url: string | null;   // aliased from avtar_url (DB typo)
  handle: string | null;
};

// Composed shape returned by useGroupFeed query
export type GroupDrop = Tables<"group_shares"> & {
  sharer: GroupProfile;
  // item is null for text-only posts (requires DB migration: group_shares.content + nullable logged_item_id)
  item: (Pick<
    Tables<"logged_items">,
    | "url"
    | "title"
    | "preview_image"
    | "source"
    | "content_type"
    | "read_time"
  > & { description: string | null }) | null;
  // content is the text body for text-only posts (requires DB migration: group_shares.content)
  content: string | null;
  engagement: {
    like: { count: number; didReact: boolean; reactors: GroupProfile[] };
    mustRead: { count: number; didReact: boolean; reactors: GroupProfile[] };
    readBy: { count: number; didReact: boolean; reactors: GroupProfile[] };
  };
  commentCount: number;
};

// Composed comment with replies
// parent_id and updated_at require DB migration: comments.parent_id UUID, comments.updated_at TIMESTAMPTZ
export type DropComment = Tables<"comments"> & {
  parent_id: string | null;
  updated_at: string | null;
  author: GroupProfile;
  replies: (Tables<"comments"> & {
    parent_id: string | null;
    updated_at: string | null;
    author: GroupProfile;
  })[];
};

export type GroupMember = Tables<"group_members"> & {
  profile: GroupProfile;
};

// Group with slug (slug not in DB yet — use id as fallback)
export type GroupWithSlug = Tables<"groups"> & {
  slug: string | null;
};
