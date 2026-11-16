-- Lets visitors who are not signed in save member-level changes
-- (tasks, leaves, training hours, attendance, project updates).
-- Staff list, settings and the admin password stay writable by signed-in staff only.
-- Run once in Supabase SQL Editor (after public_view.sql).
create or replace function public.guest_save(p_key text, p_value jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  merged jsonb := p_value;
begin
  if p_key not in ('tasks', 'leaves', 'training', 'attendance', 'projects') then
    raise exception 'Sign in to change %', p_key;
  end if;
  if jsonb_typeof(p_value) <> 'array' then
    raise exception 'Invalid data for %', p_key;
  end if;

  -- Visitors never receive leave attachments, so keep the stored ones for
  -- any leave that arrives without an "attachments" field.
  if p_key = 'leaves' then
    select coalesce(jsonb_agg(
             case
               when l ? 'attachments' then l
               else l || coalesce(
                 (select jsonb_build_object('attachments', o->'attachments')
                  from public.app_state s, jsonb_array_elements(s.value) as o
                  where s.key = 'leaves' and o->>'id' = l->>'id' and o ? 'attachments'
                  limit 1),
                 '{}'::jsonb)
             end), '[]'::jsonb)
      into merged
      from jsonb_array_elements(p_value) as l;
  end if;

  insert into public.app_state (key, value, updated_at)
  values (p_key, merged, now())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.guest_save(text, jsonb) from public;
grant execute on function public.guest_save(text, jsonb) to anon, authenticated;
