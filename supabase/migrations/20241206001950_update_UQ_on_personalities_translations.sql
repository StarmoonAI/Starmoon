-- remove unique contraint on personalities_translations table with unique_personality_voice
ALTER TABLE personalities_translations DROP CONSTRAINT unique_personality_voice;

CREATE UNIQUE INDEX unique_personality_language ON public.personalities_translations USING btree (personality_key, language_code);
ALTER TABLE personalities_translations ADD CONSTRAINT unique_personality_language UNIQUE USING INDEX unique_personality_language;
