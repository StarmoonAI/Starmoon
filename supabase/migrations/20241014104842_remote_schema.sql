create table "public"."devices" (
    "device_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "mac_address" text not null,
    "user_code" text not null,
    "user_id" uuid
);


alter table "public"."devices" enable row level security;

CREATE UNIQUE INDEX devices_mac_address_key ON public.devices USING btree (mac_address);

CREATE UNIQUE INDEX devices_pkey ON public.devices USING btree (device_id);

CREATE UNIQUE INDEX devices_user_code_key ON public.devices USING btree (user_code);

alter table "public"."devices" add constraint "devices_pkey" PRIMARY KEY using index "devices_pkey";

alter table "public"."devices" add constraint "devices_mac_address_key" UNIQUE using index "devices_mac_address_key";

alter table "public"."devices" add constraint "devices_user_code_key" UNIQUE using index "devices_user_code_key";

alter table "public"."devices" add constraint "devices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."devices" validate constraint "devices_user_id_fkey";

grant delete on table "public"."devices" to "anon";

grant insert on table "public"."devices" to "anon";

grant references on table "public"."devices" to "anon";

grant select on table "public"."devices" to "anon";

grant trigger on table "public"."devices" to "anon";

grant truncate on table "public"."devices" to "anon";

grant update on table "public"."devices" to "anon";

grant delete on table "public"."devices" to "authenticated";

grant insert on table "public"."devices" to "authenticated";

grant references on table "public"."devices" to "authenticated";

grant select on table "public"."devices" to "authenticated";

grant trigger on table "public"."devices" to "authenticated";

grant truncate on table "public"."devices" to "authenticated";

grant update on table "public"."devices" to "authenticated";

grant delete on table "public"."devices" to "service_role";

grant insert on table "public"."devices" to "service_role";

grant references on table "public"."devices" to "service_role";

grant select on table "public"."devices" to "service_role";

grant trigger on table "public"."devices" to "service_role";

grant truncate on table "public"."devices" to "service_role";

grant update on table "public"."devices" to "service_role";

create policy "Authenticated users can update devices"
on "public"."devices"
as permissive
for update
to authenticated
using (true)
with check (true);


create policy "Enable read for authd users"
on "public"."devices"
as permissive
for select
to authenticated
using (true);



