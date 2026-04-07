## Feature Audit: Vault Section — Home Page (Links + Thoughts)

### 1. What exists in web today

**Full component hierarchy (top → bottom):**

```
HomePageClient (home-page-client.tsx)
├── HomeTabHeader (home-tab-header.tsx)
│   ├── Mobile: BrandConcentricArch logo + active tab label + ⋮ dropdown (Vault/Discover)
│   └── Desktop: SlidingTabs centered (Vault/Discover)
├── VaultTabView (vault-tab-view.tsx) — when VAULT tab active
│   ├── VaultTabSubHeader (vault-tab-sub-header.tsx)
│   │   ├── Links / Thoughts tab buttons with animated underline
│   │   ├── Search toggle → VaultSearch inline
│   │   └── Filter button → VaultFilters popover (desktop) / VaultFilterSheet (mobile)
│   ├── Content area (both always mounted, opacity toggle)
│   │   ├── VaultLibrary (VaultLibrary.tsx) — when LINKS sub-tab
│   │   │   ├── Loading → 6x VaultCardSkeleton
│   │   │   ├── Error → VaultErrorState
│   │   │   ├── Empty → VaultEmptyState (default or filtered variant)
│   │   │   └── Data → VaultGrid → VaultCard[] with infinite scroll
│   │   └── ThoughtsTabView (thoughts-tab-view.tsx) — when THOUGHTS sub-tab
│   │       ├── "View all chats" / "View buckets" toggle
│   │       ├── Bucket view (default):
│   │       │   ├── Loading → BucketCardSkeleton (4 rows)
│   │       │   ├── Empty → centered message
│   │       │   └── Data → BucketCard[] (media, tasks, learning, notes)
│   │       ├── All view (when toggled):
│   │       │   ├── Loading → ThoughtsAllSkeleton
│   │       │   ├── Empty → centered message
│   │       │   └── Data → ThoughtsAllView (Virtuoso list of ThoughtBubbleAll)
│   │       └── ThoughtsBucketChat (slides in when bucket tapped):
│   │           ├── Back button
│   │           └── Virtuoso list of ThoughtBubble messages
│   └── Composer section (LinkPreviewCard + ChatInput)
└── DiscoveringTabView — when DISCOVERING tab active
```

**Key files — Links:**
- `apps/web/src/app/_components/home/home-page-client.tsx` — top-level: VAULT/DISCOVERING tabs
- `apps/web/src/app/_components/home/home-tab-header.tsx` — Kurate logo + tab label + ⋮ menu
- `apps/web/src/app/_components/home/vault-tab-view.tsx` — Links/Thoughts sub-tabs, filters, search, composer
- `apps/web/src/app/_components/home/vault-tab-sub-header.tsx` — Links/Thoughts switcher + search + filter
- `apps/web/src/app/_components/vault/VaultLibrary.tsx` — grid container with loading/error/empty + VaultGrid
- `apps/web/src/app/_components/vault/VaultCard.tsx` — individual vault card
- `apps/web/src/app/_components/vault/VaultGrid.tsx` — grid layout + infinite scroll
- `apps/web/src/app/_components/vault/VaultFilters.tsx` — filter chip groups (time, type, read status)
- `apps/web/src/app/_components/vault/VaultFilterSheet.tsx` — mobile bottom sheet for filters
- `apps/web/src/app/_components/vault/VaultSearch.tsx` — search input with debounce
- `apps/web/src/app/_components/vault/VaultCardSkeleton.tsx` — loading skeleton
- `apps/web/src/app/_components/vault/VaultEmptyState.tsx` — empty state (default + filtered)
- `apps/web/src/app/_components/vault/VaultErrorState.tsx` — error state with retry
- `apps/web/src/app/_libs/hooks/useVault.ts` — infinite query + mutations
- `apps/web/src/app/_libs/hooks/useVaultFilterOptions.ts` — filter options from types
- `apps/web/src/app/_libs/hooks/useDebouncedValue.ts` — debounce hook

**Key files — Thoughts:**
- `apps/web/src/app/_components/home/thoughts-tab-view.tsx` — thoughts container (bucket view + all view + bucket chat overlay)
- `apps/web/src/app/_components/home/thoughts-bucket-chat.tsx` — single bucket chat view (slides in from right, Virtuoso list, ThoughtBubble)
- `apps/web/src/app/_components/home/thoughts/bucket-card.tsx` — bucket summary card (colored bg, label, latest text, time, unread badge, chevron)
- `apps/web/src/app/_components/home/thoughts/bucket-card-skeleton.tsx` — bucket card loading skeleton
- `apps/web/src/app/_components/home/thoughts/thoughts-all-view.tsx` — all thoughts flat list (Virtuoso, ThoughtBubbleAll with bucket label)
- `apps/web/src/app/_components/home/thoughts/thoughts-all-skeleton.tsx` — all thoughts skeleton
- `apps/web/src/app/_components/home/thoughts/utils.ts` — DisplayMessage type, formatTime, pendingToMessage
- `apps/web/src/app/_libs/hooks/useBucketSummaries.ts` — fetches bucket summaries via `/api/thoughts/buckets`
- `apps/web/src/app/_libs/hooks/useBucketLastRead.ts` — bucket last-read tracking (supabase `bucket_last_read` table)
- `apps/web/src/app/_libs/hooks/useDeleteThought.ts` — delete thought mutation (API + optimistic)
- `apps/web/src/app/_libs/hooks/useEditThought.ts` — edit thought mutation (API + optimistic)
- `apps/web/src/app/api/thoughts/route.ts` — GET (list/search) + POST (create with auto/AI bucket classification)
- `apps/web/src/app/api/thoughts/[id]/route.ts` — PATCH (edit) + DELETE
- `apps/web/src/app/api/thoughts/buckets/route.ts` — GET bucket summaries (RPC: `get_thought_bucket_summaries`)

**Shared libs for Thoughts:**
- `libs/types/src/thoughts.ts` — `ThoughtMessage { id, bucket, text, createdAt, media_id, content_type }`
- `libs/utils/src/constants/thoughts.ts` — `ThoughtBucket` type, `THOUGHT_BUCKETS`, `BUCKET_META` (label + colorVar), `BUCKET_BADGE_COLOR`, `THOUGHT_KEYWORD_MAP`, `classifyThought()`
- `libs/query/src/keys.ts` — `queryKeys.thoughts.all`, `.list(bucket)`, `.search(q)`, `.bucketSummaries()`

**Localization keys — Links:**
- `chat.tab_vault`, `chat.tab_discovering`
- `vault.search_placeholder`, `vault.filters_aria`, `vault.clear_filters`, `vault.filter_done`
- `vault.filter_section_time`, `vault.filter_section_type`, `vault.filter_section_read_status`
- `vault.time_*`, `vault.filter_*`, `vault.empty_state_*`, `vault.error_state_*`
- `vault.mark_read_aria`, `vault.mark_unread_aria`, `vault.delete_aria`

**Localization keys — Thoughts:**
- `thoughts.no_thoughts_yet`, `thoughts.image_fallback`
- `thoughts.status_sending`, `thoughts.status_failed`
- `thoughts.view_buckets`, `thoughts.view_all_chats`
- `thoughts.empty_no_match`, `thoughts.empty_no_thoughts`
- `thoughts.empty_try_keywords`, `thoughts.empty_start_typing`, `thoughts.empty_no_buckets_match`
- `thoughts.edit_aria`, `thoughts.delete_aria`

### 2. Bugs & issues to fix before mobile replicates

🔴 Must fix: None blocking

🟡 Nice to fix:
- `useVault.ts:25-57` — `toVaultItem` uses unsafe `as Record<string, unknown>` casting
- `vault-tab-view.tsx` — 310 lines, god component with 10+ state variables
- Thoughts API routes use `(supabase as any)` casts — works but bypasses type safety

### 3. Code quality issues

🟣 Should fix:
- `useVault.ts` — lives in `apps/web/` but mobile needs same logic. Move to `libs/hooks/`.
- `useBucketSummaries.ts` — fetches via `/api/thoughts/buckets` (web API route). Mobile can't use web API routes — needs direct Supabase RPC call instead.
- `useDeleteThought.ts` / `useEditThought.ts` — use web API routes (`/api/thoughts/:id`). Mobile needs direct Supabase calls.
- `useBucketLastRead.ts` — uses web's `createClient()`. Mobile needs its own supabase client.

### 4. What should move to /libs

- `apps/web/src/app/_libs/hooks/useVault.ts` → `libs/hooks/src/useVault.ts`
  - Reason: mobile needs the same infinite query + mutations
  - Change: accept `supabase: SupabaseClient<Database>` as parameter

Note: Thought hooks (`useBucketSummaries`, `useDeleteThought`, `useEditThought`, `useBucketLastRead`) use web API routes that don't exist on mobile. Rather than moving them to libs, mobile should create its own versions that call Supabase directly (same pattern, different data source).

### 5. What mobile needs to build fresh

**Header layer:**
- `HomeHeader` — Kurate logo (BrandLogo exists) + active tab label + ⋮ popover menu

**Sub-header layer:**
- `VaultSubHeader` — Links/Thoughts tab switcher + search icon + filter icon

**Search:**
- `VaultSearchBar` — text input with debounce, back arrow to close

**Filters (Links only):**
- `VaultFilterSheet` — bottom sheet with Time/Type/ReadStatus chip groups

**Links tab components:**
- `VaultCard`, `VaultCardSkeleton`, `VaultEmptyState`, `VaultErrorState`, `VaultList`

**Thoughts tab components:**
- `BucketCard` — colored card per bucket (media/tasks/learning/notes) with label, latest text, time, unread badge
- `BucketCardSkeleton` — bucket card loading skeleton
- `ThoughtBubble` — single thought message bubble (colored bg per bucket, text, time, pending/failed status)
- `ThoughtsBucketChat` — full-screen bucket chat view (back button + FlatList of ThoughtBubble)
- `ThoughtsAllView` — flat list of all thoughts across buckets (ThoughtBubble with bucket label)
- `ThoughtsTabView` — container: "View all / View buckets" toggle, renders bucket cards or all-view, opens bucket chat
- `ThoughtsEmptyState` — empty state for no thoughts

**Thought hooks (mobile-specific, direct Supabase):**
- `useThoughts` — infinite query on `thoughts` table
- `useBucketSummaries` — calls Supabase RPC `get_thought_bucket_summaries`
- `useDeleteThought` — delete mutation (direct Supabase)
- `useBucketLastRead` — read/write `bucket_last_read` table

**Composer (shared for Links + Thoughts):**
- `ChatComposer` — pill-shaped text input pinned to bottom, detects URLs (→ link save), plain text (→ thought). Uses `useSubmitContent` from `@kurate/hooks`. Always visible above keyboard via KeyboardAvoidingView.

**Utility hooks:**
- `useVault` — thin wrapper passing mobile supabase to shared hook
- `useDebouncedValue` — debounce for search

**Screen:**
- Rewrite `index.tsx` — compose all layers with exact stacking: header → sub-header → search → content (flex-1 scrollable) → ChatComposer (pinned bottom) → overlays (filter sheet, bucket chat)

### Design Decisions — Links Tab (for mobile agent)

| Aspect | Web | Mobile |
|---|---|---|
| **Header** | BrandConcentricArch (20px) + active tab label (text-lg font-black) + ⋮ dropdown | BrandLogo component + active tab label + ⋮ Pressable → popover |
| **Tab menu** | DropdownMenu with Vault/Discover | Popover or ActionSheet with Vault/Discover |
| **Sub-header** | Links/Thoughts buttons with motion.div underline | Links/Thoughts Pressable with bottom border |
| **Active tab text** | `text-ink` | `text-foreground` |
| **Inactive tab text** | `text-ink/40` | `text-foreground/40` |
| **Search input** | `bg-card rounded-full px-3 py-1.5 shadow-sm` + back arrow | Same pattern, RN TextInput |
| **Search debounce** | 300ms | 300ms |
| **Filter sheet** | Framer Motion bottom sheet | RN Modal animationType slide |
| **Filter chips** | `rounded-badge px-3 py-1.5 text-xs font-medium` | `rounded-[6px] px-3 py-1.5 text-xs font-medium` |
| **Active chip** | `bg-primary text-primary-foreground` | Same |
| **Inactive chip** | `bg-muted text-muted-foreground` | Same |
| Card image | 150px `object-cover` | 120px RN Image |
| Title | `text-foreground text-sm font-bold line-clamp-2` | `text-foreground text-sm font-bold` + `numberOfLines={2}` |
| Card container | `bg-card border-border rounded-card shadow-sm` | `bg-card border-border rounded-xl shadow-sm` |
| Actions row | border-t, 4 icon buttons | Same |
| List | 3-col grid | Single column FlatList |
| Infinite scroll | IntersectionObserver | `onEndReached` |
| Skeleton | `bg-cream animate-pulse` | `bg-muted animate-pulse` |

### Design Decisions — Thoughts Tab (for mobile agent)

| Aspect | Web | Mobile |
|---|---|---|
| **View toggle** | "View all chats" / "View buckets" text button, right-aligned, `text-xs underline text-ink/50` | Same — Pressable text, right-aligned |
| **Bucket card** | Full-width button, `rounded-xl px-4 py-3`, bg from `var(--bucket-*)` CSS vars | Full-width Pressable, `rounded-xl px-4 py-3`, bg from `BUCKET_META[bucket].colorVar` — need to map CSS vars to actual hex values |
| **Bucket card layout** | Left: label (text-sm font-semibold) + latest text (text-xs truncate). Right: time (text-[10px]) + unread badge (small rounded-full with BUCKET_BADGE_COLOR) + chevron | Same layout |
| **Bucket colors** | CSS variables: `--bucket-media`, `--bucket-tasks`, `--bucket-learning`, `--bucket-notes` | Must define actual colors since CSS vars don't work in RN. Use a `BUCKET_COLORS` map in the component. |
| **Unread badge** | `rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white` with `BUCKET_BADGE_COLOR[bucket]` | Same |
| **Bucket card skeleton** | 4 rows, `bg-accent/40 rounded-xl px-4 py-3` with Skeleton blocks | 4 rows, `bg-accent rounded-xl` with `bg-muted animate-pulse` blocks |
| **Thought bubble** | `rounded-2xl rounded-br-sm px-3 py-2 text-sm` colored bg, right-aligned (max-w-[75%]), time + pending/failed indicators | Same layout — View with rounded corners, right-aligned |
| **Bubble text** | `leading-snug whitespace-pre-wrap` | Same |
| **Bubble time** | `text-ink/40 text-[9px]` | `text-foreground/40 text-[9px]` |
| **Pending indicator** | ⏱ emoji | Same |
| **Failed indicator** | ! in `text-red-400` | Same |
| **Bubble actions** | Hover: edit (PencilIcon) + delete (TrashIcon) appear left of bubble | Long-press: show edit/delete action menu (since no hover on mobile) |
| **Bucket chat** | Slides in from right (`x: 100%`), absolute inset-0, Virtuoso list | Full-screen View that slides in (react-native-reanimated), FlatList inverted |
| **Back button** | Floating `bg-background/80 backdrop-blur`, ChevronLeft | Same — absolute positioned Pressable with ChevronLeft |
| **All view** | Virtuoso with startReached for older messages, each bubble shows bucket label | FlatList inverted, each bubble shows bucket label |
| **Empty thoughts** | Centered: "No thoughts yet" + "Start typing..." (text-ink/50, text-ink/30) | Same pattern: VStack centered |
| **Search in thoughts** | Uses same search bar, filters thoughts client-side by text | Same — filter `displayMessages` by `text.includes(query)` |

### Design Decisions — ChatComposer (for mobile agent)

| Aspect | Web (ChatInput) | Mobile (ChatComposer) |
|---|---|---|
| **Position** | Pinned to bottom of VaultTabView, shrink-0 | Pinned to bottom inside KeyboardAvoidingView |
| **Container** | `bg-card rounded-full p-2 shadow-lg border-0` | Same: `bg-card rounded-full p-2 shadow-lg` |
| **Left icon** | LinkIcon size 15, `text-muted-foreground ml-1` | Link from lucide, size 15, same tokens |
| **Input** | shadcn Input, borderless, `flex-1 px-2 py-1.5 text-sm` | RN TextInput, `flex-1 px-2 py-1.5 text-sm bg-transparent` |
| **Placeholder** | `t('vault.input_placeholder')` = "Drop a thought, task, link or something you overheard." | Same |
| **Send button** | Animated circle `bg-primary h-8 w-8 rounded-full` + PlusIcon size 3.5, appears when hasText | Same layout, no animation (or simple opacity) |
| **URL detection** | `URL_REGEX` from useSubmitContent, 150ms debounce, strips URL from text, calls `onUrlChange` | Same logic |
| **Submit** | Enter key → handleSubmit | `returnKeyType="send"` + `onSubmitEditing` |
| **Collapsible** | When `collapsible=true` + not focused + empty → `h-8` instead of `h-10` | Same behavior |
| **Keyboard** | N/A (desktop) | `KeyboardAvoidingView` behavior="padding" (iOS) / "height" (Android) |
| **Visibility** | Always visible at bottom of vault tab (both Links and Thoughts) | Same — always visible, both sub-tabs |

### Suggested order:

1. Move `useVault` to `/libs` (web agent)
2. Build mobile Links tab components (mobile agent — steps 1-14)
3. Build mobile Thoughts tab components (mobile agent — steps 15-25)

---

## Next Commands

**Web agent** (move to /libs):
"Read `memory/CODEBASE_MAP.md` and `memory/plans/vault-plan.md` first, then read ONLY these files:

Files to move:
- `apps/web/src/app/_libs/hooks/useVault.ts` → `libs/hooks/src/useVault.ts`

Files that import it (update these imports):
- `apps/web/src/app/_components/vault/VaultLibrary.tsx` (line 14)

Context files (read for understanding only):
- `libs/hooks/src/index.ts` — barrel to update
- `libs/hooks/src/useSaveItem.ts` — example of existing shared hook pattern
- `libs/query/src/keys.ts` — queryKeys used by useVault
- `apps/web/src/app/_libs/supabase/client.ts` — web supabase client creation

Fix these specific issues:
1. Create `libs/hooks/src/useVault.ts` — copy from web's version, but refactor the module-level `const supabase = createClient()` out. Instead, accept `supabase` as a 3rd parameter: `useVault(filters: VaultFilters, userId: string, supabase: SupabaseClient<Database>)`. Also pass supabase into `fetchVaultPage` instead of using the module-level const.
2. Export `useVault` from `libs/hooks/src/index.ts`
3. In `apps/web/src/app/_components/vault/VaultLibrary.tsx` — change `import { useVault } from '@/app/_libs/hooks/useVault'` to `import { useVault } from '@kurate/hooks'` and pass `createClient()` as the 3rd argument to `useVault(filters, user?.id ?? '', supabase)`
4. Delete `apps/web/src/app/_libs/hooks/useVault.ts` (or replace with `export { useVault } from '@kurate/hooks'` if other files import it)
5. Run `cd apps/web && pnpm type:check && pnpm lint`

If something is missing from the map → explore that specific folder only, update the map, then proceed."

---

**Mobile agent** (build vault home screen — Links + Thoughts):
"Read `memory/CODEBASE_MAP.md` and `memory/plans/vault-plan.md` first, then read ONLY these files:

Shared libs:
- `libs/types/src/vault.ts` — VaultItem, VaultFilters, filter option constants
- `libs/types/src/thoughts.ts` — ThoughtMessage type
- `libs/types/src/navigation.ts` — HomeTab, VaultTab enums
- `libs/query/src/keys.ts` — queryKeys.vault.* and queryKeys.thoughts.*
- `libs/hooks/src/useVault.ts` — shared vault hook (accepts supabase param)
- `libs/utils/src/constants/thoughts.ts` — ThoughtBucket, BUCKET_META, BUCKET_BADGE_COLOR, THOUGHT_BUCKETS, classifyThought

Web reference (design + logic only, do NOT copy JSX):
- `apps/web/src/app/_components/home/home-tab-header.tsx` — header layout
- `apps/web/src/app/_components/home/vault-tab-view.tsx` — vault tab container (see how ChatInput is positioned at bottom)
- `apps/web/src/app/_components/home/vault-tab-sub-header.tsx` — Links/Thoughts tabs + search + filter
- `apps/web/src/app/_components/home/chat-input.tsx` — ChatInput component (URL detection, submit, collapsible)
- `apps/web/src/app/_components/home/thoughts-tab-view.tsx` — thoughts container logic
- `apps/web/src/app/_components/home/thoughts-bucket-chat.tsx` — bucket chat with ThoughtBubble
- `apps/web/src/app/_components/home/thoughts/bucket-card.tsx` — bucket card design
- `apps/web/src/app/_components/home/thoughts/bucket-card-skeleton.tsx` — bucket skeleton
- `apps/web/src/app/_components/home/thoughts/thoughts-all-view.tsx` — all thoughts view
- `apps/web/src/app/_components/home/thoughts/utils.ts` — DisplayMessage type, formatTime
- `apps/web/src/app/_components/vault/VaultSearch.tsx` — search input
- `apps/web/src/app/_components/vault/VaultFilters.tsx` — filter chips
- `apps/web/src/app/_components/vault/VaultFilterSheet.tsx` — filter bottom sheet
- `apps/web/src/app/_components/vault/VaultCard.tsx` — card layout
- `apps/web/src/app/_components/vault/VaultLibrary.tsx` — list container
- `apps/web/src/app/_components/vault/VaultCardSkeleton.tsx` — skeleton
- `apps/web/src/app/_components/vault/VaultEmptyState.tsx` — empty state
- `apps/web/src/app/_components/vault/VaultErrorState.tsx` — error state
- `apps/web/src/app/_libs/hooks/useBucketSummaries.ts` — bucket summaries hook (API pattern)
- `apps/web/src/app/_libs/hooks/useBucketLastRead.ts` — bucket last-read hook (Supabase pattern)
- `apps/web/src/app/_libs/hooks/useDeleteThought.ts` — delete thought hook
- `apps/web/src/app/_libs/hooks/useEditThought.ts` — edit thought hook

Existing mobile files:
- `apps/mobile-app/app/(tabs)/index.tsx` — current placeholder to replace
- `apps/mobile-app/app/(tabs)/_layout.tsx` — update tab title/icon
- `apps/mobile-app/hooks/index.ts` — barrel to update
- `apps/mobile-app/libs/supabase/client.ts` — mobile supabase client (`supabase` export)
- `apps/mobile-app/store/useAuthStore.ts` — get userId
- `apps/mobile-app/context/LocalizationContext.tsx` — useLocalization hook
- `apps/mobile-app/components/brand/brand-logo.tsx` — BrandLogo (already exists)
- `apps/mobile-app/components/ui/` — Gluestack: View, Text, HStack, VStack, SafeAreaView, Pressable, Button/ButtonText, Input, Spinner, Alert, Icon

Build these files in this exact order:

--- PART 1: Shared hooks & utilities ---

**Step 1.** `apps/mobile-app/hooks/useVault.ts` — thin wrapper: import useVault from @kurate/hooks, import supabase from @/libs/supabase/client, export useVault(filters, userId) that calls shared hook with mobile supabase. Export from hooks/index.ts.

**Step 2.** `apps/mobile-app/hooks/useDebouncedValue.ts` — useDebouncedValue(initialValue, onChange, delay=300) returns [localValue, setLocalValue]. On change, debounce then call onChange. Export from hooks/index.ts.

**Step 3.** `apps/mobile-app/hooks/useThoughts.ts` — infinite query on `thoughts` table via mobile supabase. Params: bucket (optional), searchQuery. Uses queryKeys.thoughts.list(bucket) and queryKeys.thoughts.search(q). Returns { messages: ThoughtMessage[], isLoading, hasNextPage, fetchNextPage, isFetchingNextPage }. Fetch via supabase.from('thoughts').select('*').eq('user_id', userId).order('created_at', desc).limit(100). Search: .ilike('text', `%${q}%`). Export from hooks/index.ts.

**Step 4.** `apps/mobile-app/hooks/useBucketSummaries.ts` — calls supabase.rpc('get_thought_bucket_summaries'). Returns BucketSummary[] (same shape as web: { bucket, latestText, latestCreatedAt, totalCount, unreadCount }). Uses queryKeys.thoughts.bucketSummaries(). Export from hooks/index.ts.

**Step 5.** `apps/mobile-app/hooks/useDeleteThought.ts` — mutation: supabase.from('thoughts').delete().eq('id', id). Optimistic update on queryKeys.thoughts.list(null). Invalidate queryKeys.thoughts.all on settled. Export from hooks/index.ts.

**Step 6.** `apps/mobile-app/hooks/useBucketLastRead.ts` — query bucket_last_read table for userId. Returns { lastReadAt(bucket), markBucketRead(bucket) }. markBucketRead: optimistic cache update + supabase.from('bucket_last_read').upsert(). Export from hooks/index.ts.

--- PART 2: Header & navigation ---

**Step 7.** `apps/mobile-app/components/home/HomeHeader.tsx` (~50 lines) — HStack px-4 py-3 bg-background:
   - Left: BrandLogo with size={20} and name={activeLabel} (e.g. "Vault")
   - Right: Pressable ⋮ icon (EllipsisVertical from lucide, size 20, text-muted-foreground)
   - When pressed: toggle a small absolute dropdown with "Vault" and "Discover" items
   - Props: activeTab: HomeTab, onTabChange: (tab: HomeTab) => void
   - Use useLocalization for t('chat.tab_vault') and t('chat.tab_discovering')

**Step 8.** `apps/mobile-app/components/home/VaultSubHeader.tsx` (~80 lines) — HStack px-5 border-b border-border:
   - Left: Links / Thoughts Pressable tabs. Active: text-foreground font-semibold + 2px bottom border bg-foreground. Inactive: text-foreground/40. Both text-sm capitalize, mr-5.
   - Right (ml-auto): Search icon (Search from lucide, size 16) + Filter icon (SlidersHorizontal, size 16, text-primary when active). Filter only shows when vaultTab === LINKS.
   - Props: vaultTab, onTabChange, searchOpen, onSearchToggle, onFilterPress, hasActiveFilter

--- PART 3: Links tab components ---

**Step 9.** `apps/mobile-app/components/vault/VaultSearchBar.tsx` (~50 lines) — HStack bg-card rounded-full px-3 py-1.5 shadow-sm mx-4 my-2:
   - ArrowLeft Pressable → close + clear
   - TextInput flex-1 text-sm, autoFocus, placeholder t('vault.search_placeholder')
   - Uses useDebouncedValue, calls onSearch on change
   - Props: value, onSearch, onClose

**Step 10.** `apps/mobile-app/components/vault/VaultFilterSheet.tsx` (~120 lines) — RN Modal transparent slide:
   - Backdrop → onClose
   - Sheet at bottom: bg-background rounded-t-2xl border-t border-border
   - Drag handle + "Filters" header + "Clear all" if active
   - 3 sections (Time/Type/ReadStatus) using filter constants from @kurate/types
   - Chips: rounded-[6px] px-3 py-1.5. Active: bg-primary text-primary-foreground. Inactive: bg-muted text-muted-foreground.
   - Done button
   - Props: open, filters, onChange, onClose

**Step 11.** `apps/mobile-app/components/vault/VaultCardSkeleton.tsx` (~30 lines)

**Step 12.** `apps/mobile-app/components/vault/VaultEmptyState.tsx` (~40 lines) — default + filtered variants

**Step 13.** `apps/mobile-app/components/vault/VaultErrorState.tsx` (~30 lines) — AlertCircle + title + subtitle + retry

**Step 14.** `apps/mobile-app/components/vault/VaultCard.tsx` (~120 lines) — see Links design table

**Step 15.** `apps/mobile-app/components/vault/VaultList.tsx` (~80 lines) — FlatList of VaultCard with infinite scroll, loading/error/empty

--- PART 4: Thoughts tab components ---

**Step 16.** `apps/mobile-app/components/thoughts/BucketCard.tsx` (~60 lines) — Pressable full-width rounded-xl px-4 py-3:
   - Background: bucket color (define BUCKET_COLORS map: media=#FDE8EF, tasks=#E8F5E9, learning=#E3F2FD, notes=#FFF8E1 — or extract from web CSS vars)
   - Left: VStack — label (text-sm font-semibold text-foreground) + latest text (text-xs text-foreground/45 numberOfLines=1)
   - Right: VStack items-end — time (text-[10px] text-foreground/30) + unread badge (rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white, bg from BUCKET_BADGE_COLOR) + chevron (ChevronRight from lucide, size 16, text-foreground/30)
   - Props: bucket: ThoughtBucket, latestText, latestCreatedAt, unreadCount, onPress

**Step 17.** `apps/mobile-app/components/thoughts/BucketCardSkeleton.tsx` (~25 lines) — 4 rows: rounded-xl bg-accent px-4 py-3 with animate-pulse blocks

**Step 18.** `apps/mobile-app/components/thoughts/ThoughtBubble.tsx` (~60 lines) — View right-aligned, max-w-[75%]:
   - Bubble: rounded-2xl rounded-br-sm px-3 py-2, bg from bucket color
   - Text: text-sm leading-snug (text-foreground)
   - Footer row: bucket label (text-foreground/40 text-[9px]) when showBucketLabel + time (text-foreground/40 text-[9px]) + pending (⏱) / failed (! text-red-400)
   - Long-press → call onLongPress for edit/delete menu
   - Props: message: ThoughtMessage & { _pending?, _failed? }, bucketColor: string, showBucketLabel?: boolean, onLongPress?: (id, text) => void

**Step 19.** `apps/mobile-app/components/thoughts/ThoughtsEmptyState.tsx` (~25 lines) — VStack centered:
   - Title: t('thoughts.empty_no_thoughts') or t('thoughts.empty_no_match') when searching
   - Subtitle: t('thoughts.empty_start_typing') or t('thoughts.empty_try_keywords')
   - Props: isSearching: boolean

**Step 20.** `apps/mobile-app/components/thoughts/ThoughtsBucketChat.tsx` (~80 lines) — Full-screen View absolute inset-0 bg-background z-10:
   - Animated slide-in from right (react-native-reanimated translateX)
   - Back button: absolute top-4 left-4, rounded-full bg-background/80, ChevronLeft icon
   - FlatList inverted of ThoughtBubble (bucket-filtered messages)
   - Empty: centered "No thoughts yet" text
   - Props: bucket: ThoughtBucket, messages: DisplayMessage[], searchQuery, onBack, onDelete, onEditStart

**Step 21.** `apps/mobile-app/components/thoughts/ThoughtsAllView.tsx` (~50 lines) — FlatList inverted:
   - Each item: ThoughtBubble with showBucketLabel=true
   - onEndReached → fetchNextPage (load older)
   - Props: messages, hasNextPage, isFetchingNextPage, onFetchMore, onDelete, onEditStart

**Step 22.** `apps/mobile-app/components/thoughts/ThoughtsTabView.tsx` (~100 lines) — Container:
   - Top-right toggle: "View all chats" / "View buckets" text Pressable (text-xs underline text-foreground/50)
   - Bucket view (default): loading → BucketCardSkeleton, empty → ThoughtsEmptyState, data → BucketCard list (space-y-2 px-5)
   - All view: loading → skeleton, empty → ThoughtsEmptyState, data → ThoughtsAllView
   - When bucket tapped: set activeBucket state → render ThoughtsBucketChat overlay
   - Uses: useBucketSummaries, useThoughts, useDeleteThought, useBucketLastRead
   - Props: userId, searchQuery, activeBucket, onActiveBucketChange

--- PART 5: Composer ---

**Step 23.** `apps/mobile-app/components/home/ChatComposer.tsx` (~80 lines) — Shared input for links + thoughts, pinned to bottom:
   - Container: HStack `bg-card rounded-full p-2 shadow-lg` (pill shape, same as web ChatInput)
   - Left: Link icon (Link from lucide, size 15, `text-muted-foreground ml-1`)
   - Center: RN TextInput `flex-1 px-2 py-1.5 text-sm bg-transparent`. Placeholder: `t('vault.input_placeholder')` ("Drop a thought, task, link or something you overheard."). `returnKeyType="send"`, `onSubmitEditing` → handleSubmit
   - Right: when hasText or lockedUrl → Pressable circle `bg-primary h-8 w-8 rounded-full items-center justify-center` with Plus icon (size 14, `text-primary-foreground`). Hidden when empty.
   - URL detection: import `URL_REGEX` from `@kurate/hooks` (re-exported from `useSubmitContent`). On text change (150ms debounce): match URL → call `onUrlChange(url)`, strip URL from value, keep remainder. If no URL and previously had one → `onUrlChange(null)`.
   - State: `value`, `focused`, `lockedUrl` (same pattern as web ChatInput)
   - When `collapsible=true` and not focused and empty: shrink height slightly
   - Props: `onSend: (text: string) => void | Promise<void>, onUrlChange?: (url: string | null) => void, placeholder?: string, collapsible?: boolean, initialValue?: string, autoFocus?: boolean, disabled?: boolean`
   - Use `useLocalization` for placeholder fallback: `t('chat.placeholder')`

--- PART 6: Screen assembly ---

**Step 24.** Rewrite `apps/mobile-app/app/(tabs)/index.tsx` (~140 lines) — Full vault home screen:
   - State: activeHomeTab (HomeTab, default VAULT), vaultTab (VaultTab, default LINKS), searchOpen, searchQuery, filterSheetOpen, vaultFilters, activeBucket (ThoughtBucket | null), editingThought (null | {id, text})
   - Wire useSubmitContent from `@kurate/hooks`:
     ```
     const { onSend } = useSubmitContent({
       supabase,
       queryClient,
       apiBaseUrl: EXPO_PUBLIC_API_URL,  // env var pointing to web server
       onRouted: (dest) => setVaultTab(dest === 'links' ? VaultTab.LINKS : VaultTab.THOUGHTS),
       activeBucket,
     })
     ```
   - Layout (exact UI stacking order):
     ```
     SafeAreaView flex-1 bg-background
     │
     ├── HomeHeader                          ← fixed top
     │   (activeTab, onTabChange)
     │
     ├── VaultSubHeader                      ← fixed below header
     │   (vaultTab, onTabChange, searchOpen,
     │    onSearchToggle, onFilterPress, hasActiveFilter)
     │
     ├── VaultSearchBar (if searchOpen)      ← conditional, mx-4 my-2
     │
     ├── View flex-1                         ← SCROLLABLE CONTENT AREA
     │   ├── When LINKS sub-tab:
     │   │   └── VaultList (filters, searchQuery)
     │   └── When THOUGHTS sub-tab:
     │       └── ThoughtsTabView (userId, searchQuery,
     │           activeBucket, onActiveBucketChange)
     │
     ├── KeyboardAvoidingView                ← pinned to bottom, rises with keyboard
     │   behavior="padding" (iOS) / "height" (Android)
     │   └── ChatComposer                    ← mx-4 mb-2
     │       (onSend, onUrlChange,
     │        collapsible={vaultTab === THOUGHTS && !editingThought},
     │        placeholder depends on vaultTab)
     │
     ├── VaultFilterSheet (Modal)            ← overlay, over everything
     │
     └── ThoughtsBucketChat                  ← absolute overlay when activeBucket set
         (slides in from right, z-10, covers content + composer)
     ```
   - ChatComposer is ALWAYS visible at the bottom (both Links and Thoughts tabs)
   - Content area (View flex-1) scrolls independently above ChatComposer
   - ThoughtsBucketChat overlays everything including ChatComposer when a bucket is open
   - VaultFilterSheet is a Modal so it overlays everything

**Step 25.** Update `apps/mobile-app/app/(tabs)/_layout.tsx` — change home tab title to 'Vault', icon to bookmark.

**Step 26.** Run `cd apps/mobile-app && pnpm lint && pnpm format`

IMPORTANT NOTES:

1. For bucket colors in React Native, CSS variables don't work. Define a color map:
```ts
const BUCKET_COLORS: Record<ThoughtBucket, string> = {
  media: '#FDE8EF',
  tasks: '#E8F5E9',
  learning: '#E3F2FD',
  notes: '#FFF8E1',
};
```
Check the web CSS for actual --bucket-* values and use those hex values.

2. `useSubmitContent` calls `/api/thoughts` and `/api/extract` — these are web API routes. Mobile must pass `apiBaseUrl` from env (`EXPO_PUBLIC_API_URL`) so requests go to the web server. The `useSaveItem` part (link saving) already uses Supabase directly.

3. KeyboardAvoidingView is critical — without it, the keyboard covers ChatComposer on iOS.

If something is missing from the map → explore that specific folder only, update the map, then proceed.

---

--- PART 7: Link Preview + Share to Groups/DMs (steps 27-33) ---

These features are triggered from two places:
1. **ChatComposer** → user pastes a URL → LinkPreviewCard floats above composer (Loading → Loaded → Share phase)
2. **VaultCard action row** → user taps Share → ShareSheet opens with groups/DMs grid

**Additional web files to read (design only):**
- `apps/web/src/app/_components/home/LinkPreviewCard.tsx` — 3-phase preview card
- `apps/web/src/app/_components/shared/url-extract-preview.tsx` — URL metadata display
- `apps/web/src/app/_components/shared/share-target-grid.tsx` — grid of group/DM avatars with search + selection
- `apps/web/src/app/_components/vault/VaultShareModal.tsx` — modal wrapping ShareTargetGrid
- `apps/web/src/app/_libs/hooks/useShareToGroups.ts` — mutation: insert into group_posts / messages
- `apps/web/src/app/_libs/utils/fetchShareableConversations.ts` — fetches groups + DMs
- `apps/web/src/app/_libs/hooks/useVaultPreview.ts` — manages preview phases

**Localization keys:**
- `link_preview.saved_heading`, `link_preview.share_prompt`, `link_preview.skip`, `link_preview.share_btn_send`
- `link_preview.search_placeholder`, `link_preview.no_groups`, `link_preview.no_results`, `link_preview.close_aria`
- `link_preview.reading`, `link_preview.extracting`
- `vault.share_modal_title`, `vault.share_modal_search_placeholder`, `vault.share_modal_share_selected`
- `vault.share_modal_already_shared`, `vault.share_modal_no_targets`, `vault.share_modal_no_results`

**Step 27.** `apps/mobile-app/hooks/useShareableConversations.ts` — fetches groups + DMs the user can share to, via direct Supabase:
   - Query `conversation_members` joined with `conversations` for userId
   - Split into groups (is_group=true) and DMs (is_group=false)
   - For DMs: fetch other user's profile (name, avatar)
   - Returns `ShareableConversation[] { id, name, type: 'group'|'dm', avatar_url, updated_at }`
   - Uses `queryKeys.vault.shareConversations()`, staleTime 5 min
   - Export from hooks/index.ts

**Step 28.** `apps/mobile-app/hooks/useShareToGroups.ts` — mutation to share a vault item:
   - For groups: `supabase.from('group_posts').insert({ convo_id, logged_item_id, shared_by })`
   - For DMs: `supabase.from('messages').insert({ convo_id, sender_id, message_text: '', message_type: 'logged_item', logged_item_id })`
   - Invalidate `queryKeys.vault.all` on success
   - Export from hooks/index.ts

**Step 29.** `apps/mobile-app/components/shared/ShareTargetGrid.tsx` (~100 lines) — Reusable grid of shareable groups/DMs:
   - Search: TextInput with SearchIcon, filters conversations by name
   - Grid: FlatList numColumns={4}, each item = Pressable column:
     - Avatar (rounded-full, 48px, fallback = first letter in bg-muted)
     - Name (text-xs, truncate, max-w-[80px])
     - Selected: green check badge bottom-right of avatar
     - Already shared: gray check badge, disabled, opacity-60
   - Loading: 8 skeleton circles
   - Empty: text message
   - Props: `selectedIds: Set<string>, onSelectionChange: (ids: string[]) => void, alreadySharedIds: Set<string>, enabled: boolean`

**Step 30.** `apps/mobile-app/components/shared/UrlExtractPreview.tsx` (~60 lines) — URL metadata display:
   - Loading: domain text + "Reading about the page..." + animated subtitle
   - Loaded: HStack — preview image (56x56 rounded-lg) or domain text + VStack (title text-sm font-medium numberOfLines=2, description text-xs numberOfLines=2, source · type · readTime text-xs text-muted-foreground)
   - Props: `url: string, isLoading: boolean, metadata?: { title, source, previewImage, contentType, readTime, description }`

**Step 31.** `apps/mobile-app/components/home/LinkPreviewCard.tsx` (~100 lines) — Floats ABOVE ChatComposer:
   - Position: absolute, bottom of content area, above KeyboardAvoidingView (mx-4 mb-2)
   - Container: `bg-card border border-border rounded-2xl overflow-hidden shadow-lg`
   - 3 phases (from `PreviewPhase` in `@kurate/types`):
     - **Loading**: UrlExtractPreview isLoading=true
     - **Loaded**: UrlExtractPreview with metadata + close (X) Pressable top-right
     - **Share**: "✓ Saved!" (text-primary text-sm font-semibold) + "Share to a group?" (text-muted-foreground text-sm) + border-t + ShareTargetGrid + "Skip" text button + "Send" primary Button (when selection > 0)
   - Props: `phase: PreviewPhase, url: string, metadata?, savedItemGroups?: string[], onClose, onShare: (groupIds: string[]) => void, onSkip`

**Step 32.** `apps/mobile-app/components/vault/VaultShareSheet.tsx` (~60 lines) — Bottom sheet for sharing from VaultCard action row:
   - RN Modal transparent animationType slide (same pattern as VaultFilterSheet)
   - Backdrop + Sheet at bottom: bg-background rounded-t-2xl
   - Header: "Share to your people" — `t('vault.share_modal_title')`
   - Body: ShareTargetGrid (enabled when open)
   - Footer: "Share" Button (disabled when no selection)
   - Uses useShareToGroups for the mutation
   - Props: `open: boolean, item: VaultItem | null, onClose: () => void`

**Step 33.** Wire into existing components (modifications, not new files):
   - **VaultCard** (from Step 14): add Share icon (Share2 from lucide, size 16, text-muted-foreground) to action row between read-toggle and delete. On press → call `onShare(item)`.
   - **VaultList** (from Step 15): add `shareItem` state. Pass `onShare={setShareItem}` to each VaultCard. Render `<VaultShareSheet open={!!shareItem} item={shareItem} onClose={() => setShareItem(null)} />`.
   - **index.tsx** (from Step 24): manage preview state (previewPhase, previewUrl, previewMeta). When ChatComposer calls `onUrlChange(url)` → set phase to Loading, fetch metadata via `${apiBaseUrl}/api/extract`, set phase to Loaded → then Share after save. Render LinkPreviewCard:
     ```
     ├── View flex-1 (content area)
     │
     ├── LinkPreviewCard (when previewPhase !== Idle)  ← positioned above composer
     │   (absolute bottom, mx-4, z-20)
     │
     ├── KeyboardAvoidingView
     │   └── ChatComposer
     ```

### Design Decisions — Link Preview + Share (for mobile agent)

| Aspect | Web | Mobile |
|---|---|---|
| **LinkPreviewCard position** | `absolute bottom-full` above ChatInput, max-w-2xl | Above ChatComposer, mx-4, z-20 |
| **Preview card** | `bg-card border rounded-2xl`, animated entry/exit | `bg-card border border-border rounded-2xl shadow-lg` |
| **Loading state** | DomainIcon + Typewriter + CyclingText | Domain text + static loading text |
| **Loaded state** | Image 56x56 + title + description + source | Same with RN Image |
| **Close button** | X icon absolute top-3 right-3 | Same |
| **Share phase** | "✓ Saved!" + ShareTargetGrid + Skip/Send | Same layout |
| **ShareTargetGrid** | flex-wrap, Avatar 48-56px, check badge | FlatList numColumns=4, same avatar + badge |
| **VaultShareModal** | shadcn Dialog | RN Modal bottom sheet |
| **Share mutation** | groups → group_posts, DMs → messages | Same via mobile supabase |
| **Already shared** | Gray check badge, disabled, opacity-60 | Same |"
