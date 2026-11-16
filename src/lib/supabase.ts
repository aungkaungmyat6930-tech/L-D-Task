import { createClient, SupabaseClient } from '@supabase/supabase-js';

// The publishable (anon) key is safe to ship in the browser; access is governed by RLS policies.
// Values come from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.example).
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://orjjnfyuaoftlzdirbaa.supabase.co';
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'sb_publishable_kcsD-YDAOTm7MNlxYTWXfg_nfRcJVQT';

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const APP_STATE_TABLE = 'app_state';
