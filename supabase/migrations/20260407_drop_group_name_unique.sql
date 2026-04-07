-- Allow multiple groups with the same name (different users can create "Book Club", etc.)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_group_name_key;
