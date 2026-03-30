-- Track the last time a user "saw" comments on a group post,
-- so we can show an unread-dot indicator on the comment button.
CREATE TABLE group_post_last_seen (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_post_id   UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comment_count   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, group_post_id)
);

ALTER TABLE group_post_last_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON group_post_last_seen
  FOR ALL USING (auth.uid() = user_id);
