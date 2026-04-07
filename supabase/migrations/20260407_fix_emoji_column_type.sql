-- Heart ❤️ and other emojis can be multi-codepoint (base + variation selector).
-- CHAR(1) truncates them. Change to VARCHAR(8) to support all emoji sequences.
ALTER TABLE public.message_reactions ALTER COLUMN emoji TYPE VARCHAR(8);
ALTER TABLE public.group_posts_comments_reactions ALTER COLUMN emoji TYPE VARCHAR(8);
