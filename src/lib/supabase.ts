import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Defaults so the app connects even without env vars. The publishable key is safe to ship in
// browser code; access is controlled by the row-level security policies in supabase/schema.sql.
const DEFAULT_URL = 'https://orjjnfyuaoftlzdirbaa.supabase.co';
const DEFAULT_KEY = 'sb_publishable_kcsD-YDAOTm7MNlxYTWXfg_nfRcJVQT';

const url =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const key =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_KEY;

/** null when the Supabase env vars are not set: the app then runs on localStorage only. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

export const STATE_TABLE = 'app_state';
