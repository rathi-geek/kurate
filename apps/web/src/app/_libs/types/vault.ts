import type { Database } from "./database.types";

type LoggedItemsRow = Database["public"]["Tables"]["logged_items"]["Row"];
type UserLoggedItemsRow = Database["public"]["Tables"]["user_logged_items"]["Row"];

export type VaultItemInsert = Database["public"]["Tables"]["user_logged_items"]["Insert"];
export type VaultItemUpdate = Database["public"]["Tables"]["user_logged_items"]["Update"];

// Narrow string columns to proper unions
export type ContentType = "article" | "video" | "podcast";
export type SaveSource = "external" | "shares" | "web_extension";

// raw_metadata JSON blob shape written by frontend
export interface RawMetadata {
  source?: string | null;
  author?: string | null;
  read_time?: string | null;
}

// VaultItem is the joined shape: user_logged_items + logged_items
export type VaultItem = Omit<UserLoggedItemsRow, "save_source"> & {
  save_source: SaveSource;
  // Fields joined from logged_items
  url: string;
  title: string;
  url_hash: string;
  preview_image_url: string | null;
  content_type: ContentType;
  description: string | null;
  tags: string[] | null;
  raw_metadata: RawMetadata | null;
  logged_item_created_at: string;
};

export type TimeFilter = "today" | "week" | "month" | "all";
export type ContentTypeFilter = "all" | ContentType;

/** Viewport rect for expand-from-card animation (e.g. VideoPlayer). */
export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Translation keys for vault time filter labels (must exist in vault messages). */
export type VaultTimeFilterLabelKey =
  | "time_today"
  | "time_week"
  | "time_month"
  | "time_all";

/** Translation keys for vault content type filter labels (must exist in vault messages). */
export type VaultContentTypeFilterLabelKey =
  | "filter_all_types"
  | "filter_articles"
  | "filter_videos"
  | "filter_podcasts";

/** Enum-derived time filter options (single source of truth). Use when backend does not provide options. */
export const TIME_FILTER_OPTIONS: readonly {
  value: TimeFilter;
  labelKey: VaultTimeFilterLabelKey;
}[] = [
  { value: "today", labelKey: "time_today" },
  { value: "week", labelKey: "time_week" },
  { value: "month", labelKey: "time_month" },
  { value: "all", labelKey: "time_all" },
] as const;

/** Enum-derived content type filter options (single source of truth). Use when backend does not provide options. */
export const CONTENT_TYPE_FILTER_OPTIONS: readonly {
  value: ContentTypeFilter;
  labelKey: VaultContentTypeFilterLabelKey;
}[] = [
  { value: "all", labelKey: "filter_all_types" },
  { value: "article", labelKey: "filter_articles" },
  { value: "video", labelKey: "filter_videos" },
  { value: "podcast", labelKey: "filter_podcasts" },
] as const;

export interface VaultFilters {
  time: TimeFilter;
  contentType: ContentTypeFilter;
  search: string;
}

// Re-export raw DB row types for hooks that need direct table access
export type { LoggedItemsRow, UserLoggedItemsRow };
