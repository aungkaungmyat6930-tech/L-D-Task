import { supabase } from './supabase';

export type StaffLoginResult = { ok: true; created?: boolean; updated?: boolean } | { ok: false; error: string };

export const staffLoginsEnabled = !!supabase;

/** Calls the `staff-admin` Edge Function (admin only) to create a login or set a staff member's password. */
export async function manageStaffLogin(
  action: 'create' | 'set_password',
  email: string,
  password: string
): Promise<StaffLoginResult> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' };
  const { data, error } = await supabase.functions.invoke('staff-admin', {
    body: { action, email: email.trim().toLowerCase(), password },
  });
  if (error) {
    // Try to surface the function's own message.
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      }
    } catch {}
    if (/Failed to send a request|not found|404/i.test(message)) {
      message = 'Login helper (staff-admin) is not set up in Supabase yet.';
    }
    return { ok: false, error: message };
  }
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true, created: data?.created, updated: data?.updated };
}

/** Lets the signed-in person change their own password. */
export async function changeOwnPassword(password: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.auth.updateUser({ password });
  return error ? error.message : null;
}
