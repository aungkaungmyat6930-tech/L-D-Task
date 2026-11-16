-- Read-only portal for visitors who are not signed in.
-- Run once in Supabase SQL Editor. Returns the portal data WITHOUT:
--   - the admin password
--   - staff emails and phone numbers (emails are sign-in IDs, so they must stay private)
--   - leave attachments (medical certificates etc.)
create or replace function public.get_public_state()
returns table (key text, value jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select s.key,
         case
           when s.key = 'users' then (
             select coalesce(jsonb_agg(u - 'email' - 'phone'), '[]'::jsonb)
             from jsonb_array_elements(s.value) as u
           )
           when s.key = 'leaves' then (
             select coalesce(jsonb_agg(l - 'attachments'), '[]'::jsonb)
             from jsonb_array_elements(s.value) as l
           )
           else s.value
         end
  from public.app_state s
  where s.key <> 'admin_password';
$$;

grant execute on function public.get_public_state() to anon, authenticated;
