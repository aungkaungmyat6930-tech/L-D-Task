-- Staff login (run AFTER schema.sql, and AFTER your own email is saved on your profile in the portal).
-- 1. Only emails added in the Staff In/Out portal (and not Resigned) can create a login or sign in.
-- 2. Only signed-in staff can read or change the portal data.

-- True when the email belongs to a staff profile that is not Resigned
-- (or when no staff list exists yet, for first setup).
create or replace function public.is_registered_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    not exists (select 1 from public.app_state where key = 'users')
    or exists (
      select 1
      from public.app_state s,
           jsonb_array_elements(s.value) as u
      where s.key = 'users'
        and lower(trim(u->>'email')) = lower(trim(p_email))
        and coalesce(u->>'status', 'Active') <> 'Resigned'
    );
$$;

grant execute on function public.is_registered_email(text) to anon, authenticated;

-- Block sign-ups for emails that are not in the staff list.
create or replace function public.check_staff_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_registered_email(new.email) then
    raise exception 'This email is not registered in the staff list. Ask an admin to add it.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_staff_signup on auth.users;
create trigger check_staff_signup
  before insert on auth.users
  for each row execute function public.check_staff_signup();

-- Replace the open policies with signed-in-staff-only access.
drop policy if exists "app_state public read" on public.app_state;
drop policy if exists "app_state public write" on public.app_state;
drop policy if exists "app_state staff access" on public.app_state;

create policy "app_state staff access" on public.app_state
  for all to authenticated
  using (public.is_registered_email(auth.jwt() ->> 'email'))
  with check (public.is_registered_email(auth.jwt() ->> 'email'));
