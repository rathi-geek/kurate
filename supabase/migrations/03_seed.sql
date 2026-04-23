-- ═══════════════════════════════════════════
-- 03_seed.sql
-- All seed / reference data
-- ═══════════════════════════════════════════

-- ═══════════════════════════════════════════
-- ⚠️  REQUIRED: Vault secrets for push notifications
-- ═══════════════════════════════════════════
-- After running migrations (or after db reset), you MUST set these vault secrets
-- in the Supabase SQL editor. Without them, push notifications will fail.
--
-- The notify_via_fcm() function in 02_functions.sql reads these at runtime.
--
-- Run these in the SQL editor (replace with real values from your environment):
--
--   SELECT vault.create_secret(
--     'https://<PROJECT_REF>.supabase.co/functions/v1/send-push',
--     'fcm_push_url'
--   );
--
--   SELECT vault.create_secret(
--     '<SERVICE_ROLE_KEY>',
--     'service_role_key'
--   );
--
-- Where to find these values:
--   PROJECT_REF:      Supabase Dashboard → Project Settings → General → Reference ID
--   SERVICE_ROLE_KEY: Supabase Dashboard → Project Settings → API → Secret keys → default
--
-- Also required (set in Supabase Dashboard → Edge Functions → Secrets):
--   FCM_SERVICE_ACCOUNT: Firebase Console → Project Settings → Service accounts → Generate new private key
-- ═══════════════════════════════════════════


-- ── Interests ─────────────────────────────────────────────────

INSERT INTO public.interests (name) VALUES
  ('Technology'),
  ('Design'),
  ('Business'),
  ('Science'),
  ('Health & Fitness'),
  ('Travel'),
  ('Food & Cooking'),
  ('Music'),
  ('Art'),
  ('Sports'),
  ('Finance'),
  ('Education'),
  ('Gaming'),
  ('Fashion'),
  ('Photography'),
  ('Writing'),
  ('Film & TV'),
  ('Politics'),
  ('History'),
  ('Philosophy'),
  ('Psychology'),
  ('Environment'),
  ('Parenting'),
  ('Self-Improvement'),
  ('Architecture')
ON CONFLICT (name) DO NOTHING;


-- ── Logged Categories ─────────────────────────────────────────

INSERT INTO public.logged_categories (name, slug, color) VALUES
  ('Technology',    'technology',    '#1A5C4B'),
  ('Design',        'design',        '#C94F2C'),
  ('Business',      'business',      '#2C5F8A'),
  ('Finance',       'finance',       '#7A4F9E'),
  ('Science',       'science',       '#2E7D5E'),
  ('Health',        'health',        '#D4882A'),
  ('Politics',      'politics',      '#8B2E2E'),
  ('Culture',       'culture',       '#4A6741'),
  ('Education',     'education',     '#3D5A80'),
  ('Environment',   'environment',   '#3A7D44'),
  ('Entertainment', 'entertainment', '#B5451B'),
  ('Sports',        'sports',        '#1B4F72'),
  ('Food',          'food',          '#A0522D'),
  ('Travel',        'travel',        '#2E6B8A'),
  ('Other',         'other',         '#6B6B6B')
ON CONFLICT (slug) DO NOTHING;


-- ── Events ────────────────────────────────────────────────────

INSERT INTO public.events (type, description) VALUES
  ('view_log',            'User viewed a logged item in the vault'),
  ('save_log',            'User saved or logged a new item'),
  ('comment_log',         'User commented on a content thread'),
  ('share_log',           'User shared a logged item with someone'),
  ('profile_view',        'User viewed another user''s profile'),
  ('external_link_click', 'User opened an external link from a logged item')
ON CONFLICT (type) DO NOTHING;


-- ── Backfill last_activity_at ────────────────────────────────────

-- Groups: latest group post, fallback to created_at
UPDATE public.conversations c
SET last_activity_at = COALESCE(
  (SELECT MAX(gp.shared_at) FROM public.group_posts gp WHERE gp.convo_id = c.id),
  c.created_at
)
WHERE c.is_group = true;

-- DMs: latest message, fallback to created_at
UPDATE public.conversations c
SET last_activity_at = COALESCE(
  (SELECT MAX(m.created_at) FROM public.messages m WHERE m.convo_id = c.id),
  c.created_at
)
WHERE c.is_group = false;


-- ── Backfill default buckets for existing users ─────────────────

INSERT INTO public.buckets (user_id, slug, label, color, is_system)
SELECT p.id, 'tasks', 'Tasks', '#D1FAE5', true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.buckets b WHERE b.user_id = p.id AND b.slug = 'tasks'
);

INSERT INTO public.buckets (user_id, slug, label, color, is_system)
SELECT p.id, 'notes', 'Notes to Self', '#FEF3C7', true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.buckets b WHERE b.user_id = p.id AND b.slug = 'notes'
);
