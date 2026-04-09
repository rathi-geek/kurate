# Feature Plan: Notifications

Last updated: 2026-04-09

## Feature Audit: Notifications

### 1. What exists in web today

**Files:**
- `apps/web/src/app/(app)/notifications/page.tsx` — full-page notification list
- `apps/web/src/app/_components/notifications/notification-panel.tsx` — right-side sheet (sidebar bell)
- `apps/web/src/app/_components/notifications/notification-item.tsx` — single notification row
- `apps/web/src/app/_libs/hooks/useNotifications.ts` — fetch, realtime, mark read/all read
- `apps/web/src/app/_components/app-shell.tsx` — single useNotifications instance at app level
- `apps/web/src/app/_components/sidebar/sidebar.tsx` — bell icon + NotificationPanel
- `apps/web/src/app/_components/sidebar/mobile-bottom-tab.tsx` — bell icon + unread dot

**Flow:**
1. AppShell creates one `useNotifications(userId)`, passes to sidebar + mobile tab
2. Desktop: bell in sidebar opens NotificationPanel (Sheet)
3. Mobile web: `/notifications` full page via bottom tab
4. Both auto-mark-all-read after 1.5s
5. Each item: avatar (circle, letter fallback), actor name, event label, relative time
6. Click → markRead → Supabase lookup group_posts.convo_id → navigate to group#drop-{eventId}
7. Realtime: Postgres changes on INSERT invalidates query

**Database (3 tables):**
- `notifications` — id, recipient_id, actor_id, event_id, event_type, is_read, message, created_at
- `notification_actors` — junction for multi-actor aggregation
- `notification_preferences` — per-type toggles + email/push enabled

**Event types with labels:** like, must_read, comment, new_post, must_read_broadcast, also_must_read, also_commented
**Event types without labels:** bookmark, follow, mention, co_engaged

### 2. Bugs & issues to fix before mobile replicates

🔴 **Must fix:**
1. **Hardcoded English in notification-item.tsx** — EVENT_LABELS is plain object (line 12-20), not using @kurate/locales
2. **Hardcoded English in notifications/page.tsx** — "Notifications" (line 34), "Mark all read" (line 40), "No notifications yet" (line 63), empty state subtitle (line 65)
3. **Hardcoded English in notification-panel.tsx** — "Mark all read" (line 64), "No notifications yet" (line 92), empty state subtitle (line 93)
4. **Hardcoded "Notifications" in sidebar.tsx** — Line 224, despite having useTranslations("sidebar") available
5. **Zero notification i18n keys in en.json** — No notifications.* namespace exists

🟡 **Nice to fix:**
1. **Missing event labels** — bookmark, follow, mention types exist in DB preferences but no labels
2. **Multi-actor display incomplete** — Only first actor shown. "John liked" instead of "John and 2 others liked"
3. **No notification preferences UI** — table exists but no settings screen

### 3. Code quality issues

🟣 **Should fix:**
1. **Module-scope Supabase client in notification-item.tsx** — `const supabase = createClient()` at line 10, should be in hook or inside handler
2. **Navigation logic in component** — handleClick does Supabase query to resolve convo_id — should be in hook
3. **Duplicated auto-mark-read timer** — Identical 1.5s setTimeout pattern in both page.tsx and panel.tsx
4. **Types exported from hook file** — Notification/NotificationActor types in useNotifications.ts — should be in @kurate/types

### 4. What should move to /libs

| Source | Destination | Reason |
|---|---|---|
| `Notification`, `NotificationActor` types | `libs/types/src/notifications.ts` | Mobile needs same types |
| EVENT_LABELS | `libs/locales/src/en.json` as `notifications.*` keys | Both platforms need same labels, must be localized |

### 5. What mobile needs to build fresh

- `apps/mobile-app/hooks/useNotifications.ts` — fetch + realtime + mark read
- `apps/mobile-app/app/(tabs)/notifications.tsx` — notification screen
- `apps/mobile-app/components/notifications/notification-item.tsx` — notification row
- Tab bar integration — unread badge on bell icon
- Push notification deep linking (useFCM already exists)

---

## Order of execution

1. Web — fix bugs (i18n all hardcoded strings)
2. Web — code quality (extract types, deduplicate timer, fix module-scope client)
3. Web — move to /libs (types, locales)
4. Mobile — build notification feature

---

## Web — Step by Step

### Step 1: Add notification i18n keys to en.json

File: `libs/locales/src/en.json`

Add namespace:
```json
"notifications": {
  "title": "Notifications",
  "mark_all_read": "Mark all read",
  "empty_title": "No notifications yet",
  "empty_subtitle": "You'll see activity from your groups here",
  "event_like": "liked your post",
  "event_must_read": "recommended your post",
  "event_comment": "commented on your post",
  "event_new_post": "shared a new post",
  "event_must_read_broadcast": "recommended a post",
  "event_also_must_read": "also recommended this post",
  "event_also_commented": "also commented on this post",
  "event_bookmark": "bookmarked your post",
  "event_follow": "started following you",
  "event_mention": "mentioned you"
}
```

Also add to sidebar namespace: `"notifications": "Notifications"`

### Step 2: Replace hardcoded strings in notification-item.tsx

File: `apps/web/src/app/_components/notifications/notification-item.tsx`

- Remove `EVENT_LABELS` constant
- Add `useTranslations("notifications")` from `@/i18n/use-translations`
- Replace label lookup: `const label = t(\`event_${notification.event_type}\`) ?? notification.message ?? notification.event_type`
- Move Supabase call out of module scope — import createClient inside handleClick

### Step 3: Replace hardcoded strings in notifications/page.tsx

File: `apps/web/src/app/(app)/notifications/page.tsx`

- Add `const t = useTranslations("notifications")`
- Replace: "Notifications" → `t("title")`, "Mark all read" → `t("mark_all_read")`, empty state strings → `t("empty_title")`, `t("empty_subtitle")`

### Step 4: Replace hardcoded strings in notification-panel.tsx

File: `apps/web/src/app/_components/notifications/notification-panel.tsx`

- Add `useTranslations("notifications")`
- Replace same hardcoded strings as page.tsx

### Step 5: Fix sidebar hardcoded "Notifications"

File: `apps/web/src/app/_components/sidebar/sidebar.tsx`

- Line 207 title: `"Notifications"` → `t("notifications")`
- Line 224 span: `"Notifications"` → `t("notifications")`

### Step 6: Extract types to @kurate/types

Move from `apps/web/src/app/_libs/hooks/useNotifications.ts`:
- `NotificationActor` type → `libs/types/src/notifications.ts`
- `Notification` type → `libs/types/src/notifications.ts`
- Export from `libs/types/src/index.ts`
- Update imports in: useNotifications.ts, notification-panel.tsx, notification-item.tsx, sidebar.tsx

### Step 7: Deduplicate auto-mark-read timer

Create: `apps/web/src/app/_libs/hooks/useAutoMarkRead.ts`
```ts
export function useAutoMarkRead(active: boolean, unreadCount: number, markAllRead: () => Promise<void>, delay = 1500)
```
- Contains the timer ref + useEffect logic
- Replace in both notifications/page.tsx and notification-panel.tsx

### Step 8: Fix module-scope Supabase in notification-item.tsx

File: `apps/web/src/app/_components/notifications/notification-item.tsx`

- Remove `const supabase = createClient()` at line 10
- Call `createClient()` inside `handleClick()` instead

---

## Mobile — Step by Step

### Step 1: Add useNotifications hook

New file: `apps/mobile-app/hooks/useNotifications.ts`
Read for reference:
- `apps/web/src/app/_libs/hooks/useNotifications.ts` — query shape, realtime pattern, mark read logic
- `apps/mobile-app/libs/supabase/client.ts` — mobile Supabase client
- `libs/query/src/keys.ts` — queryKeys.notifications
- `libs/types/src/notifications.ts` — Notification, NotificationActor types (after web step 6)

Build instructions:
- Fetch notifications with same Supabase query shape as web
- Avatar URL: `${EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}?t=${Date.now()}`
- Realtime subscription on notifications table INSERT
- markRead(id) and markAllRead() mutations
- Return: `{ notifications, unreadCount, isLoading, markRead, markAllRead }`

### Step 2: Add notification item component

New file: `apps/mobile-app/components/notifications/notification-item.tsx`
Read for reference:
- `apps/web/src/app/_components/notifications/notification-item.tsx` — layout: avatar (36px circle, letter fallback), name + event label, relative time
- `apps/mobile-app/CLAUDE.md` — NativeWind classes, component rules

Key design decisions from web:
- Avatar: 36px circle, `bg-primary/10`, letter fallback `text-primary text-sm font-bold`
- Unread dot: 10px `bg-primary` circle absolute positioned top-right of avatar
- Text: `<Text fontSemibold>{name}</Text> <Text muted>{eventLabel}</Text>`
- Timestamp: `text-muted-foreground text-xs` below
- Row: `px-4 py-3`, full-width Pressable

Build instructions:
- Use `HStack`, `VStack`, `Text`, `Pressable` from `@/components/ui/`
- Avatar with RN `Image` + letter fallback
- Event labels via `useLocalization` → `t('notifications.event_like')` etc.
- Relative time with `date-fns` `formatDistanceToNow`
- onPress: markRead → navigate to group page (use `expo-router` `router.push`)

### Step 3: Add notification screen

New file: `apps/mobile-app/app/(tabs)/notifications.tsx`
Read for reference:
- `apps/web/src/app/(app)/notifications/page.tsx` — layout: header with title + mark all read, scrollable list, loading skeleton, empty state

Key design decisions from web:
- Header: "Notifications" title left, "Mark all read" button right (only if unreadCount > 0)
- Loading: 3 skeleton rows (circle + 2 lines)
- Empty: centered icon-less "No notifications yet" + subtitle
- Auto-mark-all-read after 1.5s

Build instructions:
- Use `FlatList` for notification list (not ScrollView + map)
- `SafeAreaView` with `bg-background`
- Header: `HStack` with title `Text` + mark all read `Pressable`
- Loading skeleton with animated opacity
- Empty state: `VStack` centered with `useLocalization` strings
- useEffect with 1.5s timer for auto-mark-all-read

### Step 4: Add notifications tab to navigation

File: `apps/mobile-app/app/(tabs)/_layout.tsx`

- Add `Tabs.Screen` for `notifications`
- Icon: `Bell` from `lucide-react-native`
- Badge: show unread count dot (use `useNotifications` in layout or pass via context)
- Tab label via `useLocalization` → `t('notifications.title')`

### Step 5: Wire up push notification deep links

File: `apps/mobile-app/hooks/useFCM.ts` (existing)

- On notification tap → extract event_type + event_id from payload
- Navigate: lookup group_posts.convo_id → `router.push` to group screen
- Match same routing logic as web notification-item handleClick

### Step 6: Add translation keys

File: `libs/locales/src/en.json`

- Verify all notification keys from web Step 1 exist
- Add any mobile-specific keys if needed (e.g. "notifications.push_permission_title")

---

## Next Commands

**Web agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Web Steps 1-8 exactly as written in the plan.

Files to fix:
- `libs/locales/src/en.json` — add notification i18n keys
- `apps/web/src/app/_components/notifications/notification-item.tsx` — replace EVENT_LABELS with i18n, fix module-scope client
- `apps/web/src/app/(app)/notifications/page.tsx` — replace hardcoded strings with i18n, use useAutoMarkRead
- `apps/web/src/app/_components/notifications/notification-panel.tsx` — replace hardcoded strings with i18n, use useAutoMarkRead
- `apps/web/src/app/_components/sidebar/sidebar.tsx` — fix hardcoded 'Notifications' on line 207 and 224

New files to create:
- `libs/types/src/notifications.ts` — Notification + NotificationActor types
- `apps/web/src/app/_libs/hooks/useAutoMarkRead.ts` — shared auto-mark-read timer hook

Files to update imports in:
- `apps/web/src/app/_libs/hooks/useNotifications.ts` — import types from @kurate/types
- `apps/web/src/app/_components/notifications/notification-panel.tsx` — import types from @kurate/types
- `apps/web/src/app/_components/notifications/notification-item.tsx` — import types from @kurate/types
- `apps/web/src/app/_components/sidebar/sidebar.tsx` — import types from @kurate/types
- `libs/types/src/index.ts` — export notifications types

Context files (read for understanding only):
- `apps/web/src/app/_libs/hooks/useNotifications.ts` — current types + fetch logic
- `apps/web/src/i18n/use-translations.ts` — useTranslations pattern

Run `pnpm lint` and `pnpm type:check` when done."

**Mobile agent:**
"Read memory/CODEBASE_MAP.md and memory/FEATURE_PLAN.md.
Follow Mobile Steps 1-6 in order as written in the plan.

Shared libs:
- `libs/query/src/keys.ts` — queryKeys.notifications
- `libs/types/src/notifications.ts` — Notification, NotificationActor types
- `libs/locales/src/en.json` — notification translation keys
- `libs/types/src/database.types.ts` — DB types

Web reference (design + logic):
- `apps/web/src/app/(app)/notifications/page.tsx` — page layout, loading, empty state
- `apps/web/src/app/_components/notifications/notification-item.tsx` — item layout, navigation logic
- `apps/web/src/app/_libs/hooks/useNotifications.ts` — fetch query shape, realtime, mark read

Existing mobile files:
- `apps/mobile-app/app/(tabs)/_layout.tsx` — add notifications tab here
- `apps/mobile-app/hooks/useFCM.ts` — push notification handler (wire deep links)
- `apps/mobile-app/libs/supabase/client.ts` — mobile Supabase client
- `apps/mobile-app/store/useAuthStore.ts` — auth state (userId)
- `apps/mobile-app/context/LocalizationContext.tsx` — useLocalization

IMPORTANT:
- UI components are custom CVA + NativeWind wrappers at @/components/ui/ (Text, VStack, HStack, Pressable, etc). Import from @/components/ui/text, @/components/ui/vstack, etc.
- Use FlatList for notification list, not ScrollView + map
- Avatar URLs need cache-busting ?t=timestamp
- All strings via useLocalization — import from @/context

Run `pnpm lint` and `pnpm format` when done."
