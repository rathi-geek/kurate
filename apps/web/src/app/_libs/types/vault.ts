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
  tags: string[];
  shared_to_groups: string[];
  // Pending backend migration — optional until columns are added to logged_items
  is_read?: boolean;
  read_at?: string | null;
  reading_progress?: number;
  last_opened_at?: string | null;
};

export type TimeFilter = "today" | "week" | "month" | "all";
export type ContentTypeFilter = "all" | ContentType;

export interface VaultFilters {
  time: TimeFilter;
  contentType: ContentTypeFilter;
  search: string;
}

export interface VaultPagination {
  hasMore: boolean;
  lastCreatedAt: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
}
