# Feature Plan: Personal DMs (people/:id)
Last updated: 2026-04-20

## Feature Audit: Personal DMs

### 1. What exists in web today

Files found:
- `apps/web/src/app/(app)/people/page.tsx` — conversations list (has `"use client"` — rule violation)
- `apps/web/src/app/(app)/people/[convoId]/page.tsx` — chat view (server component, correct)
- `apps/web/src/app/_components/people/dm-chat-view.tsx` — chat container with infinite scroll
- `apps/web/src/app/_components/people/dm-composer.tsx` — message input with URL detection
- `apps/web/src/app/_components/people/message-bubble.tsx` — message with reactions/reply/edit/delete
- `apps/web/src/app/_components/people/find-user-sheet.tsx` — search users to start DM
- `apps/web/src/app/_components/sidebar/sidebar-people-section.tsx` — sidebar DM list with prefetch
- `apps/web/src/app/_components/sidebar/PeoplePanel.tsx` — full conversations panel (cleaner duplicate of page.tsx)
- `apps/web/src/app/_libs/hooks/useDMConversations.ts` — fetch DM list + realtime
- `apps/web/src/app/_libs/hooks/useMessages.ts` — infinite message pagination + realtime
- `apps/web/src/app/_libs/hooks/useUnreadCounts.ts` — unread badges (DMs + groups)
- `apps/web/src/app/api/people/conversation/route.ts` — create/get DM conversation
- `libs/types/src/people.ts` — DMConversation, DMMessage, AppProfile

Flow summary: Sidebar shows conversations via `useDMConversations`. Clicking opens `/people/[convoId]` which renders `DmChatView`. Messages use infinite pagination (30/page) with cursor-based loading. Realtime via Supabase postgres_changes channels. `FindUserSheet` searches profiles and creates conversations via API route. `useUnreadCounts` tracks unread for both DMs (via message_read_receipts table) and groups (via localStorage).

### 2. Bugs & issues to fix before mobile replicates

🔴 Must fix:
- **B1. `people/page.tsx` is `"use client"`** — CLAUDE.md: page.tsx must be server component. `PeoplePanel.tsx` already exists as a cleaner client component. Fix: make page.tsx a server component, create `people-page-client.tsx` wrapping PeoplePanel with `useAuth()` + `useDMConversations()`.
- **B2. `message-bubble.tsx:250` — `new URL()` can throw** on malformed URLs, crashing entire message list. Fix: wrap in try-catch, fallback to raw URL.
- **B3. No error handling on send/react/delete** — `dm-composer.tsx` clears text even if Supabase insert fails silently. `message-bubble.tsx` `handleReact`/`handleDelete` are fire-and-forget. Fix: check `.error` on all Supabase calls, show toast via `sonner`.
- **B4. Dead mock code** — `person/PersonChatView.tsx` uses `MOCK_CONTACTS`, hardcoded `@vivek`. Entirely superseded by real DM implementation. Fix: delete dead files.
- **B5. `useUnreadCounts` doesn't scale** — fetches ALL read receipts + ALL messages for ALL conversations on every page load/tab focus. Fix: add `last_read_at` column to `conversation_members` in `01_initial_schema.sql`, add RPC functions in `02_functions.sql`, run SQL in Supabase editor.

🟡 Nice to fix:
- **B6. `people/page.tsx` duplicates `formatRelativeTime`** — already exported from `@kurate/utils`. `PeoplePanel.tsx` already uses it.
- **B7. `people/page.tsx` uses `supabase.auth.getUser()` instead of `useAuth()`** — fixed when delegating to PeoplePanel.

### 3. Code quality issues

🟣 Should fix:
- **Q1. `bg-white` instead of `bg-card`** — `people/page.tsx:79`, `dm-chat-view.tsx:144`, `dm-composer.tsx:191`, `message-bubble.tsx:109,166`, `PeoplePanel.tsx:60`. Leave `bg-white/10`, `bg-white/20` opacity variants on own-message styling.
- **Q2. `rounded-2xl`/`rounded-xl` instead of radius tokens** — `message-bubble.tsx:189` bubble → add `--radius-bubble: 16px` token. `message-bubble.tsx:166` picker → `rounded-card`. `dm-composer.tsx:262` textarea → `rounded-pill`. `dm-composer.tsx:230`, `message-bubble.tsx:221` link cards → `rounded-card`.
- **Q3. Avatar images never displayed** — all locations show initials only despite `avatar_url` data being available. Use `Avatar`/`AvatarImage`/`AvatarFallback` from `@/components/ui/avatar`.
- **Q4. No delete confirmation** — `message-bubble.tsx` deletes immediately. Add `AlertDialog` from `@/components/ui/alert-dialog`.
- **Q5. `useDMConversations` realtime unfiltered** — listens to ALL message inserts system-wide. Add client-side filter: skip if `sender_id === userId`.
- **Q6. `next/link` instead of `@/i18n` Link** — `@/i18n` does NOT export Link yet, 22+ files use `next/link`. Skip for now — address codebase-wide later.

### 4. What should move to /libs
- `hooks/useDMConversations.ts` → `libs/hooks/src/useDMConversations.ts` — add `supabase: SupabaseClient<Database>` param
- `hooks/useMessages.ts` → `libs/hooks/src/useMessages.ts` — add `supabase` param
- DM part of `hooks/useUnreadCounts.ts` → `libs/hooks/src/useDMUnreadCounts.ts`
- Pattern reference: `libs/hooks/src/useComments.ts`, `libs/hooks/src/useGroupFeed.ts`

### 5. What mobile needs to build fresh

New files (exact paths):
- `apps/mobile-app/app/(tabs)/people.tsx` — People tab screen
- `apps/mobile-app/app/people/[convoId].tsx` — Chat detail screen (deep link)
- `apps/mobile-app/components/people/conversations-list.tsx` — FlashList of conversations
- `apps/mobile-app/components/people/conversation-row.tsx` — Single conversation row
- `apps/mobile-app/components/people/dm-chat-view.tsx` — Chat container (inverted FlashList + composer)
- `apps/mobile-app/components/people/message-bubble.tsx` — Message bubble (long-press actions)
- `apps/mobile-app/components/people/dm-composer.tsx` — Text input + send button
- `apps/mobile-app/components/people/find-user-sheet.tsx` — BottomSheetModal user search
- `apps/mobile-app/components/people/dm-avatar.tsx` — FastImage avatar with initials fallback
- `apps/mobile-app/hooks/useDMConversations.ts` — Thin wrapper passing mobile supabase client
- `apps/mobile-app/hooks/useMessages.ts` — Thin wrapper passing mobile supabase client
- `apps/mobile-app/hooks/useDMUnreadCounts.ts` — Thin wrapper passing mobile supabase client

Files to modify:
- `apps/mobile-app/app/(tabs)/_layout.tsx` — Add People tab
- `apps/mobile-app/hooks/index.ts` — Export new hooks
- `libs/locales/src/en.json` — Add `dms.*` i18n keys

All dependencies already installed: `@shopify/flash-list`, `react-native-fast-image`, `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-keyboard-controller`, `lucide-react-native`

---

## Order of execution (always follow this sequence)
1. Web — fix bugs
2. Web — code quality
3. Web — move to /libs
4. Mobile — build feature

---

## Web — Step by Step

### Step 1: Fix bugs — Convert people/page.tsx to server component (B1 + B6 + B7)
File: `apps/web/src/app/(app)/people/page.tsx`
- Issue: `"use client"` on page.tsx violates CLAUDE.md rule
- Fix:
  1. Remove `"use client"` and all client imports from `people/page.tsx`
  2. Create `apps/web/src/app/(app)/people/people-page-client.tsx` — uses `useAuth()` for userId, `useDMConversations(userId)` for data, renders `PeoplePanel`
  3. Server `page.tsx` becomes: `import { PeoplePageClient } from "./people-page-client"; export default function PeoplePage() { return <PeoplePageClient />; }`
  4. Delete local `formatRelativeTime` (PeoplePanel already uses `@kurate/utils`)
  5. Delete `supabase.auth.getUser()` pattern (PeoplePageClient uses `useAuth()`)
- Pattern reference: `apps/web/src/app/(app)/groups/page.tsx`

### Step 2: Fix bugs — Unsafe URL parsing (B2)
File: `apps/web/src/app/_components/people/message-bubble.tsx` (line 250)
- Issue: `new URL(message.item.url)` throws on malformed URLs
- Fix: wrap in try-catch, fallback to raw URL string
  ```tsx
  let hostname = message.item.url;
  try { hostname = new URL(message.item.url).hostname.replace("www.", ""); } catch { /* use raw url */ }
  ```

### Step 3: Fix bugs — Error handling on mutations (B3)
Files:
- `apps/web/src/app/_components/people/dm-composer.tsx`
  - In `handleSend`: check `.error` on both `messages.insert()` calls (text + logged_item paths). If error, show `toast.error(t("send_error"))`, do NOT clear `text` state.
  - In edit mode: check `.error` on `.update()`. If error, show toast, don't cancel edit.
- `apps/web/src/app/_components/people/message-bubble.tsx`
  - In `handleReact`: check `.error` on `.delete()` and `.insert()`. Show toast on failure.
  - In `handleDelete`: check `.error` on `.delete()`. Show toast on failure.
- Import `toast` from `sonner` in both files.

### Step 4: Fix bugs — Delete dead code (B4)
Delete these files:
- `apps/web/src/app/_components/person/PersonChatView.tsx`
- `apps/web/src/app/_components/person/SharedContentStrip.tsx`
- `apps/web/src/app/_libs/contacts.ts`
- `apps/web/src/app/_mocks/mock-dm-messages.ts`
- `apps/web/src/app/_mocks/mock-person-content.ts`
Do NOT delete `_mocks/mock-thread-data.ts` or `_mocks/mock-data.ts` (have other consumers).

### Step 5: Fix bugs — useUnreadCounts scalability (B5)

**Schema change** — update `supabase/migrations/01_initial_schema.sql`:
Add `last_read_at TIMESTAMPTZ` column to `conversation_members` table definition (after `updated_at`).

**Functions** — update `supabase/migrations/02_functions.sql`, add these functions:

```sql
-- Get unread DM counts for a user
CREATE OR REPLACE FUNCTION public.get_dm_unread_counts(p_user_id UUID)
RETURNS TABLE(convo_id UUID, unread_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT cm.convo_id, COUNT(m.id) AS unread_count
  FROM public.conversation_members cm
  JOIN public.conversations c ON c.id = cm.convo_id AND c.is_group = false
  JOIN public.messages m ON m.convo_id = cm.convo_id
    AND m.sender_id != p_user_id
    AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
  WHERE cm.user_id = p_user_id
  GROUP BY cm.convo_id
  HAVING COUNT(m.id) > 0;
$$;

-- Mark a conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_user_id UUID, p_convo_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.conversation_members
  SET last_read_at = now()
  WHERE user_id = p_user_id AND convo_id = p_convo_id;
$$;
```

**SQL for user to run in Supabase SQL editor:**
```sql
-- Add column
ALTER TABLE public.conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- Backfill existing members so they don't see all history as unread
UPDATE public.conversation_members SET last_read_at = now() WHERE last_read_at IS NULL;

-- Create RPC: get unread DM counts
CREATE OR REPLACE FUNCTION public.get_dm_unread_counts(p_user_id UUID)
RETURNS TABLE(convo_id UUID, unread_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT cm.convo_id, COUNT(m.id) AS unread_count
  FROM public.conversation_members cm
  JOIN public.conversations c ON c.id = cm.convo_id AND c.is_group = false
  JOIN public.messages m ON m.convo_id = cm.convo_id
    AND m.sender_id != p_user_id
    AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
  WHERE cm.user_id = p_user_id
  GROUP BY cm.convo_id
  HAVING COUNT(m.id) > 0;
$$;

-- Create RPC: mark conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_user_id UUID, p_convo_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.conversation_members
  SET last_read_at = now()
  WHERE user_id = p_user_id AND convo_id = p_convo_id;
$$;
```

**After running SQL:** run `pnpm db:types`

**Refactor** `apps/web/src/app/_libs/hooks/useUnreadCounts.ts`:
- Replace `fetchCounts` DM logic: call `supabase.rpc('get_dm_unread_counts', { p_user_id: userId })` → returns `{convo_id, unread_count}[]` directly
- Replace `markRead` for DMs: call `supabase.rpc('mark_conversation_read', { p_user_id: userId, p_convo_id: convoId })`
- Keep group post unread logic unchanged (localStorage-based)
- Keep realtime subscriptions unchanged (they increment local state for live updates)

### Step 6: Code quality — Design tokens (Q1 + Q2)
Files: `dm-chat-view.tsx`, `dm-composer.tsx`, `message-bubble.tsx`, `PeoplePanel.tsx`
- Replace `bg-white` → `bg-card` (NOT `bg-white/10`, `bg-white/20` opacity variants in own-message styling)
- Add `--radius-bubble: 16px;` to `apps/web/src/styles/tokens/radius.css` and corresponding Tailwind utility
- Replace `rounded-2xl` on message bubbles → `rounded-bubble`
- Replace `rounded-2xl` on emoji picker → `rounded-card`
- Replace `rounded-2xl` on composer textarea → `rounded-pill`
- Replace `rounded-xl` on link cards → `rounded-card`

### Step 7: Code quality — Avatar images (Q3)
Files: `people-page-client.tsx`, `dm-chat-view.tsx`, `sidebar-people-section.tsx`, `PeoplePanel.tsx`, `find-user-sheet.tsx`
- Where initials are shown, add conditional avatar image using `Avatar`/`AvatarImage`/`AvatarFallback` from `@/components/ui/avatar`
- Show image when `avatar_url` is truthy, fallback to initials

### Step 8: Code quality — Delete confirmation (Q4)
File: `apps/web/src/app/_components/people/message-bubble.tsx`
- Import `AlertDialog` from `@/components/ui/alert-dialog`
- Add `deleteConfirmOpen` state
- Delete button opens dialog instead of calling `handleDelete` directly
- Dialog confirm calls `handleDelete`
- Use i18n keys for dialog text

### Step 9: Code quality — Filter realtime (Q5)
File: `apps/web/src/app/_libs/hooks/useDMConversations.ts`
- In realtime callback (~line 116): add `const msg = payload.new as { sender_id: string }; if (msg.sender_id === userId) return;` before invalidating

### Step 10: Move to libs — useDMConversations
- Source: `apps/web/src/app/_libs/hooks/useDMConversations.ts`
- Dest: `libs/hooks/src/useDMConversations.ts`
- Change: replace `createClient()` import with `supabase: SupabaseClient<Database>` parameter on both `fetchDMConversations` and `useDMConversations`
- Export from `libs/hooks/src/index.ts`
- Update web imports to pass supabase client

### Step 11: Move to libs — useMessages
- Source: `apps/web/src/app/_libs/hooks/useMessages.ts`
- Dest: `libs/hooks/src/useMessages.ts`
- Change: add `supabase: SupabaseClient<Database>` parameter
- Export from `libs/hooks/src/index.ts`
- Update web imports in: `dm-chat-view.tsx`, `sidebar-people-section.tsx`

### Step 12: Move to libs — DM unread counts
- Extract DM-specific logic from `useUnreadCounts.ts` into `libs/hooks/src/useDMUnreadCounts.ts`
- Accept `supabase` param, use the RPC functions
- Keep group localStorage logic in web-only hook
- Web's `useUnreadCounts` becomes composition: `useDMUnreadCounts` (from libs) + local group logic
- Export from `libs/hooks/src/index.ts`
- Update all web imports

## Mobile — Step by Step

### Step 13: Add People tab to tab navigator
File: `apps/mobile-app/app/(tabs)/_layout.tsx`
Read for reference:
- `apps/mobile-app/app/(tabs)/_layout.tsx` — existing tab definitions (groups, notifications, profile)
Key design decisions from web:
- People tab sits between Groups and Notifications in nav order
- Uses MessageCircle icon from lucide-react-native
- Shows unread badge (same NotificationBadge pattern as notifications tab)
Build instructions:
- Import `MessageCircle` from `lucide-react-native`
- Add `<Tabs.Screen name="people" ...>` between groups and notifications tabs
- Tab options: `title: t("tabs.people")`, tabBarIcon renders MessageCircle with NotificationBadge overlay
- Badge count from `useDMUnreadCounts(supabase, userId).totalUnread`

### Step 14: Create DM avatar component
New file: `apps/mobile-app/components/people/dm-avatar.tsx`
Read for reference:
- `apps/mobile-app/components/ui/avatar/index.tsx` — existing Avatar component
- `apps/web/src/app/_components/people/dm-chat-view.tsx` — avatar initials pattern (line 152-155)
Key design decisions from web:
- Circle with bg-primary/10, text-primary initials as fallback
- Sizes: 40px (conversation list), 32px (chat header), 32px (find user results)
Build instructions:
- Props: `{ avatarUrl: string | null; displayName: string | null; handle: string; size?: number }`
- If `avatarUrl` truthy → `FastImage` rounded-full with given size
- Fallback → `View` with `bg-primary/10 rounded-full items-center justify-center`, `Text` with initial uppercase
- Extract initial from `displayName?.[0] ?? handle?.[0] ?? "?"`

### Step 15: Create conversation row component
New file: `apps/mobile-app/components/people/conversation-row.tsx`
Read for reference:
- `apps/web/src/app/_components/sidebar/PeoplePanel.tsx` — conversation row layout (lines 56-89)
- `apps/mobile-app/components/groups/feed-view.tsx` — Pressable row pattern
Key design decisions from web:
- Row: avatar (40px) + name (semibold 14px) + truncated last message (12px muted) + relative timestamp (10px)
- Unread: bold name + badge dot on right
- Active state: bg-accent
Build instructions:
- Props: `{ conversation: DMConversation; unreadCount: number; onPress: () => void }`
- `Pressable` with `className="flex-row items-center gap-3 px-4 py-3 active:bg-accent"`
- Left: `<DmAvatar size={40} ... />`
- Center: VStack with name (Text semibold, numberOfLines={1}) + lastMessage (Text muted, numberOfLines={1})
- Right: VStack with relative timestamp (Text 10px muted) + unread badge dot if count > 0
- Use `formatRelativeTime` from `@kurate/utils` for timestamp

### Step 16: Create conversations list
New file: `apps/mobile-app/components/people/conversations-list.tsx`
Read for reference:
- `apps/web/src/app/_components/sidebar/PeoplePanel.tsx` — list structure, empty state, loading
- `apps/mobile-app/components/groups/feed-view.tsx` — FlashList pattern with estimatedItemSize
Key design decisions from web:
- Empty state: centered text + "Start a conversation" CTA button
- Loading: 3 skeleton rows (h-16 rounded-xl)
- Header: "Messages" title + "+ New Message" button
Build instructions:
- Props: `{ userId: string }`
- Use `useDMConversations(supabase, userId)` from local wrapper hook
- Use `useDMUnreadCounts(supabase, userId)` for badge counts
- `FlashList` with `estimatedItemSize={72}`, `keyExtractor={(item) => item.id}`
- `renderItem` → `<ConversationRow onPress={() => router.push(\`/people/\${item.id}\`)} />`
- Header component: HStack with title + new message Pressable
- New message button opens FindUserSheet (Step 20)
- `ListEmptyComponent` for empty state
- Loading: 3 `Skeleton` rects

### Step 17: Create People tab screen
New file: `apps/mobile-app/app/(tabs)/people.tsx`
Read for reference:
- `apps/mobile-app/app/(tabs)/index.tsx` — screen structure pattern (SafeAreaView, auth check)
Key design decisions from web:
- Full page with conversations list, no sub-tabs
Build instructions:
- `SafeAreaView` wrapper with `className="flex-1 bg-background"`
- Get `userId` from `useAuthStore(state => state.userId)`
- Render `<ConversationsList userId={userId} />`

### Step 18: Create message bubble
New file: `apps/mobile-app/components/people/message-bubble.tsx`
Read for reference:
- `apps/web/src/app/_components/people/message-bubble.tsx` — bubble layout, reactions, link card, quote reply
- `apps/mobile-app/components/groups/comment-bubble.tsx` — own-vs-other bubble pattern, long-press
Key design decisions from web:
- Own messages: right-aligned, bg-primary text-primary-foreground, rounded-2xl rounded-br-sm
- Other messages: left-aligned, bg-surface text-foreground border border-border, rounded-2xl rounded-bl-sm
- Continuation messages (same sender): reduced top padding (pt-0.5 vs py-1)
- Quoted parent: border-l-2 with sender name + truncated text
- Link card: image (h-32) + title + description + hostname, rounded-xl
- Reactions bar: emoji pills below bubble with count
- Timestamp: 9px inside bubble bottom-right (HH:MM format)
Build instructions:
- Props: `{ message: DMMessage; currentUserId: string; convoId: string; allMessages: DMMessage[]; onReply: (msg) => void; onEdit: (msg) => void; isContinuation: boolean }`
- Long-press → show action sheet (react, reply, edit if own text, delete if own) using `Alert.alert` with buttons or a custom bottom sheet
- Reaction toggle: call supabase `.insert()` or `.delete()` on `message_reactions`
- Delete: show confirmation alert before calling supabase `.delete()` on `messages`
- Link card: `Pressable` wrapping `FastImage` + text, `onPress` → `Linking.openURL(url)`
- Hostname: wrap `new URL()` in try-catch (same fix as web Step 2)

### Step 19: Create DM composer
New file: `apps/mobile-app/components/people/dm-composer.tsx`
Read for reference:
- `apps/web/src/app/_components/people/dm-composer.tsx` — send logic, URL detection, reply/edit banners
- `apps/mobile-app/components/groups/reply-input.tsx` — TextInput + send button pattern
- `apps/mobile-app/components/groups/drop-composer.tsx` — URL detection + metadata extraction pattern
Key design decisions from web:
- Textarea auto-grows up to max-h-32
- URL detection via regex, auto-extract metadata with preview card
- Reply banner: primary accent bar + sender name + truncated text + close button
- Edit banner: similar, prefills text
- Enter to send (not applicable on mobile — use send button only)
- Send disabled when empty + no metadata
Build instructions:
- Props: `{ convoId: string; currentUserId: string; replyTo?: ReplyContext | null; onCancelReply?: () => void; editingMessage?: EditContext | null; onCancelEdit?: () => void; onMessageSent?: () => void }`
- `KeyboardAvoidingView` or use `react-native-keyboard-controller` `KeyboardStickyView`
- HStack: TextInput (flex-1, multiline, maxHeight 128) + send Pressable (rounded-full bg-primary, SendIcon)
- URL detection: same `URL_REGEX` pattern, debounced 150ms, call `useExtractMetadata` from `@kurate/hooks`
- Reply/edit banners above input with close button
- Send: insert message via supabase, check `.error`, invalidate queries
- After send: clear text, call `onMessageSent`, `onCancelReply`

### Step 20: Create find user bottom sheet
New file: `apps/mobile-app/components/people/find-user-sheet.tsx`
Read for reference:
- `apps/web/src/app/_components/people/find-user-sheet.tsx` — search logic, profile queries, create conversation
- `apps/mobile-app/components/groups/comment-thread-sheet.tsx` — BottomSheetModal pattern
Key design decisions from web:
- Search input with debounced 300ms query
- Primary query: handle/first_name/last_name ilike
- Secondary query: multi-word (first word → first_name, last word → last_name)
- Deduplicate by user id
- Show avatar + display name + @handle
- On select: POST /api/people/conversation, navigate to chat
Build instructions:
- Props: `{ open: boolean; onClose: () => void; currentUserId: string }`
- `BottomSheetModal` with `snapPoints={['60%']}`
- `BottomSheetTextInput` for search (autoFocus)
- `FlashList` for results with `estimatedItemSize={56}`
- Each result: `Pressable` → DmAvatar + name + handle
- On select: fetch or create conversation via supabase (same logic as web API route but client-side), navigate with `router.push(\`/people/\${convoId}\`)`
- For client-side conversation creation: replicate the 3-step check from `api/people/conversation/route.ts` (check existing shared DM conversations, or create new)

### Step 21: Create chat detail screen
New file: `apps/mobile-app/app/people/[convoId].tsx`
Read for reference:
- `apps/web/src/app/_components/people/dm-chat-view.tsx` — chat container, scroll handling, reply/edit state
- `apps/mobile-app/app/(tabs)/groups/[id].tsx` — dynamic route pattern, useLocalSearchParams
- `apps/mobile-app/components/groups/comment-thread-sheet.tsx` — inverted FlashList pattern
Key design decisions from web:
- Header: back chevron + avatar + other user name
- Messages: infinite scroll (load older on top), auto-scroll to bottom on new message
- Composer at bottom with reply/edit context
- markRead on mount and on new messages
Build instructions:
- Get `convoId` from `useLocalSearchParams<{ convoId: string }>()`
- Get `userId` from `useAuthStore`
- Use `useMessages(supabase, convoId)` for messages + pagination
- Use `useDMConversations(supabase, userId)` cache or fallback query for other user name
- Use `useDMUnreadCounts(supabase, userId).markRead(convoId)` on mount
- State: `replyingTo`, `editingMessage`
- Header: `Stack.Screen options={{ headerTitle: otherUserName }}` or custom header with back + DmAvatar + name
- `FlashList` with `inverted={true}` for message list (newest at bottom)
  - Reverse message array so FlashList inverted shows correct order
  - `onEndReached` → `fetchNextPage()` (loads older messages)
  - `estimatedItemSize={80}`
- `renderItem` → `<MessageBubble ... onReply={handleReply} onEdit={handleEdit} />`
- Bottom: `<DmComposer replyTo={replyingTo} editingMessage={editingMessage} ... />`

---

## Next Commands

**Web agent (fix bugs — Steps 1-5):**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Web Steps 1-5 exactly as written in the plan.

Files to fix:
- apps/web/src/app/(app)/people/page.tsx
- apps/web/src/app/_components/people/dm-composer.tsx
- apps/web/src/app/_components/people/message-bubble.tsx
- apps/web/src/app/_libs/hooks/useDMConversations.ts
- apps/web/src/app/_libs/hooks/useUnreadCounts.ts
- supabase/migrations/01_initial_schema.sql (add last_read_at column to conversation_members)
- supabase/migrations/02_functions.sql (add get_dm_unread_counts + mark_conversation_read)

Context files (read for understanding only):
- apps/web/src/app/(app)/groups/page.tsx — pattern for server component page
- apps/web/src/app/_libs/auth-context.tsx — useAuth hook
- apps/web/src/app/_components/sidebar/PeoplePanel.tsx — reuse as page client content

Files to delete:
- apps/web/src/app/_components/person/PersonChatView.tsx
- apps/web/src/app/_components/person/SharedContentStrip.tsx
- apps/web/src/app/_libs/contacts.ts
- apps/web/src/app/_mocks/mock-dm-messages.ts
- apps/web/src/app/_mocks/mock-person-content.ts

After step 5: tell user to run SQL in Supabase editor (provided in plan), then pnpm db:types.
If missing from map → explore that specific folder only, update map, proceed."

**Web agent (code quality — Steps 6-9):**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Web Steps 6-9 exactly as written in the plan.

Files to fix:
- apps/web/src/app/_components/people/dm-chat-view.tsx
- apps/web/src/app/_components/people/dm-composer.tsx
- apps/web/src/app/_components/people/message-bubble.tsx
- apps/web/src/app/_components/people/find-user-sheet.tsx
- apps/web/src/app/_components/sidebar/PeoplePanel.tsx
- apps/web/src/app/_components/sidebar/sidebar-people-section.tsx
- apps/web/src/styles/tokens/radius.css
- apps/web/src/app/(app)/people/people-page-client.tsx (created in step 1)

Context files (read for understanding only):
- apps/web/src/components/ui/avatar.tsx — Avatar component
- apps/web/src/components/ui/alert-dialog.tsx — AlertDialog component
- apps/web/src/app/_libs/hooks/useDMConversations.ts — realtime filter fix

If missing from map → explore that specific folder only, update map, proceed."

**Web agent (move to libs — Steps 10-12):**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Web Steps 10-12 exactly as written in the plan.

Files to move:
- apps/web/src/app/_libs/hooks/useDMConversations.ts → libs/hooks/src/useDMConversations.ts
- apps/web/src/app/_libs/hooks/useMessages.ts → libs/hooks/src/useMessages.ts
- DM logic from apps/web/src/app/_libs/hooks/useUnreadCounts.ts → libs/hooks/src/useDMUnreadCounts.ts

Pattern reference:
- libs/hooks/src/useComments.ts — shows supabase parameter pattern
- libs/hooks/src/useGroupFeed.ts — shows supabase parameter pattern

Files that import them (update these imports):
- apps/web/src/app/(app)/people/people-page-client.tsx
- apps/web/src/app/_components/people/dm-chat-view.tsx
- apps/web/src/app/_components/sidebar/sidebar-people-section.tsx
- apps/web/src/app/_components/sidebar/PeoplePanel.tsx

Update libs/hooks/src/index.ts with new exports.
If missing from map → explore that specific folder only, update map, proceed."

**Mobile agent (build feature — Steps 13-21):**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Mobile Steps 13-21 in order as written in the plan.

Shared libs (import from @kurate/*):
- libs/hooks/src/useDMConversations.ts — useDMConversations(supabase, userId)
- libs/hooks/src/useMessages.ts — useMessages(supabase, convoId), fetchMessages(supabase, convoId, before?)
- libs/hooks/src/useDMUnreadCounts.ts — useDMUnreadCounts(supabase, userId)
- libs/types/src/people.ts — DMConversation, DMMessage, AppProfile
- libs/query/src/keys.ts — queryKeys.people.*
- libs/locales/src/en.json — people.* namespace keys

Web reference (design + logic):
- apps/web/src/app/_components/people/dm-chat-view.tsx — chat layout, scroll handling, reply/edit state
- apps/web/src/app/_components/people/dm-composer.tsx — URL detection, send logic, reply/edit banners
- apps/web/src/app/_components/people/message-bubble.tsx — bubble layout, reactions, link cards, timestamp
- apps/web/src/app/_components/people/find-user-sheet.tsx — search profiles, create conversation
- apps/web/src/app/_components/sidebar/PeoplePanel.tsx — conversations list layout
- apps/web/src/app/api/people/conversation/route.ts — create/get conversation API

Existing mobile files (read for patterns):
- apps/mobile-app/app/(tabs)/_layout.tsx — tab navigator, add People tab
- apps/mobile-app/app/(tabs)/groups/[id].tsx — dynamic route pattern with useLocalSearchParams
- apps/mobile-app/components/groups/feed-view.tsx — FlashList infinite scroll pattern
- apps/mobile-app/components/groups/comment-bubble.tsx — chat bubble own-vs-other pattern
- apps/mobile-app/components/groups/comment-thread-sheet.tsx — BottomSheet with inverted FlashList
- apps/mobile-app/components/groups/reply-input.tsx — BottomSheetTextInput pattern
- apps/mobile-app/components/groups/drop-composer.tsx — URL detection pattern
- apps/mobile-app/components/ui/avatar/index.tsx — Avatar component
- apps/mobile-app/store/useAuthStore.ts — userId selector pattern
- apps/mobile-app/libs/supabase/client.ts — supabase client to pass to hooks
- apps/mobile-app/hooks/useGroupUnreadCounts.ts — unread badge pattern

Build People/DMs following Mobile Steps 13-21 exactly.
If missing from map → explore that specific folder only, update map, proceed."
