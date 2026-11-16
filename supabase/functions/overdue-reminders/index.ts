// Supabase Edge Function: emails staff when their tasks become overdue.
// Each overdue task is emailed once (again only if its deadline changes and it becomes overdue again).
// Runs daily from Supabase Cron (supabase/overdue_cron.sql) and on demand from the portal (admins).
//
// Secrets (Supabase Dashboard -> Edge Functions -> Secrets):
//   GMAIL_USER          the Gmail address that sends the emails
//   GMAIL_APP_PASSWORD  a Gmail App Password (16 letters) for that address
//   CRON_SECRET         any long random text; the daily cron job sends it to prove it's allowed
//   PORTAL_URL          (optional) the website address, shown as a link in the email
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Staff = { id: string; name?: string; email?: string; roleTier?: string; status?: string };
type Task = {
  id: string;
  title?: string;
  ownerId?: string;
  coAssigneeIds?: string[];
  due?: string;
  status?: string;
  note?: string;
};
const norm = (e?: string | null) => (e ?? '').trim().toLowerCase();
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Today's date in Myanmar time (UTC+6:30), as YYYY-MM-DD. */
const todayMyanmar = () => new Date(Date.now() + 6.5 * 3600_000).toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const load = async (key: string) => {
    const { data } = await admin.from('app_state').select('value').eq('key', key).maybeSingle();
    return data?.value;
  };
  const staff: Staff[] = Array.isArray(await load('users')) ? await load('users') : [];

  // Allowed callers: the daily cron job (secret header) or a signed-in, active admin.
  const cronSecret = Deno.env.get('CRON_SECRET');
  const fromCron = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret;
  if (!fromCron) {
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: caller } = await admin.auth.getUser(jwt);
    const me = staff.find((u) => norm(u.email) === norm(caller?.user?.email));
    if (!me || me.status === 'Resigned' || !['ADMIN', 'SUPER_ADMIN'].includes(me.roleTier ?? '')) {
      return json({ error: 'Only admins (or the daily schedule) can send overdue emails.' }, 403);
    }
  }

  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailPass = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s+/g, '');
  if (!gmailUser || !gmailPass) {
    return json({ error: 'Email is not set up: add GMAIL_USER and GMAIL_APP_PASSWORD in Edge Function secrets.' }, 500);
  }

  const today = todayMyanmar();
  const tasks: Task[] = Array.isArray(await load('tasks')) ? await load('tasks') : [];
  const notifiedRaw = await load('overdue_notified');
  const notified: Record<string, string> = notifiedRaw && typeof notifiedRaw === 'object' ? notifiedRaw : {};

  const isOverdue = (t: Task) =>
    !!t.due && t.due < today && t.status !== 'Completed' && t.status !== 'Cancelled';

  // Tasks that are overdue and haven't been emailed for this deadline yet.
  const fresh = tasks.filter((t) => isOverdue(t) && notified[t.id] !== t.due);

  // Group by recipient (owner + co-assignees).
  const byPerson = new Map<string, { person: Staff; tasks: Task[] }>();
  for (const t of fresh) {
    const ids = new Set([t.ownerId, ...(t.coAssigneeIds ?? [])].filter(Boolean) as string[]);
    for (const id of ids) {
      const person = staff.find((u) => u.id === id);
      if (!person || !person.email || person.status === 'Resigned') continue;
      const entry = byPerson.get(id) ?? { person, tasks: [] };
      entry.tasks.push(t);
      byPerson.set(id, entry);
    }
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });
  const portalUrl = Deno.env.get('PORTAL_URL') ?? '';

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  const emailedTaskIds = new Set<string>();

  for (const { person, tasks: list } of byPerson.values()) {
    const rows = list
      .map(
        (t) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(t.title ?? 'Task')}</td>` +
          `<td style="padding:6px 10px;border-bottom:1px solid #eee;color:#dc2626;font-weight:bold">${esc(t.due ?? '')}</td></tr>`
      )
      .join('');
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b">
        <p>မင်္ဂလာပါ ${esc(person.name ?? '')},</p>
        <p>အောက်ပါ Task ${list.length} ခုသည် Deadline ကျော်လွန်နေပါသည် (Overdue)။ ကျေးဇူးပြု၍ အမြန်ဆုံး ဆောင်ရွက်ပေးပါ။</p>
        <p style="color:#64748b">The following ${list.length} task(s) are past their deadline. Please follow up as soon as possible.</p>
        <table style="border-collapse:collapse;margin:12px 0">
          <tr style="background:#f1f5f9"><th style="padding:6px 10px;text-align:left">Task</th><th style="padding:6px 10px;text-align:left">Deadline</th></tr>
          ${rows}
        </table>
        ${portalUrl ? `<p><a href="${esc(portalUrl)}" style="color:#2563eb">L&amp;D Portal ကို ဖွင့်ရန် / Open the portal</a></p>` : ''}
        <p style="color:#94a3b8;font-size:12px">This is an automatic message from the L&amp;D Task Portal.</p>
      </div>`;
    try {
      await transporter.sendMail({
        from: `"L&D Task Portal" <${gmailUser}>`,
        to: person.email,
        subject: `⚠️ Overdue Task ${list.length} ခု / ${list.length} overdue task(s)`,
        html,
      });
      sent.push(person.email!);
      list.forEach((t) => emailedTaskIds.add(t.id));
    } catch (e) {
      failed.push({ email: person.email!, error: (e as Error).message });
    }
  }

  // Remember what was emailed; forget tasks that no longer exist or are no longer overdue.
  const next: Record<string, string> = {};
  for (const t of tasks) {
    if (!isOverdue(t)) continue;
    if (emailedTaskIds.has(t.id)) next[t.id] = t.due!;
    else if (notified[t.id] === t.due) next[t.id] = notified[t.id];
  }
  await admin
    .from('app_state')
    .upsert({ key: 'overdue_notified', value: next, updated_at: new Date().toISOString() });

  return json({
    ok: failed.length === 0,
    today,
    newOverdueTasks: fresh.length,
    emailsSent: sent.length,
    sentTo: sent,
    failed,
  });
});
