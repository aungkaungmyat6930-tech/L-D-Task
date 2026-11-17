import React, { useCallback, useEffect, useState } from 'react';
import { History, RefreshCw, Search, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { Language } from '../utils/translations';

interface AuditRow {
  id: number;
  at: string;
  actor_email: string | null;
  area: string;
  action: 'added' | 'changed' | 'removed';
  item_id: string | null;
  item_label: string | null;
  fields: string[] | null;
}

const PAGE_SIZE = 100;

const AREA_LABELS: Record<string, { my: string; en: string }> = {
  tasks: { my: 'Task', en: 'Tasks' },
  leaves: { my: 'ခွင့်', en: 'Leaves' },
  training: { my: 'သင်တန်း', en: 'Training' },
  projects: { my: 'Project', en: 'Projects' },
  attendance: { my: 'ရုံးတက်', en: 'Attendance' },
  users: { my: 'ဝန်ထမ်း', en: 'Staff' },
  appearance: { my: 'Logo / Theme', en: 'Logo / Theme' },
  allow_member_deadline: { my: 'Deadline Setting', en: 'Deadline setting' },
  admin_password: { my: 'Admin Password', en: 'Admin password' },
  password_requests: { my: 'Password တောင်းဆိုမှု', en: 'Password requests' },
};

const ACTIONS = {
  added: { my: 'ထည့်သည်', en: 'Added', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', Icon: Plus },
  changed: { my: 'ပြင်သည်', en: 'Changed', cls: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Pencil },
  removed: { my: 'ဖျက်သည်', en: 'Removed', cls: 'bg-red-100 text-red-800 border-red-200', Icon: Trash2 },
} as const;

/** Admins: who changed what, and when (written by the database, read-only here). */
export const AuditTab: React.FC<{ users: UserProfile[]; language: Language }> = ({ users, language }) => {
  const my = language === 'my';
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [area, setArea] = useState('');
  const [actor, setActor] = useState('');
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');

  const nameFor = (email: string | null) => {
    if (!email) return my ? 'System (အလိုအလျောက်)' : 'System (automatic)';
    const u = users.find((x) => (x.email || '').toLowerCase() === email.toLowerCase());
    return u ? u.name : email;
  };

  const load = useCallback(
    async (append: boolean) => {
      if (!supabase) {
        setError('Supabase is not configured.');
        return;
      }
      setLoading(true);
      setError(null);
      const from = append ? rows.length : 0;
      let q = supabase
        .from('audit_log')
        .select('*')
        .order('at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (area) q = q.eq('area', area);
      if (actor === '__system') q = q.is('actor_email', null);
      else if (actor) q = q.eq('actor_email', actor);
      if (searchApplied) q = q.ilike('item_label', `%${searchApplied.replace(/[%_]/g, '')}%`);
      const { data, error: err } = await q;
      setLoading(false);
      if (err) {
        setError(
          /audit_log/.test(err.message) && /exist|find|schema/i.test(err.message)
            ? my
              ? 'Audit log ကို Supabase တွင် မဖွင့်ရသေးပါ (audit_log.sql ကို Run ပါ)။'
              : 'The audit log is not set up in Supabase yet (run audit_log.sql).'
            : err.message
        );
        return;
      }
      const list = (data ?? []) as AuditRow[];
      setRows((prev) => (append ? [...prev, ...list] : list));
      setHasMore(list.length === PAGE_SIZE);
    },
    [area, actor, searchApplied, rows.length, my]
  );

  // Reload from the top whenever a filter changes.
  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, actor, searchApplied]);

  const staffWithEmail = users.filter((u) => u.email);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {my ? 'Audit — ပြင်ဆင်မှု မှတ်တမ်း' : 'Audit — change history'}
              </h2>
              <p className="text-xs text-slate-500">
                {my
                  ? 'ဘယ်သူက ဘာကို ဘယ်အချိန်မှာ ပြင်ခဲ့သလဲ (Admin နှင့် Super Admin သာ မြင်ရသည်)'
                  : 'Who changed what, and when (visible to Admins and Super Admins only)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => load(false)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {my ? 'ပြန်ရယူရန်' : 'Refresh'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
          >
            <option value="">{my ? 'အပိုင်း အားလုံး' : 'All areas'}</option>
            {Object.entries(AREA_LABELS).map(([key, l]) => (
              <option key={key} value={key}>
                {my ? l.my : l.en}
              </option>
            ))}
          </select>
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
          >
            <option value="">{my ? 'လူ အားလုံး' : 'Everyone'}</option>
            {staffWithEmail.map((u) => (
              <option key={u.id} value={(u.email || '').toLowerCase()}>
                {u.name} ({u.email})
              </option>
            ))}
            <option value="__system">{my ? 'System (အလိုအလျောက်)' : 'System (automatic)'}</option>
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchApplied(search.trim());
            }}
            className="relative"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => setSearchApplied(search.trim())}
              placeholder={my ? 'Task / ဝန်ထမ်းအမည် ရှာရန်…' : 'Search task / name…'}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </form>
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 whitespace-nowrap">{my ? 'အချိန်' : 'When'}</th>
                <th className="p-3">{my ? 'ပြင်သူ' : 'Who'}</th>
                <th className="p-3">{my ? 'အပိုင်း' : 'Area'}</th>
                <th className="p-3">{my ? 'လုပ်ဆောင်ချက်' : 'Action'}</th>
                <th className="p-3">{my ? 'အကြောင်းအရာ' : 'Item'}</th>
                <th className="p-3">{my ? 'ပြင်ခဲ့သည့်အကွက်' : 'Changed fields'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    {my ? 'မှတ်တမ်း မရှိသေးပါ။' : 'No changes recorded yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const act = ACTIONS[r.action] ?? ACTIONS.changed;
                  const areaLabel = AREA_LABELS[r.area];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 align-top">
                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600 tabular-nums">
                        {new Date(r.at).toLocaleString('en-GB', {
                          timeZone: 'Asia/Yangon',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-3">
                        <span className="block font-bold text-slate-900">{nameFor(r.actor_email)}</span>
                        {r.actor_email && <span className="block text-[10px] text-slate-400">{r.actor_email}</span>}
                      </td>
                      <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                        {areaLabel ? (my ? areaLabel.my : areaLabel.en) : r.area}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${act.cls}`}>
                          <act.Icon className="w-3 h-3" />
                          {my ? act.my : act.en}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 max-w-[260px] break-words">
                        {r.item_label && r.item_label !== r.area ? r.item_label : '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(r.fields ?? []).map((f) => (
                            <span key={f} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {(hasMore || loading) && (
          <div className="p-3 border-t border-slate-100 text-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => load(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {my ? 'ထပ်ကြည့်ရန်' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
