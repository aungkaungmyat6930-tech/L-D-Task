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
  const { error } = await supabase.auth.updateUser({ password });
  return error ? error.message : null;
}

export type EmailLoginResult =
  | { kind: 'signed-in' }
  | { kind: 'needs-password' }
  | { kind: 'unavailable' } // helper not deployed: fall back to password sign-in
  | { kind: 'error'; message: string };

/** Member/Viewer sign-in with just their email (via the staff-admin Edge Function). */
export async function emailLogin(email: string): Promise<EmailLoginResult> {
  if (!supabase) return { kind: 'unavailable' };
  const { data, error } = await supabase.functions.invoke('staff-admin', {
    body: { action: 'email_login', email: email.trim().toLowerCase() },
  });
  if (error) {
    let message = error.message;
    let status = 0;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        status = ctx.status;
        const body = await ctx.json();
        if (body?.error) message = body.error;
      }
    } catch {}
    if (!status || status === 404 && !/staff list/i.test(message)) return { kind: 'unavailable' };
    return { kind: 'error', message };
  }
  if (data?.needsPassword) return { kind: 'needs-password' };
  if (!data?.token_hash) return { kind: 'error', message: data?.error ?? 'Could not sign in.' };
  const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (otpError) return { kind: 'error', message: otpError.message };
  return { kind: 'signed-in' };
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
