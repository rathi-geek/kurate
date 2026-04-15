-- ═══════════════════════════════════════════
-- Post-initial schema changes + Group RPC functions
-- Consolidated from multiple migration files
-- ═══════════════════════════════════════════


-- ── Schema fixes ────────────────────────────────────────────────

-- Allow multiple groups with the same name
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_group_name_key;

-- Increase group name character limit from 20 to 50
ALTER TABLE public.conversations ALTER COLUMN group_name TYPE VARCHAR(50);

-- Heart and other emojis can be multi-codepoint. CHAR(1) truncates them.
ALTER TABLE public.message_reactions ALTER COLUMN emoji TYPE VARCHAR(8);
ALTER TABLE public.group_posts_comments_reactions ALTER COLUMN emoji TYPE VARCHAR(8);

-- Allow users to delete their own interests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_interests'
      AND policyname = 'Users can DELETE own interests'
  ) THEN
    CREATE POLICY "Users can DELETE own interests"
      ON public.user_interests FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ── Helper functions ────────────────────────────────────────────

-- Drop functions whose return type changed (CREATE OR REPLACE cannot alter return types)
DROP FUNCTION IF EXISTS public.get_group_post_comments(UUID, TIMESTAMPTZ, INT);
DROP FUNCTION IF EXISTS public.get_group_members(UUID);

-- Redrop to replace JSONB variants with flat columns
DROP FUNCTION IF EXISTS public.get_group_post_comments(UUID, TIMESTAMPTZ, INT);
DROP FUNCTION IF EXISTS public.get_group_members(UUID);

-- Build avatar_path from media_metadata
-- Returns 'bucket_name/file_path' or NULL. Client prepends the storage base URL.
CREATE OR REPLACE FUNCTION public._avatar_path(p_media_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT m.bucket_name || '/' || m.file_path
  FROM public.media_metadata m
  WHERE m.id = p_media_id
  LIMIT 1
$$;

-- Build display_name from profile columns
CREATE OR REPLACE FUNCTION public._display_name(
  p_first_name TEXT,
  p_last_name  TEXT,
  p_handle     TEXT
)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', p_first_name, p_last_name)), ''),
    p_handle
  )
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 1. get_group_feed_page
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_group_feed_page(
  p_group_id UUID,
  p_user_id  UUID,
  p_cursor   TIMESTAMPTZ DEFAULT NULL,
  p_limit    INT         DEFAULT 20
)
RETURNS TABLE (
  id              UUID,
  convo_id        UUID,
  logged_item_id  UUID,
  shared_by       UUID,
  note            VARCHAR(500),
  content         TEXT,
  shared_at       TIMESTAMPTZ,
  sharer_id            UUID,
  sharer_display_name  TEXT,
  sharer_avatar_path   TEXT,
  sharer_handle        TEXT,
  item_url              TEXT,
  item_title            TEXT,
  item_preview_image    TEXT,
  item_content_type     TEXT,
  item_raw_metadata     JSONB,
  item_description      TEXT,
  like_count       BIGINT,
  did_like         BOOLEAN,
  must_read_count  BIGINT,
  did_must_read    BOOLEAN,
  comment_count    BIGINT,
  seen_at          TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT
    gp.id,
    gp.convo_id,
    gp.logged_item_id,
    gp.shared_by,
    gp.note,
    gp.content,
    gp.shared_at,
    sp.id              AS sharer_id,
    public._display_name(sp.first_name, sp.last_name, sp.handle) AS sharer_display_name,
    public._avatar_path(sp.avatar_id)                             AS sharer_avatar_path,
    sp.handle          AS sharer_handle,
    li.url              AS item_url,
    li.title            AS item_title,
    li.preview_image_url AS item_preview_image,
    li.content_type::TEXT AS item_content_type,
    li.raw_metadata     AS item_raw_metadata,
    li.description      AS item_description,
    COALESCE(likes.cnt, 0)       AS like_count,
    COALESCE(likes.did, FALSE)   AS did_like,
    COALESCE(mr.cnt, 0)          AS must_read_count,
    COALESCE(mr.did, FALSE)      AS did_must_read,
    COALESCE(cc.cnt, 0)          AS comment_count,
    ls.seen_at
  FROM public.group_posts gp
  LEFT JOIN public.profiles sp ON sp.id = gp.shared_by
  LEFT JOIN public.logged_items li ON li.id = gp.logged_item_id
  LEFT JOIN public.group_post_last_seen ls
    ON ls.group_post_id = gp.id AND ls.user_id = p_user_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::BIGINT AS cnt,
      BOOL_OR(gl.user_id = p_user_id) AS did
    FROM public.group_posts_likes gl
    WHERE gl.group_post_id = gp.id
  ) likes ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::BIGINT AS cnt,
      BOOL_OR(gm.user_id = p_user_id) AS did
    FROM public.group_posts_must_reads gm
    WHERE gm.group_post_id = gp.id
  ) mr ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM public.group_posts_comments gc
    WHERE gc.group_post_id = gp.id
  ) cc ON TRUE
  WHERE gp.convo_id = p_group_id
    AND (p_cursor IS NULL OR gp.shared_at < p_cursor)
  ORDER BY gp.shared_at DESC
  LIMIT p_limit
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 2. get_feed_comment_previews
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_feed_comment_previews(p_post_ids UUID[])
RETURNS TABLE (
  group_post_id      UUID,
  comment_text       VARCHAR(500),
  created_at         TIMESTAMPTZ,
  author_display_name TEXT,
  author_avatar_path  TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (c.group_post_id)
    c.group_post_id,
    c.comment_text,
    c.created_at,
    public._display_name(p.first_name, p.last_name, p.handle) AS author_display_name,
    public._avatar_path(p.avatar_id)                           AS author_avatar_path
  FROM public.group_posts_comments c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  WHERE c.group_post_id = ANY(p_post_ids)
  ORDER BY c.group_post_id, c.created_at DESC
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 3. get_group_post_comments
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_group_post_comments(
  p_post_id UUID,
  p_cursor  TIMESTAMPTZ DEFAULT NULL,
  p_limit   INT         DEFAULT 30
)
RETURNS TABLE (
  id                  UUID,
  group_post_id       UUID,
  user_id             UUID,
  comment_text        VARCHAR(500),
  parent_comment_id   UUID,
  created_at          TIMESTAMPTZ,
  author_id           UUID,
  author_display_name TEXT,
  author_avatar_path  TEXT,
  author_handle       TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.group_post_id,
    c.user_id,
    c.comment_text,
    c.parent_comment_id,
    c.created_at,
    COALESCE(p.id, c.user_id)                                   AS author_id,
    public._display_name(p.first_name, p.last_name, p.handle)   AS author_display_name,
    public._avatar_path(p.avatar_id)                            AS author_avatar_path,
    COALESCE(p.handle, '')                                      AS author_handle
  FROM public.group_posts_comments c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  WHERE c.group_post_id = p_post_id
    AND (p_cursor IS NULL OR c.created_at < p_cursor)
  ORDER BY c.created_at DESC
  LIMIT p_limit
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 4. get_group_members
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_group_members(p_group_id UUID)
RETURNS TABLE (
  id                   UUID,
  convo_id             UUID,
  user_id              UUID,
  role                 role_enum,
  joined_at            TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ,
  profile_id           UUID,
  profile_display_name TEXT,
  profile_avatar_path  TEXT,
  profile_handle       TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cm.id,
    cm.convo_id,
    cm.user_id,
    cm.role,
    cm.joined_at,
    cm.updated_at,
    COALESCE(p.id, cm.user_id)                                  AS profile_id,
    public._display_name(p.first_name, p.last_name, p.handle)   AS profile_display_name,
    public._avatar_path(p.avatar_id)                            AS profile_avatar_path,
    COALESCE(p.handle, '')                                      AS profile_handle
  FROM public.conversation_members cm
  LEFT JOIN public.profiles p ON p.id = cm.user_id
  WHERE cm.convo_id = p_group_id
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 5. get_user_groups
-- ═══════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.get_user_groups();

CREATE OR REPLACE FUNCTION public.get_user_groups()
RETURNS TABLE (
  id                UUID,
  group_name        VARCHAR(50),
  group_description VARCHAR(200),
  avatar_path       TEXT,
  role              role_enum,
  joined_at         TIMESTAMPTZ,
  last_activity_at  TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT
    conv.id,
    conv.group_name,
    conv.group_description,
    public._avatar_path(conv.group_avatar_id) AS avatar_path,
    cm.role,
    cm.joined_at,
    conv.last_activity_at
  FROM public.conversation_members cm
  INNER JOIN public.conversations conv
    ON conv.id = cm.convo_id AND conv.is_group = TRUE
  WHERE cm.user_id = auth.uid()
    AND conv.group_name IS NOT NULL
  ORDER BY conv.last_activity_at DESC
$$;
