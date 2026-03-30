-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE thought_content_type AS ENUM (
  'text',
  'image',
  'voice_note',
  'file'
  -- Note: links always go to logged_items, never stored here
);

CREATE TYPE thought_bucket AS ENUM (
  'media',
  'tasks',
  'learning',
  'notes'
);

CREATE TYPE bucket_source AS ENUM (
  'auto',   -- keyword classifier (sync, free)
  'ai',     -- Gemini reclassification
  'user'    -- user manually changed it
);

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE thoughts (
  id              UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID                 NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content_type    thought_content_type NOT NULL DEFAULT 'text',
  text            TEXT,                -- required for 'text'; optional caption for media
  media_id        UUID                 REFERENCES media_metadata(id) ON DELETE SET NULL,
                                       -- required for image | voice_note | file

  bucket          thought_bucket       NOT NULL DEFAULT 'notes',
  bucket_source   bucket_source        NOT NULL DEFAULT 'auto',

  created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  CONSTRAINT thoughts_has_content
    CHECK (text IS NOT NULL OR media_id IS NOT NULL)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX thoughts_user_id_idx         ON thoughts(user_id);
CREATE INDEX thoughts_user_bucket_idx     ON thoughts(user_id, bucket);
CREATE INDEX thoughts_user_created_at_idx ON thoughts(user_id, created_at DESC);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER thoughts_updated_at
  BEFORE UPDATE ON thoughts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own thoughts
CREATE POLICY "thoughts: owner read"
  ON thoughts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own thoughts
CREATE POLICY "thoughts: owner insert"
  ON thoughts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own thoughts
CREATE POLICY "thoughts: owner update"
  ON thoughts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own thoughts
CREATE POLICY "thoughts: owner delete"
  ON thoughts FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Storage Bucket: thoughts (private) ──────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New Bucket:
--   Name: thoughts | Public: OFF | File size limit: 5 MB
--   Allowed MIME: image/jpeg, image/png, image/gif, image/webp,
--                 audio/mpeg, audio/mp4, audio/webm, application/pdf

-- ─── Storage RLS ──────────────────────────────────────────────────────────────
-- File path convention: {user_id}/{uuid}.{ext}

CREATE POLICY "thoughts storage: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thoughts' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "thoughts storage: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'thoughts' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "thoughts storage: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'thoughts' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );
