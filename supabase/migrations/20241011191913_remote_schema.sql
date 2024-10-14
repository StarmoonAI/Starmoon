alter table "public"."personalities" add column "emoji" text;

alter table "public"."users" add column "user_info" jsonb not null default '{"user_type": "user", "user_metadata": {}}'::jsonb;

alter table "public"."users" add column "volume_control" smallint not null default '70'::smallint;

alter table "public"."users" add constraint "users_volume_control_check" CHECK (((volume_control <= 100) AND (volume_control > 0))) not valid;

alter table "public"."users" validate constraint "users_volume_control_check";


