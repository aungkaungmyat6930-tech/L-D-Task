-- Audit log: Supabase records every change to the portal data (who, what, when).
-- Written by a database trigger, so it can't be edited or skipped from the website.
-- Only signed-in, active Admins and Super Admins can read it.
-- Run in Supabase SQL Editor (after schema.sql and auth.sql). Safe to run again after updates.

create table if not exists public.audit_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor_email text,                 -- null = automatic (system / scheduled job)
  area        text not null,        -- app_state key: tasks, leaves, users, ...
  action      text not null,        -- added | changed | removed
  item_id     text,
  item_label  text,
  fields      text[]                -- which fields changed (for "changed")
);

-- Whose record it was (task owner, leave/attendance member, trainer, the staff member).
alter table public.audit_log add column if not exists item_owner text;

create index if not exists audit_log_at_idx on public.audit_log (at desc);

alter table public.audit_log enable row level security;

-- True when the email belongs to an active Admin or Super Admin in the staff list.
create or replace function public.is_admin_email(p_email text)
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
      and u->>'roleTier' in ('ADMIN', 'SUPER_ADMIN')
      and coalesce(u->>'status', 'Active') <> 'Resigned'
  );
$$;

drop policy if exists "audit_log admins read" on public.audit_log;
create policy "audit_log admins read" on public.audit_log
  for select to authenticated
  using (public.is_admin_email(auth.jwt() ->> 'email'));
-- No insert/update/delete policies: only the trigger below writes, nobody can change the log.

-- Human-readable name of a record, per area.
create or replace function public.audit_item_label(p_key text, p_item jsonb)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case p_key
    when 'tasks'    then p_item->>'title'
    when 'projects' then p_item->>'title'
    when 'users'    then concat_ws(' · ', p_item->>'name', p_item->>'email')
    when 'training' then concat_ws(' · ', p_item->>'name', p_item->>'date')
    when 'leaves'   then concat_ws(' · ', p_item->>'memberName', p_item->>'type',
                                   concat_ws(' ~ ', p_item->>'start', p_item->>'end'))
    when 'attendance' then concat_ws(' · ',
      (select u->>'name' from public.app_state s, jsonb_array_elements(s.value) u
        where s.key = 'users' and u->>'id' = p_item->>'memberId' limit 1),
      p_item->>'date', p_item->>'status')
    when 'password_requests' then concat_ws(' · ', p_item->>'name', p_item->>'email')
    else coalesce(p_item->>'title', p_item->>'name', p_item->>'id')
  end;
$$;

-- Name of a staff member by id (falls back to the name stored on the record).
create or replace function public.audit_staff_name(p_id text, p_fallback text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u->>'name' from public.app_state s, jsonb_array_elements(s.value) u
      where s.key = 'users' and u->>'id' = p_id limit 1),
    nullif(p_fallback, ''));
$$;

-- Whose record it is: owner (plus co-assignees) for tasks/projects, the member for
-- leaves/attendance, the trainer for training, the person for staff profiles.
create or replace function public.audit_item_owner(p_key text, p_item jsonb)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case p_key
    when 'tasks' then concat_ws(' + ',
      public.audit_staff_name(p_item->>'ownerId', p_item->>'ownerName'),
      nullif(array_to_string(array(
        select coalesce(public.audit_staff_name(c.id, null), c.id)
        from jsonb_array_elements_text(coalesce(p_item->'coAssigneeIds', '[]'::jsonb)) as c(id)), ', '), ''))
    when 'projects' then public.audit_staff_name(p_item->>'ownerId', p_item->>'ownerName')
    when 'leaves' then public.audit_staff_name(p_item->>'memberId', p_item->>'memberName')
    when 'attendance' then public.audit_staff_name(p_item->>'memberId', null)
    when 'training' then nullif(p_item->>'trainerName', '')
    when 'users' then p_item->>'name'
    when 'password_requests' then p_item->>'name'
    else null
  end;
$$;

create or replace function public.log_app_state_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := nullif(auth.jwt() ->> 'email', '');
  v_old jsonb := case when tg_op = 'UPDATE' then old.value else null end;
  v_new jsonb := new.value;
begin
  -- Internal bookkeeping of the overdue e-mails: not interesting for people.
  if new.key = 'overdue_notified' then
    return new;
  end if;
  if v_old is not distinct from v_new then
    return new;
  end if;

  begin
    if jsonb_typeof(v_new) = 'array' and (v_old is null or jsonb_typeof(v_old) = 'array') then
      -- Lists of records with an "id": log each added / removed / changed record.
      insert into public.audit_log (actor_email, area, action, item_id, item_label, fields, item_owner)
      select v_actor, new.key, 'added', n->>'id', public.audit_item_label(new.key, n), null,
             public.audit_item_owner(new.key, n)
      from jsonb_array_elements(v_new) n
      where not exists (
        select 1 from jsonb_array_elements(coalesce(v_old, '[]'::jsonb)) o where o->>'id' = n->>'id');

      insert into public.audit_log (actor_email, area, action, item_id, item_label, fields, item_owner)
      select v_actor, new.key, 'removed', o->>'id', public.audit_item_label(new.key, o), null,
             public.audit_item_owner(new.key, o)
      from jsonb_array_elements(coalesce(v_old, '[]'::jsonb)) o
      where not exists (
        select 1 from jsonb_array_elements(v_new) n where n->>'id' = o->>'id');

      insert into public.audit_log (actor_email, area, action, item_id, item_label, fields, item_owner)
      select v_actor, new.key, 'changed', n->>'id', public.audit_item_label(new.key, n),
             (select array_agg(k order by k)
                from (select jsonb_object_keys(o || n) as k) keys
               where (o -> k) is distinct from (n -> k)),
             public.audit_item_owner(new.key, n)
      from jsonb_array_elements(v_new) n
      join jsonb_array_elements(coalesce(v_old, '[]'::jsonb)) o on o->>'id' = n->>'id'
      where o is distinct from n;

    elsif jsonb_typeof(v_new) = 'object' and (v_old is null or jsonb_typeof(v_old) = 'object') then
      -- Settings objects (e.g. appearance): log which settings changed, never the values.
      insert into public.audit_log (actor_email, area, action, item_id, item_label, fields)
      select v_actor, new.key, 'changed', null, new.key, array_agg(k order by k)
      from (select jsonb_object_keys(coalesce(v_old, '{}'::jsonb) || v_new) as k) keys
      where (coalesce(v_old, '{}'::jsonb) -> k) is distinct from (v_new -> k)
      having count(*) > 0;

    else
      -- Single values (e.g. a setting or the admin password): just note the change.
      insert into public.audit_log (actor_email, area, action, item_id, item_label, fields)
      values (v_actor, new.key, 'changed', null, new.key, null);
    end if;
  exception when others then
    -- Logging must never block saving the portal data.
    raise warning 'audit log failed for %: %', new.key, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists app_state_audit on public.app_state;
create trigger app_state_audit
  after insert or update on public.app_state
  for each row execute function public.log_app_state_change();
