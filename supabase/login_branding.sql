-- Lets the login page (shown before anyone signs in) read ONLY the pictures it displays:
-- the portal logo and the login team photo. Nothing else is readable without signing in.
-- Run once in Supabase SQL Editor.
create or replace function public.get_login_branding()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'logoType',          value->'logoType',
    'logoText',          value->'logoText',
    'logoImageDataUrl',  value->'logoImageDataUrl',
    'loginImageDataUrl', value->'loginImageDataUrl'
  )
  from public.app_state
  where key = 'appearance';
$$;

grant execute on function public.get_login_branding() to anon, authenticated;
