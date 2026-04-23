# Feature Plan: FCM Push Notifications

Last updated: 2026-04-22

## Context

The app has working in-app notifications (engagement + co-engagement) via Supabase realtime. All FCM/push notification code is commented out or doesn't exist. We're deleting all commented-out code and building push notifications from scratch.

**Bookmark notifications will be removed** (personal vault save, not needed). **Follow/unfollow does not exist** in the app. **@mention backend will be prepared** but no frontend yet.

---

## Final Notification Scenarios

| #   | Scenario            | Trigger Table                                          | Goes to `notifications` table?   | Push?                                |
| --- | ------------------- | ------------------------------------------------------ | -------------------------------- | ------------------------------------ |
| 1   | DM message          | `messages` INSERT (non-group)                          | No — DMs are ephemeral           | Yes (suppress if viewing that chat)  |
| 2   | Added to group      | `conversation_members` INSERT (group)                  | Yes — `group_invite` type        | Yes                                  |
| 3   | New post in group   | `group_posts` INSERT                                   | No — posts visible in group feed | Yes (suppress if viewing that group) |
| 4   | Like                | `likes` INSERT (existing trigger)                      | Yes — `like` type                | Yes (add FCM call)                   |
| 5   | Must-read/Recommend | `must_reads` INSERT (existing trigger)                 | Yes — `must_read` type           | Yes (add FCM call)                   |
| 6   | Comment             | `group_posts_comments` INSERT (existing trigger)       | Yes — `comment` type             | Yes (add FCM call)                   |
| 7   | Co-engagement       | likes/must_reads/comments INSERT (existing trigger)    | Yes — `co_engaged` type          | Yes (add FCM call)                   |
| 8   | @mention            | `group_posts_comments` INSERT (extend comment trigger) | Yes — `mention` type             | Yes (backend only, no frontend)      |

---

Phase 0: Firebase Project Setup (User Action — Step by Step)

Step 1: Create Firebase Project

1.  Go to https://console.firebase.google.com
2.  Click "Add project"
3.  Name it "Kurate" (or your preferred name)
4.  Disable Google Analytics (optional, not needed for FCM)
5.  Click "Create project"

Step 2: Register iOS App

1.  In Firebase Console → Project Overview → click the iOS icon (+)
2.  Bundle ID: use your app's bundle ID from app.config.ts (likely in.co.kurate.app or check ios.bundleIdentifier)
3.  Skip the nickname and App Store ID
4.  Click "Register app"
5.  Download GoogleService-Info.plist
6.  Place it at: apps/mobile-app/ios/<YourAppName>/GoogleService-Info.plist
7.  Skip the remaining Firebase setup steps (we handle this via React Native Firebase)

Step 3: Register Android App

1.  In Firebase Console → click the Android icon (+)
2.  Package name: use your app's package from app.config.ts (likely in.co.kurate.app or check android.package)
3.  Skip nickname and SHA-1 for now
4.  Click "Register app"
5.  Download google-services.json
6.  Place it at: apps/mobile-app/android/app/google-services.json

Step 4: Enable Cloud Messaging

1.  In Firebase Console → go to Project Settings (gear icon) → Cloud Messaging tab
2.  Ensure "Firebase Cloud Messaging API (V1)" is Enabled
3.  If not, click the three-dot menu → "Manage API in Google Cloud Console" → Enable it

Step 5: Generate Service Account Key (for edge function)

1.  In Firebase Console → Project Settings → Service accounts tab
2.  Click "Generate new private key"
3.  Download the JSON file
4.  Store it as a Supabase secret:
    supabase secrets set FCM_SERVICE_ACCOUNT="$(cat path/to/serviceAccountKey.json)"

Step 6: iOS APNs Key (required for iOS push)

1.  Go to https://developer.apple.com/account → Certificates, Identifiers & Profiles → Keys
2.  Create a new key, enable "Apple Push Notifications service (APNs)"
3.  Download the .p8 key file
4.  In Firebase Console → Project Settings → Cloud Messaging tab → iOS app
5.  Upload the APNs key (.p8 file), enter Key ID and Team ID

Step 7: Verify pg_net DB settings

Run in Supabase SQL editor:
SELECT current_setting('app.supabase_url', true);
SELECT current_setting('app.service_role_key', true);
If NULL, set them:
ALTER DATABASE postgres SET app.supabase_url = 'https://<your-project-ref>.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = '<your-service-role-key>';

Once these steps are done, tell me and we'll proceed with implementation.

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it "Kurate" (or your preferred name)
4. Disable Google Analytics (optional, not needed for FCM)
5. Click "Create project"

### Step 2: Register iOS App

1. In Firebase Console → Project Overview → click the iOS icon (+)
2. Bundle ID: use your app's bundle ID from `app.config.ts` (likely `in.co.kurate.app` or check `ios.bundleIdentifier`)
3. Skip the nickname and App Store ID
4. Click "Register app"
5. Download `GoogleService-Info.plist`
6. Place it at: `apps/mobile-app/ios/<YourAppName>/GoogleService-Info.plist`
7. Skip the remaining Firebase setup steps (we handle this via React Native Firebase)

### Step 3: Register Android App

1. In Firebase Console → click the Android icon (+)
2. Package name: use your app's package from `app.config.ts` (likely `in.co.kurate.app` or check `android.package`)
3. Skip nickname and SHA-1 for now
4. Click "Register app"
5. Download `google-services.json`
6. Place it at: `apps/mobile-app/android/app/google-services.json`

### Step 4: Enable Cloud Messaging

1. In Firebase Console → go to Project Settings (gear icon) → Cloud Messaging tab
2. Ensure "Firebase Cloud Messaging API (V1)" is **Enabled**
3. If not, click the three-dot menu → "Manage API in Google Cloud Console" → Enable it

### Step 5: Generate Service Account Key (for edge function)

1. In Firebase Console → Project Settings → Service accounts tab
2. Click "Generate new private key"
3. Download the JSON file
4. Store it as a Supabase secret:
   ```bash
   supabase secrets set FCM_SERVICE_ACCOUNT="$(cat path/to/serviceAccountKey.json)"
   ```

### Step 6: iOS APNs Key (required for iOS push)

1. Go to https://developer.apple.com/account → Certificates, Identifiers & Profiles → Keys
2. Create a new key, enable "Apple Push Notifications service (APNs)"
3. Download the `.p8` key file
4. In Firebase Console → Project Settings → Cloud Messaging tab → iOS app
5. Upload the APNs key (`.p8` file), enter Key ID and Team ID

### Step 7: Verify pg_net DB settings

Run in Supabase SQL editor:

```sql
SELECT current_setting('app.supabase_url', true);
SELECT current_setting('app.service_role_key', true);
```

If NULL, set them:

```sql
ALTER DATABASE postgres SET app.supabase_url = 'https://<your-project-ref>.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = '<your-service-role-key>';
```

---

## Phase 1: Database Schema Changes

**File: `supabase/migrations/01_initial_schema.sql`**

### 1A. Add to `entity_type_enum` (line ~1045)

Add `'group_invite'` and `'mention'` to the enum.

### 1B. Add `added_by` column to `conversation_members` (line ~284)

```sql
added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
```

Nullable — NULL for group creators/self-joins, populated when someone invites another.

### 1C. Add preference columns to `notification_preferences` (line ~1132)

```sql
dm_push_notifications boolean default true,
```

---

## Phase 2: SQL Functions — Cleanup + New Triggers

**File: `supabase/migrations/02_functions.sql`**

### 2A. DELETE (rebuild from scratch)

- Lines 277-289: Commented-out `notify_via_fcm()` — delete
- Line 333: Commented FCM call in `handle_like_insert()` — delete line
- Line 429: Commented FCM call in `handle_must_read_insert()` — delete line
- **Lines 490-581: Entire `handle_bookmark_insert()` + `handle_bookmark_delete()` + triggers — DELETE** (bookmarks are personal)
- Line 608: Commented FCM call in `handle_comment_insert()` — delete line
- Lines 717-769: Commented-out `handle_new_post_insert()` + trigger — delete

### 2B. CREATE new `notify_via_fcm()` helper

Accepts JSONB payload, sends async HTTP POST to edge function via `pg_net.http_post()`.

### 2C. ADD FCM calls to existing triggers

Add `PERFORM public.notify_via_fcm(...)` to:

- `handle_like_insert()` — after notification insert
- `handle_must_read_insert()` — after notification insert
- `handle_comment_insert()` — after notification insert
- `handle_must_read_broadcast()` — inside loop after insert
- `handle_co_engagement_insert()` — inside loop after insert

### 2D. CREATE `handle_new_post_push()` — NEW

Trigger on `group_posts` INSERT. Fans out to all group members except poster. **Push-only — no notification row** (posts are already visible in the group feed). Checks `new_post_notifications` preference. Sends FCM directly with group name + poster name. Client suppresses if user is already viewing that group.

### 2E. CREATE `handle_group_invite()` — NEW

Trigger on `conversation_members` INSERT. Only fires when `is_group = TRUE` and `added_by IS NOT NULL` and `role != 'owner'`. Creates `group_invite` notification row + FCM call. Message: "xyz added you to abc".

### 2F. CREATE `handle_dm_message_push()` — NEW

Trigger on `messages` INSERT. Only fires for non-group conversations (`is_group = FALSE`). Does NOT create notification row (DMs are ephemeral). Sends FCM directly with sender name + message preview. Checks `dm_push_notifications` preference.

### 2G. EXTEND `handle_comment_insert()` with @mention parsing

After existing comment notification logic, parse `comment_text` for `@handle` patterns using regex. For each resolved handle → create `mention` notification row + FCM call. Skip self-mentions and the post owner (already gets comment notification).

---

## Phase 3: Supabase Edge Function

**New file: `supabase/functions/send-push/index.ts`**

Deno edge function that:

1. Receives JSONB payload from pg_net (three shapes):
   - `{type: 'notification', notification_id, recipient_id}` — for notification-table types (like, comment, etc.)
   - `{type: 'dm_message', recipient_id, convo_id, sender_name, message_text, sender_id}` — for DMs
   - `{type: 'new_post', recipient_id, convo_id, poster_name, group_name}` — for new group posts (push-only)
2. Checks `notification_preferences.push_enabled` for recipient
3. Queries `user_devices` for recipient's FCM tokens
4. For notification-table types: queries `notifications` + `profiles` to build title/body
5. For DM: uses payload directly (sender_name as title, message_text as body)
6. Generates Google OAuth2 access token from service account (JWT signing via `jose` library)
7. Sends to FCM HTTP v1 API: `https://fcm.googleapis.com/v1/projects/{projectId}/messages:send`
8. Includes `data` payload with `type`, `notification_id`, `event_id`, `convo_id` for deep linking
9. On `UNREGISTERED` error: deletes stale token from `user_devices`

**FCM payload includes `convo_id` for ALL types** (edge function resolves it from `group_posts.convo_id` when needed) so the client never needs an extra query on tap.

---

## Phase 4: Native Build Configuration

### 4A. iOS

- User places `GoogleService-Info.plist` in `ios/` project directory
- Verify `AppDelegate` has `FirebaseApp.configure()` and APNs token forwarding
- `UIBackgroundModes: ['remote-notification']` already configured

### 4B. Android

- User places `google-services.json` in `android/app/`
- Add `com.google.gms:google-services` plugin to gradle files

### 4C. Expo Config (`app.config.ts`)

- Add `@react-native-firebase/app` and `@react-native-firebase/messaging` to plugins array

After: `pnpm prebuild:clean` → `cd ios && pod install`

---

## Phase 5: Mobile `useFCM` Hook

**File: `apps/mobile-app/hooks/useFCM.ts`** — replace no-op entirely

The hook (called in `_layout.tsx`, already wired):

1. **Request permission** — `messaging().requestPermission()` (iOS system prompt), Android 13+ `PermissionsAndroid`
2. **Get FCM token** — `messaging().getToken()`, upsert to `user_devices` table
3. **Token refresh listener** — `messaging().onTokenRefresh()` → update `user_devices`
4. **Foreground handler** — `messaging().onMessage()`:
   - If `type === 'dm_message'` and user is viewing that conversation → suppress (WhatsApp style)
   - If `type === 'new_post'` and user is viewing that group → suppress
   - Otherwise → show in-app toast/banner via `react-native-toast-message` or similar
5. **Background tap handler** — `messaging().onNotificationOpenedApp()` → navigate to relevant screen
6. **Cold start handler** — `messaging().getInitialNotification()` → navigate if app opened from push
7. **Sign-out cleanup** — delete from `user_devices` + `messaging().deleteToken()`

### Deep Linking on Tap

```
dm_message    → /people/{convo_id}
group_invite  → /groups/{convo_id}
new_post      → /groups/{convo_id}
like/must_read/comment/mention/co_engaged/must_read_broadcast → /groups/{convo_id}
```

### Foreground Suppression (DMs + Group Posts)

Track current route via a Zustand store or `usePathname()` ref. In `onMessage`:

- If `type === 'dm_message'` and user is viewing `/people/{convo_id}` → suppress
- If `type === 'new_post'` and user is viewing `/groups/{convo_id}` → suppress
- Otherwise → show in-app toast/banner

---

## Phase 6: Update Client Code for `added_by`

**Files:**

- `apps/mobile-app/app/groups/join/[invite_code].tsx` (line 138-144) — when inserting into `conversation_members`, look up `invited_by` from `group_invites` and pass as `added_by`
- `apps/mobile-app/components/groups/invite-member-sheet.tsx` — if direct member addition exists, pass `added_by: auth.uid()`
- `apps/web/src/app/(app)/groups/join/[invite_code]/page.tsx` — same pattern for web

---

## Phase 7: Update Notification Item for New Types

**File: `apps/mobile-app/components/notifications/notification-item.tsx`**

- Add `'group_invite'` and `'mention'` to `NAVIGABLE_EVENTS`
- Handle `group_invite` navigation: `event_id` is `convo_id` (navigate directly to `/groups/{event_id}`)
- Fix: currently uses `Image` from `react-native` (line 2) — should use `FastImage`

---

## Phase 8: Localization

**File: `libs/locales/src/en.json`**

Add:

```json
"event_group_invite": "added you to a group",
"event_mention": "mentioned you in a comment"
```

---

## Phase 9: Background Handler

**File: `apps/mobile-app/index.js`**

Uncomment and restore Firebase background message handler:

```javascript
const { getMessaging, setBackgroundMessageHandler } = require("@react-native-firebase/messaging");
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  // OS handles display automatically, no custom logic needed
});
```

---

## Implementation Order

1. **Phase 0** — User provides Firebase credentials (blocking) ✅ DONE
2. **Phase 1** — Schema changes → user runs SQL in Supabase editor
3. **Phase 2** — Function changes → user runs SQL in Supabase editor → `pnpm db:types`
4. **Phase 3** — Create edge function → deploy with `supabase functions deploy send-push`
5. **Phase 4** — Native config → `pnpm prebuild:clean`
6. **Phase 5** — Implement `useFCM` hook
7. **Phase 6** — Update join flow for `added_by`
8. **Phase 7** — Update notification item component
9. **Phase 8** — Add localization strings
10. **Phase 9** — Enable background handler

---

## Verification

1. **DB triggers**: Insert test rows in `messages`, `group_posts`, `conversation_members` → verify notification rows appear and edge function receives requests
2. **Edge function**: Check Supabase function logs for successful FCM sends
3. **Token registration**: Sign in on device → verify `user_devices` has FCM token
4. **Push delivery**: Send test notification from Firebase Console → verify device receives it
5. **Deep linking**: Tap notification → verify correct screen navigation
6. **DM suppression**: Open a DM chat → have someone send a message → verify no push banner while viewing
7. **Preferences**: Toggle `push_enabled` off → verify no pushes sent
8. **Token cleanup**: Sign out → verify token removed from `user_devices`

---

## Critical Files

| File                                                             | Action                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/01_initial_schema.sql`                      | Add enum values, `added_by` column, preference column                                                                      |
| `supabase/migrations/02_functions.sql`                           | Delete bookmark triggers, delete commented code, add FCM helper, add FCM calls to existing triggers, create 3 new triggers |
| `supabase/functions/send-push/index.ts`                          | NEW — Edge function for FCM delivery                                                                                       |
| `apps/mobile-app/hooks/useFCM.ts`                                | Replace no-op with full FCM implementation                                                                                 |
| `apps/mobile-app/index.js`                                       | Uncomment background handler                                                                                               |
| `apps/mobile-app/app/groups/join/[invite_code].tsx`              | Pass `added_by` on join                                                                                                    |
| `apps/mobile-app/components/notifications/notification-item.tsx` | Add new types, fix FastImage                                                                                               |
| `libs/locales/src/en.json`                                       | Add localization keys                                                                                                      |
| `apps/mobile-app/app.config.ts`                                  | Add Firebase plugins                                                                                                       |
