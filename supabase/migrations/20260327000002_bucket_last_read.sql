-- Track the last time a user read each thoughts bucket,
-- replacing the previous localStorage-based approach.
CREATE TABLE bucket_last_read (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bucket       TEXT NOT NULL CHECK (bucket IN ('media', 'tasks', 'learning', 'notes')),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, bucket)
);

ALTER TABLE bucket_last_read ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON bucket_last_read
  FOR ALL USING (auth.uid() = user_id);
