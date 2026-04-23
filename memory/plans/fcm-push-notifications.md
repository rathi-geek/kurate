# FCM Push Notifications — Status & Setup Guide

## Status: Backend complete, mobile client pending Firebase config files

---

## What's done

### Database (applied in Supabase SQL editor)
- `entity_type_enum` — added `group_invite`, `mention`
- `conversation_members` — added `added_by` (UUID, nullable), `muted_until` (TIMESTAMPTZ, nullable)
- `notification_preferences` — added `dm_push_notifications` (boolean, default true)
- Deleted bookmark notification triggers (bookmarks = personal vault saves)
- `notify_via_fcm(JSONB)` — reads URL/key from Supabase Vault, calls edge function via `net.http_post()`
- FCM calls added to: like, must_read, comment, must_read_broadcast, co_engagement triggers
- New triggers: `handle_new_post_push()`, `handle_group_invite()`, `handle_dm_message_push()`
- `handle_comment_insert()` extended with @mention parsing (backend-ready, no frontend)
- DM + new_post triggers check `muted_until` before sending

### Supabase Vault secrets (set in SQL editor)
```sql
SELECT vault.create_secret('https://eavlskuuyzzttyqsfsqc.supabase.co/functions/v1/send-push', 'fcm_push_url');
SELECT vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
```
- **Why vault:** Supabase hosted blocks `ALTER DATABASE SET app.*`. Vault encrypts secrets.
- **Setup docs:** `supabase/migrations/03_seed.sql` (top of file)

### Edge function: `supabase/functions/send-push/index.ts`
- Deployed: `pnpm dlx supabase functions deploy send-push`
- 3 payload types: `notification`, `dm_message`, `new_post`
- Collapse keys (WhatsApp-style DM stacking)
- Badge count from unread notifications
- Per-conversation mute check
- Stale token cleanup
- **Requires:** `FCM_SERVICE_ACCOUNT` secret in Dashboard → Edge Functions → Secrets

### Migration files updated
- `01_initial_schema.sql` — enum, added_by, muted_until, dm_push_notifications
- `02_functions.sql` — all triggers, vault-based notify_via_fcm
- `03_seed.sql` — vault setup instructions

---

## What's pending

### 1. Firebase config files (blocking)
- Place `GoogleService-Info.plist` at `apps/mobile-app/GoogleService-Info.plist`
- Place `google-services.json` at `apps/mobile-app/google-services.json`
- Run `npx expo prebuild --clean`

### 2. iOS APNs key
- Create APNs key in Apple Developer portal → Keys
- Upload `.p8` file to Firebase Console → Cloud Messaging → iOS app

### 3. Mobile code to re-apply (reverted by user/linter)

| File | Change needed |
|---|---|
| `hooks/useFCM.ts` | Replace no-op with full implementation (permission, token, foreground suppression, deep linking, sign-out cleanup) |
| `index.js` | Uncomment Firebase background handler |
| `components/groups/invite-member-sheet.tsx` | Add `added_by: userId` to conversation_members insert |
| `components/notifications/notification-item.tsx` | Add `group_invite`/`mention` to NAVIGABLE_EVENTS, use FastImage, handle group_invite navigation |
| `libs/locales/src/en.json` | Add `event_group_invite`, `event_co_engaged`, update `event_mention` |
| `app/(tabs)/groups/[id].tsx` | Read `scrollTo`/`openComments` from useLocalSearchParams |
| `components/groups/feed-view.tsx` | Accept + pass `openCommentsForDropId` prop |
| `components/groups/feed-list-parts.tsx` | Pass `autoOpenComments` to FeedDropCard |
| `components/groups/feed-drop-card.tsx` | Accept `autoOpenComments`, auto-open CommentThreadSheet |

### 4. After config files placed
- `pnpm db:types`
- `npx expo run:ios --device` (FCM requires physical device)

---

## Notification scenarios

| # | Scenario | notifications table? | Push? |
|---|---|---|---|
| 1 | DM message | No (ephemeral) | Yes, collapse per convo |
| 2 | Added to group (by username) | Yes (group_invite) | Yes |
| 3 | New post in group | No (visible in feed) | Yes, collapse per group |
| 4 | Like | Yes | Yes |
| 5 | Must-read/Recommend | Yes | Yes |
| 6 | Comment | Yes | Yes |
| 7 | Co-engagement | Yes (co_engaged) | Yes |
| 8 | @mention | Yes (mention) | Backend only, no frontend |

---

## Key architecture decisions
- **Firebase FCM over Expo Notifications** — no middleman, reliable at scale
- **DM + new_post = push-only** — no notification table row
- **Email invite joins = no notification** — only direct username adds (added_by != NULL)
- **Client-side foreground suppression** — suppress if viewing that chat/group
- **`net.http_post()` not `pg_net.http_post()`** — Supabase hosted uses `net` schema
- **Supabase Vault** — secrets not hardcoded in function definitions

---

## If resetting DB or setting up new environment
1. Run all migration files (01, 02, 03)
2. Set vault secrets (see `03_seed.sql` top for exact commands)
3. Set `FCM_SERVICE_ACCOUNT` in Edge Functions → Secrets
4. Deploy edge function: `pnpm dlx supabase functions deploy send-push`
