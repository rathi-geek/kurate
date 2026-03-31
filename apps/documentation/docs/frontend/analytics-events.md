# Analytics Events Reference

**Provider:** Mixpanel
**Utility:** `track()` from `apps/web/src/app/_libs/utils/analytics.ts`
**Total events:** 25

Events are only fired after Mixpanel is initialised (no-op before that). Properties listed as `—` mean the event is fired with no payload.

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

**File:** `apps/web/src/app/(onboarding)/onboarding/_components/onboarding-form.tsx`
**Trigger:** On successful form submit in the onboarding flow

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

**File:** `apps/web/src/app/(app)/home/page.tsx`
**Trigger:** `activeTab` state changes to `HomeTab.VAULT` — deduplicated with a ref so it only fires once per tab switch

---

### `discover_view`
Fired when the user lands on or switches to the Discover tab on the home page.

| Property | Description |
|---|---|
| — | No properties |

**File:** `apps/web/src/app/(app)/home/page.tsx`
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
| `source` | `string` | `"manual"`, `"thought_added"` | What triggered the switch |

**File:** `apps/web/src/app/_components/home/vault-tab-view.tsx`
**Trigger:** Manual tab toggle OR auto-switch after a thought is saved

---

## Vault / Content

### `vault_link_saved`
Fired when the user successfully saves a link to their vault from the home page input.

| Property | Type | Values | Description |
|---|---|---|---|
| `content_type` | `string` | `"article"`, `"video"`, `"podcast"` | Detected content type |
| `source` | `string \| null` | domain name e.g. `"twitter.com"` | Extracted source from metadata |
| `has_tags` | `boolean` | `false` | Reserved — tags not yet implemented |
| `is_duplicate` | `boolean` | `true`/`false` | Whether the URL was already in the vault |

**File:** `apps/web/src/app/_components/home/vault-tab-view.tsx`
**Trigger:** `handleLinkSaved` callback fires after the save API returns — fires for both new saves and duplicates

---

### `link_opened`
Fired whenever a user opens a link in a new tab. The `context` property tells you which surface the link was opened from.

| Property | Type | Values | Description |
|---|---|---|---|
| `context` | `string` | `"vault"`, `"group_feed"` | Surface where the link was opened |
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
Fired when a user posts a drop (link or note) to a group feed.

| Property | Type | Values | Description |
|---|---|---|---|
| `content_type` | `string` | `"article"`, `"video"`, `"podcast"` | Detected content type of the shared link |

**File:** `apps/web/src/app/_components/groups/drop-composer.tsx`
**Trigger:** On successful post insert — fires after the DB write, before saving to vault

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
Fired when a user taps the comment icon to open the comment thread on a group post.

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
- **`comment_thread_opened`** — fires on every toggle (open and close). If you need open-only, add a guard checking the direction of the toggle.
- **`dm_created`** — fires for both new and existing conversations (the API returns the existing convoId if one already exists). Consider adding an `is_new` boolean if you need to distinguish.
- **`item_saved_from_group`** — does not fire on unsave. Unsave is a silent action with no tracking.
