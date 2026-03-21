# VAULT FEATURE — FULL IMPLEMENTATION PROMPT

## CONTEXT

You are working on a Next.js 16 (App Router) project called Kurate.
Tech stack: React 19, TypeScript (strict), Supabase, Framer Motion, shadcn/ui, Tailwind CSS v4.

Working directory: apps/web/src

---

## DESIGN SYSTEM RULES — FOLLOW STRICTLY

- NEVER use raw hex colors, Tailwind default colors (blue-500, red-400, etc.)
- ALWAYS use semantic tokens: bg-primary, text-foreground, bg-card, border-border,
  text-muted-foreground, bg-muted, bg-surface, text-destructive, bg-destructive/10
- Radius tokens: rounded-input (10px), rounded-button (10px), rounded-card (12px), rounded-badge (6px)
- Font: font-sans (DM Sans), font-mono (DM Mono), font-serif (Georgia)
- Motion: always import from "@/app/\_libs/utils/motion" or "framer-motion"
  Use springSnappy, springGentle for transitions. Never use cubic-bezier strings.
- Always check useReducedMotion() when using framer-motion animations
- Focus states: border-primary + ring-2 + ring-primary/20 (never raw outline)
- Shadows: shadow-sm (resting), shadow-md (hover/elevated)
- All components use "use client" if they have state or effects

---

## DATABASE — logged_items TABLE (Supabase)

Existing columns:
id uuid (PK)
user_id uuid
url text
title text
source text
author text
preview_image text
content_type text ("article" | "video" | "podcast")
read_time text
remarks text
tags text[]
raw_metadata jsonb (contains: description, and other extracted metadata)
created_at timestamptz
save_source text ("logged" | "feed" | "discovered")
shared_to_groups text[]
shared_from_name text
shared_from_handle text

UNIQUE constraint: (user_id, url)

Columns to be added later by backend team (make them optional in TypeScript types):
is_read boolean
read_at timestamptz
reading_progress integer
last_opened_at timestamptz

Read description via: raw_metadata->>'description'

---

## TANSTACK QUERY — ALREADY SET UP

@tanstack/react-query v5 and @tanstack/react-query-devtools are installed.

The following files already exist — DO NOT recreate them:

- src/app/_libs/query/client.ts         ← getQueryClient() singleton
- src/app/_libs/query/QueryProvider.tsx ← wraps root layout, available everywhere
- src/app/_libs/query/keys.ts           ← queryKeys.vault, queryKeys.feed, queryKeys.user, queryKeys.groups

QueryProvider is already added to src/app/layout.tsx (root) — all routes have access.

Import pattern:
  import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
  import { queryKeys } from "@/app/_libs/query/keys"
  import { getQueryClient } from "@/app/_libs/query/client"

---

## EXISTING FILES — DO NOT BREAK THESE

- src/app/_components/vault/VaultLibrary.tsx       ← REPLACE this entirely
- src/app/_components/reader/article-reader.tsx    ← EXTEND only
- src/app/_components/home/vault-tab-view.tsx      ← MINIMAL changes only
- src/app/_libs/chat-types.ts                      ← ADD types here, never remove existing
- src/app/_libs/supabase/client.ts                 ← Use createClient() from here — already typed with Database generic
- src/app/_libs/supabase/server.ts                 ← Already typed with Database generic
- src/app/_mocks/mock-data.ts                      ← Keep MOCK_ITEMS as fallback

---

## TASK — IMPLEMENT THE VAULT FEATURE

Build all files below in order. Each section specifies the exact file path,
purpose, and requirements.

═══════════════════════════════════════════════════════
STEP 1 — Types
FILE: src/app/\_libs/types/vault.ts (NEW FILE)
═══════════════════════════════════════════════════════

DO NOT write hardcoded types manually.

Types are auto-generated from the live Supabase schema.
The file already exists at: src/app/\_libs/types/database.types.ts
Both Supabase clients (client.ts and server.ts) are already typed with Database generic.

Derive all vault types from the generated schema:

```ts
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

// NOTE: description is NOT a column on logged_items.
// Read it via: item.raw_metadata?.description
// NOTE: profiles table has NO handle/username field — only display_name.

export type TimeFilter = "today" | "week" | "month" | "all";
export type ContentTypeFilter = "all" | ContentType;

export interface VaultFilters {
  time: TimeFilter;
  contentType: ContentTypeFilter;
  search: string;
}

```

NOTE: VaultPagination interface is NOT needed — TanStack Query manages all pagination state internally.

═══════════════════════════════════════════════════════
STEP 2 — Data Hook
FILE: src/app/_libs/hooks/useVault.ts  (NEW FILE)
═══════════════════════════════════════════════════════

Use TanStack Query (useInfiniteQuery + useMutation). No manual pagination state. No refreshKey.

```ts
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { startOfDay, subDays } from "date-fns";
import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import { MOCK_ITEMS } from "@/app/_mocks/mock-data";
import type { VaultFilters, VaultItem } from "@/app/_libs/types/vault";

const PAGE_SIZE = 20;

// Module-level singleton — avoids recreating the client on every call
const supabase = createClient();

async function fetchVaultPage(filters: VaultFilters, cursor: string | null): Promise<VaultItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("logged_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) query = query.lt("created_at", cursor);

  if (filters.time === "today") query = query.gte("created_at", startOfDay(new Date()).toISOString());
  if (filters.time === "week")  query = query.gte("created_at", subDays(new Date(), 7).toISOString());
  if (filters.time === "month") query = query.gte("created_at", subDays(new Date(), 30).toISOString());
  if (filters.contentType !== "all") query = query.eq("content_type", filters.contentType);
  if (filters.search.trim()) {
    const q = filters.search.trim();
    query = query.or(`title.ilike.%${q}%,source.ilike.%${q}%,author.ilike.%${q}%,remarks.ilike.%${q}%`);
  }

  const { data, error } = await query;
  // Throw so TanStack can track isError, trigger retry (retry: 1 in client.ts), and expose error
  if (error) throw new Error(error.message);
  return (data ?? []) as VaultItem[];
}

export function useVault(filters: VaultFilters) {
  const queryClient = useQueryClient();
  // Use the module-level singleton, not a new client per render

  const query = useInfiniteQuery({
    queryKey: queryKeys.vault.list(filters),
    queryFn: ({ pageParam }) => fetchVaultPage(filters, pageParam as string | null),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].created_at : undefined,
    staleTime: 1000 * 60,
  });

  const items = query.data?.pages.flat() ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("logged_items").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vault.all });
      const previous = queryClient.getQueryData(queryKeys.vault.list(filters));
      queryClient.setQueryData(queryKeys.vault.list(filters), (old: InfiniteData<VaultItem[]> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => page.filter((item) => item.id !== id)),
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.vault.list(filters), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.vault.all }),
  });

  const remarksMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks: string }) => {
      const { error } = await supabase.from("logged_items").update({ remarks }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, remarks }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vault.all });
      const previous = queryClient.getQueryData(queryKeys.vault.list(filters));
      queryClient.setQueryData(queryKeys.vault.list(filters), (old: InfiniteData<VaultItem[]> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((item) => (item.id === id ? { ...item, remarks } : item))
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.vault.list(filters), context.previous);
    },
  });

  // saveItem belongs in useVault — vault is for personal reading AND sharing with groups/profiles.
  // content_type should NOT be hardcoded — it must be extracted from the URL by the backend/metadata service.
  // For now pass it as a param; default to "article" only when auto-detection is unavailable.
  async function saveItem(
    url: string,
    metadata?: { content_type?: ContentType; title?: string }
  ): Promise<"saved" | "duplicate" | "error"> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "error";
      const { error } = await supabase.from("logged_items").upsert(
        {
          user_id: user.id,
          url,
          save_source: "logged",
          // Use detected content_type if available; fall back to "article"
          content_type: metadata?.content_type ?? "article",
          ...(metadata?.title ? { title: metadata.title } : {}),
        },
        { onConflict: "user_id,url" }
      );
      if (error?.code === "23505") return "duplicate";
      if (error) return "error";
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      return "saved";
    } catch {
      return "error";
    }
  }

  return {
    items,
    // TanStack state — expose all so VaultLibrary doesn't need to import useQuery directly
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isFetching: query.isFetching,   // true during background refetch (after invalidation)
    isError: query.isError,
    error: query.error,
    hasMore: query.hasNextPage ?? false,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,         // manual retry
    deleteItem: deleteMutation.mutate,
    updateRemarks: (id: string, remarks: string) => remarksMutation.mutate({ id, remarks }),
    saveItem, // signature: (url, metadata?) => Promise<"saved" | "duplicate" | "error">
  };
}

// Also import ContentType in this file:
// import type { VaultFilters, VaultItem, ContentType } from "@/app/_libs/types/vault";
```

Use date-fns for date calculations (already installed).
Import MOCK_ITEMS from "@/app/_mocks/mock-data".

═══════════════════════════════════════════════════════
STEP 3 — VaultSearch
FILE: src/app/\_components/vault/VaultSearch.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: { value: string; onChange: (v: string) => void }

- Use the existing Input component from "@/components/ui/input"
- Show search icon (SVG, 16x16, strokeWidth 1.5) on left inside input
- Show clear button (×) when value is not empty
- Debounce: update parent onChange after 300ms using useEffect + setTimeout
- Placeholder: "Search your vault…"
- Wrap in a div with relative positioning for icons

═══════════════════════════════════════════════════════
STEP 4 — VaultFilters
FILE: src/app/\_components/vault/VaultFilters.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: { filters: VaultFilters; onChange: (f: VaultFilters) => void }

Layout: horizontal flex row, gap-3, flex-wrap

LEFT: Time filter pills (Today | This Week | Month | All)

- Pill button style: px-3 py-1.5 rounded-badge font-sans text-xs font-medium
- Active: bg-primary text-primary-foreground
- Inactive: bg-muted text-muted-foreground hover:bg-muted/80
- transition-colors duration-150

RIGHT: Content type dropdown using shadcn DropdownMenu

- Trigger button: same pill style, shows current selection + chevron icon
- Options: All Types | Articles | Videos | Podcasts
- Active option shows checkmark on left

═══════════════════════════════════════════════════════
STEP 5 — VaultEmptyState
FILE: src/app/\_components/vault/VaultEmptyState.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: { onExplore: () => void }

- Import BrandArch from "@/components/brand"
- Center content vertically and horizontally
- BrandArch at s=56, className="text-muted-foreground/30 mb-5"
- Title: "Your Vault is empty" — font-serif text-lg font-bold text-foreground
- Subtitle: "Save articles, videos, and podcasts to read later." — font-sans text-sm text-muted-foreground mt-1
- Button: "Explore Discover Feed" — uses Button component variant="outline" size="sm" — calls onExplore
- Wrap in motion.div with fadeUp variant, min-h-[240px] flex flex-col items-center justify-center

═══════════════════════════════════════════════════════
STEP 6 — VaultErrorState
FILE: src/app/\_components/vault/VaultErrorState.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: { onRetry: () => void }

- Center content vertically and horizontally, min-h-[240px]
- Icon: exclamation circle SVG (24×24, strokeWidth 1.5), text-destructive/60
- Title: "Something went wrong" — font-serif text-base font-bold text-foreground mt-3
- Subtitle: "We couldn't load your Vault. Check your connection." — font-sans text-sm text-muted-foreground mt-1
- Button: "Try again" — variant="outline" size="sm" mt-4 — calls onRetry
- Wrap in motion.div fadeUp variant

This is intentionally minimal. TanStack will automatically retry once (retry: 1 in client.ts)
before this state appears, so users rarely see it.

═══════════════════════════════════════════════════════
STEP 7 — VaultDeleteModal
FILE: src/app/\_components/vault/VaultDeleteModal.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: {
open: boolean
onConfirm: () => void
onCancel: () => void
}

- Use Dialog, DialogContent, DialogTitle, DialogDescription from "@/components/ui/dialog"
- Title: "Delete item?"
- Description: "This will permanently remove it from your Vault."
- Checkbox: "Don't ask again" using Radix Checkbox from "@/components/ui/checkbox"
  - On check: localStorage.setItem("vault.skipDeleteConfirm", "true")
- Buttons: [Cancel] [Delete]
  - Cancel: variant="outline"
  - Delete: variant="destructive" (uses bg-destructive text-destructive-foreground)
- Store skip preference in localStorage key: "vault.skipDeleteConfirm"

Export also a helper: shouldSkipConfirm() → boolean
reads localStorage.getItem("vault.skipDeleteConfirm") === "true"

═══════════════════════════════════════════════════════
STEP 8 — VaultCard
FILE: src/app/\_components/vault/VaultCard.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: {
item: VaultItem
onOpen: (item: VaultItem) => void
onDelete: (id: string) => void
onShare: (item: VaultItem) => void
onToggleRead: (item: VaultItem) => void
onEditRemark: (id: string, value: string) => void
}

Wrap entire export in React.memo.

CARD STRUCTURE:
┌──────────────────────────────────┐
│ [preview image or type badge] │ ← h-[120px] object-cover
│ content_type pill (top-left) │ ← absolute positioned
├──────────────────────────────────┤
│ Title (line-clamp-2) │
│ Remark (editable, optional) │
│ Description (line-clamp-2) │ ← from raw_metadata?.description
├──────────────────────────────────┤
│ Source · timeAgo [icons row] │
└──────────────────────────────────┘

CONTENT TYPE PILL:

- Article: bg-brand-50 text-primary
- Video: bg-info-bg text-info-foreground
- Podcast: bg-warning-bg text-warning-foreground
- font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-badge

READ STATE (when is_read is true — optional field):

- Apply opacity-60 to the card
- Show small eye icon badge overlaid on image (bottom-right of image area)

REMARK EDITING:

- If remarks exist: show text with pencil icon on hover
- Click pencil → swap <p> for <textarea> (same font, no border, bg-transparent, outline:none)
- Track editing state locally with useState
- On blur or Enter: call onEditRemark(id, value), exit edit mode
- On Escape: cancel and restore original value

SWIPE TO DELETE:

- Wrap card content in motion.div with drag="x" dragConstraints={{ left: -72, right: 0 }}
- dragElastic={0.1}
- On dragEnd: if offset.x < -48 → call onDelete(id) flow (check shouldSkipConfirm first)
- Behind the card (absolutely positioned, right side): red strip with trash icon
  bg-destructive/90 text-destructive-foreground, width=72px, full height, flex center
- Animate its opacity based on drag progress using useMotionValue + useTransform

FOOTER ACTIONS (icon buttons, h-7 w-7, rounded-button):

- Open: external link icon → calls onOpen(item)
- Read toggle: eye / eye-off → calls onToggleRead(item)
- Share: share icon → calls onShare(item)
- Delete: trash icon → runs delete flow (check shouldSkipConfirm)
  All icons: SVG inline, 14×14, strokeWidth 1.5, stroke="currentColor", fill="none"

CARD OUTER WRAPPER:

- rounded-card border border-border bg-card overflow-hidden
- hover:shadow-md transition-shadow duration-200
- NO hardcoded background colors — only bg-card and design tokens

timeAgo: format with date-fns formatDistanceToNow(new Date(item.created_at), { addSuffix: true })

═══════════════════════════════════════════════════════
STEP 9 — VaultGrid
FILE: src/app/\_components/vault/VaultGrid.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: {
items: VaultItem[]
hasMore: boolean
isLoadingMore: boolean
onLoadMore: () => void
onOpen: (item: VaultItem) => void
onDelete: (id: string) => void
onShare: (item: VaultItem) => void
onToggleRead: (item: VaultItem) => void
onEditRemark: (id: string, val: string) => void
}

GRID:

- grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3

INFINITE SCROLL:

- Place a sentinel <div ref={sentinelRef}> below the grid
- Use IntersectionObserver: when sentinel enters viewport → call onLoadMore()
- Only trigger when hasMore is true and not isLoadingMore
- Cleanup observer on unmount

SKELETON LOADING (while isLoadingMore):

- Show 3 VaultCardSkeleton components below the grid
- Skeleton: same card size, use bg-muted animate-pulse for image and text areas
- rounded-card border border-border overflow-hidden

STAGGER ANIMATION:

- Wrap grid in motion.div with variants staggerContainer (from motion-variants)
- Each VaultCard wrapped in motion.div with staggerItem variant
- Only animate on initial mount, not on filter change (use key prop on grid)

═══════════════════════════════════════════════════════
STEP 10 — VaultLibrary (REFACTORED ORCHESTRATOR)
FILE: src/app/\_components/vault/VaultLibrary.tsx (REPLACE ENTIRELY)
═══════════════════════════════════════════════════════

Props: {
  onItemClick: (item: VaultItem) => void
  panelMode?: boolean
  onNavigateToDiscover?: () => void
}

NOTE: refreshKey prop is REMOVED — TanStack Query handles cache invalidation via
queryClient.invalidateQueries({ queryKey: queryKeys.vault.all }) called inside useVault mutations.

Responsibilities (NO direct Supabase calls, NO heavy JSX):

1. Own filters state (VaultFilters)
2. Call useVault(filters)  ← no refreshKey
3. Manage deleteModal state (open, targetId)
4. Manage shareModal state (open, targetItem)
5. Handle open → call onItemClick(item)
6. Handle delete flow: check shouldSkipConfirm() → skip modal or show VaultDeleteModal
7. Render VaultSearch + VaultFilters + VaultGrid or VaultEmptyState

Structure:

```tsx
export function VaultLibrary({ onItemClick, panelMode, onNavigateToDiscover }) {
  const [filters, setFilters] = useState<VaultFilters>({
    time: "all",
    contentType: "all",
    search: "",
  });
  const { items, isLoading, isLoadingMore, isFetching, isError, hasMore, loadMore, deleteItem, updateRemarks, refetch } = useVault(filters);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; targetId: string | null }>({
    open: false,
    targetId: null,
  });

  function handleDelete(id: string) {
    if (shouldSkipConfirm()) {
      deleteItem(id);
      return;
    }
    setDeleteModal({ open: true, targetId: id });
  }

  const isEmpty = !isLoading && items.length === 0;

  return (
    <div className={panelMode ? "space-y-4 p-5" : "mt-8 space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VaultSearch
          value={filters.search}
          onChange={(s) => setFilters((f) => ({ ...f, search: s }))}
        />
      </div>
      <VaultFilters filters={filters} onChange={setFilters} />

      {/* Subtle top bar when background refetch is in progress */}
      {isFetching && !isLoading && (
        <div className="h-0.5 w-full animate-pulse bg-primary/30 rounded-full" />
      )}

      {isLoading && <VaultGridSkeleton />}
      {!isLoading && isError && (
        <VaultErrorState onRetry={refetch} />
      )}
      {!isLoading && !isError && isEmpty && (
        <VaultEmptyState onExplore={onNavigateToDiscover ?? (() => {})} />
      )}
      {!isLoading && !isError && !isEmpty && (
        <VaultGrid
          items={items}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
          onOpen={onItemClick}
          onDelete={handleDelete}
          onShare={(item) => {
            /* open share modal */
          }}
          onToggleRead={(item) => {
            /* toggle read */
          }}
          onEditRemark={updateRemarks}
        />
      )}

      <VaultDeleteModal
        open={deleteModal.open}
        onConfirm={() => {
          deleteItem(deleteModal.targetId!);
          setDeleteModal({ open: false, targetId: null });
        }}
        onCancel={() => setDeleteModal({ open: false, targetId: null })}
      />
    </div>
  );
}
```

═══════════════════════════════════════════════════════
STEP 11 — VaultShareModal
FILE: src/app/\_components/vault/VaultShareModal.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: {
open: boolean
item: VaultItem | null
onClose: () => void
}

- Use Dialog from shadcn
- Title: "Share to group"
- Fetch user's groups from Supabase (table: groups — select id, name, slug)
- For each group: show group name
  - If (item.shared_to_groups ?? []).includes(groupId): show "✓ Already Shared" greyed out
    (NOTE: shared_to_groups is string[] | null in the real schema — always null-coalesce)
  - Otherwise: show "Share" button
- On share: update shared_to_groups array in logged_items via Supabase
- Optimistic update: close modal, parent refreshes vault
- If groups table doesn't exist yet: show "No groups yet" empty state

═══════════════════════════════════════════════════════
STEP 12 — VideoPlayer
FILE: src/app/\_components/reader/VideoPlayer.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: {
url: string | null
title?: string | null
onClose: () => void
}

DETECTION:

- YouTube: url matches youtube.com/watch?v= or youtu.be/
  → extract video ID → embed as https://www.youtube.com/embed/{id}
- Vimeo: url matches vimeo.com/{id}
  → embed as https://player.vimeo.com/video/{id}
- Otherwise: call window.open(url, "\_blank", "noopener") and onClose()

UI:

- Same slide-in panel pattern as ArticleReader
- 16:9 iframe container: aspect-video w-full
- Close button top-right (same as ArticleReader)
- Title below iframe
- Animation: same slideInRight variant as ArticleReader

═══════════════════════════════════════════════════════
STEP 13 — PodcastPlayer
FILE: src/app/\_components/reader/PodcastPlayer.tsx (NEW FILE)
═══════════════════════════════════════════════════════

Props: {
url: string | null
title?: string | null
source?: string | null
onClose: () => void
}

DETECTION:

- Direct audio: url ends with .mp3, .m4a, .ogg, .wav
  → render <audio controls> with HTML5 player
- Otherwise: window.open(url, "\_blank", "noopener") and onClose()

UI:

- Bottom sheet panel (slides up from bottom) instead of side panel
- Shows title + source at top
- HTML5 <audio> element with controls, full width
- Close button top-right
- Height: auto, min-h-[140px]

═══════════════════════════════════════════════════════
STEP 14 — Wire everything in home/page.tsx
FILE: src/app/(app)/home/page.tsx (EXTEND)
═══════════════════════════════════════════════════════

Update handleFeedItemClick and the open logic:

- article → setReaderUrl + setReaderItem (existing)
- video → setVideoItem(item) → renders VideoPlayer
- podcast → setPodcastItem(item) → renders PodcastPlayer

Add state:
const [videoItem, setVideoItem] = useState<VaultItem | null>(null)
const [podcastItem, setPodcastItem] = useState<VaultItem | null>(null)

Pass onNavigateToDiscover to VaultTabView which passes it to VaultLibrary:
onNavigateToDiscover = () => setActiveTab(HomeTab.DISCOVERING)

Duplicate save notification:

- Import and use sonner toast
- In handleSend (vault tab): if saveItem returns "duplicate":
  toast("Already in your Vault", { description: "This link has been saved before." })

═══════════════════════════════════════════════════════
STEP 15 — Update vault-tab-view.tsx
FILE: src/app/\_components/home/vault-tab-view.tsx (EXTEND)
═══════════════════════════════════════════════════════

Add prop: onNavigateToDiscover: () => void
Pass it through to VaultLibrary.

Remove the refreshKey prop entirely — no longer needed.
VaultLibrary now self-invalidates via TanStack Query when items are saved/deleted.

Update VaultLibrary call:
onItemClick now receives VaultItem (not just url string).
Pass the full item up to home/page.tsx for routing to correct player.

Update the onOpenArticle prop name to onItemClick with type (item: VaultItem) => void.

In home/page.tsx:
- Remove vaultRefreshKey state and setVaultRefreshKey entirely
- When a URL is saved via ChatInput: use queryClient.invalidateQueries({ queryKey: queryKeys.vault.all })
  instead of setVaultRefreshKey((k) => k + 1)
- Import: import { useQueryClient } from "@tanstack/react-query"
         import { queryKeys } from "@/app/_libs/query/keys"

---

## CONSTRAINTS

1. Do NOT modify any auth files
2. Do NOT modify AppShell, AppSidebar
3. Do NOT modify any files outside of:
   - src/app/\_components/vault/
   - src/app/\_components/reader/
   - src/app/\_components/home/vault-tab-view.tsx
   - src/app/(app)/home/page.tsx
   - src/app/\_libs/types/vault.ts (new)
   - src/app/\_libs/hooks/useVault.ts (new)
4. Every new component file must start with "use client"
5. Never use any Tailwind color that is not a semantic token
6. Every list item rendered from an array must have a stable key (use item.id)
7. React.memo on VaultCard — it must NOT re-render unless its own item prop changes
8. All SVG icons: inline, fill="none", stroke="currentColor", strokeWidth={1.5}, strokeLinecap="round", strokeLinejoin="round"
9. Import cn from "@/app/\_libs/utils/cn"
10. Import motion utilities from "@/app/\_libs/utils/motion" or directly from "framer-motion"

---

## IMPLEMENTATION ORDER

Follow this order exactly:

1. vault.ts (types)
2. useVault.ts (hook)
3. VaultEmptyState.tsx
4. VaultErrorState.tsx
5. VaultSearch.tsx
6. VaultFilters.tsx
7. VaultDeleteModal.tsx
8. VaultCard.tsx
9. VaultGrid.tsx
10. VaultLibrary.tsx (replace)
11. VaultShareModal.tsx
12. VideoPlayer.tsx
13. PodcastPlayer.tsx
14. vault-tab-view.tsx (extend)
15. home/page.tsx (extend)
