# Analytics Events Reference

**Provider:** Mixpanel
**Utility:** `track()` from `apps/web/src/app/_libs/utils/analytics.ts`
**Total events:** 28

Events are only fired after Mixpanel is initialised (no-op before that). Properties listed as `—` mean the event is fired with no payload.

---

## Manual Testing Checklist

Open Mixpanel Live View, then trigger each event below. Check the box once confirmed in Mixpanel.

| # | Event | How to trigger | Checked? |
|---|---|---|---|
| 1 | `user_logged_in` | Log out → log back in via Google | [ ] |
| 2 | `onboarding_completed` | Complete the onboarding flow (new account or reset) | [ ] |
| 3 | `profile_edited` | Edit profile → save | [ ] |
| 4 | `interests_updated` | Edit profile → save (fires alongside profile_edited) | [ ] |
| 5 | `vault_view` | Switch to Vault tab on home page | [ ] |
| 6 | `discover_view` | Switch to Discover tab on home page | [ ] |
| 7 | `group_feed_view` | Open any group → land on Feed view | [ ] |
| 8 | `group_library_view` | Inside a group → switch to Library tab | [ ] |
| 9 | `thoughts_bucket_view` | Vault → Thoughts tab → tap a bucket chip (e.g. "work") | [ ] |
| 10 | `thoughts_all_chats_view` | Vault → Thoughts tab → "All" view active | [ ] |
| 11 | `links_thoughts_switched` | Vault → toggle between Links and Thoughts sub-tabs | [ ] |
| 12 | `vault_link_saved` | Paste a URL in vault input → hit send | [ ] |
| 13 | `vault_link_save_failed` | Paste a URL → send with network off (DevTools → Offline) | [ ] |
| 14 | `link_opened` (vault) | Click a vault card to open the link | [ ] |
| 15 | `link_opened` (group_feed) | Click a link card in a group feed post | [ ] |
| 16 | `link_opened` (personal_chat) | Click a shared link in a DM conversation | [ ] |
| 17 | `link_opened` (discovery) | Click a discovery card on Discover tab | [ ] |
| 18 | `link_marked_read` | Mark an unread vault item as read | [ ] |
| 19 | `link_deleted` | Delete a vault item | [ ] |
| 20 | `vault_filtered` | Click a filter chip in vault (time, content type, or read status) | [ ] |
| 21 | `vault_searched` | Type a search query in vault search | [ ] |
| 22 | `group_created` | Create a new group | [ ] |
| 23 | `group_post_created` | Post a link to a group feed | [ ] |
| 24 | `group_text_post_created` | Post a text-only message to a group feed | [ ] |
| 25 | `item_saved_from_group` | Tap bookmark icon on a group post to save to vault | [ ] |
| 26 | `reaction_added` | Add a like or must-read reaction to a group post | [ ] |
| 27 | `reaction_removed` | Remove a reaction from a group post | [ ] |
| 28 | `comment_thread_opened` | Click the comment icon on a group post | [ ] |
| 29 | `comment_posted` | Submit a comment on a group post | [ ] |
| 30 | `discovery_view_in_group` | Click "view in group" on a discovery item in group feed | [ ] |
| 31 | `dm_created` | Start a new DM from the People tab | [ ] |

---

## User / Auth

### `user_logged_in`
Fired when a user successfully signs in via Google OAuth.

| Property | Type | Values | Description |
|---|---|---|---|
| `method` | `string` | `"google"` | Auth provider used |

**File:** `apps/web/src/app/_libs/auth-context.tsx`
**Trigger:** Supabase `SIGNED_IN` auth state change event

---

### `onboarding_completed`
Fired when the user finishes the onboarding flow and saves their interests.

| Property | Type | Values | Description |
|---|---|---|---|
| `interests_selected` | `number` | any | Number of interests the user selected |

**File:** `apps/web/src/app/_libs/hooks/useProfileUpsert.ts`
**Trigger:** On successful profile upsert during the onboarding flow

---

### `profile_edited`
Fired when the user saves changes to their profile (name, handle, bio, avatar).

| Property | Type | Values | Description |
|---|---|---|---|
| `fields_changed` | `string[]` | `["first_name", "last_name", "handle", "bio"]` | Which fields were modified |

**File:** `apps/web/src/app/_components/profile/ProfileEditModal.tsx`
**Trigger:** On successful profile save — always fires alongside `interests_updated`

---

### `interests_updated`
Fired alongside `profile_edited` when the user saves their profile (even if interests didn't change).

| Property | Type | Values | Description |
|---|---|---|---|
| `count` | `number` | any | Total number of interests selected after save |

**File:** `apps/web/src/app/_components/profile/ProfileEditModal.tsx`
**Trigger:** On successful profile save

---

## Navigation / Views

### `vault_view`
Fired when the user lands on or switches to the Vault tab on the home page.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/home/home-page-client.tsx`
**Trigger:** `activeTab` state changes to `HomeTab.VAULT` — deduplicated with a ref so it only fires once per tab switch

---

### `discover_view`
Fired when the user lands on or switches to the Discover tab on the home page.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/home/home-page-client.tsx`
**Trigger:** `activeTab` state changes to `HomeTab.DISCOVER` — deduplicated per tab switch

---

### `group_feed_view`
Fired when the user enters or switches to the Feed view inside a group.

| Property | Type | Values | Description |
|---|---|---|---|
| `group_id` | `string` | UUID | The group being viewed |
| `view` | `string` | `"feed"` | Current view name |

**File:** `apps/web/src/app/(app)/groups/[id]/GroupPageClient.tsx`
**Trigger:** `view` state changes to `GroupView.Feed` (skipped if on Info view)

---

### `group_library_view`
Fired when the user switches to the Library view inside a group.

| Property | Type | Values | Description |
|---|---|---|---|
| `group_id` | `string` | UUID | The group being viewed |
| `view` | `string` | `"library"` | Current view name |

**File:** `apps/web/src/app/(app)/groups/[id]/GroupPageClient.tsx`
**Trigger:** `view` state changes to `GroupView.Library`

---

### `thoughts_bucket_view`
Fired when the user selects a specific thought bucket inside the Thoughts tab.

| Property | Type | Values | Description |
|---|---|---|---|
| `bucket` | `ThoughtBucket` | e.g. `"work"`, `"personal"` | The bucket selected |

**File:** `apps/web/src/app/_components/home/vault-tab-view.tsx`
**Trigger:** User taps a bucket chip — only fires if the bucket changes (no re-fire for same bucket)

---

### `thoughts_all_chats_view`
Fired when the Thoughts tab is open and the "All" view is active.

| Property | Type | Values | Description |
|---|---|---|---|
| `bucket` | `string` | `"all"` | Hardcoded — indicates the unfiltered view |

**File:** `apps/web/src/app/_components/home/vault-tab-view.tsx`
**Trigger:** `useEffect` when `vaultTab === VaultTab.THOUGHTS && thoughtsViewAll === true`

---

### `links_thoughts_switched`
Fired when the user manually toggles between the Links sub-tab and the Thoughts sub-tab inside the Vault, or when a thought is added and the view auto-switches.

| Property | Type | Values | Description |
|---|---|---|---|
| `from` | `VaultTab` | `"links"`, `"thoughts"` | Previous active tab |
| `to` | `VaultTab` | `"links"`, `"thoughts"` | New active tab |
| `source` | `string` | `"manual"`, `"auto_thought_added"` | What triggered the switch |

**File:** `apps/web/src/app/_components/home/vault-tab-view.tsx` + `apps/web/src/app/_libs/hooks/useVaultComposer.ts`
**Trigger:** Manual tab toggle OR auto-switch after a thought is saved

---

## Vault / Content

### `vault_link_saved`
Fired immediately when the user submits a link to their vault (at the point of user intent, before Supabase confirmation).

| Property | Type | Values | Description |
|---|---|---|---|
| `content_type` | `string` | `"article"`, `"video"`, `"podcast"`, `"link"` | Detected content type |
| `source` | `string \| null` | domain name e.g. `"twitter.com"` | Extracted source from metadata |
| `has_tags` | `boolean` | `true`/`false` | Whether extracted metadata included tags |
| `is_duplicate` | `boolean` | `false` | Always false (Dexie-level dedup returns early before this fires) |

**File:** `apps/web/src/app/_libs/hooks/useVaultComposer.ts`
**Trigger:** Fires synchronously after the Dexie pending write, before the async Supabase save begins

---

### `vault_link_save_failed`
Fired when a vault link save fails (Supabase error, network timeout, etc.).

| Property | Type | Values | Description |
|---|---|---|---|
| `url` | `string` | any URL | The URL that failed to save |

**File:** `apps/web/src/app/_libs/hooks/useVaultComposer.ts`
**Trigger:** `.catch()` handler on the `onSend()` promise — fires when the Supabase save throws

---

### `link_opened`
Fired whenever a user opens a link in a new tab. The `context` property tells you which surface the link was opened from.

| Property | Type | Values | Description |
|---|---|---|---|
| `context` | `string` | `"vault"`, `"group_feed"`, `"personal_chat"`, `"discovery"` | Surface where the link was opened |
| `content_type` | `string` | `"article"`, `"video"`, `"podcast"` | Content type of the item |
| `source` | `string \| null` | domain e.g. `"medium.com"` | Extracted metadata source |

**Files & contexts:**

| File | Context value | Trigger |
|---|---|---|
| `apps/web/src/app/_components/vault/VaultCard.tsx` | `"vault"` | User clicks the card (image or title area) in their vault |
| `apps/web/src/app/_components/groups/feed-share-card.tsx` | `"group_feed"` | User clicks the preview image or title in a group feed post |
| `apps/web/src/app/_components/people/message-bubble.tsx` | `"personal_chat"` | User clicks a shared link card in a DM conversation |
| `apps/web/src/app/_components/home/vault-discovery-card.tsx` | `"discovery"` | User clicks a discovery card on the Discover tab |

---

### `link_marked_read`
Fired when the user marks a vault item as read (only when marking as read, not unread).

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/vault/VaultCard.tsx`
**Trigger:** User clicks the read toggle button — fires only when `!item.is_read` (i.e. toggling from unread → read)

---

### `link_deleted`
Fired when the user deletes a vault item.

| Property | Type | Values | Description |
|---|---|---|---|
| `content_type` | `string` | `"article"`, `"video"`, `"podcast"` | Content type of the deleted item |

**File:** `apps/web/src/app/_components/vault/VaultCard.tsx`
**Trigger:** User clicks the delete button — fires before the confirmation modal appears (or immediately if skip-confirm is enabled)

---

### `vault_filtered`
Fired when the user activates a filter in the vault (not when resetting to "all").

| Property | Type | Values | Description |
|---|---|---|---|
| `filter_type` | `string` | `"time"`, `"contentType"`, `"readStatus"` | Which filter dimension was changed |

**File:** `apps/web/src/app/_components/vault/VaultFilters.tsx`
**Trigger:** User clicks a filter chip — only fires when the chip is being activated (`!isActive`), not when toggled off

---

### `vault_searched`
Fired when the user searches inside their vault (debounced).

| Property | Type | Values | Description |
|---|---|---|---|
| `query_length` | `number` | any | Character count of the trimmed search query |

**File:** `apps/web/src/app/_components/vault/VaultSearch.tsx`
**Trigger:** Debounced input change — only fires if the trimmed query is non-empty

---

## Groups / Social

### `group_created`
Fired when a user successfully creates a new group.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/groups/create-group-dialog.tsx`
**Trigger:** On successful Supabase insert + member upsert, just before navigating to the invite flow

---

### `group_post_created`
Fired when a user posts a link to a group feed.

| Property | Type | Values | Description |
|---|---|---|---|
| `content_type` | `string` | `"article"`, `"video"`, `"podcast"` | Detected content type of the shared link |

**File:** `libs/hooks/src/useGroupComposer.ts`
**Trigger:** `onTrack` callback after the group post is inserted into the DB

---

### `group_text_post_created`
Fired when a user posts a text-only message (no link) to a group feed.

| Property | Description |
|---|---|
| — | No properties |

**File:** `libs/hooks/src/useGroupComposer.ts`
**Trigger:** `onTrack` callback after a text-only group post is inserted into the DB

---

### `item_saved_from_group`
Fired when a user saves a group post item to their personal vault using the bookmark icon in the engagement bar.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/groups/engagement-bar.tsx`
**Trigger:** `toggleVault()` when `willSave === true` (not fired on unsave)

---

### `reaction_added`
Fired when a user adds a reaction to a group post.

| Property | Type | Values | Description |
|---|---|---|---|
| `type` | `string` | `"like"`, `"must_read"` | Reaction type |
| `source` | `string` | `"group_feed"`, `"group_library"` | Which view the reaction was made from |

**File:** `apps/web/src/app/_components/groups/engagement-bar.tsx`
**Trigger:** User taps a reaction button when `didReact === false`

---

### `reaction_removed`
Fired when a user removes a reaction from a group post.

| Property | Type | Values | Description |
|---|---|---|---|
| `type` | `string` | `"like"`, `"must_read"` | Reaction type |
| `source` | `string` | `"group_feed"`, `"group_library"` | Which view the reaction was removed from |

**File:** `apps/web/src/app/_components/groups/engagement-bar.tsx`
**Trigger:** User taps a reaction button when `didReact === true`

---

### `comment_thread_opened`
Fired when a user taps the comment icon on a group post.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/groups/engagement-bar.tsx`
**Trigger:** Comment icon button click (fires even if the thread is being toggled closed — fires on every click)

---

### `comment_posted`
Fired when a user successfully submits a comment on a group post.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/groups/reply-input.tsx`
**Trigger:** Enter key or submit button press with non-empty trimmed text

---

### `discovery_view_in_group`
Fired when a user clicks to view a discovery item within a group context.

| Property | Type | Values | Description |
|---|---|---|---|
| `postId` | `string` | UUID | The group post ID being viewed |

**File:** `apps/web/src/app/_components/groups/feed-share-card.tsx`
**Trigger:** User clicks "view in group" link on a discovery item in the group feed

---

## People / DMs

### `dm_created`
Fired when a user starts a new direct message conversation by selecting a person from the search sheet.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/_components/people/find-user-sheet.tsx`
**Trigger:** `POST /api/people/conversation` returns a `convoId` — fires regardless of whether it's a new conversation or an existing one being reopened

---

## Notes for Product / Data

- **`link_opened` context** — all four surfaces are instrumented: `"vault"`, `"group_feed"`, `"personal_chat"`, `"discovery"`. If a new surface is added, pass the appropriate context string at that call site.
- **`vault_link_saved`** — now fires at submit time (user intent), not after Supabase confirmation. Use `vault_link_save_failed` to track save failures. The `is_duplicate` field is always `false` because Dexie-level dedup returns early before tracking.
- **`comment_thread_opened`** — fires on every toggle (open and close). If you need open-only, add a guard checking the direction of the toggle.
- **`dm_created`** — fires for both new and existing conversations (the API returns the existing convoId if one already exists). Consider adding an `is_new` boolean if you need to distinguish.
- **`item_saved_from_group`** — does not fire on unsave. Unsave is a silent action with no tracking.
