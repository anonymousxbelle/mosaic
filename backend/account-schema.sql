-- Run once in a new Supabase project's SQL editor.
create table public.libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000),
  updated_at timestamptz not null default now()
);
alter table public.libraries enable row level security;
revoke all on public.libraries from anon;
grant select,insert,update,delete on public.libraries to authenticated;
create policy "Read own library" on public.libraries for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own library" on public.libraries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own library" on public.libraries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own library" on public.libraries for delete to authenticated using ((select auth.uid()) = user_id);
