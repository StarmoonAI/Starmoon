alter table "public"."conversations" add column "personality_id" uuid not null default 'a1c073e6-653d-40cf-acc1-891331689409'::uuid;

alter table "public"."conversations" add constraint "conversations_personality_id_fkey" FOREIGN KEY (personality_id) REFERENCES personalities(personality_id) ON DELETE SET DEFAULT not valid;

alter table "public"."conversations" validate constraint "conversations_personality_id_fkey";


