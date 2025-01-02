
INSERT INTO public.toys (name, prompt, third_person_prompt, image_src, tts_code, tts_language_code, tts_model)
VALUES ('Jakie', 'You are an American child''s voice', 'Jakie is an American child''s voice', 'aria', 'fcb251ca950343fcb821e725f433b16a', 'en-US', 'FISH');

UPDATE public.personalities_translations
SET voice_name = 'Jakie'
WHERE personalities_translation_id = '29bbfd7c-4389-4215-847a-9f35100dc346';


