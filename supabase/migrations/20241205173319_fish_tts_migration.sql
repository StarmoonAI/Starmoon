-- add tts_model enum
CREATE TYPE tts_model_enum AS ENUM ('FISH', 'AZURE');

-- drop is_famous column
ALTER TABLE personalities DROP COLUMN is_famous;

-- add tts_model column to toys table
ALTER TABLE toys
ADD COLUMN tts_model tts_model_enum DEFAULT 'AZURE';

-- move language_code column from `toys` to `personalities_translations`
ALTER TABLE personalities_translations ADD COLUMN language_code VARCHAR(255);
UPDATE personalities_translations SET language_code = toys.language_code FROM toys WHERE personalities_translations.voice_name = toys.name;
ALTER TABLE personalities_translations ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE personalities_translations ADD CONSTRAINT personalities_translations_language_code_fkey 
    FOREIGN KEY (language_code) REFERENCES languages(code);

-- update azure_code -> tts_code and language_code -> tts_language_code (IS NULLABLE)
ALTER TABLE toys RENAME COLUMN azure_code TO tts_code;
ALTER TABLE toys RENAME COLUMN language_code TO tts_language_code;
ALTER TABLE toys ALTER COLUMN tts_language_code DROP NOT NULL;
