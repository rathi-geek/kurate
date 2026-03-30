-- Enable Supabase Realtime for group_posts_comments
-- Without this, postgres_changes subscriptions for this table are silently deaf.
ALTER PUBLICATION supabase_realtime ADD TABLE group_posts_comments;

-- Full replica identity so UPDATE/DELETE events carry the full row (needed for filters)
ALTER TABLE group_posts_comments REPLICA IDENTITY FULL;
