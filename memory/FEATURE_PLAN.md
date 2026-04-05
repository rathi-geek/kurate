## Feature Audit: Vault Section — Home Page

### 1. What exists in web today

- **Home page**: `apps/web/src/app/_components/home/home-page-client.tsx` — two-tab layout (VAULT / DISCOVERING), URL-synced tab state
- **Vault tab container**: `apps/web/src/app/_components/home/vault-tab-view.tsx` — manages Links/Thoughts sub-tabs, filters, search, link preview composer, chat input (310 lines, heavy state)
- **Sub-header**: `apps/web/src/app/_components/home/vault-tab-sub-header.tsx` — Links/Thoughts tab switcher with animated underline, search toggle, filter popover (desktop) / sheet (mobile)
- **VaultLibrary**: `apps/web/src/app/_components/vault/VaultLibrary.tsx` — grid container with pending items (Dexie), loading skeletons, error/empty states, infinite scroll
- **VaultCard**: `apps/web/src/app/_components/vault/VaultCard.tsx` — card with 150px image area (fallback: description text → domain icon), ContentTypePill, title, tags, remarks, description, source/time, hover overlay (desktop), action row (mobile: read/edit/share/delete)
- **VaultGrid**: `apps/web/src/app/_components/vault/VaultGrid.tsx` — 3-col responsive grid with IntersectionObserver for infinite scroll
- **useVault hook**: `apps/web/src/app/_libs/hooks/useVault.ts` — infinite query on `user_logged_items` joined with `logged_items`, client-side search/sort (unread first), optimistic mutations for delete/remarks/toggleRead
- **Supporting**: VaultCardSkeleton, VaultEmptyState, VaultErrorState, VaultFilters, VaultFilterSheet, VaultSearch, VaultDeleteModal, VaultRemarkModal, VaultShareModal, PendingLinkCard, ContentDNA
- **Types**: `libs/types/src/vault.ts` — VaultItem, VaultFilters, ContentType, filter option constants
- **Query keys**: `libs/query/src/keys.ts` — vault.all, vault.list(filters), vault.shareConversations, vault.tagCounts, vault.contentDNA

### 2. Bugs & issues to fix before mobile replicates

🔴 Must fix: None blocking

🟡 Nice to fix:

- `useVault.ts:25-57` — `toVaultItem` uses unsafe `as Record<string, unknown>` casting instead of typed Supabase response
- `vault-tab-view.tsx` — 310 lines managing 10+ state variables (preview, composer, media, filters, editing) — god component

### 3. Code quality issues

🟣 Should fix:

- `useVault.ts` — lives in `apps/web/` but mobile needs identical data fetching. Only web-specific part is `createClient()` import. Should move to `libs/hooks/` with injectable supabase client param.

### 4. What should move to /libs

- `apps/web/src/app/_libs/hooks/useVault.ts` → `libs/hooks/src/useVault.ts`
  - Reason: mobile needs the same infinite query + mutations + `toVaultItem` mapping
  - Change: accept `supabase: SupabaseClient<Database>` as parameter instead of importing web's `createClient()`

### 5. What mobile needs to build fresh (mobile-specific only)

- Home screen vault view (replace placeholder `index.tsx`)
- VaultCard component (press-to-open, action row with native icons)
- VaultCardSkeleton, VaultEmptyState, VaultErrorState
- VaultList (FlatList with `onEndReached` infinite scroll)
- Mobile `useVault` wrapper (passes mobile supabase client to shared hook)
- Tab layout update (title + icon)

### Design Decisions Extracted from Web (for mobile agent)

| Aspect           | Web                                                            | Mobile                                                    |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| Card image       | 150px, `object-cover`, `Image` with `onError` fallback         | 120px, RN `Image` with `onError` fallback                 |
| Image fallback 1 | Description text centered in `bg-muted`                        | Same                                                      |
| Image fallback 2 | Domain icon centered in `bg-muted`                             | Same                                                      |
| ContentTypePill  | Badge `absolute top-2 left-2` on image                         | Same position                                             |
| Title            | `text-foreground text-sm font-bold line-clamp-2`               | `text-foreground text-sm font-bold` + `numberOfLines={2}` |
| Tags             | `ContentTypePill` per tag, `flex-wrap gap-1`                   | Same                                                      |
| Description      | `text-muted-foreground text-xs line-clamp-2`                   | `text-muted-foreground text-xs` + `numberOfLines={2}`     |
| Source/time      | `text-muted-foreground font-mono text-xs`                      | Same                                                      |
| Read state       | `opacity-60` on card                                           | Same                                                      |
| Card container   | `bg-card border-border rounded-card shadow-sm hover:shadow-md` | `bg-card border-border rounded-xl shadow-sm`              |
| Actions          | Bottom row visible on mobile: read/remark/share/delete         | Same — always-visible action row                          |
| Action icons     | `size-4`, `text-muted-foreground`, delete = `text-red-400`     | Same                                                      |
| List layout      | 3-col grid                                                     | Single column FlatList                                    |
| Infinite scroll  | IntersectionObserver                                           | `onEndReached` + `onEndReachedThreshold={0.5}`            |
| Loading          | 6 skeleton cards in grid                                       | 4 skeleton cards in list                                  |
| Empty state      | Centered VStack: title + subtitle + CTA button                 | Same pattern                                              |
| Error state      | Centered VStack: title + subtitle + retry button               | Same pattern                                              |
| Filters v1       | Sub-header with search + popover/sheet                         | Skip in v1 — just the list                                |

### Suggested order:

1. Move `useVault` to `/libs` (web agent)
2. Build mobile vault components + home screen (mobile agent)

---

## Next Commands

**Web agent** (move to /libs):
"Read `memory/CODEBASE_MAP.md` and `memory/FEATURE_PLAN.md` first, then read ONLY these files:

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

**Mobile agent** (build vault home screen):
"Read `memory/CODEBASE_MAP.md` first, then read ONLY these files:

Shared libs:

- `libs/types/src/vault.ts` — VaultItem, VaultFilters, filter option constants
- `libs/query/src/keys.ts` — queryKeys.vault.\*
- `libs/hooks/src/useVault.ts` — shared vault hook (accepts supabase param)

Web reference (design + logic only, do NOT copy JSX):

- `apps/web/src/app/_components/vault/VaultCard.tsx` — card layout reference
- `apps/web/src/app/_components/vault/VaultLibrary.tsx` — list structure reference
- `apps/web/src/app/_components/vault/VaultCardSkeleton.tsx` — skeleton reference
- `apps/web/src/app/_components/vault/VaultEmptyState.tsx` — empty state reference
- `apps/web/src/app/_components/vault/VaultErrorState.tsx` — error state reference

Existing mobile files:

- `apps/mobile-app/app/(tabs)/index.tsx` — current placeholder to replace
- `apps/mobile-app/app/(tabs)/_layout.tsx` — update tab title/icon
- `apps/mobile-app/hooks/index.ts` — barrel to update
- `apps/mobile-app/libs/supabase/client.ts` — mobile supabase client (`supabase` export)
- `apps/mobile-app/store/useAuthStore.ts` — get userId
- `apps/mobile-app/context/LocalizationContext.tsx` — useLocalization hook

Build these files in this exact order:

1. `apps/mobile-app/hooks/useVault.ts` — thin wrapper: `import { useVault as useVaultShared } from '@kurate/hooks'` + `import { supabase } from '@/libs/supabase/client'`, export `useVault(filters, userId)` that calls `useVaultShared(filters, userId, supabase)`. Export it from `hooks/index.ts`.
2. `apps/mobile-app/components/vault/VaultCardSkeleton.tsx` — animate-pulse skeleton matching card dimensions (120px image placeholder + text lines)
3. `apps/mobile-app/components/vault/VaultEmptyState.tsx` — VStack centered, use `t('vault.empty_state_title')` and `t('vault.empty_state_subtitle')` from useLocalization
4. `apps/mobile-app/components/vault/VaultErrorState.tsx` — VStack centered, use `t('vault.error_state_title')`, `t('vault.error_state_subtitle')`, `t('vault.error_state_retry_btn')`, accepts `onRetry` prop
5. `apps/mobile-app/components/vault/VaultCard.tsx` — card component. Props: `item: VaultItem, onToggleRead: (item) => void, onDelete: (id) => void`. Use design table above for exact tokens. Pressable card opens URL via `Linking.openURL`. Bottom action row always visible: read toggle (Check/CheckCheck icons), delete (Trash2 icon, text-red-400). Icons from `lucide-react-native`, size 16.
6. `apps/mobile-app/components/vault/VaultList.tsx` — FlatList of VaultCard. Props: `filters: VaultFilters`. Uses `useVault` + `useAuthStore` for userId. Handles loading (4x VaultCardSkeleton), error (VaultErrorState), empty (VaultEmptyState). `onEndReached` triggers `loadMore`, `ListFooterComponent` shows Spinner when `isLoadingMore`.
7. Rewrite `apps/mobile-app/app/(tabs)/index.tsx` — import VaultList, render inside SafeAreaView with `bg-background`. Pass default filters `{ time: 'all', contentType: 'all', search: '', readStatus: 'all' }`.
8. Update `apps/mobile-app/app/(tabs)/_layout.tsx` — change home tab title to 'Vault', change icon to `bookmark` (FontAwesome).
9. Run `cd apps/mobile-app && pnpm lint && pnpm format`

If something is missing from the map → explore that specific folder only, update the map, then proceed."
