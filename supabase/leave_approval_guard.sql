-- Leave approval is Super Admin only, enforced by the database (not just the website).
-- A save is refused when someone who is not an active Super Admin:
--   * approves / rejects (or otherwise changes the status of) a leave request,
--   * adds a leave request that is not "Pending",
--   * marks an attendance day as "Leave".
-- Automatic changes (no signed-in person, e.g. SQL Editor or scheduled jobs) are allowed.
-- Run once in Supabase SQL Editor. Safe to run again.

create or replace function public.is_super_admin_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_state s, jsonb_array_elements(s.value) as u
    where s.key = 'users'
      and lower(trim(u->>'email')) = lower(trim(p_email))
      and u->>'roleTier' = 'SUPER_ADMIN'
      and coalesce(u->>'status', 'Active') <> 'Resigned'
  );
$$;

create or replace function public.guard_leave_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := nullif(auth.jwt() ->> 'email', '');
  v_old jsonb := case when tg_op = 'UPDATE' then old.value else null end;
begin
  if new.key not in ('leaves', 'attendance') then
    return new;
  end if;
  -- First save of the list, or an automatic change: nothing to check.
  if v_old is null or v_actor is null or jsonb_typeof(new.value) <> 'array' then
    return new;
  end if;
  if public.is_super_admin_email(v_actor) then
    return new;
  end if;

  if new.key = 'leaves' then
    if exists (
      select 1
      from jsonb_array_elements(new.value) n
      left join jsonb_array_elements(v_old) o on o->>'id' = n->>'id'
      where (o is null and coalesce(n->>'status', 'Pending') <> 'Pending')
         or (o is not null and (o->>'status') is distinct from (n->>'status'))
    ) then
      raise exception 'Only a Super Admin can approve or reject leave requests.'
        using errcode = '42501';
    end if;
  else
    if exists (
      select 1
      from jsonb_array_elements(new.value) n
      left join jsonb_array_elements(v_old) o on o->>'id' = n->>'id'
      where n->>'status' = 'Leave'
        and (o is null or (o->>'status') is distinct from 'Leave')
    ) then
      raise exception 'Only a Super Admin can mark attendance as Leave.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists app_state_leave_guard on public.app_state;
create trigger app_state_leave_guard
  before insert or update on public.app_state
  for each row execute function public.guard_leave_approval();
