drop policy "Authenticated users can update devices" on "public"."devices";

drop policy "Enable read for authd users" on "public"."devices";

create table "public"."tasks" (
    "task_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "email" text not null,
    "body" text not null,
    "user_id" uuid not null default gen_random_uuid(),
    "is_checked" boolean not null default false
);


alter table "public"."tasks" enable row level security;

alter table "public"."devices" alter column "mac_address" drop not null;

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (task_id);

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."tasks" add constraint "tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_user_id_fkey";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant references on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant trigger on table "public"."tasks" to "anon";

grant truncate on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant references on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant trigger on table "public"."tasks" to "authenticated";

grant truncate on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant references on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant trigger on table "public"."tasks" to "service_role";

grant truncate on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";

create policy "Enable read access for all users"
on "public"."devices"
as permissive
for select
to public
using (true);


create policy "esp users can update devices"
on "public"."devices"
as permissive
for update
to public
using (true)
with check (true);


create policy "Authenticated users can select their own tasks"
on "public"."tasks"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Authenticated users can update their own tasks"
on "public"."tasks"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "public insert"
on "public"."tasks"
as permissive
for insert
to public
with check (true);



