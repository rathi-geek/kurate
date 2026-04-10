# Feature Plan: Groups
Last updated: 2026-04-09

## Order of execution (always follow this sequence)
1. Web — fix bugs (5 items)
2. Web — code quality (7 items)
3. Web — move to /libs (10 items)
4. Mobile — build feature (13 screens/components)

---

## Web — Step by Step

### Step 1: Fix bugs

#### 1a. Extract GroupsPageClient from page.tsx
File: `apps/web/src/app/(app)/groups/page.tsx`
- Issue: `"use client"` on a page.tsx violates codebase rule (pages must be Server Components)
- Fix: Create `apps/web/src/app/(app)/groups/GroupsPageClient.tsx` with all the current client logic. Make `page.tsx` a thin Server Component that renders `<GroupsPageClient />`.

#### 1b. Fix unsafe `as any` cast in invite API
File: `apps/web/src/app/api/groups/invite/route.ts` (lines 157-164)
- Issue: `const db = supabase as any` bypasses TypeScript, try/catch silently swallows errors. The `group_invites` table exists and is used elsewhere.
- Fix: Remove `as any` cast, use `supabase` directly. Remove try/catch — let errors propagate or handle explicitly.

#### 1c. Fix infinite fetch loop in LibraryView
File: `apps/web/src/app/_components/groups/library-view.tsx` (lines 29-30)
- Issue: `if (hasNextPage) { fetchNextPage(); }` runs on every render, causing an infinite loop.
- Fix: Wrap in `useEffect` with `[hasNextPage, isFetchingNextPage]` deps, guard with `!isFetchingNextPage`.

#### 1d. Fix missing useEffect deps in FeedShareCard
File: `apps/web/src/app/_components/groups/feed-share-card.tsx` (line 136)
- Issue: `useEffect` uses `drop.id`, `markPostSeen`, `latestCommentAtRef` but only has `[showComments]` in deps.
- Fix: Add `drop.id` and `markPostSeen` to dep array. `latestCommentAtRef` is a ref (stable) so OK to omit.

#### 1e. Fix typo in LibraryCard className
File: `apps/web/src/app/_components/groups/library-card.tsx` (line 46)
- Issue: `overflow-hiddrop.cden` should be `overflow-hidden`
- Fix: Replace `overflow-hiddrop.cden` with `overflow-hidden`.

---

### Step 2: Code quality

#### 2a. Extract CommentItem to its own file
File: `apps/web/src/app/_components/groups/comment-thread.tsx` (lines 31-207)
- Issue: File is 411 lines. `CommentItem` is 175 lines and is a standalone component.
- Fix: Move `CommentItem`, `CommentItemProps`, and `renderTextWithLinks` to `apps/web/src/app/_components/groups/comment-item.tsx`. Import in `comment-thread.tsx`.

#### 2b. Extract DangerConfirmModal to its own file
File: `apps/web/src/app/_components/groups/group-danger-zone.tsx` (lines 28-117)
- Issue: `DangerConfirmModal` is 90 lines and is a reusable component.
- Fix: Move `DangerConfirmModal` and `DangerConfirmModalProps` to `apps/web/src/app/_components/groups/danger-confirm-modal.tsx`. Import in `group-danger-zone.tsx`.

#### 2c. Move delete-drop logic to a hook
File: `apps/web/src/app/_components/groups/feed-tab-view.tsx` (lines 86-89)
- Issue: Direct `supabase.from("group_posts").delete()` call inside component.
- Fix: Add a `deleteDrop` mutation to `useGroupFeed.ts` or create a small `useDeleteDrop` hook. Call it from `feed-tab-view.tsx`.

#### 2d. Deduplicate ProfileRow type and toProfile helper
Files: `apps/web/src/app/_libs/hooks/useGroupFeed.ts`, `apps/web/src/app/_libs/utils/mapGroupDrop.ts`
- Issue: `ProfileRow` type defined in both files. `toProfile()` function duplicated.
- Fix: Keep canonical versions in `mapGroupDrop.ts` (already exports them). Import in `useGroupFeed.ts`. Remove duplicates.

#### 2e. Deduplicate feed mapping logic
Files: `apps/web/src/app/_libs/hooks/useGroupFeed.ts` (lines 69-134), `apps/web/src/app/_libs/utils/mapGroupDrop.ts`
- Issue: `fetchGroupFeedPage` contains inline mapping that duplicates `mapRowToGroupDrop`.
- Fix: Use `mapRowToGroupDrop` from `mapGroupDrop.ts` inside `fetchGroupFeedPage`. Adapt input shape if needed.

#### 2f. Fix sequential awaits in useUnreadCounts
File: `apps/web/src/app/_libs/hooks/useUnreadCounts.ts` (lines 47-62)
- Issue: Group unread queries run sequentially in a for loop (`for...of` + `await`).
- Fix: Use `Promise.all(groupIdArr.map(...))` to parallelize.

#### 2g. Replace inline SVGs with icon components
Files: `apps/web/src/app/_components/groups/feed-header.tsx` (lines 35-42, 88-99), `apps/web/src/app/(app)/groups/page.tsx` (lines 90-100)
- Issue: Inline `<svg>` elements instead of components from `@/components/icons`.
- Fix: Use `ChevronLeftIcon`, `ChevronRightIcon` from `@/components/icons`. If missing, add them.

---

### Step 3: Move to /libs

> **Critical prerequisite:** Hooks currently import `createClient` from `@/app/_libs/supabase/client`. To share across web/mobile, either:
> (A) Accept a Supabase client as parameter in each hook, or
> (B) Create a shared client wrapper in `libs/` that each platform configures.
>
> **Recommendation:** Option A is simpler — each hook factory takes `supabase` as arg. Web passes its client, mobile passes its client. This is a pattern change that applies to ALL hooks being moved.

#### 3a. Move ProfileRow + toProfile to libs/types and libs/utils
- `ProfileRow` type → add to `libs/types/src/groups.ts`
- `toProfile()` → add to `libs/utils/src/profile.ts` (new file)
- Update imports in: `useGroupFeed.ts`, `mapGroupDrop.ts`, `useGroupMembers.ts`

#### 3b. Move mapGroupDrop.ts to libs/utils
- Move: `apps/web/src/app/_libs/utils/mapGroupDrop.ts` → `libs/utils/src/mapGroupDrop.ts`
- Export from `libs/utils/src/index.ts`
- Update imports in: `useGroupFeed.ts`, any other consumers

#### 3c. Move fetchGroupDetail.ts to libs/utils
- Move: `apps/web/src/app/_libs/utils/fetchGroupDetail.ts` → `libs/utils/src/fetchGroupDetail.ts`
- Change to accept `supabase` client as parameter
- Update imports in: `useGroupDetail.ts`

#### 3d. Move fetchUserGroups.ts to libs/hooks
- Move: `apps/web/src/app/_libs/utils/fetchUserGroups.ts` → `libs/hooks/src/useUserGroups.ts`
- Wrap as a hook (useUserGroups) that accepts supabase client
- Update imports in: `groups/page.tsx`, `sidebar-groups-section.tsx`

#### 3e. Move useGroupDetail.ts to libs/hooks
- Move: `apps/web/src/app/_libs/hooks/useGroupDetail.ts` → `libs/hooks/src/useGroupDetail.ts`
- Change `fetchGroupDetail`/`fetchGroupRole` to accept supabase client
- Update imports in: `GroupPageClient.tsx`

#### 3f. Move useGroupMembers.ts to libs/hooks
- Move: `apps/web/src/app/_libs/hooks/useGroupMembers.ts` → `libs/hooks/src/useGroupMembers.ts`
- Change to accept supabase client
- Update imports in: `feed-tab-view.tsx`, `group-info-page.tsx`

#### 3g. Move useGroupInvites.ts to libs/hooks
- Move: `apps/web/src/app/_libs/hooks/useGroupInvites.ts` → `libs/hooks/src/useGroupInvites.ts`
- Change to accept supabase client
- Update imports in: `group-info-page.tsx`

#### 3h. Move useDropEngagement.ts to libs/hooks
- Move: `apps/web/src/app/_libs/hooks/useDropEngagement.ts` → `libs/hooks/src/useDropEngagement.ts`
- Change to accept supabase client
- Update imports in: `engagement-bar.tsx`

#### 3i. Move useComments.ts to libs/hooks
- Move: `apps/web/src/app/_libs/hooks/useComments.ts` → `libs/hooks/src/useComments.ts`
- Change to accept supabase client
- Update imports in: `comment-thread.tsx`, `feed-tab-view.tsx`

#### 3j. Move useShareToGroups.ts to libs/hooks (consolidate)
- Web: `apps/web/src/app/_libs/hooks/useShareToGroups.ts`
- Mobile: `apps/mobile-app/hooks/useShareToGroups.ts`
- Both are near-identical. Consolidate into `libs/hooks/src/useShareToGroups.ts`
- Accept supabase client + userId as params
- Delete both app-local versions, update imports

---

## Mobile — Step by Step

> **Design philosophy:** Same visual language as web, adapted for native. Same color tokens, proportional spacing. Bottom sheets replace modals/dropdowns. Single column. Press states replace hover.
>
> **Shared libs used:** `@kurate/types`, `@kurate/query`, `@kurate/hooks` (after Step 3), `@kurate/utils`, `@kurate/locales`

### Step M1: Tab navigation — add Groups tab
New file: `apps/mobile-app/app/(tabs)/groups.tsx`
Read for reference:
- `apps/web/src/app/(app)/groups/page.tsx` — list layout, role badges, empty state
- `libs/types/src/groups.ts` — GroupRow, GroupRole types
Read existing mobile:
- `apps/mobile-app/app/(tabs)/_layout.tsx` — current tab setup
Key design decisions from web:
- Groups list: avatar (40px circle) + name + role badge + description + chevron
- Empty state: centered text + "Create a Group" button
- Create button: top-right, pill shape, `bg-primary`
Build instructions:
- Add "Groups" tab to `_layout.tsx` with `Users` icon from lucide
- Create `groups.tsx` screen using `useUserGroups` from `@kurate/hooks`
- FlatList with group rows (avatar, name, role badge, description)
- Empty state with create button
- FAB or header button for "Create Group"

### Step M2: Create group bottom sheet
New file: `apps/mobile-app/components/groups/create-group-sheet.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/create-group-dialog.tsx` — fields, validation, submit flow
Key design decisions from web:
- Two fields: name (required), description (optional)
- Submit creates conversation + owner membership
- Navigates to group after creation
Build instructions:
- Bottom sheet with name Input + description Textarea
- Submit → Supabase insert → invalidate groups list → navigate to group
- Loading + error states

### Step M3: Group detail screen (shell + feed/library/info routing)
New file: `apps/mobile-app/app/(tabs)/groups/[id].tsx`
New file: `apps/mobile-app/components/groups/group-header.tsx`
Read for reference:
- `apps/web/src/app/(app)/groups/[id]/GroupPageClient.tsx` — view routing, realtime redirect
- `apps/web/src/app/_components/groups/feed-header.tsx` — header layout
- `apps/web/src/app/_components/groups/group-view.ts` — GroupView enum
Key design decisions from web:
- Header: back button + avatar + group name + library toggle + info button
- Three views: Feed (default), Library, Info
- Realtime: redirect on membership DELETE
Build instructions:
- Dynamic route `[id].tsx`
- Use `useGroupDetail` + `useGroupRole` from `@kurate/hooks`
- State for `view` (Feed/Library/Info)
- Header component with back, avatar, name, toggle buttons
- Render appropriate view based on state

### Step M4: Group feed view + drop cards
New file: `apps/mobile-app/components/groups/feed-view.tsx`
New file: `apps/mobile-app/components/groups/feed-drop-card.tsx`
New file: `apps/mobile-app/components/groups/drop-item-preview.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/feed-tab-view.tsx` — feed layout, infinite scroll, empty/loading states
- `apps/web/src/app/_components/groups/feed-share-card.tsx` — card structure, seen tracking, comment toggle
- `apps/web/src/app/_components/groups/drop-item-preview.tsx` — link preview image, title, metadata
Key design decisions from web:
- Card: sharer header (avatar 32px + name + "dropped . time"), optional note (italic), link preview (220px image), text-only content, reaction pills, engagement bar, latest comment preview, expandable comment thread
- Must-read cards: `border-warning-foreground/30 bg-warning-bg/40`
- New comments: green dot on comment icon
- Latest comment preview: avatar + author + "+N more" + text + chevron
Build instructions:
- FlatList with `useGroupFeed` from `@kurate/hooks`
- `onEndReached` for infinite scroll
- `FeedDropCard` component with all sub-sections
- Press on comment preview → expand thread (see Step M6)
- Seen tracking via `markPostSeen`

### Step M5: Drop composer
New file: `apps/mobile-app/components/groups/drop-composer.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/drop-composer.tsx` — URL detection, metadata extraction, text-only, preview card
- `apps/web/src/app/_components/home/chat-input.tsx` — input behavior
Key design decisions from web:
- Single input: detects URLs automatically, shows preview below
- Link post: URL + optional note
- Text-only post: plain text content
- After link share: toast with "Save to vault?" action
Build instructions:
- TextInput with URL regex detection
- `useExtractMetadata` from `@kurate/hooks` for preview
- Preview card component (image, title, source, close button)
- Submit: upsert logged_item → insert group_post → optional vault save toast
- Reset input after submit

### Step M6: Comment thread (bottom sheet or inline)
New file: `apps/mobile-app/components/groups/comment-thread.tsx`
New file: `apps/mobile-app/components/groups/comment-bubble.tsx`
New file: `apps/mobile-app/components/groups/reply-input.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/comment-thread.tsx` — DM-style bubbles, reply-to, edit, delete, unread divider
- `apps/web/src/app/_components/groups/reply-input.tsx` — input with send button
Key design decisions from web:
- Own comments: right-aligned, `bg-primary text-primary-foreground`, rounded-tr-sm
- Others: left-aligned, `bg-surface border`, avatar + name, rounded-tl-sm
- Reply-to: quoted block with accent bar, author name, truncated text
- Unread divider: "N new messages" with primary-colored lines
- Continuation: same author grouped, no repeated name/avatar
- Timestamp: inline at end of bubble, mono text
Build instructions:
- FlatList (inverted for bottom-anchored scroll) with `useComments` from `@kurate/hooks`
- `CommentBubble` component handling own/other styling
- Reply-to context banner above input
- Edit mode: pre-fills input, banner shows "Editing"
- Delete: long-press action sheet or swipe
- `ReplyInput` with TextInput + send button

### Step M7: Engagement bar
New file: `apps/mobile-app/components/groups/engagement-bar.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/engagement-bar.tsx` — like, must-read, bookmark, comment toggle
Key design decisions from web:
- Row of icon buttons: Heart (like), Star (must-read), Bookmark (vault), MessageCircle (comments)
- Active states: red for like, warning for must-read, primary for bookmark
- Count shown next to icon, mono font
- Comment icon: green fill when new comments
Build instructions:
- HStack of Pressable buttons
- `useDropEngagement` from `@kurate/hooks` for like/must-read
- `useVaultToggle` for bookmark (from web hook, needs lib move)
- Optimistic UI — count changes immediately

### Step M8: Library view
New file: `apps/mobile-app/components/groups/library-view.tsx`
New file: `apps/mobile-app/components/groups/library-card.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/library-view.tsx` — must-read section, all-shared grid
- `apps/web/src/app/_components/groups/library-card.tsx` — card with image, title, metadata, engagement
Key design decisions from web:
- Two sections: "MUST READ" at top, "ALL SHARED" below
- Cards: preview image (aspect-video), title, source + read time, engagement bar
- Card click → navigate to feed with scroll-to-drop
Build instructions:
- SectionList with must-read + all-shared sections
- `LibraryCard` component: Image + title + metadata + EngagementBar
- Single column on mobile (2 columns on tablet if needed)
- Press → navigate to feed view with drop ID param

### Step M9: Group info screen
New file: `apps/mobile-app/components/groups/group-info-view.tsx`
New file: `apps/mobile-app/components/groups/group-members-list.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/group-info-page.tsx` — layout
- `apps/web/src/app/_components/groups/group-info-header.tsx` — avatar, name, description, edit button
- `apps/web/src/app/_components/groups/group-info-members-list.tsx` — member rows
Key design decisions from web:
- Header: large avatar (80px), name, description, edit pencil (owner only)
- "Add member" button (dashed border, plus icon) — admin/owner only
- Members list: avatar 40px + name + handle + role badge + chevron (owner only)
- Pending invites section (admin/owner)
- Danger zone at bottom: leave + delete (owner)
Build instructions:
- ScrollView with header, add-member button, FlatList of members
- `useGroupMembers` + `useGroupInvites` from `@kurate/hooks`
- Tap member → action sheet (owner only): promote/demote, remove
- Danger zone: leave + delete buttons at bottom

### Step M10: Edit group info sheet
New file: `apps/mobile-app/components/groups/edit-group-info-sheet.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/edit-group-info-modal.tsx` — avatar upload, name, description
Key design decisions from web:
- Avatar upload: tap avatar → image picker → upload to Supabase storage → update media_metadata → update conversation
- Name + description fields
Build instructions:
- Bottom sheet with avatar (pressable → expo-image-picker), name Input, description Textarea
- Upload flow: pick image → upload to storage → upsert media_metadata → update conversations.group_avatar_id
- Save + cancel buttons

### Step M11: Invite member sheet
New file: `apps/mobile-app/components/groups/invite-member-sheet.tsx`
Read for reference:
- `apps/web/src/app/_components/groups/group-invite-modal.tsx` — search, email detection, batch add, role selector
Key design decisions from web:
- Search input: debounced, searches profiles by name/handle
- Email detection: if email typed, check platform user or offer email invite
- Multi-select with chips
- Role selector: member/admin toggle
- Batch add button
Build instructions:
- Bottom sheet with search Input
- FlatList of search results with checkboxes
- Email branch: "Invite by email" + "Copy invite link" buttons
- Selected chips row + role picker
- "Add N members" submit button
- `useGroupInvites` for pending invites management

### Step M12: Join group deep link handler
New file: `apps/mobile-app/app/groups/join/[invite_code].tsx`
Read for reference:
- `apps/web/src/app/(app)/groups/join/[invite_code]/page.tsx` — auth check, email validation, capacity check, join flow
Key design decisions from web:
- Server-side on web; on mobile this is a screen triggered by deep link
- Check auth → check onboarding → validate email (if present) → check capacity → join → redirect
Build instructions:
- Screen that handles deep link `/groups/join/:invite_code`
- On mount: check auth, validate, join group via Supabase insert
- Error states: wrong account, revoked, invalid, full
- Success: navigate to group detail

### Step M13: Sidebar/tab unread badges
Read for reference:
- `apps/web/src/app/_libs/hooks/useUnreadCounts.ts` — localStorage tracking, realtime subscription
- `apps/web/src/app/_components/sidebar/sidebar-groups-section.tsx` — unread badge
Key design decisions from web:
- Unread count per group: new posts since last visit (by others)
- Realtime: increment on new post INSERT
- Mark read on group visit (localStorage on web → AsyncStorage on mobile)
Build instructions:
- `useGroupUnreadCounts` hook: AsyncStorage for last-seen, Supabase realtime for increments
- Badge component on groups tab icon + individual group rows
- Mark read when navigating to a group

---

## Next Commands

**Web agent (fix bugs — Step 1):**
"Read memory/CODEBASE_MAP.md first, then read ONLY these files:

Files to fix:
- `apps/web/src/app/(app)/groups/page.tsx`
- `apps/web/src/app/api/groups/invite/route.ts`
- `apps/web/src/app/_components/groups/library-view.tsx`
- `apps/web/src/app/_components/groups/feed-share-card.tsx`
- `apps/web/src/app/_components/groups/library-card.tsx`

Fix these specific issues:
1. `groups/page.tsx` — extract client logic to `GroupsPageClient.tsx`, make page.tsx a Server Component
2. `invite/route.ts:157-164` — remove `as any` cast, use supabase directly, remove unnecessary try/catch
3. `library-view.tsx:29-30` — wrap `fetchNextPage()` in useEffect with `[hasNextPage, isFetchingNextPage]` guards
4. `feed-share-card.tsx:136` — add `drop.id` and `markPostSeen` to useEffect dep array
5. `library-card.tsx:46` — fix `overflow-hiddrop.cden` → `overflow-hidden`

Run `pnpm lint` and `pnpm type:check` when done."

**Web agent (code quality — Step 2):**
"Read memory/CODEBASE_MAP.md first, then read ONLY these files:

Files to refactor:
- `apps/web/src/app/_components/groups/comment-thread.tsx` — extract CommentItem + renderTextWithLinks to `comment-item.tsx`
- `apps/web/src/app/_components/groups/group-danger-zone.tsx` — extract DangerConfirmModal to `danger-confirm-modal.tsx`
- `apps/web/src/app/_components/groups/feed-tab-view.tsx` — move delete-drop Supabase call to useGroupFeed hook
- `apps/web/src/app/_libs/hooks/useGroupFeed.ts` — import ProfileRow/toProfile from mapGroupDrop.ts, use mapRowToGroupDrop for mapping
- `apps/web/src/app/_libs/utils/mapGroupDrop.ts` — canonical source for ProfileRow, toProfile, mapRowToGroupDrop
- `apps/web/src/app/_libs/hooks/useUnreadCounts.ts` — parallelize group queries with Promise.all
- `apps/web/src/app/_components/groups/feed-header.tsx` — replace inline SVGs with ChevronLeftIcon/ChevronRightIcon
- `apps/web/src/app/(app)/groups/page.tsx` — replace inline SVG chevron with icon component

Run `pnpm lint` and `pnpm type:check` when done."

**Web agent (move to /libs — Step 3):**
"Read memory/CODEBASE_MAP.md first, then read ONLY these files:

Files to move (change to accept supabase client as parameter):
- `apps/web/src/app/_libs/utils/mapGroupDrop.ts` → `libs/utils/src/mapGroupDrop.ts`
- `apps/web/src/app/_libs/utils/fetchGroupDetail.ts` → `libs/utils/src/fetchGroupDetail.ts`
- `apps/web/src/app/_libs/utils/fetchUserGroups.ts` → `libs/hooks/src/useUserGroups.ts`
- `apps/web/src/app/_libs/hooks/useGroupDetail.ts` → `libs/hooks/src/useGroupDetail.ts`
- `apps/web/src/app/_libs/hooks/useGroupMembers.ts` → `libs/hooks/src/useGroupMembers.ts`
- `apps/web/src/app/_libs/hooks/useGroupInvites.ts` → `libs/hooks/src/useGroupInvites.ts`
- `apps/web/src/app/_libs/hooks/useDropEngagement.ts` → `libs/hooks/src/useDropEngagement.ts`
- `apps/web/src/app/_libs/hooks/useComments.ts` → `libs/hooks/src/useComments.ts`
- `apps/web/src/app/_libs/hooks/useShareToGroups.ts` + `apps/mobile-app/hooks/useShareToGroups.ts` → `libs/hooks/src/useShareToGroups.ts`

Files that import them (update these imports after move):
- `apps/web/src/app/(app)/groups/page.tsx` (or GroupsPageClient.tsx after bug fix)
- `apps/web/src/app/(app)/groups/[id]/GroupPageClient.tsx`
- `apps/web/src/app/_components/groups/feed-tab-view.tsx`
- `apps/web/src/app/_components/groups/feed-share-card.tsx`
- `apps/web/src/app/_components/groups/engagement-bar.tsx`
- `apps/web/src/app/_components/groups/comment-thread.tsx`
- `apps/web/src/app/_components/groups/group-info-page.tsx`
- `apps/web/src/app/_components/groups/group-info-header.tsx`
- `apps/web/src/app/_components/sidebar/sidebar-groups-section.tsx`
- `apps/web/src/app/_libs/hooks/useGroupFeed.ts`

Pattern: Each moved hook should accept `supabase: SupabaseClient` as first parameter. Web callers pass `createClient()`, mobile callers pass their own client.

Update barrel exports in `libs/hooks/src/index.ts`, `libs/utils/src/index.ts`, `libs/types/src/index.ts`.

Run `pnpm lint` and `pnpm type:check` when done."

**Mobile agent (build groups — Step M1-M13):**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Mobile Steps M1-M13 in order as written in the plan.

Shared libs (read these first):
- `libs/types/src/groups.ts`
- `libs/query/src/keys.ts`
- `libs/hooks/src/index.ts` (after Step 3 moves)
- `libs/utils/src/index.ts`
- `libs/locales/src/en.json`

Web reference (design + logic — read for each step as noted):
- `apps/web/src/app/(app)/groups/page.tsx`
- `apps/web/src/app/(app)/groups/[id]/GroupPageClient.tsx`
- `apps/web/src/app/_components/groups/` (all files listed per step)

Existing mobile files:
- `apps/mobile-app/app/(tabs)/_layout.tsx`
- `apps/mobile-app/components/ui/` (all Gluestack components)
- `apps/mobile-app/hooks/index.ts`
- `apps/mobile-app/libs/supabase/client.ts`
- `apps/mobile-app/context/`

Build each step as written. Use Gluestack UI + NativeWind + lucide-react-native.
If something is missing from the map → explore that specific folder only, update the map, then proceed."
