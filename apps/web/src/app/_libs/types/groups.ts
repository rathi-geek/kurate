import type { Tables } from "@/app/_libs/types/database.types";

export type GroupRole = "owner" | "admin" | "member";

// Minimal profile shape used across group features
// Note: profiles table has no handle column — display_name used as handle fallback
export type GroupProfile = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "avatar_url"
>;

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
