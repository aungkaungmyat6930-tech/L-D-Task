import { supabase } from './supabase';

export type StaffLoginResult = { ok: true; created?: boolean; updated?: boolean } | { ok: false; error: string };

export const staffLoginsEnabled = !!supabase;

/** Calls the `staff-admin` Edge Function (admin only) to create a login or set a staff member's password. */
export async function manageStaffLogin(
  action: 'create' | 'set_password' | 'ensure_login' | 'delete_login',
  email: string,
  password = ''
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
  // Also clears the "temporary password" flag set when an admin gave out the password.
  const { error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
  return error ? error.message : null;
}

export type OverdueEmailResult =
  | { ok: true; emailsSent: number; newOverdueTasks: number; failed: { email: string; error: string }[] }
  | { ok: false; error: string };

/** Admins: email staff about overdue tasks. With userId, emails that one person all of their overdue tasks now. */
export async function sendOverdueEmails(userId?: string): Promise<OverdueEmailResult> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' };
  const { data, error } = await supabase.functions.invoke('overdue-reminders', {
    body: userId ? { userId } : {},
  });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const body = await ctx.json();
        if (body?.error) message = body.error;
        else if (ctx.status === 404) message = 'The overdue-reminders function is not set up in Supabase yet.';
      }
    } catch {}
    if (/Failed to send a request/i.test(message)) message = 'The overdue-reminders function is not set up in Supabase yet.';
    return { ok: false, error: message };
  }
  return {
    ok: true,
    emailsSent: data?.emailsSent ?? 0,
    newOverdueTasks: data?.newOverdueTasks ?? 0,
    failed: data?.failed ?? [],
  };
}

/** Login page "forgot password": asks the admins for a temporary password (no sign-in needed). */
export async function requestPasswordReset(email: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.functions.invoke('staff-admin', {
    body: { action: 'request_reset', email: email.trim().toLowerCase() },
  });
  return error ? 'တောင်းဆိုမှု ပို့၍ မရပါ။ ခဏနေမှ ထပ်ကြိုးစားပါ။ (Could not send the request.)' : null;
}
