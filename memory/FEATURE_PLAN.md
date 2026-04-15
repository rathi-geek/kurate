# Feature Plan: Instant Group Posting (vault-pattern for groups)

Last updated: 2026-04-15

## Context

After posting in a group on **both web and mobile** two regressions are visible:

1. **Sidebar doesn't reorder** — sender's group should bubble to the top, but `groups.list()` is not optimistically updated. Web invalidates via realtime in `apps/web/src/app/_components/app-shell.tsx:131-138`, but `useUserGroups` has `staleTime: 1000 * 60` so the UI waits. Mobile has no equivalent logic at all.
2. **Feed flickers** — the composer awaits the API then fires `refetch()` (web: `feed-tab-view.tsx:28-29` → `drop-composer.tsx:134`) or `invalidateQueries()` (mobile: `drop-composer.tsx:133-135`). Both replace every cached post reference, re-rendering every `FeedShareCard` / `FeedDropCard`. Mobile is worse because `libs/hooks/useGroupFeed.ts:208-221` *also* invalidates on realtime INSERT → double refetch.

**Goal:** replicate the **vault instant-card pattern** for groups so posts appear optimistically, the sidebar reorders immediately, and no refetch/invalidation happens on the sender's client.

---

## Order of execution (always follow this sequence)

1. **Web — move shared logic to /libs** (new shared hooks: `useGroupComposer`, `useBumpGroupsList`, extend `PendingDB`, extend `useGroupFeed`)
2. **Web — fix bugs** (Dexie `pending_group_posts` table; refactor `drop-composer.tsx`, `feed-tab-view.tsx`, `feed-share-card.tsx`; new `PendingGroupPostCard.tsx`)
3. **Mobile — migrate persistence** (swap Zustand persist backend from `expo-secure-store` to `react-native-mmkv`; flag user that `expo prebuild` + dev client rebuild is required)
4. **Mobile — build feature** (extend `usePendingStore` + `mobilePendingDb`, new `useGroupComposer` wrapper, refactor `drop-composer.tsx` + `feed-view.tsx` + `feed-drop-card.tsx`)

---

## Reference architecture (already built for vault — clone it)

- `libs/hooks/src/types/pending-db.ts` — `PendingDB` interface (currently `PendingLinkRow` + `PendingThoughtRow`)
- `libs/hooks/src/useVaultComposer.ts` — shared composer accepting `platform.pendingDb`
- **Web adapter:** `apps/web/src/app/_libs/db/index.ts` (Dexie tables) + `apps/web/src/app/_libs/hooks/useVaultComposer.ts` (wrapper)
- **Mobile adapter:** `apps/mobile-app/store/usePendingStore.ts` (Zustand+secure-store, MIGRATING TO MMKV) + `apps/mobile-app/libs/pending-db.ts` (adapter) + `apps/mobile-app/hooks/useVaultComposer.ts` (wrapper)
- **Merge UI (web):** `apps/web/src/app/_components/vault/VaultLibrary.tsx` (uses `useLiveQuery`); `VaultGrid.tsx:62-102` (`<LayoutGroup>` + `<AnimatePresence mode="popLayout">` + `layoutId={`vault-${url}`}` for seamless morph)
- **Pending card visuals:** `apps/web/src/app/_components/vault/PendingLinkCard.tsx` (sending spinner, failed banner with retry/dismiss)
- **Lifecycle:** mark `confirmed` when matching server row appears → 2s linger → delete

---

## Web — Step by Step

### Step 1: Extend `PendingDB` interface

File: `libs/hooks/src/types/pending-db.ts`

- Add new row type:
  ```ts
  export interface PendingGroupPostRow {
    tempId: string;
    convo_id: string;
    shared_by: string;
    content: string | null;
    logged_item_id: string | null;
    note: string | null;
    url: string | null;
    title: string | null;
    previewImage: string | null;
    source: string | null;
    contentType: string | null;
    serverId: string | null;       // populated when status flips to confirmed
    createdAt: string;
    status: "sending" | "confirmed" | "failed";
  }
  ```
- Add to `PendingDB` interface:
  ```ts
  addPendingGroupPost(row: PendingGroupPostRow): Promise<void>;
  updatePendingGroupPostStatus(tempId: string, status: string, serverId?: string): Promise<void>;
  deletePendingGroupPost(tempId: string): Promise<void>;
  getAllPendingGroupPosts(): Promise<PendingGroupPostRow[]>;
  getPendingGroupPostsForGroup(groupId: string): Promise<PendingGroupPostRow[]>;
  ```
- Re-export `PendingGroupPostRow` from `libs/hooks/src/index.ts`.

### Step 2: Build `useGroupComposer` shared hook

New file: `libs/hooks/src/useGroupComposer.ts`

Mirror the pattern in `libs/hooks/src/useVaultComposer.ts`. Accepts:
```ts
interface UseGroupComposerConfig {
  groupId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  platform?: {
    pendingDb?: PendingDB;
    onToast?: (msg: string, opts?: { description?: string }) => void;
    onTrack?: (event: string, data?: Record<string, unknown>) => void;
    generateTempId?: () => string;
  };
  onPosted?: (row: PendingGroupPostRow) => void;
}
```

Submit flow (text or link):
1. Dedup: if link, check `getPendingGroupPostsForGroup(groupId)` — skip if same URL already pending.
2. Generate `tempId`; call `addPendingGroupPost({ …, status: "sending" })`.
3. Call `onPosted(row)` synchronously — consumer bumps sidebar.
4. Reset preview / clear input.
5. Fire-and-forget supabase insert (lift the existing logic from `apps/web/src/app/_components/groups/drop-composer.tsx:67-156`):
   - For link: `upsertLoggedItem(...)` then `supabase.from('group_posts').insert({ convo_id, logged_item_id, shared_by, note })`
   - For text: `supabase.from('group_posts').insert({ convo_id, shared_by, content })`
6. On resolve: `updatePendingGroupPostStatus(tempId, "confirmed", serverInsertId)`. On reject: `updatePendingGroupPostStatus(tempId, "failed")`.

Expose a `retry(tempId)` function for failed-state UI — re-runs step 5 using the stored row data.

Re-export from `libs/hooks/src/index.ts`.

### Step 3: Build `useBumpGroupsList` shared hook

New file: `libs/hooks/src/useBumpGroupsList.ts`

```ts
export function useBumpGroupsList() {
  const queryClient = useQueryClient();
  return useCallback((row: PendingGroupPostRow) => {
    queryClient.setQueryData<UserGroupRow[]>(queryKeys.groups.list(), (old) => {
      if (!old) return old;
      const idx = old.findIndex(g => g.id === row.convo_id);
      if (idx < 0) return old;
      const copy = old.slice();
      const [bumped] = copy.splice(idx, 1);
      return [
        { ...bumped, last_activity_at: row.createdAt, last_message_preview: row.content ?? row.title ?? "" },
        ...copy,
      ];
    });
  }, [queryClient]);
}
```

Pure cache mutation — no invalidation. Re-export from `libs/hooks/src/index.ts`. Read the actual `UserGroupRow` shape from `libs/hooks/src/useUserGroups.ts` and match field names exactly (`last_activity_at`, `last_message_preview`).

### Step 4: Extend `useGroupFeed` shared hook

File: `libs/hooks/src/useGroupFeed.ts`

- Accept optional `pendingPosts: PendingGroupPostRow[]` param (live array, passed in by platform wrapper).
- Inside the hook, prepend pending rows (mapped to feed item shape) to the first page of the infinite query result. Dedupe by `serverId` once confirmed (server row wins; pending row stays only until 2s linger expires).
- Add `useEffect` to mark pending rows `confirmed` when a server row with matching `id === pending.serverId` appears.
- Add `useEffect` with 2s `setTimeout` to delete confirmed pending rows.
- **Fix realtime self-skip**: at lines 208-221, add `if (post.shared_by === currentUserId) return;` (mirror `apps/web/src/app/_libs/hooks/useGroupFeed.ts:195-197`). Requires `currentUserId` param if not already present.

### Step 5: Web Dexie — add `pending_group_posts` table

File: `apps/web/src/app/_libs/db/index.ts`

- Add `pending_group_posts!: EntityTable<PendingGroupPostRow, "tempId">;` field on `KurateDB` class.
- Bump to `version(3)` adding new store: `pending_group_posts: "tempId, convo_id, status, createdAt"`.

New file: `apps/web/src/app/_libs/db/pending-db.ts`

- Implement `PendingDB` for groups by delegating to `db.pending_group_posts.add/update/delete/where(...)`. Mirror `apps/mobile-app/libs/pending-db.ts` shape but using Dexie calls.
- If a web `PendingDB` already exists for vault (check `apps/web/src/app/_libs/hooks/useVaultComposer.ts` for how Dexie is invoked there — it may currently call Dexie directly without an adapter), extend that pattern. Otherwise create the adapter as the first web `PendingDB` instance and have it cover links/thoughts too (lift from existing direct Dexie calls).

### Step 6: New `PendingGroupPostCard` component

New file: `apps/web/src/app/_components/groups/PendingGroupPostCard.tsx`

Mirror `apps/web/src/app/_components/vault/PendingLinkCard.tsx` design decisions:
- `status === "sending"` → small spinner badge in card corner; rest of card looks normal
- `status === "failed"` → red banner overlay or footer with "Failed to post" + Retry + Dismiss buttons
- Use design tokens only (`bg-card`, `text-muted-foreground`, `text-destructive`, `rounded-card`, `shadow-sm`)
- Spring physics from `apps/web/src/app/_libs/utils/motion.ts`

Read for reference:
- `apps/web/src/app/_components/vault/PendingLinkCard.tsx` — copy status visual treatment
- `apps/web/src/app/_components/groups/feed-share-card.tsx` — match overall card geometry / padding / image ratio so the morph is seamless

### Step 7: Refactor web `drop-composer.tsx`

File: `apps/web/src/app/_components/groups/drop-composer.tsx`

- Remove direct `supabase.from('group_posts').insert(...)` calls (lines 85-92, 145-150).
- Remove `onDropPosted` prop — caller no longer needs to pass `refetch`.
- Call `useGroupComposer({ groupId, currentUserId, supabase, platform: { pendingDb: webPendingDb, onToast, onTrack: track }, onPosted: useBumpGroupsList() })`.
- Pass `composer.handleSend` to `<ChatInput onSend={...}>`.
- Keep the URL preview UI / "Save to vault?" toast logic — that's local UI concern and unrelated to optimistic posting.

### Step 8: Refactor web `feed-tab-view.tsx` + `feed-share-card.tsx`

File: `apps/web/src/app/_components/groups/feed-tab-view.tsx`

- Drop the `refetch` coupling — no longer pass it to composer.
- Wrap the feed list in `<LayoutGroup>` and `<AnimatePresence mode="popLayout">` (mirror `apps/web/src/app/_components/vault/VaultGrid.tsx:62-102`).
- The drops array now comes pre-merged from web's `useGroupFeed` wrapper (which reads pending rows via `useLiveQuery(() => db.pending_group_posts.where('convo_id').equals(groupId).toArray())`).

File: `apps/web/src/app/_components/groups/feed-share-card.tsx` (and the text post card, whatever it's called)

- Wrap in `<motion.div layoutId={drop.id ? `group-post-${drop.id}` : `group-post-pending-${drop.tempId}` /* OR use tempId-then-server-id stable scheme */} layout>`.
- Critical: `layoutId` must remain stable when a row morphs from pending→confirmed. Use `serverId ?? tempId` once `serverId` is populated, or use the eventual server `id` for both pending (when known via `serverId` field) and confirmed.
- `key` prop differs (`pending-${tempId}` vs `${id}`) but `layoutId` stays the same — that's what enables Framer's morph.
- Reference: `apps/web/src/app/_components/vault/VaultGrid.tsx:62-102`.

### Step 9: Web `useGroupFeed` wrapper

File: `apps/web/src/app/_libs/hooks/useGroupFeed.ts`

- Refactor to thin wrapper over the now-extended shared `libs/hooks/src/useGroupFeed.ts`.
- Reads pending rows: `const pendingPosts = useLiveQuery(() => db.pending_group_posts.where('convo_id').equals(groupId).toArray(), [groupId])`.
- Passes `pendingPosts` and `currentUserId` into shared hook.
- Keeps any web-specific SSR / supabase client wiring.

### Step 10: Lint + typecheck web

- `pnpm --filter web lint`
- `pnpm --filter web type:check`
- Smoke test: post a text → instant card; post a link → pending card morphs to confirmed; sender's group jumps to top; other cards do not flicker.

---

## Mobile — Step by Step

### Step 1: Migrate `usePendingStore` persistence to MMKV

File: `apps/mobile-app/store/usePendingStore.ts`

Read for reference:
- Current file shows `expo-secure-store` adapter wired via `createJSONStorage`. That's wrong for app state — see the MMKV memory at `~/.claude/projects/-Users-ankurrathi-Desktop-kurate-wtf-platform/memory/project_mobile_storage_mmkv.md`.

Build instructions:
- Add dependency: `pnpm --filter mobile-app add react-native-mmkv`
- Replace imports: remove `expo-secure-store` `getItemAsync/setItemAsync/deleteItemAsync`, add `import { MMKV } from 'react-native-mmkv'`.
- New storage:
  ```ts
  const mmkv = new MMKV({ id: 'kurate-pending-queue' });
  // ...
  storage: createJSONStorage(() => ({
    getItem: (k) => mmkv.getString(k) ?? null,
    setItem: (k, v) => { mmkv.set(k, v); },
    removeItem: (k) => { mmkv.delete(k); },
  })),
  ```
- **Tell the user**: `npx expo prebuild` (or `eas build --profile development`) is required before next test run, and they need to install the new dev client build. Existing pending rows will be lost on first launch — acceptable since they're short-lived.

### Step 2: Add `pendingGroupPosts` slice + adapter

File: `apps/mobile-app/store/usePendingStore.ts`

- Add to state shape:
  ```ts
  pendingGroupPosts: PendingGroupPostRow[];
  addPendingGroupPost: (row: PendingGroupPostRow) => void;
  updatePendingGroupPostStatus: (tempId: string, status: string, serverId?: string) => void;
  deletePendingGroupPost: (tempId: string) => void;
  getPendingGroupPostsForGroup: (groupId: string) => PendingGroupPostRow[];
  ```
- Implement with the same array-map/filter pattern as existing `pendingLinks` methods.

File: `apps/mobile-app/libs/pending-db.ts`

- Add to `mobilePendingDb` object:
  ```ts
  addPendingGroupPost: async row => { usePendingStore.getState().addPendingGroupPost(row); },
  updatePendingGroupPostStatus: async (tempId, status, serverId) => { usePendingStore.getState().updatePendingGroupPostStatus(tempId, status, serverId); },
  deletePendingGroupPost: async tempId => { usePendingStore.getState().deletePendingGroupPost(tempId); },
  getAllPendingGroupPosts: async () => usePendingStore.getState().pendingGroupPosts,
  getPendingGroupPostsForGroup: async groupId => usePendingStore.getState().getPendingGroupPostsForGroup(groupId),
  ```

### Step 3: Build mobile `useGroupComposer` wrapper

New file: `apps/mobile-app/hooks/useGroupComposer.ts`

Read for reference:
- `apps/mobile-app/hooks/useVaultComposer.ts` — copy the wrapper pattern exactly
- `libs/hooks/src/useGroupComposer.ts` — the shared hook to wrap

Build instructions:
- Thin wrapper that injects `mobilePendingDb` + Toast adapter + analytics adapter into shared hook.
- Re-exports the result.

### Step 4: Refactor mobile `drop-composer.tsx`

File: `apps/mobile-app/components/groups/drop-composer.tsx`

Read for reference:
- `apps/web/src/app/_components/groups/drop-composer.tsx` (post-refactor) — same pattern, NativeWind instead of Tailwind
- Existing mobile composer (current file) — reuse the URL detection + extraction UI

Build instructions:
- Remove direct `supabase.from(...).upsert/insert(...)` calls and `queryClient.invalidateQueries(...)` (lines 84-141).
- Call `const composer = useGroupComposer({ groupId, currentUserId: userId, supabase, onPosted: useBumpGroupsList() })`.
- Wire the existing send button to `composer.handleSend`.
- Keep the URL preview card UI as-is — only the submission internals change.

### Step 5: Refactor mobile `feed-view.tsx`

File: `apps/mobile-app/components/groups/feed-view.tsx`

- Remove any local `invalidateQueries` calls coupled to posting.
- Read pending rows: `const pendingPosts = usePendingStore(s => s.pendingGroupPosts.filter(p => p.convo_id === groupId))` (use a stable selector).
- Pass `pendingPosts` and `userId` into the mobile `useGroupFeed` wrapper, which passes them through to the shared hook.

### Step 6: Update mobile `feed-drop-card.tsx`

File: `apps/mobile-app/components/groups/feed-drop-card.tsx`

Read for reference:
- `apps/web/src/app/_components/groups/PendingGroupPostCard.tsx` — extract status visual treatment
- Existing mobile card — keep all current confirmed-state visuals

Build instructions:
- Add a `kind: "pending" | "confirmed"` discriminator on the prop (or check `drop.status`).
- `status === "sending"` → render a small NativeWind spinner badge in a corner (use `Spinner` from `components/ui/spinner`).
- `status === "failed"` → render a red banner footer (`bg-destructive text-destructive-foreground`) with two `Pressable` buttons: Retry (calls `composer.retry(tempId)` — pass `retry` down via context or props) and Dismiss (calls `mobilePendingDb.deletePendingGroupPost(tempId)`).
- All strings via `useLocalization` — add new keys to `libs/locales/src/en.json` (`groups.failed_to_post`, `groups.retry`, `groups.dismiss`).
- FlashList `keyExtractor` stays stable — use `drop.serverId ?? drop.tempId ?? drop.id`.

### Step 7: Lint + format mobile

- `pnpm --filter mobile-app lint`
- `pnpm --filter mobile-app format`
- Test on a fresh dev client build with MMKV. Walk verification checklist (see plan file).

---

## Verification (both platforms)

- [ ] Post a text message — card appears instantly; input clears; no other cards flicker.
- [ ] Post a link — pending card with metadata appears instantly; morphs to confirmed card smoothly on web (layoutId) once server responds; no flicker on other cards.
- [ ] Sender's group jumps to top of sidebar / groups list immediately.
- [ ] Kill network → post → pending card shows `failed` state with Retry + Dismiss.
- [ ] Re-open app → pending "failed" rows still present.
- [ ] Two clients of same user: poster shows optimistic card; other tab/device receives server row via realtime insert (the `shared_by === self` guard only skips the *poster's* refetch).
- [ ] `pnpm lint` + `pnpm type:check` (web), `pnpm lint` + `pnpm format` (mobile).

---

## Next Commands

**Web agent:**

"Read `memory/CODEBASE_MAP.md` and `memory/FEATURE_PLAN.md`.

Implement Web Steps 1–10 in order from FEATURE_PLAN.md. This includes:
- Steps 1–4: extend shared `libs/hooks` (PendingDB types, new `useGroupComposer`, new `useBumpGroupsList`, extend `useGroupFeed` with pending-merge + self-skip)
- Steps 5–9: web Dexie table + adapter, new `PendingGroupPostCard`, refactor `drop-composer.tsx` / `feed-tab-view.tsx` / `feed-share-card.tsx` to use shared hooks + `layoutId`, refactor `useGroupFeed` web wrapper
- Step 10: lint + type:check

Reference architecture to clone (read these only):
- `libs/hooks/src/types/pending-db.ts` (extend it)
- `libs/hooks/src/useVaultComposer.ts` (mirror its shape for `useGroupComposer`)
- `libs/hooks/src/useGroupFeed.ts` (extend with pending merge + self-skip at lines 208-221)
- `apps/web/src/app/_libs/db/index.ts` (extend with `pending_group_posts` table)
- `apps/web/src/app/_components/vault/VaultLibrary.tsx` (live-query merge pattern)
- `apps/web/src/app/_components/vault/VaultGrid.tsx` lines 62-102 (`<LayoutGroup>` + `<AnimatePresence>` + `layoutId`)
- `apps/web/src/app/_components/vault/PendingLinkCard.tsx` (status visuals to mirror in `PendingGroupPostCard`)
- `apps/web/src/app/_components/groups/drop-composer.tsx` (current file, refactor target)
- `apps/web/src/app/_components/groups/feed-tab-view.tsx` (current file, refactor target)
- `apps/web/src/app/_components/groups/feed-share-card.tsx` (current file, refactor target)
- `apps/web/src/app/_libs/hooks/useGroupFeed.ts` (current file — lines 195-197 has the self-skip pattern to copy into the shared hook)
- `libs/hooks/src/useUserGroups.ts` (for the `UserGroupRow` shape used by `useBumpGroupsList`)
- `libs/query/src/keys.ts` (for `queryKeys.groups.list()`)

If anything is missing from the map, explore that specific folder only, update the map, and proceed."

**Mobile agent:**

"Read `memory/CODEBASE_MAP.md` and `memory/FEATURE_PLAN.md`. Also read `~/.claude/projects/-Users-ankurrathi-Desktop-kurate-wtf-platform/memory/project_mobile_storage_mmkv.md` and `project_pending_db_pattern.md` for the architectural decisions.

Wait until the Web agent has finished Steps 1–4 (the shared `libs/hooks` changes) before you start — your work depends on those types and hooks existing.

Implement Mobile Steps 1–7 in order from FEATURE_PLAN.md. This includes:
- Step 1: install `react-native-mmkv`, swap `usePendingStore` persist backend from `expo-secure-store` to MMKV, FLAG USER to run `npx expo prebuild` and install fresh dev client
- Step 2: extend `usePendingStore` + `mobilePendingDb` with `pendingGroupPosts` slice
- Step 3: new `apps/mobile-app/hooks/useGroupComposer.ts` wrapper
- Step 4: refactor `apps/mobile-app/components/groups/drop-composer.tsx` to use shared composer + `useBumpGroupsList`
- Step 5: refactor `apps/mobile-app/components/groups/feed-view.tsx` to read pending rows and pass into shared `useGroupFeed`
- Step 6: update `apps/mobile-app/components/groups/feed-drop-card.tsx` with sending/failed status UI (Spinner badge, red banner with Retry+Dismiss)
- Step 7: lint + format

Reference files (read these only):
- `apps/mobile-app/store/usePendingStore.ts` (current file, refactor target — current `expo-secure-store` wiring)
- `apps/mobile-app/libs/pending-db.ts` (current file, extend with group post methods)
- `apps/mobile-app/hooks/useVaultComposer.ts` (mirror this exact wrapper pattern for `useGroupComposer`)
- `apps/mobile-app/components/groups/drop-composer.tsx` (current file, refactor target)
- `apps/mobile-app/components/groups/feed-view.tsx` (current file, refactor target)
- `apps/mobile-app/components/groups/feed-drop-card.tsx` (current file, refactor target)
- `libs/hooks/src/useGroupComposer.ts` (created by Web agent — wrap it)
- `libs/hooks/src/useBumpGroupsList.ts` (created by Web agent — call from composer wrapper)
- `libs/hooks/src/types/pending-db.ts` (extended by Web agent — implement new methods)
- `libs/locales/src/en.json` (add `groups.failed_to_post`, `groups.retry`, `groups.dismiss`)

Lists must use `@shopify/flash-list`. Images must use `react-native-fast-image`. NativeWind only — no Gluestack. All strings via `useLocalization`.

If anything is missing from the map, explore that specific folder only, update the map, and proceed."
