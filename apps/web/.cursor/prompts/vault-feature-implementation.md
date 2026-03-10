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
- Motion: always import from "@/app/_libs/utils/motion" or "framer-motion"
  Use springSnappy, springGentle for transitions. Never use cubic-bezier strings.
- Always check useReducedMotion() when using framer-motion animations
- Focus states: border-primary + ring-2 + ring-primary/20 (never raw outline)
- Shadows: shadow-sm (resting), shadow-md (hover/elevated)
- All components use "use client" if they have state or effects

---

## DATABASE — logged_items TABLE (Supabase)

Existing columns:
  id                  uuid (PK)
  user_id             uuid
  url                 text
  title               text
  source              text
  author              text
  preview_image       text
  content_type        text  ("article" | "video" | "podcast")
  read_time           text
  remarks             text
  tags                text[]
  raw_metadata        jsonb  (contains: description, and other extracted metadata)
  created_at          timestamptz
  save_source         text  ("logged" | "feed" | "discovered")
  shared_to_groups    text[]
  shared_from_name    text
  shared_from_handle  text

UNIQUE constraint: (user_id, url)

Columns to be added later by backend team (make them optional in TypeScript types):
  is_read             boolean
  read_at             timestamptz
  reading_progress    integer
  last_opened_at      timestamptz

Read description via: raw_metadata->>'description'

---

## EXISTING FILES — DO NOT BREAK THESE

- src/app/_components/vault/VaultLibrary.tsx       ← REPLACE this entirely
- src/app/_components/reader/article-reader.tsx    ← EXTEND only
- src/app/_components/home/vault-tab-view.tsx      ← MINIMAL changes only
- src/app/_libs/chat-types.ts                      ← ADD types here, never remove existing
- src/app/_libs/supabase/client.ts                 ← Use createClient() from here — already typed with Database generic
- src/app/_libs/supabase/server.ts                 ← Already typed with Database generic
- src/app/_libs/types/database.types.ts            ← Auto-generated Supabase types — DO NOT edit manually, run pnpm db:types to regenerate
- src/app/_mocks/mock-data.ts                      ← Keep MOCK_ITEMS as fallback

---

## TASK — IMPLEMENT THE VAULT FEATURE

Build all files below in order. Each section specifies the exact file path,
purpose, and requirements.

═══════════════════════════════════════════════════════
STEP 1 — Types
FILE: src/app/_libs/types/vault.ts  (NEW FILE)
═══════════════════════════════════════════════════════

DO NOT write hardcoded types manually.

Types are auto-generated from the live Supabase schema.
The file already exists at: src/app/_libs/types/database.types.ts
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
export type SaveSource  = "logged" | "feed" | "discovered";

export type VaultItem = Omit<LoggedItemsRow, "content_type" | "save_source" | "tags" | "shared_to_groups"> & {
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

export type TimeFilter        = "today" | "week" | "month" | "all";
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
```

═══════════════════════════════════════════════════════
STEP 2 — Data Hook
FILE: src/app/_libs/hooks/useVault.ts  (NEW FILE)
═══════════════════════════════════════════════════════

This hook owns ALL data logic. No component should call Supabase directly.

Implement:

```ts
export function useVault(filters: VaultFilters, refreshKey: number) {
  // Returns:
  // items: VaultItem[]
  // pagination: VaultPagination
  // loadMore: () => Promise<void>
  // deleteItem: (id: string) => Promise<void>
  // updateRemarks: (id: string, remarks: string) => Promise<void>
  // saveItem: (url: string) => Promise<"saved" | "duplicate" | "error">
}
```

Implementation rules:

FETCH:
- Initial load: 20 items, ordered by created_at DESC
- Cursor pagination: WHERE created_at < lastItem.created_at LIMIT 20
- Time filter:
    today → gte(startOfDay(new Date()))
    week  → gte(subDays(new Date(), 7))
    month → gte(subDays(new Date(), 30))
    all   → no filter
- contentType filter: eq("content_type", value) — skip if "all"
- Search: .or(`title.ilike.%${q}%,source.ilike.%${q}%,author.ilike.%${q}%,remarks.ilike.%${q}%`)
- On Supabase error: fall back to MOCK_ITEMS from mock-data.ts

DUPLICATE DETECTION (saveItem):
- Use upsert with onConflict: "user_id,url"
- If Supabase error code is "23505" → return "duplicate"
- Otherwise return "saved" or "error"

DELETE:
- Optimistic: remove from items state immediately
- Call supabase.from("logged_items").delete().eq("id", id)
- On error: restore item to previous position

UPDATE REMARKS:
- Optimistic update in state
- Call supabase.from("logged_items").update({ remarks }).eq("id", id)

Use date-fns for date calculations (already installed).
Import MOCK_ITEMS from "@/app/_mocks/mock-data".

═══════════════════════════════════════════════════════
STEP 3 — VaultSearch
FILE: src/app/_components/vault/VaultSearch.tsx  (NEW FILE)
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
FILE: src/app/_components/vault/VaultFilters.tsx  (NEW FILE)
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
FILE: src/app/_components/vault/VaultEmptyState.tsx  (NEW FILE)
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
STEP 6 — VaultDeleteModal
FILE: src/app/_components/vault/VaultDeleteModal.tsx  (NEW FILE)
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
STEP 7 — VaultCard
FILE: src/app/_components/vault/VaultCard.tsx  (NEW FILE)
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
│  [preview image or type badge]   │  ← h-[120px] object-cover
│  content_type pill (top-left)    │  ← absolute positioned
├──────────────────────────────────┤
│  Title (line-clamp-2)            │
│  Remark (editable, optional)     │
│  Description (line-clamp-2)      │  ← from raw_metadata?.description
├──────────────────────────────────┤
│  Source · timeAgo    [icons row] │
└──────────────────────────────────┘

CONTENT TYPE PILL:
- Article: bg-brand-50 text-primary
- Video:   bg-info-bg text-info-foreground
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
STEP 8 — VaultGrid
FILE: src/app/_components/vault/VaultGrid.tsx  (NEW FILE)
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
STEP 9 — VaultLibrary (REFACTORED ORCHESTRATOR)
FILE: src/app/_components/vault/VaultLibrary.tsx  (REPLACE ENTIRELY)
═══════════════════════════════════════════════════════

Props: {
  refreshKey: number
  onItemClick: (item: VaultItem) => void
  panelMode?: boolean
  onNavigateToDiscover?: () => void
}

Responsibilities (NO direct Supabase calls, NO heavy JSX):
1. Own filters state (VaultFilters)
2. Call useVault(filters, refreshKey)
3. Manage deleteModal state (open, targetId)
4. Manage shareModal state (open, targetItem)
5. Handle open → call onItemClick(item)
6. Handle delete flow: check shouldSkipConfirm() → skip modal or show VaultDeleteModal
7. Render VaultSearch + VaultFilters + VaultGrid or VaultEmptyState

Structure:
```tsx
export function VaultLibrary({ refreshKey, onItemClick, panelMode, onNavigateToDiscover }) {
  const [filters, setFilters] = useState<VaultFilters>({ time: "all", contentType: "all", search: "" })
  const { items, pagination, loadMore, deleteItem, updateRemarks } = useVault(filters, refreshKey)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; targetId: string | null }>({ open: false, targetId: null })

  function handleDelete(id: string) {
    if (shouldSkipConfirm()) { deleteItem(id); return }
    setDeleteModal({ open: true, targetId: id })
  }

  const isEmpty = !pagination.isLoading && items.length === 0

  return (
    <div className={panelMode ? "p-5 space-y-4" : "mt-8 space-y-4"}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <VaultSearch value={filters.search} onChange={(s) => setFilters(f => ({ ...f, search: s }))} />
      </div>
      <VaultFilters filters={filters} onChange={setFilters} />

      {pagination.isLoading && <VaultGridSkeleton />}
      {!pagination.isLoading && isEmpty && <VaultEmptyState onExplore={onNavigateToDiscover ?? (() => {})} />}
      {!isEmpty && (
        <VaultGrid
          items={items}
          hasMore={pagination.hasMore}
          isLoadingMore={pagination.isLoadingMore}
          onLoadMore={loadMore}
          onOpen={onItemClick}
          onDelete={handleDelete}
          onShare={(item) => { /* open share modal */ }}
          onToggleRead={(item) => { /* toggle read */ }}
          onEditRemark={updateRemarks}
        />
      )}

      <VaultDeleteModal
        open={deleteModal.open}
        onConfirm={() => { deleteItem(deleteModal.targetId!); setDeleteModal({ open: false, targetId: null }) }}
        onCancel={() => setDeleteModal({ open: false, targetId: null })}
      />
    </div>
  )
}
```

═══════════════════════════════════════════════════════
STEP 10 — VaultShareModal
FILE: src/app/_components/vault/VaultShareModal.tsx  (NEW FILE)
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
  - If item.shared_to_groups.includes(groupId): show "✓ Already Shared" greyed out
  - Otherwise: show "Share" button
- On share: update shared_to_groups array in logged_items via Supabase
- Optimistic update: close modal, parent refreshes vault
- If groups table doesn't exist yet: show "No groups yet" empty state

═══════════════════════════════════════════════════════
STEP 11 — VideoPlayer
FILE: src/app/_components/reader/VideoPlayer.tsx  (NEW FILE)
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
- Otherwise: call window.open(url, "_blank", "noopener") and onClose()

UI:
- Same slide-in panel pattern as ArticleReader
- 16:9 iframe container: aspect-video w-full
- Close button top-right (same as ArticleReader)
- Title below iframe
- Animation: same slideInRight variant as ArticleReader

═══════════════════════════════════════════════════════
STEP 12 — PodcastPlayer
FILE: src/app/_components/reader/PodcastPlayer.tsx  (NEW FILE)
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
- Otherwise: window.open(url, "_blank", "noopener") and onClose()

UI:
- Bottom sheet panel (slides up from bottom) instead of side panel
- Shows title + source at top
- HTML5 <audio> element with controls, full width
- Close button top-right
- Height: auto, min-h-[140px]

═══════════════════════════════════════════════════════
STEP 13 — Wire everything in home/page.tsx
FILE: src/app/(app)/home/page.tsx  (EXTEND)
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
STEP 14 — Update vault-tab-view.tsx
FILE: src/app/_components/home/vault-tab-view.tsx  (EXTEND)
═══════════════════════════════════════════════════════

Add prop: onNavigateToDiscover: () => void
Pass it through to VaultLibrary.

Update VaultLibrary call:
  onItemClick now receives VaultItem (not just url string).
  Pass the full item up to home/page.tsx for routing to correct player.

Update the onOpenArticle prop name to onItemClick with type (item: VaultItem) => void.

---

## CONSTRAINTS

1. Do NOT modify any auth files
2. Do NOT modify AppShell, AppSidebar
3. Do NOT modify any files outside of:
   - src/app/_components/vault/
   - src/app/_components/reader/
   - src/app/_components/home/vault-tab-view.tsx
   - src/app/(app)/home/page.tsx
   - src/app/_libs/types/vault.ts  (new)
   - src/app/_libs/hooks/useVault.ts  (new)
4. Every new component file must start with "use client"
5. Never use any Tailwind color that is not a semantic token
6. Every list item rendered from an array must have a stable key (use item.id)
7. React.memo on VaultCard — it must NOT re-render unless its own item prop changes
8. All SVG icons: inline, fill="none", stroke="currentColor", strokeWidth={1.5}, strokeLinecap="round", strokeLinejoin="round"
9. Import cn from "@/app/_libs/utils/cn"
10. Import motion utilities from "@/app/_libs/utils/motion" or directly from "framer-motion"

---

## IMPLEMENTATION ORDER

Follow this order exactly:
1. vault.ts (types)
2. useVault.ts (hook)
3. VaultEmptyState.tsx
4. VaultSearch.tsx
5. VaultFilters.tsx
6. VaultDeleteModal.tsx
7. VaultCard.tsx
8. VaultGrid.tsx
9. VaultLibrary.tsx (replace)
10. VaultShareModal.tsx
11. VideoPlayer.tsx
12. PodcastPlayer.tsx
13. vault-tab-view.tsx (extend)
14. home/page.tsx (extend)
