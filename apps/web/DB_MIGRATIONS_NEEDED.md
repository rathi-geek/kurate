# DB Migrations Needed

Apply these SQL migrations (in order) to unlock pending frontend features.
Each migration has a corresponding frontend implementation ready to activate.

---

## Phase 1 — Group Name Uniqueness

Blocks: Duplicate group names cause routing collisions at `/groups/[slug]`.

```sql
ALTER TABLE groups ADD CONSTRAINT groups_name_unique UNIQUE (name);
```

**Frontend action after migration:** Error handling already in place — `create-group-dialog.tsx` catches Postgres code `23505` and shows "A group with this name already exists."

---

## Phase 2 — Text-Only Posts

Blocks: `group_shares.logged_item_id` is NOT NULL; text posts have no logged item.

```sql
ALTER TABLE group_shares ADD COLUMN content TEXT;
ALTER TABLE group_shares ALTER COLUMN logged_item_id DROP NOT NULL;
```

**Frontend action after migration:**
1. In `useGroupFeed.ts` → add `content` to the select query (comment marked in file)
2. In `useGroupFeed.ts` mapping → uncomment `content: (row as any).content ?? null`
3. The text-post UI in `drop-composer.tsx` will start working automatically

---

## Phase 3 — Fix Reactions for Group Shares

Blocks: `reactions.comment_id` is required; group-share reactions have no comment.

```sql
ALTER TABLE reactions ALTER COLUMN comment_id DROP NOT NULL;
```

**Frontend action after migration:**
1. Run `pnpm db:types` to regenerate Supabase types
2. In `useDropEngagement.ts` → remove the `as unknown as TablesInsert<"reactions">` cast

---

## Phase 4 — Comment Replies

Blocks: `comments` table has no `parent_id` or `updated_at` columns; reply UI is orphaned.

```sql
ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN updated_at TIMESTAMPTZ;
```

**Frontend action after migration:**
1. Run `pnpm db:types` to regenerate Supabase types
2. In `useComments.ts` → add `parent_id, updated_at` to the select query
3. In `useComments.ts` → remove `parent_id: null as string | null` injected placeholder
4. In `useComments.ts` → add `parent_id` to the insert when `parentId` is provided
5. In `useComments.ts` → build tree: separate top-level comments from replies
6. In `groups.ts` → remove manual overrides (types now come from `Tables<"comments">`)

---

## Phase 5 — Fix RLS on group_members (Infinite Recursion)

Blocks: Member profile joins return blank names/avatars. User-scoped group queries fail.

**This requires a Supabase RLS policy fix**, not just a SQL migration.

The existing policy on `group_members` causes infinite recursion when it checks group membership to determine if a user can read group_members rows.

**Fix:** Replace the recursive RLS policy with a non-recursive equivalent, e.g.:

```sql
-- Drop the existing recursive policy
DROP POLICY IF EXISTS "group_members_select" ON group_members;

-- Allow users to see members of groups they belong to (non-recursive)
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members AS gm
      WHERE gm.user_id = auth.uid()
    )
  );
```

**Note:** If this causes another recursive loop, use a security definer function:

```sql
CREATE OR REPLACE FUNCTION get_user_group_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT group_id FROM group_members WHERE user_id = uid AND status = 'active';
$$;

-- Then reference the function in the policy
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT get_user_group_ids(auth.uid()))
  );
```

**Frontend action after migration:**
- `useGroupMembers.ts` already attempts the profile join with a fallback — the join will start working automatically
- `fetchUserGroups.ts` already uses the user-scoped query (activated in this PR)

---

## Phase 6 — Email Invites

Blocks: Inviting users not yet on the platform by email.

```sql
CREATE TABLE group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | expired
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Index for lookup by invite code + email
CREATE INDEX group_invites_code_idx ON group_invites(invite_code);
CREATE INDEX group_invites_email_idx ON group_invites(email);
```

**Frontend action after migration:**
1. Run `pnpm db:types` to regenerate Supabase types
2. In `group-invite-modal.tsx` → remove the `as any` cast on the `group_invites` insert
3. In `join/[invite_code]/page.tsx` → optionally add email-match validation

---

## Summary Table

| Migration | Phase | Status | Frontend Ready? |
|-----------|-------|--------|-----------------|
| `groups.name` UNIQUE | Phase 1 | Pending | ✅ Yes — error handling in dialog |
| `group_shares.content` TEXT + nullable `logged_item_id` | Phase 2 | Pending | ✅ Yes — UI built, needs activation |
| `reactions.comment_id` nullable | Phase 3 | Pending | ✅ Yes — cast to remove after migration |
| `comments.parent_id` + `updated_at` | Phase 4 | Pending | ✅ Yes — tree logic ready |
| RLS fix on `group_members` | Phase 5 | Pending | ✅ Yes — fallback already in place |
| `group_invites` table | Phase 6 | Pending | ✅ Yes — UI built with `as any` cast |
