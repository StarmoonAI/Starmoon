create policy "Update user table"
on "public"."users"
as permissive
for update
to anon
using (true)
with check (true);



