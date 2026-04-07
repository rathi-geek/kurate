-- Allow multiple groups with the same name (different users can create "Book Club", etc.)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_group_name_key;

-- Increase group name character limit from 20 to 50
ALTER TABLE public.conversations ALTER COLUMN group_name TYPE VARCHAR(50);
