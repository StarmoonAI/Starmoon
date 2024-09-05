alter table "public"."users" drop constraint "users_supervisee_age_check";

alter table "public"."conversations" add column "emotion_model" text;

alter table "public"."users" drop column "supervisee_age";

alter table "public"."users" drop column "supervisee_name";

alter table "public"."users" drop column "supervisee_persona";

alter table "public"."users" drop column "supervisor_name";

alter table "public"."users" add column "supervisee_age" smallint not null default '3'::smallint;

alter table "public"."users" add column "supervisee_name" text not null;

alter table "public"."users" add column "supervisee_persona" text not null;

alter table "public"."users" add column "supervisor_name" text not null;

alter table "public"."users" add constraint "users_supervisee_age_check" CHECK ((supervisee_age > 1)) not valid;

alter table "public"."users" validate constraint "users_supervisee_age_check";


