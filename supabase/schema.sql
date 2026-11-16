-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Stores the portal's shared data as one JSON document per key.

create table if not exists public.app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- The app has no Supabase Auth login yet, so the browser (anon/publishable key)
-- needs read/write access. Tighten these policies once real auth is added.
drop policy if exists "app_state read"   on public.app_state;
drop policy if exists "app_state insert" on public.app_state;
drop policy if exists "app_state update" on public.app_state;

create policy "app_state read"   on public.app_state for select to anon, authenticated using (true);
create policy "app_state insert" on public.app_state for insert to anon, authenticated with check (true);
create policy "app_state update" on public.app_state for update to anon, authenticated using (true) with check (true);

-- Enable realtime so changes appear instantly on other devices.
do $$
begin
  alter publication supabase_realtime add table public.app_state;
exception when duplicate_object then null;
end $$;
