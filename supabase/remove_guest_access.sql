-- Everyone now signs in before seeing the portal, so remove the visitor (not signed in)
-- database functions. Run once in Supabase SQL Editor.
drop function if exists public.get_public_state();
drop function if exists public.guest_save(text, jsonb);
