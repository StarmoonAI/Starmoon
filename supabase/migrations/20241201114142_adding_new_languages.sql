alter table "public"."personalities" drop constraint "personalities_voice_id_fkey";

alter table "public"."users" drop constraint "users_toy_id_fkey";

create table "public"."languages" (
    "language_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "code" text not null,
    "name" text not null,
    "flag" text not null
);


alter table "public"."languages" enable row level security;

create table "public"."personalities_translations" (
    "personalities_translation_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "trait" text not null,
    "title" text not null,
    "subtitle" text not null,
    "trait_short_description" text not null,
    "personality_key" text not null,
    "voice_name" text not null
);


alter table "public"."personalities_translations" enable row level security;

alter table "public"."personalities" drop column "emoji";

alter table "public"."personalities" drop column "subtitle";

alter table "public"."personalities" drop column "title";

alter table "public"."personalities" drop column "trait";

alter table "public"."personalities" drop column "trait_short_description";

alter table "public"."personalities" drop column "voice_id";

alter table "public"."personalities" add column "is_famous" boolean not null default false;

alter table "public"."personalities" add column "key" text not null default ''::text;

alter table "public"."toys" drop column "expanded_prompt";

alter table "public"."toys" add column "azure_code" text not null default ''::text;

alter table "public"."toys" add column "language_code" text not null default 'en-US'::text;

alter table "public"."users" drop column "toy_id";

alter table "public"."users" add column "language_code" text not null default 'en-US'::text;

-- grant permissions
grant delete on table "public"."languages" to "anon";

grant insert on table "public"."languages" to "anon";

grant references on table "public"."languages" to "anon";

grant select on table "public"."languages" to "anon";

grant trigger on table "public"."languages" to "anon";

grant truncate on table "public"."languages" to "anon";

grant update on table "public"."languages" to "anon";

grant delete on table "public"."languages" to "authenticated";

grant insert on table "public"."languages" to "authenticated";

grant references on table "public"."languages" to "authenticated";

grant select on table "public"."languages" to "authenticated";

grant trigger on table "public"."languages" to "authenticated";

grant truncate on table "public"."languages" to "authenticated";

grant update on table "public"."languages" to "authenticated";

grant delete on table "public"."languages" to "service_role";

grant insert on table "public"."languages" to "service_role";

grant references on table "public"."languages" to "service_role";

grant select on table "public"."languages" to "service_role";

grant trigger on table "public"."languages" to "service_role";

grant truncate on table "public"."languages" to "service_role";

grant update on table "public"."languages" to "service_role";

grant delete on table "public"."personalities_translations" to "anon";

grant insert on table "public"."personalities_translations" to "anon";

grant references on table "public"."personalities_translations" to "anon";

grant select on table "public"."personalities_translations" to "anon";

grant trigger on table "public"."personalities_translations" to "anon";

grant truncate on table "public"."personalities_translations" to "anon";

grant update on table "public"."personalities_translations" to "anon";

grant delete on table "public"."personalities_translations" to "authenticated";

grant insert on table "public"."personalities_translations" to "authenticated";

grant references on table "public"."personalities_translations" to "authenticated";

grant select on table "public"."personalities_translations" to "authenticated";

grant trigger on table "public"."personalities_translations" to "authenticated";

grant truncate on table "public"."personalities_translations" to "authenticated";

grant update on table "public"."personalities_translations" to "authenticated";

grant delete on table "public"."personalities_translations" to "service_role";

grant insert on table "public"."personalities_translations" to "service_role";

grant references on table "public"."personalities_translations" to "service_role";

grant select on table "public"."personalities_translations" to "service_role";

grant trigger on table "public"."personalities_translations" to "service_role";

grant truncate on table "public"."personalities_translations" to "service_role";

grant update on table "public"."personalities_translations" to "service_role";

create policy "auth read"
on "public"."languages"
as permissive
for select
to authenticated
using (true);


create policy "auth read"
on "public"."personalities_translations"
as permissive
for select
to public
using (true);


