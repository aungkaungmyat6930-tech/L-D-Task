-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
-- Stores each part of the portal's data (users, tasks, leaves, ...) as one JSON row.

create table if not exists public.app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- The app has no Supabase login yet, so the publishable key may read and write.
-- Anyone with the site URL can therefore read/edit this data. Tighten this once you add Supabase Auth.
drop policy if exists "app_state public read" on public.app_state;
create policy "app_state public read" on public.app_state
  for select to anon, authenticated using (true);

drop policy if exists "app_state public write" on public.app_state;
create policy "app_state public write" on public.app_state
  for all to anon, authenticated using (true) with check (true);

-- Push changes to other open browsers in real time.
do $$
begin
  alter publication supabase_realtime add table public.app_state;
exception when duplicate_object then null;
end $$;
