import type { Database } from "./database.types";

// Derived directly from Supabase schema — updates automatically on pnpm db:types
type LoggedItemsRow = Database["public"]["Tables"]["logged_items"]["Row"];

export type VaultItemInsert = Database["public"]["Tables"]["logged_items"]["Insert"];
export type VaultItemUpdate = Database["public"]["Tables"]["logged_items"]["Update"];

// Narrow string columns to proper unions
export type ContentType = "article" | "video" | "podcast";
export type SaveSource = "logged" | "feed" | "discovered";

export type VaultItem = Omit<
  LoggedItemsRow,
  "content_type" | "save_source" | "tags" | "shared_to_groups"
> & {
  content_type: ContentType;
  save_source: SaveSource;
  // REAL SCHEMA: tags and shared_to_groups are nullable in the DB
  tags: string[] | null;
  shared_to_groups: string[] | null;
  // Pending backend migration — optional until columns are added to logged_items
  is_read?: boolean;
  read_at?: string | null;
  reading_progress?: number;
  last_opened_at?: string | null;
};

export type TimeFilter = "today" | "week" | "month" | "all";
export type ContentTypeFilter = "all" | ContentType;

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
