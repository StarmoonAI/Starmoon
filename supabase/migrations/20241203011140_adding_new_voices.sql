-- add new american english male voices
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('Noah', 'You are an american english male voice', 'Noah is an american english male voice', 'papa_john', 'en-US', 'en-US-Andrew2:DragonHDLatestNeural');
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('Jaydon', 'You are an american english male voice', 'Jaydon is an american english male voice', 'papa_john', 'en-US', 'en-US-Brian:DragonHDLatestNeural');
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('River', 'You are an american english male voice', 'River is an american english male voice', 'papa_john', 'en-US', 'en-US-Davis:DragonHDLatestNeural');
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('Cho', 'You are an american english male voice', 'Cho is an american english male voice', 'papa_john', 'en-US', 'en-US-Steffan:DragonHDLatestNeural');

-- add new american english female voices
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('Sophia', 'You are an american english female voice', 'Sophia is an american english female voice', 'mama_mia', 'en-US', 'en-US-Aria:DragonHDLatestNeural');
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('Aaliyah', 'You are an american english female voice', 'Aaliyah is an american english female voice', 'mama_mia', 'en-US', 'en-US-Emma:DragonHDLatestNeural');
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('Emma', 'You are an american english female voice', 'Emma is an american english voice', 'mama_mia', 'en-US', 'en-US-Emma2:DragonHDLatestNeural');
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, language_code, azure_code) VALUES ('Mei', 'You are an american english female voice', 'Mei is an american english voice', 'mama_mia', 'en-US', 'en-US-Jenny:DragonHDLatestNeural');

-- update male personalities_translations to use new voices
UPDATE public.personalities_translations SET voice_name = 'Noah' WHERE personality_key = 'master_chef' AND voice_name = 'Orion';
UPDATE public.personalities_translations SET voice_name = 'Jaydon' WHERE personality_key = 'batman' AND voice_name = 'Orion';
UPDATE public.personalities_translations SET voice_name = 'River' WHERE personality_key = 'geo_guide' AND voice_name = 'Orion';
UPDATE public.personalities_translations SET voice_name = 'Cho' WHERE personality_key = 'starmoon_default' AND voice_name = 'Orion';

-- update female personalities_translations to use new voices
UPDATE public.personalities_translations SET voice_name = 'Sophia' WHERE personality_key = 'art_guru' AND voice_name = 'Selena';
UPDATE public.personalities_translations SET voice_name = 'Aaliyah' WHERE personality_key = 'fitness_coach' AND voice_name = 'Selena';
