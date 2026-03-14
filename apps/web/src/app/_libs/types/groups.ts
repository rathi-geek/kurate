import type { Tables } from "@/app/_libs/types/database.types";

export type GroupRole = "owner" | "admin" | "member";

// Friendly profile shape used across group features.
// DB stores first_name + last_name separately; we combine into display_name.
// DB has a typo: avtar_url (not avatar_url); we alias it as avatar_url here.
export type GroupProfile = {
  id: string;
  display_name: string | null; // computed: first_name + " " + last_name
  avatar_url: string | null;   // aliased from avtar_url (DB typo)
  handle: string;
};

// Composed shape returned by useGroupFeed query
export type GroupDrop = Tables<"group_shares"> & {
  sharer: GroupProfile;
  item: Pick<
    Tables<"logged_items">,
    | "url"
    | "title"
    | "preview_image"
    | "source"
    | "content_type"
    | "read_time"
  > & { description: string | null };
  engagement: {
    like: { count: number; didReact: boolean };
    mustRead: { count: number; didReact: boolean };
    readBy: { count: number; didReact: boolean };
  };
  commentCount: number;
};

// Composed comment with replies
export type DropComment = Tables<"comments"> & {
  // parent_id not in DB types yet — treat as nullable
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
