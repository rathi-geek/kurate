# Feature Audit: Discovery (Home Page)

## 1. What exists in web today

**Files found:**
- `apps/web/src/app/_components/home/discovering-tab-view.tsx` — main discovery container (3 sections)
- `apps/web/src/app/_components/home/discovery-vault-section.tsx` — horizontal vault carousel
- `apps/web/src/app/_components/home/vault-discovery-card.tsx` — individual vault card (176px wide)
- `apps/web/src/app/_components/home/discovery-today-section.tsx` — today's top 10 drops by engagement
- `apps/web/src/app/_components/home/discovery-new-section.tsx` — remaining 20 new drops
- `apps/web/src/app/_libs/hooks/useDiscoveryFeed.ts` — calls `get_discovery_feed` RPC, splits today/new
- `apps/web/src/app/_libs/hooks/useDiscoveryVault.ts` — unread vault items 3+ days old
- `apps/web/src/app/_libs/utils/mapGroupDrop.ts` — `GROUP_POST_SELECT` + `mapRowToGroupDrop`

**Flow summary:**
1. User clicks DISCOVERING tab → `DiscoveringTabView` mounts
2. Two hooks fetch in parallel: `useDiscoveryFeed(userId)` and `useDiscoveryVault(userId)`
3. `useDiscoveryFeed` calls `supabase.rpc("get_discovery_feed").select(GROUP_POST_SELECT)` → maps via `mapRowToGroupDrop` → splits into todayDrops (top 10 by engagement) and newDrops (up to 20)
4. `useDiscoveryVault` queries `user_logged_items` for unread items > 3 days old
5. Three sections render vertically: vault carousel → today → new
6. Each section has a centered divider header (e.g., `── From Your Vault ──`)
7. Drops render via `FeedShareCard` with `context="discovery"`
8. Empty state shows when no drops exist

---

## 2. Bugs & issues to fix before mobile replicates

🔴 **Must fix:**
- **`get_discovery_feed` RPC returns raw `SETOF group_posts`** (`02_functions.sql:627`). This forces the web hook to bolt on `.select(GROUP_POST_SELECT)` and `mapRowToGroupDrop` for nested join unwrapping. Every other group RPC (`get_group_feed_page`, `get_group_members`, `get_group_post_comments`) returns flat, pre-joined columns using `_avatar_path()` and `_display_name()` helpers. Discovery should follow the same pattern. **Fix: create `get_discovery_feed_page` RPC with flat return type matching `get_group_feed_page`.**

🟡 **Nice to fix:**
- `useDiscoveryFeed.ts:10` — module-level `supabase = createClient()` outside the hook. Mobile should import singleton from `@/libs/supabase/client`.
- Once `get_discovery_feed_page` exists, web's `useDiscoveryFeed` can switch to it and drop the `mapGroupDrop.ts` dependency entirely.

---

## 3. Code quality issues

🟣 **Should fix:**
- `mapGroupDrop.ts` — `GROUP_POST_SELECT` + `mapRowToGroupDrop` exist only because `get_discovery_feed` returns raw rows. With a proper flat RPC, this file becomes unnecessary for discovery. Mobile already has a near-duplicate in `hooks/useRecommendedDrops.ts` (lines 9-86) — both can be eliminated.
- `useDiscoveryVault.ts:12-18` — `VaultDiscoveryItem` type is defined locally in the web hook. Should live in `@kurate/types`.

---

## 4. What should move to /libs

| Source | Destination | Reason |
|---|---|---|
| `useDiscoveryVault.ts` → `VaultDiscoveryItem` type | `libs/types/src/vault.ts` | Both platforms need this type |

**No longer needed (after RPC fix):**
- ~~`mapGroupDrop.ts` → `libs/`~~ — With `get_discovery_feed_page` returning flat columns, the mapping is a simple inline field assignment (same as `useGroupFeed` lines 51-92 in `libs/hooks/src/useGroupFeed.ts`). No separate mapping utility needed.

---

## 5. What mobile needs to build fresh

### Database (edit `02_functions.sql`, run in Supabase SQL editor)
- Replace `get_discovery_feed` with `get_discovery_feed_page(p_user_id, p_limit)` — flat return type matching `get_group_feed_page` columns
- Run `pnpm db:types` after

### Data Layer (hooks — now in libs/)
- `libs/hooks/src/useDiscoveryFeed.ts` — calls new RPC via `mapFeedRowToGroupDrop`, splits today/new ✅ DONE
- `libs/hooks/src/useDiscoveryVault.ts` — queries unread vault items 3+ days old ✅ DONE
- Both exported from `libs/hooks/src/index.ts` ✅ DONE
- Web and mobile import from `@kurate/hooks`

### UI Components
- `apps/mobile-app/components/discovery/SectionDivider.tsx` — centered label with border dividers
- `apps/mobile-app/components/discovery/VaultDiscoveryCard.tsx` — 176px card (title, domain, days ago)
- `apps/mobile-app/components/discovery/VaultCarousel.tsx` — horizontal FlashList of vault cards
- `apps/mobile-app/components/discovery/DiscoveringTabView.tsx` — main container with vertical FlashList

### Integration
- Modify `apps/mobile-app/app/(tabs)/index.tsx` — render `DiscoveringTabView` when `activeHomeTab === HomeTab.DISCOVERING`
- Modify `apps/mobile-app/hooks/index.ts` — export new hooks

---

# Feature Plan: Discovery (Home Page)
Last updated: 2026-04-20

## Order of execution
1. Database — add `get_discovery_feed_page` to `02_functions.sql` (keep old `get_discovery_feed` so web doesn't break)
2. Web — switch `useDiscoveryFeed.ts` to use new RPC (safe to deploy, then old RPC is dead code)
3. Mobile — build discovery hooks + UI
4. Database cleanup — remove old `get_discovery_feed` from `02_functions.sql` (optional, once confirmed dead)

## Database — Step 1: Add `get_discovery_feed_page` to `02_functions.sql`

File: `supabase/migrations/02_functions.sql` — add after line 643 (after existing `get_discovery_feed`)
Read for reference:
- `supabase/migrations/20260410160000_group_rpc_functions.sql` — `get_group_feed_page` (lines 76-161) is the exact pattern for return type + lateral joins
- `supabase/migrations/02_functions.sql` — `get_discovery_feed` (lines 624-643) has the WHERE filter logic

**Keep old `get_discovery_feed` intact (web still uses it). Add new function below it:**

```sql
CREATE OR REPLACE FUNCTION public.get_discovery_feed_page(
  p_user_id  UUID,
  p_limit    INT DEFAULT 60
)
RETURNS TABLE (
  id              UUID,
  convo_id        UUID,
  logged_item_id  UUID,
  shared_by       UUID,
  note            VARCHAR(500),
  content         TEXT,
  shared_at       TIMESTAMPTZ,
  sharer_id            UUID,
  sharer_display_name  TEXT,
  sharer_avatar_path   TEXT,
  sharer_handle        TEXT,
  item_url              TEXT,
  item_title            TEXT,
  item_preview_image    TEXT,
  item_content_type     TEXT,
  item_raw_metadata     JSONB,
  item_description      TEXT,
  like_count       BIGINT,
  did_like         BOOLEAN,
  must_read_count  BIGINT,
  did_must_read    BOOLEAN,
  comment_count    BIGINT,
  seen_at          TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dgp.id,
    dgp.convo_id,
    dgp.logged_item_id,
    dgp.shared_by,
    dgp.note,
    dgp.content,
    dgp.shared_at,
    sp.id              AS sharer_id,
    public._display_name(sp.first_name, sp.last_name, sp.handle) AS sharer_display_name,
    public._avatar_path(sp.avatar_id)                             AS sharer_avatar_path,
    sp.handle          AS sharer_handle,
    li.url              AS item_url,
    li.title            AS item_title,
    li.preview_image_url AS item_preview_image,
    li.content_type::TEXT AS item_content_type,
    li.raw_metadata     AS item_raw_metadata,
    li.description      AS item_description,
    COALESCE(likes.cnt, 0)       AS like_count,
    COALESCE(likes.did, FALSE)   AS did_like,
    COALESCE(mr.cnt, 0)          AS must_read_count,
    COALESCE(mr.did, FALSE)      AS did_must_read,
    COALESCE(cc.cnt, 0)          AS comment_count,
    ls.seen_at
  FROM (
    SELECT DISTINCT ON (COALESCE(gp.logged_item_id::text, gp.id::text)) gp.*
    FROM public.group_posts gp
    WHERE gp.convo_id IN (
      SELECT convo_id FROM public.conversation_members WHERE user_id = p_user_id
    )
      AND gp.shared_by != p_user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.group_post_reads r
        WHERE r.group_post_id = gp.id
          AND r.user_id = p_user_id
      )
    ORDER BY COALESCE(gp.logged_item_id::text, gp.id::text), gp.shared_at DESC
  ) dgp
  LEFT JOIN public.profiles sp ON sp.id = dgp.shared_by
  LEFT JOIN public.logged_items li ON li.id = dgp.logged_item_id
  LEFT JOIN public.group_post_last_seen ls
    ON ls.group_post_id = dgp.id AND ls.user_id = p_user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt, BOOL_OR(gl.user_id = p_user_id) AS did
    FROM public.group_posts_likes gl WHERE gl.group_post_id = dgp.id
  ) likes ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt, BOOL_OR(gm.user_id = p_user_id) AS did
    FROM public.group_posts_must_reads gm WHERE gm.group_post_id = dgp.id
  ) mr ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM public.group_posts_comments gc WHERE gc.group_post_id = dgp.id
  ) cc ON TRUE
  ORDER BY dgp.shared_at DESC
  LIMIT p_limit
$$;
```

**Action for user:** Run this SQL in Supabase SQL editor, then run `pnpm db:types` to regenerate types.

## Web — Step by Step

### Step 1.5: Switch `useDiscoveryFeed.ts` to new RPC

File: `apps/web/src/app/_libs/hooks/useDiscoveryFeed.ts`
Read for reference:
- `libs/hooks/src/useGroupFeed.ts` — lines 51-92 (`fetchGroupFeedPage`) — flat field → GroupDrop mapping pattern

**What changes:**
- Remove import of `GROUP_POST_SELECT` and `mapRowToGroupDrop` from `mapGroupDrop.ts`
- Change RPC call from `get_discovery_feed` → `get_discovery_feed_page`
- Remove `.select(GROUP_POST_SELECT)` chain (RPC now returns flat columns directly)
- Replace `mapRowToGroupDrop` mapping with simple flat-field assignment (same as `fetchGroupFeedPage` lines 51-92)
- Keep the `scoreDrops`, today/new splitting logic unchanged

**Before:**
```ts
const { data, error } = await supabase
  .rpc("get_discovery_feed", { p_user_id: userId })
  .select(GROUP_POST_SELECT)
  .order("shared_at", { ascending: false })
  .limit(60);
const all = (data ?? []).map((row) =>
  mapRowToGroupDrop(row as ..., userId),
);
```

**After:**
```ts
const { data, error } = await supabase
  .rpc("get_discovery_feed_page", { p_user_id: userId, p_limit: 60 });
const all = (data ?? []).map((row) => ({
  id: row.id,
  convo_id: row.convo_id,
  logged_item_id: row.logged_item_id,
  shared_by: row.shared_by,
  note: row.note,
  content: row.content ?? null,
  shared_at: row.shared_at,
  sharer: {
    id: row.sharer_id ?? row.shared_by,
    display_name: row.sharer_display_name ?? null,
    avatar_path: row.sharer_avatar_path,
    handle: row.sharer_handle ?? null,
  },
  item: row.item_url != null ? {
    url: row.item_url ?? "",
    title: row.item_title ?? null,
    preview_image_url: row.item_preview_image ?? null,
    content_type: (row.item_content_type ?? "article") as ContentType,
    raw_metadata: row.item_raw_metadata ?? null,
    description: row.item_description ?? null,
  } : null,
  engagement: {
    like: { count: Number(row.like_count), didReact: row.did_like ?? false, reactors: [] },
    mustRead: { count: Number(row.must_read_count), didReact: row.did_must_read ?? false, reactors: [] },
    readBy: { count: 0, didReact: false, reactors: [] },
  },
  commentCount: Number(row.comment_count),
  seenAt: row.seen_at ?? null,
  latestCommentAt: null,
  latestComment: null,
} satisfies GroupDrop));
```

**After this change:**
- `mapGroupDrop.ts` is no longer imported by `useDiscoveryFeed.ts`
- Check if `mapGroupDrop.ts` is used anywhere else → it's NOT (only consumer was discovery). Can be deleted or left for now.
- Old `get_discovery_feed` RPC is now dead code in the DB — can be removed from `02_functions.sql` in cleanup step.

## Mobile — Step by Step

### Steps 2-4: Discovery hooks — ✅ DONE (moved to libs)
- `libs/hooks/src/useDiscoveryFeed.ts` — uses `mapFeedRowToGroupDrop` from `mapFeedRow.ts`, splits today/new
- `libs/hooks/src/useDiscoveryVault.ts` — exports `VaultDiscoveryItem` type
- Both exported from `libs/hooks/src/index.ts`
- Both accept `supabase: SupabaseClient<Database>` as first param (same pattern as `useGroupFeed`)
- Web and mobile import: `import { useDiscoveryFeed, useDiscoveryVault } from '@kurate/hooks'`

### Step 5: Create SectionDivider component
New file: `apps/mobile-app/components/discovery/SectionDivider.tsx`
Read for reference:
- `apps/web/src/app/_components/home/discovery-vault-section.tsx` — lines 39-43 (divider pattern)
Key design decisions from web:
- Centered text with `h-px bg-border flex-1` dividers on each side
- Text: `text-xs font-medium text-muted-foreground`
- Gap: `gap-3`
Build instructions:
- Props: `{ label: string }`
- `HStack` with `items-center gap-3 px-4 py-2`
- Left `View` with `h-px flex-1 bg-border`
- Center `Text` with `font-sans text-xs font-medium text-muted-foreground`
- Right `View` with `h-px flex-1 bg-border`

### Step 6: Create VaultDiscoveryCard component
New file: `apps/mobile-app/components/discovery/VaultDiscoveryCard.tsx`
Read for reference:
- `apps/web/src/app/_components/home/vault-discovery-card.tsx` — all 54 lines
Key design decisions from web:
- Card: 176px wide (w-44), rounded-xl, border border-border bg-card p-3, min-h-24
- Title: numberOfLines={2}, text-sm font-medium text-foreground
- Domain: truncate, text-xs text-muted-foreground
- Days ago: text-xs text-muted-foreground/70
Build instructions:
- Props: `{ title: string | null; url: string; createdAt: string }`
- Domain extraction: `new URL(url).hostname.replace(/^www\./, "")`
- Days: `Math.floor((Date.now() - Date.parse(createdAt)) / 86400000)`
- `Pressable` wrapping card, `onPress` → `Linking.openURL(url)`
- `t('discovery.days_ago', { count: days })`

### Step 7: Create VaultCarousel component
New file: `apps/mobile-app/components/discovery/VaultCarousel.tsx`
Read for reference:
- `apps/web/src/app/_components/home/discovery-vault-section.tsx` — horizontal scroll (lines 44-55)
Key design decisions from web:
- Horizontal scroll, gap-3 between cards, hidden scrollbar
Build instructions:
- Props: `{ items: VaultDiscoveryItem[] }`
- Horizontal `FlashList`, `estimatedItemSize={176}`
- `contentContainerStyle` with `paddingHorizontal: 16`
- `ItemSeparatorComponent` with 12px gap
- `renderItem` → `<VaultDiscoveryCard />`
- `showsHorizontalScrollIndicator={false}`

### Step 8: Create DiscoveringTabView (main container)
New file: `apps/mobile-app/components/discovery/DiscoveringTabView.tsx`
Read for reference:
- `apps/web/src/app/_components/home/discovering-tab-view.tsx` — all 71 lines
- `apps/web/src/app/_components/home/discovery-today-section.tsx` — section pattern
- `apps/web/src/app/_components/home/discovery-new-section.tsx` — section pattern
Read existing mobile:
- `apps/mobile-app/components/groups/feed-drop-card.tsx` — reuse for drop rendering
- `apps/mobile-app/components/ui/skeleton/index.tsx` — loading skeletons
Key design decisions from web:
- Three sections: vault → today → new
- Today header: `"Today · Apr 16"` using `formatDateLabel()` from `@kurate/utils`
- New header: `"New Since Last Visit"`
- Vault header: `"From Your Vault"`
- Empty state: centered title + subtitle
- Loading: 3 skeleton cards
Build instructions:
- Get `userId` from `useAuthStore`
- Call `useDiscoveryFeed(userId)` and `useDiscoveryVault(userId)`
- Build flat heterogeneous array for FlashList:
  ```
  type DiscoveryListItem =
    | { type: 'vault-header'; key: string }
    | { type: 'vault-carousel'; key: string; items: VaultDiscoveryItem[] }
    | { type: 'section-header'; key: string; label: string }
    | { type: 'drop'; key: string; drop: GroupDrop }
    | { type: 'empty'; key: string }
  ```
- Conditionally include vault section (only if items exist)
- Conditionally include today section (only if todayDrops exist)
- Conditionally include new section (only if newDrops exist)
- Empty item if both drop arrays are empty and not loading
- `getItemType={(item) => item.type}` for FlashList recycling
- `estimatedItemSize={200}`
- `renderItem` switch: vault-header → SectionDivider, vault-carousel → VaultCarousel, section-header → SectionDivider, drop → FeedDropCard, empty → empty state VStack
- FeedDropCard: `onDelete` as async no-op (discovery excludes own posts via SQL)
- Loading: 3 `Skeleton` rectangles (h-48 rounded-xl)
- Pull-to-refresh: `refreshing` + `onRefresh` calling both refetch functions

### Step 9: Wire into home screen
File: `apps/mobile-app/app/(tabs)/index.tsx`
Build instructions:
- Import `DiscoveringTabView` from `@/components/discovery/DiscoveringTabView`
- After line 187 (closing `</KeyboardAvoidingView>` of VAULT block), add:
  ```tsx
  {activeHomeTab === HomeTab.DISCOVERING && <DiscoveringTabView />}
  ```

---

## Next Commands

**Step 1 — User action (run in Supabase SQL editor):**
The full SQL for `get_discovery_feed_page` is in Database Step 1 above. Run it in Supabase SQL editor, then run `pnpm db:types` locally to regenerate types.

**Step 2 — Web agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.

The discovery hooks have been moved to `@kurate/hooks`. Replace web's local `useDiscoveryFeed` with the shared version.

Files to read:
- `apps/web/src/app/_libs/hooks/useDiscoveryFeed.ts` — file to replace (all 54 lines)
- `libs/hooks/src/useDiscoveryFeed.ts` — new shared hook
- `apps/web/src/app/_components/home/discovering-tab-view.tsx` — consumer of the hook

Changes:
1. Delete `apps/web/src/app/_libs/hooks/useDiscoveryFeed.ts` (replaced by shared lib)
2. Delete `apps/web/src/app/_libs/hooks/useDiscoveryVault.ts` (replaced by shared lib)
3. Update `discovering-tab-view.tsx`: import `useDiscoveryFeed` from `@kurate/hooks` instead of local path, pass supabase client as first arg
4. Update `discovery-vault-section.tsx`: import `useDiscoveryVault` from `@kurate/hooks` instead of local path, pass supabase client as first arg
5. Delete `apps/web/src/app/_libs/utils/mapGroupDrop.ts` (no longer imported by anything)

After: run `pnpm lint` and `pnpm type:check`."

**Step 3 — Mobile agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Mobile Steps 5-9 in order as written in the plan (Steps 2-4 are done — hooks are in `@kurate/hooks`).

Files to read first:
- Shared libs:
  - `libs/hooks/src/useDiscoveryFeed.ts` — shared hook, import as `useDiscoveryFeed` from `@kurate/hooks`
  - `libs/hooks/src/useDiscoveryVault.ts` — shared hook + `VaultDiscoveryItem` type, import from `@kurate/hooks`
  - `libs/types/src/groups.ts` — GroupDrop type
  - `libs/utils/src/index.ts` — formatDateLabel export
  - `libs/locales/src/en.json` — discovery.* strings (lines 581-589)
- Web reference (design only):
  - `apps/web/src/app/_components/home/discovering-tab-view.tsx` — container structure
  - `apps/web/src/app/_components/home/vault-discovery-card.tsx` — card design
- Existing mobile files:
  - `apps/mobile-app/components/groups/feed-drop-card.tsx` — reuse for drop rendering
  - `apps/mobile-app/app/(tabs)/index.tsx` — integration point
  - `apps/mobile-app/libs/supabase/client.ts` — supabase client (pass to hooks as first arg)

Usage pattern for shared hooks:
```tsx
import { useDiscoveryFeed, useDiscoveryVault } from '@kurate/hooks';
import { supabase } from '@/libs/supabase/client';
const { todayDrops, newDrops, isLoading, refetch } = useDiscoveryFeed(supabase, userId);
const { data: vaultItems, isLoading: vaultLoading, refetch: vaultRefetch } = useDiscoveryVault(supabase, userId);
```

Build discovery UI components (Steps 5-9) using these shared hooks.
If something is missing from the map → explore that specific folder only, update the map, then proceed."

**Step 4 — Cleanup (optional):**
- Remove old `get_discovery_feed` function from `02_functions.sql` (lines 620-643)
- Delete `apps/web/src/app/_libs/utils/mapGroupDrop.ts` if no other file imports it (confirmed: only `useDiscoveryFeed.ts` used it)
