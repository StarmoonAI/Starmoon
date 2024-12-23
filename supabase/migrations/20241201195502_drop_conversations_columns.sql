-- Step 1: Drop the `toy_id` column and its foreign key constraint
ALTER TABLE public.conversations
DROP CONSTRAINT conversations_toy_id_fkey; -- Drop the FK constraint if it exists

ALTER TABLE public.conversations
DROP COLUMN toy_id; -- Drop the `toy_id` column

ALTER TABLE public.conversations
DROP CONSTRAINT conversations_personality_id_fkey;

ALTER TABLE public.conversations
DROP COLUMN personality_id;

ALTER TABLE public.toys
DROP COLUMN hume_ai_config_id;

-- Step 2: Add the `personalities_translation_id` column with a default value
ALTER TABLE public.conversations
ADD COLUMN personalities_translation_id UUID DEFAULT 'c72e233c-0fa2-4915-83fe-d7d72ab878ff';

-- Step 3: Add the foreign key constraint for `personalities_translation_id`
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_personalities_translation_id_fkey
FOREIGN KEY (personalities_translation_id)
REFERENCES public.personalities_translations (personalities_translation_id);