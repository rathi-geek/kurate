# Unread Comments Divider (Group Posts)

## Status
Implemented on `feat/mobile-vault` branch (2026-04-05). Has known bugs — not yet catalogued, will fix later.

## What it does
WhatsApp-style "N new messages" divider inside group post comment threads. Scrolls user to the divider on open.

## How it works
1. `group_post_last_seen` table stores `seen_at` per user per post (already existed)
2. Feed query LEFT JOINs this -> `drop.seenAt` on each `GroupDrop` (already existed)
3. Green filled comment icon when `latestCommentAt > seenAt` (already existed)
4. **New:** On thread open, `FeedShareCard` snapshots `drop.seenAt` into `unreadDividerAtRef` BEFORE calling `markPostSeen` (which clears the green dot by updating seenAt)
5. Snapshot passed to `<CommentThread lastSeenAt={...} />`
6. CommentThread finds first comment with `created_at > lastSeenAt` -> renders "N new messages" divider
7. Scrolls to divider position instead of bottom
8. On thread close: ref is cleared, next open gets fresh seenAt (no stale divider)

## Files changed
- `apps/web/src/app/_components/groups/feed-share-card.tsx` — seenAt snapshot via `unreadDividerAtRef`, passed as `lastSeenAt` prop
- `apps/web/src/app/_components/groups/comment-thread.tsx` — `lastSeenAt` prop, divider rendering, scroll-to-divider logic
- `libs/locales/src/en.json` — added `new_message_singular`, `new_messages` keys in groups namespace

## Key design decision
`markPostSeen` is called on thread OPEN (to immediately clear the green dot on the engagement bar), but we snapshot `seenAt` BEFORE that call so the divider still knows the correct cutoff point. This avoids the reference point being destroyed.

## Related existing infrastructure (no changes needed)
- DB: `group_post_last_seen` table with `user_id`, `group_post_id`, `seen_at`, `comment_count`
- `useGroupFeed` hook: `markPostSeen()`, realtime subscription for comments
- `usePostSeenStatus` hook: alternative seen tracker (used elsewhere, uses comment_count approach)
- `EngagementBar`: green comment icon indicator

## Known bugs
To be catalogued and fixed in a future session.
