alter table "public"."personalities" add column "trait_short_description" text not null default ''::text;

alter table "public"."personalities" add column "voice_id" uuid not null default '6c3eb71a-8d68-4fc6-85c5-27d283ecabc8'::uuid;

alter table "public"."personalities" add constraint "personalities_voice_id_fkey" FOREIGN KEY (voice_id) REFERENCES toys(toy_id) ON DELETE SET DEFAULT not valid;

alter table "public"."personalities" validate constraint "personalities_voice_id_fkey";


