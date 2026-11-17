// Supabase Edge Function for staff logins (admins only). Everyone signs in with email + password.
//  - create: create a login with a temporary password (the person must change it on first sign-in).
//  - set_password: give someone a new temporary password (also creates the login if missing).
//  - ensure_login: make sure a staff member has a login account.
//  - delete_login: remove the login account of a deleted staff member.
// Deploy in Supabase Dashboard -> Edge Functions -> Deploy a new function, name: staff-admin.
// The service-role key is provided by Supabase automatically; it never reaches the browser.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Staff = { email?: string; roleTier?: string; status?: string; name?: string };
const norm = (e?: string | null) => (e ?? '').trim().toLowerCase();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let body: { action?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const loadStaff = async (): Promise<Staff[]> => {
    const { data } = await admin.from('app_state').select('value').eq('key', 'users').maybeSingle();
    return Array.isArray(data?.value) ? (data!.value as Staff[]) : [];
  };

  const findAuthUser = async (email: string) => {
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const found = data.users.find((u) => norm(u.email) === email);
      if (found) return found;
      if (data.users.length < 200) return null;
    }
    return null;
  };

  // Everything below is for admins only.
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: caller, error: callerError } = await admin.auth.getUser(jwt);
  if (callerError || !caller?.user?.email) return json({ error: 'Please sign in again.' }, 401);

  const staff = await loadStaff();
  const me = staff.find((u) => norm(u.email) === norm(caller.user.email));
  if (!me || me.status === 'Resigned' || !['ADMIN', 'SUPER_ADMIN'].includes(me.roleTier ?? '')) {
    return json({ error: 'Only admins can manage staff logins.' }, 403);
  }

  const email = norm(body.email);
  const password = body.password ?? '';
  if (!email) return json({ error: 'Email is required.' }, 400);

  // Remove the login of a staff member who was deleted from the list.
  if (body.action === 'delete_login') {
    if (email === norm(caller.user.email)) return json({ error: 'You cannot delete your own login.' }, 400);
    try {
      const existing = await findAuthUser(email);
      if (!existing) return json({ ok: true, deleted: false });
      const { error } = await admin.auth.admin.deleteUser(existing.id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, deleted: true });
    } catch (e) {
      return json({ error: (e as Error).message ?? 'Something went wrong.' }, 500);
    }
  }

  if (body.action !== 'ensure_login' && password.length < 6) {
    return json({ error: 'Password must be at least 6 characters.' }, 400);
  }

  // 2. The target must be an active staff member. A just-added profile can take a moment
  //    to reach the database, so wait briefly for it.
  let target: Staff | undefined;
  for (let i = 0; i < 10; i++) {
    target = (i === 0 ? staff : await loadStaff()).find((u) => norm(u.email) === email);
    if (target) break;
    await new Promise((r) => setTimeout(r, 700));
  }
  if (!target) return json({ error: 'This email is not in the staff list yet. Save the staff member first.' }, 404);
  if (target.status === 'Resigned') return json({ error: 'This staff member is marked Resigned.' }, 400);

  try {
    const existing = await findAuthUser(email);

    if (body.action === 'ensure_login') {
      if (existing) return json({ ok: true, created: false });
      const { error } = await admin.auth.admin.createUser({
        email,
        password: crypto.randomUUID() + crypto.randomUUID(),
        email_confirm: true,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, created: true });
    }

    if (body.action === 'create') {
      if (existing) {
        return json({ error: 'This email already has a login. Use "Set password" to change it.', exists: true }, 409);
      }
      const { error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { must_change_password: true },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, created: true });
    }

    if (body.action === 'set_password') {
      if (!existing) {
        const { error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { must_change_password: true },
        });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, created: true });
      }
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata ?? {}), must_change_password: true },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, updated: true });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message ?? 'Something went wrong.' }, 500);
  }
});
