-- ═══════════════════════════════════════════
-- 02_functions.sql
-- All functions, triggers, and stored procedures
-- ═══════════════════════════════════════════


-- ── Auto-create profile on signup ─────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'given_name',
    NEW.raw_user_meta_data->>'family_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── Generic updated_at bumper ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_conversation_members_updated_at
  BEFORE UPDATE ON public.conversation_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER thoughts_updated_at
  BEFORE UPDATE ON public.thoughts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── Auto-update conversations.updated_at on new message ───────

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NEW.created_at WHERE id = NEW.convo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();


-- ── Auto-update conversations.updated_at on new group post ────

CREATE OR REPLACE FUNCTION public.update_conversation_on_group_post()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NEW.shared_at WHERE id = NEW.convo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_on_group_post
  AFTER INSERT ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_group_post();


-- ── Update weekly/monthly stats when a user logs an item ──────

CREATE OR REPLACE FUNCTION public.update_user_stats_on_log()
RETURNS TRIGGER AS $$
DECLARE
  v_content_type      content_type_enum;
  v_week_start        DATE;
  v_month_start       DATE;
  v_unique_cats_week  INTEGER;
  v_unique_cats_month INTEGER;
BEGIN
  SELECT content_type INTO v_content_type
  FROM public.logged_items WHERE id = NEW.logged_item_id;

  v_week_start  := date_trunc('week',  NEW.created_at)::DATE;
  v_month_start := date_trunc('month', NEW.created_at)::DATE;

  -- Recount unique categories for this user in the affected week/month
  SELECT COUNT(DISTINCT li.category_id) INTO v_unique_cats_week
  FROM public.user_logged_items uli
  JOIN public.logged_items li ON li.id = uli.logged_item_id
  WHERE uli.user_id = NEW.user_id
    AND date_trunc('week', uli.created_at)::DATE = v_week_start
    AND li.category_id IS NOT NULL;

  SELECT COUNT(DISTINCT li.category_id) INTO v_unique_cats_month
  FROM public.user_logged_items uli
  JOIN public.logged_items li ON li.id = uli.logged_item_id
  WHERE uli.user_id = NEW.user_id
    AND date_trunc('month', uli.created_at)::DATE = v_month_start
    AND li.category_id IS NOT NULL;

  INSERT INTO public.user_stats_weekly (
    user_id, week_start_date,
    total_logs, article_count, video_count, podcast_count, unique_categories
  ) VALUES (
    NEW.user_id, v_week_start,
    1,
    CASE WHEN v_content_type = 'article' THEN 1 ELSE 0 END,
    CASE WHEN v_content_type = 'video'   THEN 1 ELSE 0 END,
    CASE WHEN v_content_type = 'podcast' THEN 1 ELSE 0 END,
    v_unique_cats_week
  )
  ON CONFLICT (user_id, week_start_date) DO UPDATE SET
    total_logs        = user_stats_weekly.total_logs + 1,
    article_count     = user_stats_weekly.article_count  + CASE WHEN v_content_type = 'article' THEN 1 ELSE 0 END,
    video_count       = user_stats_weekly.video_count    + CASE WHEN v_content_type = 'video'   THEN 1 ELSE 0 END,
    podcast_count     = user_stats_weekly.podcast_count  + CASE WHEN v_content_type = 'podcast' THEN 1 ELSE 0 END,
    unique_categories = v_unique_cats_week,
    computed_at       = NOW();

  INSERT INTO public.user_stats_monthly (
    user_id, month_start_date,
    total_logs, article_count, video_count, podcast_count, unique_categories
  ) VALUES (
    NEW.user_id, v_month_start,
    1,
    CASE WHEN v_content_type = 'article' THEN 1 ELSE 0 END,
    CASE WHEN v_content_type = 'video'   THEN 1 ELSE 0 END,
    CASE WHEN v_content_type = 'podcast' THEN 1 ELSE 0 END,
    v_unique_cats_month
  )
  ON CONFLICT (user_id, month_start_date) DO UPDATE SET
    total_logs        = user_stats_monthly.total_logs + 1,
    article_count     = user_stats_monthly.article_count  + CASE WHEN v_content_type = 'article' THEN 1 ELSE 0 END,
    video_count       = user_stats_monthly.video_count    + CASE WHEN v_content_type = 'video'   THEN 1 ELSE 0 END,
    podcast_count     = user_stats_monthly.podcast_count  + CASE WHEN v_content_type = 'podcast' THEN 1 ELSE 0 END,
    unique_categories = v_unique_cats_month,
    computed_at       = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stats_on_log
  AFTER INSERT ON public.user_logged_items
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_on_log();


-- ── Decrement weekly/monthly stats when a logged item is removed ─

CREATE OR REPLACE FUNCTION public.update_user_stats_on_log_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_content_type      content_type_enum;
  v_week_start        DATE;
  v_month_start       DATE;
  v_unique_cats_week  INTEGER;
  v_unique_cats_month INTEGER;
BEGIN
  SELECT content_type INTO v_content_type
  FROM public.logged_items WHERE id = OLD.logged_item_id;

  v_week_start  := date_trunc('week',  OLD.created_at)::DATE;
  v_month_start := date_trunc('month', OLD.created_at)::DATE;

  -- Recount after the delete (OLD row already removed from table)
  SELECT COUNT(DISTINCT li.category_id) INTO v_unique_cats_week
  FROM public.user_logged_items uli
  JOIN public.logged_items li ON li.id = uli.logged_item_id
  WHERE uli.user_id = OLD.user_id
    AND date_trunc('week', uli.created_at)::DATE = v_week_start
    AND li.category_id IS NOT NULL;

  SELECT COUNT(DISTINCT li.category_id) INTO v_unique_cats_month
  FROM public.user_logged_items uli
  JOIN public.logged_items li ON li.id = uli.logged_item_id
  WHERE uli.user_id = OLD.user_id
    AND date_trunc('month', uli.created_at)::DATE = v_month_start
    AND li.category_id IS NOT NULL;

  UPDATE public.user_stats_weekly SET
    total_logs        = GREATEST(total_logs - 1, 0),
    article_count     = GREATEST(article_count  - CASE WHEN v_content_type = 'article' THEN 1 ELSE 0 END, 0),
    video_count       = GREATEST(video_count    - CASE WHEN v_content_type = 'video'   THEN 1 ELSE 0 END, 0),
    podcast_count     = GREATEST(podcast_count  - CASE WHEN v_content_type = 'podcast' THEN 1 ELSE 0 END, 0),
    unique_categories = v_unique_cats_week,
    computed_at       = NOW()
  WHERE user_id = OLD.user_id AND week_start_date = v_week_start;

  UPDATE public.user_stats_monthly SET
    total_logs        = GREATEST(total_logs - 1, 0),
    article_count     = GREATEST(article_count  - CASE WHEN v_content_type = 'article' THEN 1 ELSE 0 END, 0),
    video_count       = GREATEST(video_count    - CASE WHEN v_content_type = 'video'   THEN 1 ELSE 0 END, 0),
    podcast_count     = GREATEST(podcast_count  - CASE WHEN v_content_type = 'podcast' THEN 1 ELSE 0 END, 0),
    unique_categories = v_unique_cats_month,
    computed_at       = NOW()
  WHERE user_id = OLD.user_id AND month_start_date = v_month_start;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stats_on_log_delete
  AFTER DELETE ON public.user_logged_items
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_on_log_delete();


-- ── Accumulate reading time when a session completes ──────────

CREATE OR REPLACE FUNCTION public.update_reading_time_on_session()
RETURNS TRIGGER AS $$
DECLARE
  v_week_start    DATE;
  v_month_start   DATE;
  v_minutes_added INTEGER;
BEGIN
  -- Only fire when duration transitions NULL → value (session just completed)
  IF NEW.duration IS NULL OR OLD.duration IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_week_start    := date_trunc('week',  NEW.created_at)::DATE;
  v_month_start   := date_trunc('month', NEW.created_at)::DATE;
  v_minutes_added := GREATEST(ROUND(NEW.duration / 60.0)::INTEGER, 0);

  UPDATE public.user_stats_weekly SET
    total_reading_time = total_reading_time + v_minutes_added,
    computed_at        = NOW()
  WHERE user_id = NEW.user_id AND week_start_date = v_week_start;

  UPDATE public.user_stats_monthly SET
    total_reading_time = total_reading_time + v_minutes_added,
    computed_at        = NOW()
  WHERE user_id = NEW.user_id AND month_start_date = v_month_start;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_reading_time
  AFTER UPDATE ON public.reading_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_reading_time_on_session();


-- ═══════════════════════════════════════════════════════════
-- Notification triggers
-- ═══════════════════════════════════════════════════════════

-- Enable pg_net for async HTTP calls (Supabase hosted uses 'net' schema)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Helper: fire FCM edge function asynchronously ─────────
-- Reads URL and key from Supabase Vault (encrypted secrets).
-- See 03_seed.sql for setup instructions.

CREATE OR REPLACE FUNCTION public.notify_via_fcm(p_payload JSONB)
RETURNS VOID AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'fcm_push_url';
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  PERFORM net.http_post(
    url     := v_url,
    body    := p_payload,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Like: INSERT ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_like_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient         UUID;
  v_notif_id          UUID;
  v_like_notifs       BOOLEAN;
  v_push_enabled      BOOLEAN;
BEGIN
  -- Get post author
  SELECT shared_by INTO v_recipient FROM public.group_posts WHERE id = NEW.group_post_id;

  -- Skip self-like
  IF NEW.user_id = v_recipient THEN RETURN NEW; END IF;

  -- Check preferences (default true if no row exists)
  SELECT like_notifications, push_enabled
    INTO v_like_notifs, v_push_enabled
    FROM public.notification_preferences
   WHERE user_id = v_recipient;

  IF v_like_notifs = FALSE THEN RETURN NEW; END IF;

  -- Find existing aggregated notification for this post
  SELECT id INTO v_notif_id
    FROM public.notifications
   WHERE recipient_id = v_recipient
     AND event_type = 'like'
     AND event_id = NEW.group_post_id;

  IF v_notif_id IS NULL THEN
    -- First like: create notification and fire FCM
    INSERT INTO public.notifications (recipient_id, actor_id, event_type, event_id, message)
    VALUES (v_recipient, NEW.user_id, 'like', NEW.group_post_id, 'liked your post')
    RETURNING id INTO v_notif_id;

    INSERT INTO public.notification_actors (notification_id, actor_id)
    VALUES (v_notif_id, NEW.user_id)
    ON CONFLICT DO NOTHING;

    PERFORM public.notify_via_fcm(jsonb_build_object(
      'type', 'notification',
      'notification_id', v_notif_id,
      'recipient_id', v_recipient
    ));
  ELSE
    -- Subsequent like: update actor only, no re-push
    INSERT INTO public.notification_actors (notification_id, actor_id)
    VALUES (v_notif_id, NEW.user_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.notifications
       SET actor_id = NEW.user_id, updated_at = NOW()
     WHERE id = v_notif_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_like_notification
  AFTER INSERT ON public.group_posts_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_insert();


-- ── Like: DELETE ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_like_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient UUID;
  v_notif_id  UUID;
  v_remaining INTEGER;
BEGIN
  SELECT shared_by INTO v_recipient FROM public.group_posts WHERE id = OLD.group_post_id;

  SELECT id INTO v_notif_id
    FROM public.notifications
   WHERE recipient_id = v_recipient
     AND event_type = 'like'
     AND event_id = OLD.group_post_id;

  IF v_notif_id IS NULL THEN RETURN OLD; END IF;

  DELETE FROM public.notification_actors
   WHERE notification_id = v_notif_id AND actor_id = OLD.user_id;

  SELECT COUNT(*) INTO v_remaining
    FROM public.notification_actors
   WHERE notification_id = v_notif_id;

  IF v_remaining = 0 THEN
    DELETE FROM public.notifications WHERE id = v_notif_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_like_delete_notification
  AFTER DELETE ON public.group_posts_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_delete();


-- ── Must-Read: INSERT ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_must_read_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient          UUID;
  v_notif_id           UUID;
  v_must_read_notifs   BOOLEAN;
  v_push_enabled       BOOLEAN;
BEGIN
  SELECT shared_by INTO v_recipient FROM public.group_posts WHERE id = NEW.group_post_id;

  IF NEW.user_id = v_recipient THEN RETURN NEW; END IF;

  SELECT must_read_notifications, push_enabled
    INTO v_must_read_notifs, v_push_enabled
    FROM public.notification_preferences
   WHERE user_id = v_recipient;

  IF v_must_read_notifs = FALSE THEN RETURN NEW; END IF;

  SELECT id INTO v_notif_id
    FROM public.notifications
   WHERE recipient_id = v_recipient
     AND event_type = 'must_read'
     AND event_id = NEW.group_post_id;

  IF v_notif_id IS NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, event_type, event_id, message)
    VALUES (v_recipient, NEW.user_id, 'must_read', NEW.group_post_id, 'marked your post as must-read')
    RETURNING id INTO v_notif_id;

    INSERT INTO public.notification_actors (notification_id, actor_id)
    VALUES (v_notif_id, NEW.user_id)
    ON CONFLICT DO NOTHING;

    PERFORM public.notify_via_fcm(jsonb_build_object(
      'type', 'notification',
      'notification_id', v_notif_id,
      'recipient_id', v_recipient
    ));
  ELSE
    INSERT INTO public.notification_actors (notification_id, actor_id)
    VALUES (v_notif_id, NEW.user_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.notifications
       SET actor_id = NEW.user_id, updated_at = NOW()
     WHERE id = v_notif_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_must_read_notification
  AFTER INSERT ON public.group_posts_must_reads
  FOR EACH ROW EXECUTE FUNCTION public.handle_must_read_insert();


-- ── Must-Read: DELETE ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_must_read_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient UUID;
  v_notif_id  UUID;
  v_remaining INTEGER;
BEGIN
  SELECT shared_by INTO v_recipient FROM public.group_posts WHERE id = OLD.group_post_id;

  SELECT id INTO v_notif_id
    FROM public.notifications
   WHERE recipient_id = v_recipient
     AND event_type = 'must_read'
     AND event_id = OLD.group_post_id;

  IF v_notif_id IS NULL THEN RETURN OLD; END IF;

  DELETE FROM public.notification_actors
   WHERE notification_id = v_notif_id AND actor_id = OLD.user_id;

  SELECT COUNT(*) INTO v_remaining
    FROM public.notification_actors
   WHERE notification_id = v_notif_id;

  IF v_remaining = 0 THEN
    DELETE FROM public.notifications WHERE id = v_notif_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_must_read_delete_notification
  AFTER DELETE ON public.group_posts_must_reads
  FOR EACH ROW EXECUTE FUNCTION public.handle_must_read_delete();


-- ── Comment: INSERT (no aggregation) ──────────────────────

CREATE OR REPLACE FUNCTION public.handle_comment_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient          UUID;
  v_notif_id           UUID;
  v_comment_notifs     BOOLEAN;
  v_push_enabled       BOOLEAN;
  v_mention_handle     TEXT;
  v_mention_user_id    UUID;
  v_mention_notif_id   UUID;
  v_mention_pref       BOOLEAN;
BEGIN
  SELECT shared_by INTO v_recipient FROM public.group_posts WHERE id = NEW.group_post_id;

  -- Comment notification to post owner
  IF NEW.user_id != v_recipient THEN
    SELECT comment_notifications, push_enabled
      INTO v_comment_notifs, v_push_enabled
      FROM public.notification_preferences
     WHERE user_id = v_recipient;

    IF v_comment_notifs IS DISTINCT FROM FALSE THEN
      INSERT INTO public.notifications (recipient_id, actor_id, event_type, event_id, message)
      VALUES (v_recipient, NEW.user_id, 'comment', NEW.group_post_id, 'commented on your post')
      RETURNING id INTO v_notif_id;

      PERFORM public.notify_via_fcm(jsonb_build_object(
        'type', 'notification',
        'notification_id', v_notif_id,
        'recipient_id', v_recipient
      ));
    END IF;
  END IF;

  -- @mention notifications (backend-ready)
  FOR v_mention_handle IN
    SELECT (regexp_matches(NEW.comment_text, '@([a-zA-Z0-9_]+)', 'g'))[1]
  LOOP
    SELECT id INTO v_mention_user_id
      FROM public.profiles
     WHERE handle = v_mention_handle;

    IF v_mention_user_id IS NULL THEN CONTINUE; END IF;
    IF v_mention_user_id = NEW.user_id THEN CONTINUE; END IF;
    IF v_mention_user_id = v_recipient THEN CONTINUE; END IF;

    SELECT mention_notifications INTO v_mention_pref
      FROM public.notification_preferences WHERE user_id = v_mention_user_id;
    IF v_mention_pref = FALSE THEN CONTINUE; END IF;

    INSERT INTO public.notifications (recipient_id, actor_id, event_type, event_id, message)
    VALUES (v_mention_user_id, NEW.user_id, 'mention', NEW.group_post_id, 'mentioned you in a comment')
    RETURNING id INTO v_mention_notif_id;

    PERFORM public.notify_via_fcm(jsonb_build_object(
      'type', 'notification',
      'notification_id', v_mention_notif_id,
      'recipient_id', v_mention_user_id
    ));
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_comment_notification
  AFTER INSERT ON public.group_posts_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_insert();


-- ── Discovery Feed: flat-column RPC matching get_group_feed_page pattern ──
-- Returns deduplicated unread posts from others in user's groups.
-- Client splits the result: today's posts → top 10 by engagement (Today),
-- remaining posts → New section. No overlap possible.

CREATE OR REPLACE FUNCTION public.get_discovery_feed_page(
  p_user_id  UUID,
  p_limit    INT DEFAULT 60
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
    dgp.id,
    dgp.convo_id,
    dgp.logged_item_id,
    dgp.shared_by,
    dgp.note,
    dgp.content,
    dgp.shared_at,
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
  FROM (
    SELECT DISTINCT ON (COALESCE(gp.logged_item_id::text, gp.id::text)) gp.*
    FROM public.group_posts gp
    WHERE gp.convo_id IN (
      SELECT convo_id FROM public.conversation_members WHERE user_id = p_user_id
    )
      AND gp.shared_by != p_user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.group_post_reads r
        WHERE r.group_post_id = gp.id
          AND r.user_id = p_user_id
      )
    ORDER BY COALESCE(gp.logged_item_id::text, gp.id::text), gp.shared_at DESC
  ) dgp
  LEFT JOIN public.profiles sp ON sp.id = dgp.shared_by
  LEFT JOIN public.logged_items li ON li.id = dgp.logged_item_id
  LEFT JOIN public.group_post_last_seen ls
    ON ls.group_post_id = dgp.id AND ls.user_id = p_user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt, BOOL_OR(gl.user_id = p_user_id) AS did
    FROM public.group_posts_likes gl WHERE gl.group_post_id = dgp.id
  ) likes ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt, BOOL_OR(gm.user_id = p_user_id) AS did
    FROM public.group_posts_must_reads gm WHERE gm.group_post_id = dgp.id
  ) mr ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM public.group_posts_comments gc WHERE gc.group_post_id = dgp.id
  ) cc ON TRUE
  ORDER BY dgp.shared_at DESC
  LIMIT p_limit
$$;


-- ── Helper: get all users who engaged with a post ────────────────────────────
-- Returns distinct user_ids from likes, must_reads, and comments (not bookmarks — unused in app).

CREATE OR REPLACE FUNCTION public.get_all_post_engagers(
  p_post_id UUID,
  p_exclude_users UUID[]
)
RETURNS TABLE(user_id UUID)
LANGUAGE SQL STABLE AS $$
  SELECT DISTINCT u.user_id FROM (
    SELECT l.user_id FROM public.group_posts_likes l WHERE l.group_post_id = p_post_id
    UNION
    SELECT m.user_id FROM public.group_posts_must_reads m WHERE m.group_post_id = p_post_id
    UNION
    SELECT c.user_id FROM public.group_posts_comments c WHERE c.group_post_id = p_post_id
  ) u
  WHERE u.user_id != ALL(p_exclude_users);
$$;

-- ── Must-read broadcast — notifies ALL group members ─────────────────────────
-- Fires after a new must-read mark. Notifies every group member except the actor
-- and the post owner (who already gets a 'must_read' notification).

CREATE OR REPLACE FUNCTION public.handle_must_read_broadcast()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_convo_id       UUID;
  v_post_owner_id  UUID;
  v_member         RECORD;
  v_notif_id       UUID;
  v_pref           BOOLEAN;
BEGIN
  SELECT gp.convo_id, gp.shared_by
    INTO v_convo_id, v_post_owner_id
    FROM public.group_posts gp
   WHERE gp.id = NEW.group_post_id;

  FOR v_member IN
    SELECT cm.user_id
      FROM public.conversation_members cm
     WHERE cm.convo_id = v_convo_id
       AND cm.user_id != NEW.user_id         -- exclude the actor
       AND cm.user_id != v_post_owner_id     -- exclude post owner (gets 'must_read')
  LOOP
    SELECT must_read_notifications INTO v_pref
      FROM public.notification_preferences WHERE user_id = v_member.user_id;
    IF v_pref = FALSE THEN CONTINUE; END IF;

    -- Aggregate: one notification per (recipient, 'must_read_broadcast', post)
    SELECT id INTO v_notif_id FROM public.notifications
     WHERE recipient_id = v_member.user_id
       AND event_type = 'must_read_broadcast'
       AND event_id = NEW.group_post_id;

    IF v_notif_id IS NULL THEN
      INSERT INTO public.notifications (recipient_id, actor_id, event_type, event_id, message)
      VALUES (v_member.user_id, NEW.user_id, 'must_read_broadcast', NEW.group_post_id,
              'marked a post as must-read')
      RETURNING id INTO v_notif_id;

      PERFORM public.notify_via_fcm(jsonb_build_object(
        'type', 'notification',
        'notification_id', v_notif_id,
        'recipient_id', v_member.user_id
      ));
    ELSE
      UPDATE public.notifications
         SET actor_id = NEW.user_id, updated_at = NOW()
       WHERE id = v_notif_id;
    END IF;

    INSERT INTO public.notification_actors (notification_id, actor_id)
    VALUES (v_notif_id, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_must_read_broadcast
  AFTER INSERT ON public.group_posts_must_reads
  FOR EACH ROW EXECUTE FUNCTION public.handle_must_read_broadcast();

-- ── Cross-type co-engagement notifications ───────────────────────────────────
-- Unified function: when ANY engagement happens (like, must_read, comment),
-- notifies ALL prior engagers on that post regardless of engagement type.
-- Uses TG_TABLE_NAME to determine the action label.

CREATE OR REPLACE FUNCTION public.handle_co_engagement_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_owner_id  UUID;
  v_owner_name     TEXT;
  v_recipient      UUID;
  v_notif_id       UUID;
  v_pref           BOOLEAN;
  v_action_label   TEXT;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'group_posts_likes'      THEN v_action_label := 'liked';
    WHEN 'group_posts_must_reads' THEN v_action_label := 'marked as must-read';
    WHEN 'group_posts_comments'   THEN v_action_label := 'commented on';
    ELSE v_action_label := 'engaged with';
  END CASE;

  SELECT shared_by INTO v_post_owner_id
    FROM public.group_posts WHERE id = NEW.group_post_id;

  SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), handle, 'Someone')
    INTO v_owner_name FROM public.profiles WHERE id = v_post_owner_id;

  FOR v_recipient IN
    SELECT e.user_id FROM public.get_all_post_engagers(
      NEW.group_post_id,
      ARRAY[NEW.user_id, v_post_owner_id]
    ) e
    LIMIT 50
  LOOP
    SELECT co_engagement_notifications INTO v_pref
      FROM public.notification_preferences WHERE user_id = v_recipient;
    IF v_pref = FALSE THEN CONTINUE; END IF;

    SELECT id INTO v_notif_id FROM public.notifications
     WHERE recipient_id = v_recipient
       AND event_type = 'co_engaged'
       AND event_id = NEW.group_post_id;

    IF v_notif_id IS NULL THEN
      INSERT INTO public.notifications (recipient_id, actor_id, event_type, event_id, message)
      VALUES (v_recipient, NEW.user_id, 'co_engaged', NEW.group_post_id,
              v_action_label || ' ' || v_owner_name || '''s post')
      RETURNING id INTO v_notif_id;

      PERFORM public.notify_via_fcm(jsonb_build_object(
        'type', 'notification',
        'notification_id', v_notif_id,
        'recipient_id', v_recipient
      ));
    ELSE
      UPDATE public.notifications
         SET actor_id = NEW.user_id,
             message = v_action_label || ' ' || v_owner_name || '''s post',
             updated_at = NOW()
       WHERE id = v_notif_id;
    END IF;

    INSERT INTO public.notification_actors (notification_id, actor_id)
    VALUES (v_notif_id, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_co_engagement_like
  AFTER INSERT ON public.group_posts_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_co_engagement_insert();

CREATE TRIGGER trg_co_engagement_must_read
  AFTER INSERT ON public.group_posts_must_reads
  FOR EACH ROW EXECUTE FUNCTION public.handle_co_engagement_insert();

CREATE TRIGGER trg_co_engagement_comment
  AFTER INSERT ON public.group_posts_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_co_engagement_insert();

-- ── Co-engagement cleanup on delete ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_co_engagement_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_notif_id  UUID;
  v_remaining BIGINT;
BEGIN
  FOR v_notif_id IN
    SELECT n.id FROM public.notifications n
    JOIN public.notification_actors na ON na.notification_id = n.id
    WHERE n.event_type = 'co_engaged'
      AND n.event_id = OLD.group_post_id
      AND na.actor_id = OLD.user_id
  LOOP
    DELETE FROM public.notification_actors
    WHERE notification_id = v_notif_id AND actor_id = OLD.user_id;

    SELECT COUNT(*) INTO v_remaining FROM public.notification_actors
    WHERE notification_id = v_notif_id;

    IF v_remaining = 0 THEN
      DELETE FROM public.notifications WHERE id = v_notif_id;
    ELSE
      UPDATE public.notifications SET
        actor_id = (SELECT actor_id FROM public.notification_actors
                    WHERE notification_id = v_notif_id ORDER BY created_at DESC LIMIT 1),
        updated_at = NOW()
      WHERE id = v_notif_id;
    END IF;
  END LOOP;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_co_engagement_delete_like
  AFTER DELETE ON public.group_posts_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_co_engagement_delete();

CREATE TRIGGER trg_co_engagement_delete_must_read
  AFTER DELETE ON public.group_posts_must_reads
  FOR EACH ROW EXECUTE FUNCTION public.handle_co_engagement_delete();

CREATE TRIGGER trg_co_engagement_delete_comment
  AFTER DELETE ON public.group_posts_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_co_engagement_delete();


-- ── New Post: push-only fan-out (no notification row) ─────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_post_push()
RETURNS TRIGGER AS $$
DECLARE
  v_poster_name     TEXT;
  v_group_name      TEXT;
  v_member          RECORD;
  v_new_post_pref   BOOLEAN;
BEGIN
  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''),
    handle, 'Someone'
  ) INTO v_poster_name FROM public.profiles WHERE id = NEW.shared_by;

  SELECT group_name INTO v_group_name
    FROM public.conversations WHERE id = NEW.convo_id;

  FOR v_member IN
    SELECT user_id, muted_until FROM public.conversation_members
     WHERE convo_id = NEW.convo_id AND user_id != NEW.shared_by
  LOOP
    -- Skip if conversation is muted
    IF v_member.muted_until IS NOT NULL AND v_member.muted_until > NOW() THEN CONTINUE; END IF;

    SELECT new_post_notifications INTO v_new_post_pref
      FROM public.notification_preferences
     WHERE user_id = v_member.user_id;
    IF v_new_post_pref = FALSE THEN CONTINUE; END IF;

    PERFORM public.notify_via_fcm(jsonb_build_object(
      'type', 'new_post',
      'recipient_id', v_member.user_id,
      'convo_id', NEW.convo_id,
      'poster_name', v_poster_name,
      'group_name', COALESCE(v_group_name, 'your group')
    ));
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_post_push
  AFTER INSERT ON public.group_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_post_push();


-- ── Group Invite: notify when added to a group ────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_group_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_is_group    BOOLEAN;
  v_group_name  TEXT;
  v_adder_name  TEXT;
  v_notif_id    UUID;
BEGIN
  SELECT is_group, group_name INTO v_is_group, v_group_name
    FROM public.conversations WHERE id = NEW.convo_id;

  IF NOT v_is_group THEN RETURN NEW; END IF;
  IF NEW.role = 'owner' THEN RETURN NEW; END IF;
  IF NEW.added_by IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''),
    handle, 'Someone'
  ) INTO v_adder_name FROM public.profiles WHERE id = NEW.added_by;

  INSERT INTO public.notifications (recipient_id, actor_id, event_type, event_id, message)
  VALUES (
    NEW.user_id, NEW.added_by, 'group_invite', NEW.convo_id,
    v_adder_name || ' added you to ' || COALESCE(v_group_name, 'a group')
  )
  RETURNING id INTO v_notif_id;

  PERFORM public.notify_via_fcm(jsonb_build_object(
    'type', 'notification',
    'notification_id', v_notif_id,
    'recipient_id', NEW.user_id
  ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_group_invite_notification
  AFTER INSERT ON public.conversation_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_group_invite();


-- ── DM Message: push-only (no notification row) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_dm_message_push()
RETURNS TRIGGER AS $$
DECLARE
  v_is_group      BOOLEAN;
  v_sender_name   TEXT;
  v_recipient_id  UUID;
  v_dm_push       BOOLEAN;
  v_muted_until   TIMESTAMPTZ;
BEGIN
  SELECT is_group INTO v_is_group FROM public.conversations WHERE id = NEW.convo_id;
  IF v_is_group THEN RETURN NEW; END IF;

  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''),
    handle, 'Someone'
  ) INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;

  SELECT user_id, muted_until INTO v_recipient_id, v_muted_until
    FROM public.conversation_members
   WHERE convo_id = NEW.convo_id AND user_id != NEW.sender_id
   LIMIT 1;

  IF v_recipient_id IS NULL THEN RETURN NEW; END IF;

  -- Skip if conversation is muted
  IF v_muted_until IS NOT NULL AND v_muted_until > NOW() THEN RETURN NEW; END IF;

  SELECT dm_push_notifications INTO v_dm_push
    FROM public.notification_preferences WHERE user_id = v_recipient_id;
  IF v_dm_push = FALSE THEN RETURN NEW; END IF;

  PERFORM public.notify_via_fcm(jsonb_build_object(
    'type', 'dm_message',
    'recipient_id', v_recipient_id,
    'convo_id', NEW.convo_id,
    'sender_name', v_sender_name,
    'message_text', LEFT(NEW.message_text, 100),
    'sender_id', NEW.sender_id
  ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dm_message_push
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_dm_message_push();


-- ── Bucket summaries for thoughts ────────────────────────────
-- Returns one row per bucket with latest text, timestamp, total count, and unread count.
-- Pulls from the buckets table dynamically. Sorted: pinned first, then by most recent message.

DROP FUNCTION IF EXISTS public.get_thought_bucket_summaries();

CREATE OR REPLACE FUNCTION public.get_thought_bucket_summaries()
RETURNS TABLE (
  bucket            TEXT,
  "bucketLabel"     TEXT,
  color             TEXT,
  "isSystem"        BOOLEAN,
  "isPinned"        BOOLEAN,
  "latestText"      TEXT,
  "latestCreatedAt" TIMESTAMPTZ,
  "totalCount"      BIGINT,
  "unreadCount"     BIGINT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    b.slug                    AS bucket,
    b.label                   AS "bucketLabel",
    b.color,
    b.is_system               AS "isSystem",
    b.is_pinned               AS "isPinned",
    latest.text               AS "latestText",
    latest.created_at         AS "latestCreatedAt",
    COALESCE(counts.total, 0) AS "totalCount",
    COALESCE(counts.unread, 0) AS "unreadCount"
  FROM public.buckets b
  LEFT JOIN LATERAL (
    SELECT t.text, t.created_at
    FROM public.thoughts t
    WHERE t.user_id = auth.uid() AND t.bucket = b.slug
    ORDER BY t.created_at DESC
    LIMIT 1
  ) latest ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::BIGINT AS total,
      COUNT(*) FILTER (
        WHERE t.created_at > COALESCE(
          (SELECT blr.last_read_at FROM public.bucket_last_read blr
           WHERE blr.user_id = auth.uid() AND blr.bucket = b.slug),
          '1970-01-01'::timestamptz
        )
      )::BIGINT AS unread
    FROM public.thoughts t
    WHERE t.user_id = auth.uid() AND t.bucket = b.slug
  ) counts ON true
  WHERE b.user_id = auth.uid()
  ORDER BY b.is_pinned DESC, latest.created_at DESC NULLS LAST;
$$;


-- ── Auto-create default buckets for new users ───────────────────

CREATE OR REPLACE FUNCTION public.create_default_buckets()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.buckets (user_id, slug, label, color, is_system)
  VALUES
    (NEW.id, 'tasks', 'Tasks', '#D1FAE5', true),
    (NEW.id, 'notes', 'Notes to Self', '#FEF3C7', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_default_buckets
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_buckets();


-- ── Bump last_activity_at on new group post ──────────────────────

CREATE OR REPLACE FUNCTION public.bump_activity_on_group_post()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_activity_at = NEW.shared_at
  WHERE id = NEW.convo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bump_activity_group_post
  AFTER INSERT ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_activity_on_group_post();


-- ── Bump last_activity_at on new DM message ──────────────────────

CREATE OR REPLACE FUNCTION public.bump_activity_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.convo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bump_activity_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_activity_on_message();


-- ── DM unread counts ─────────────────────────────────────────

-- Get unread DM counts for a user (single efficient query)
CREATE OR REPLACE FUNCTION public.get_dm_unread_counts(p_user_id UUID)
RETURNS TABLE(convo_id UUID, unread_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT cm.convo_id, COUNT(m.id) AS unread_count
  FROM public.conversation_members cm
  JOIN public.conversations c ON c.id = cm.convo_id AND c.is_group = false
  JOIN public.messages m ON m.convo_id = cm.convo_id
    AND m.sender_id != p_user_id
    AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
  WHERE cm.user_id = p_user_id
  GROUP BY cm.convo_id
  HAVING COUNT(m.id) > 0;
$$;

-- Mark a conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_user_id UUID, p_convo_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.conversation_members
  SET last_read_at = now()
  WHERE user_id = p_user_id AND convo_id = p_convo_id;
$$;
