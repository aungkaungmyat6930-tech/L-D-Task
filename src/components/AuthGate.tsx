import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogIn, LogOut, Mail, KeyRound, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase, STATE_TABLE } from '../lib/supabase';
import { changeOwnPassword, requestPasswordReset } from '../lib/staffLogins';
import App from '../App';

type Mode = 'signin' | 'forgot' | 'reset';
type Access = 'checking' | 'allowed' | 'not-registered' | 'resigned';

const normalize = (email: string) => email.trim().toLowerCase();

/** Staff login in front of the portal. Without Supabase configured it renders the app as before. */
export default function AuthGate() {
  if (!supabase) return <App />;
  return <SupabaseAuthGate />;
}

function SupabaseAuthGate() {
  const client = supabase!;
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>('signin');
  const [access, setAccess] = useState<Access>('checking');
  // Set once the person replaced their temporary password in this session.
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = client.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // After sign-in, make sure the email belongs to an active staff profile.
  useEffect(() => {
    const email = session?.user.email;
    if (!email) return;
    setAccess('checking');
    client
      .from(STATE_TABLE)
      .select('value')
      .eq('key', 'users')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('[supabase] staff check failed:', error.message);
          setAccess('not-registered');
          return;
        }
        // No staff list saved yet: first setup, let the first person in.
        if (!data) {
          setAccess('allowed');
          return;
        }
        const users: { email?: string; status?: string }[] = Array.isArray(data.value) ? data.value : [];
        const matches = users.filter((u) => u.email && normalize(u.email) === normalize(email));
        if (matches.some((u) => u.status !== 'Resigned')) setAccess('allowed');
        else setAccess(matches.length ? 'resigned' : 'not-registered');
      });
  }, [session?.user.email]);

  const signOut = async () => {
    try {
      sessionStorage.removeItem('kbz_ld_admin_unlocked_v1');
    } catch {}
    await client.auth.signOut();
    setMode('signin');
    setPasswordChanged(false);
  };

  if (!ready) return <Splash />;

  // Opened the link from a "reset password" email.
  if (session && mode === 'reset') {
    return (
      <LoginShell>
        <NewPasswordForm
          title="Password အသစ် သတ်မှတ်ရန်"
          subtitle="Set a new password"
          onDone={() => {
            setPasswordChanged(true);
            setMode('signin');
          }}
        />
      </LoginShell>
    );
  }

  if (!session) {
    return (
      <LoginShell>
        <LoginForm mode={mode} setMode={setMode} />
      </LoginShell>
    );
  }

  if (access === 'checking') return <Splash />;

  if (access === 'not-registered' || access === 'resigned') {
    return (
      <LoginShell>
        <h2 className="text-xl font-extrabold text-slate-900">
          {access === 'resigned' ? 'အသုံးပြုခွင့် ရပ်ဆိုင်းထားပါသည်' : 'ဝန်ထမ်းစာရင်းတွင် မတွေ့ပါ'}
        </h2>
        <p className="text-xs text-slate-500 mb-4">{access === 'resigned' ? 'Access ended' : 'No staff profile found'}</p>
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {access === 'resigned' ? (
            <>
              <b>{session.user.email}</b> ကို Resigned အဖြစ် မှတ်ထားသဖြင့် Portal ကို အသုံးပြု၍ မရတော့ပါ။
            </>
          ) : (
            <>
              <b>{session.user.email}</b> သည် ဝန်ထမ်းစာရင်းတွင် မပါဝင်ပါ။ Admin ထံ ဆက်သွယ်ပါ။
            </>
          )}
        </p>
        <button onClick={signOut} className={btnPrimary}>
          <LogOut className="w-4 h-4" /> ထွက်ရန် · Sign out
        </button>
      </LoginShell>
    );
  }

  // First sign-in with the temporary password from the admin: choose your own before continuing.
  if (session.user.user_metadata?.must_change_password && !passwordChanged) {
    return (
      <LoginShell>
        <NewPasswordForm
          title="ကိုယ်ပိုင် Password သတ်မှတ်ပါ"
          subtitle="Replace your temporary password"
          note="Admin ပေးထားသော ယာယီ Password ဖြင့် ဝင်ထားပါသည်။ ဆက်လက်အသုံးပြုရန် ကိုယ်ပိုင် Password အသစ် သတ်မှတ်ပါ။"
          onDone={() => setPasswordChanged(true)}
        />
        <button onClick={signOut} className="mt-4 w-full text-xs text-slate-500 hover:text-red-700">
          ထွက်ရန် · Sign out
        </button>
      </LoginShell>
    );
  }

  return <App authEmail={session.user.email} onSignOut={signOut} />;
}

function LoginForm({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const client = supabase!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const cleanEmail = normalize(email);
      if (mode === 'forgot') {
        const err = await requestPasswordReset(cleanEmail);
        if (err) setError(err);
        else
          setInfo(
            'Admin ထံ တောင်းဆိုမှု ပို့ပြီးပါပြီ။ Admin က ယာယီ Password ပေးပါလိမ့်မည်။ ထို Password ဖြင့် ဝင်ပြီး ကိုယ်ပိုင် Password ပြန်ပြောင်းပါ။ (Request sent to the admins.)'
          );
        return;
      }
      const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email သို့မဟုတ် Password မှားနေပါသည်။ (Wrong email or password)'
            : error.message
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const forgot = mode === 'forgot';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {forgot ? 'Password မေ့နေပါသလား' : 'ဝန်ထမ်း Login'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {forgot ? 'Admin ထံ ယာယီ Password တောင်းရန် · Ask an admin for a temporary password' : 'Sign in to the L&D Task & Work Portal'}
        </p>
      </div>

      <label className="block">
        <span className={labelCls}>Email</span>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="name@gmail.com"
          />
        </div>
      </label>

      {!forgot && (
        <label className="block">
          <span className={labelCls}>Password</span>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-11`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </label>
      )}

      {error && <p className={errorCls}>{error}</p>}
      {info && <p className={infoCls}>{info}</p>}

      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        {forgot ? 'Admin ထံ တောင်းဆိုရန်' : 'ဝင်ရန် · Sign in'}
      </button>

      <div className="flex items-center justify-between text-xs">
        {forgot ? (
          <button type="button" onClick={() => setMode('signin')} className="text-slate-500 hover:text-red-700">
            ← Login သို့ ပြန်သွားရန်
          </button>
        ) : (
          <>
            <span className="text-slate-400">Password ကို Admin ထံမှ ရယူပါ</span>
            <button type="button" onClick={() => setMode('forgot')} className="font-semibold text-red-700 hover:text-red-800">
              Password မေ့နေပါသလား?
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function NewPasswordForm({
  title,
  subtitle,
  note,
  onDone,
}: {
  title: string;
  subtitle: string;
  note?: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password သည် အနည်းဆုံး စာလုံး ၆ လုံး ရှိရပါမည်။');
      return;
    }
    if (password !== confirm) {
      setError('Password နှစ်ခု မတူပါ။ (Passwords do not match)');
      return;
    }
    setBusy(true);
    const err = await changeOwnPassword(password);
    setBusy(false);
    if (err) setError(err);
    else onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-3">
          <ShieldCheck className="w-5 h-5 text-red-700" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {note && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">{note}</p>}
      <label className="block">
        <span className={labelCls}>Password အသစ်</span>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={show ? 'text' : 'password'}
            required
            autoFocus
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputCls} pr-11`}
            placeholder="အနည်းဆုံး ၆ လုံး"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </label>
      <label className="block">
        <span className={labelCls}>Password အသစ် (ထပ်ရိုက်ပါ)</span>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={show ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        </div>
      </label>
      {error && <p className={errorCls}>{error}</p>}
      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        Password သိမ်းပြီး ဆက်သွားရန်
      </button>
    </form>
  );
}

type LoginBranding = {
  logoType?: 'badge' | 'image';
  logoText?: string;
  logoImageDataUrl?: string;
  loginImageDataUrl?: string;
};

const BRANDING_CACHE_KEY = 'kbz_ld_login_branding_v1';

/** Logo and team photo for the login page, as set by admins (public, read-only). */
function useLoginBranding(): LoginBranding {
  const [branding, setBranding] = useState<LoginBranding>(() => {
    try {
      return JSON.parse(localStorage.getItem(BRANDING_CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    if (!supabase) return;
    supabase.rpc('get_login_branding').then(({ data, error }) => {
      if (error || !data || typeof data !== 'object') return;
      setBranding(data as LoginBranding);
      try {
        localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(data));
      } catch {
        /* storage full: just don't cache */
      }
    });
  }, []);
  return branding;
}

/** Full-screen login layout: the team photo with the form card beside it (stacked on phones). */
function LoginShell({ children }: { children: React.ReactNode }) {
  const branding = useLoginBranding();
  const teamPhoto = branding.loginImageDataUrl || '/login-team.webp';
  const customLogo = branding.logoType === 'image' && branding.logoImageDataUrl;
  const logoText = (branding.logoText || 'KBZ').trim() || 'KBZ';

  return (
    <div className="min-h-screen w-full bg-[#2a0505] bg-[radial-gradient(ellipse_at_top_left,#8f1212_0%,#4a0909_45%,#1f0404_100%)] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/15">
            <img
              src={teamPhoto}
              alt="Learning & Development team"
              className="w-full h-auto max-h-[70vh] object-cover block"
              onError={(e) => {
                if (!e.currentTarget.src.endsWith('/login-team.webp')) e.currentTarget.src = '/login-team.webp';
              }}
            />
          </div>
          <p className="hidden lg:block mt-4 text-center text-sm font-semibold text-amber-100/80 tracking-wide">
            Learning &amp; Development · KBZ Life Insurance
          </p>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              {customLogo ? (
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-md ring-2 ring-amber-200 overflow-hidden shrink-0">
                  <img src={branding.logoImageDataUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
              ) : (
                <div className="h-12 min-w-[3.5rem] px-2.5 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 flex flex-col items-center justify-center shadow-md ring-2 ring-amber-200 shrink-0">
                  <span className="text-base font-black tracking-tight text-slate-900 leading-none">{logoText}</span>
                  {logoText.toUpperCase() === 'KBZ' && (
                    <span className="text-[8px] font-extrabold tracking-[0.22em] text-slate-900 leading-none mt-0.5">LIFE</span>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm font-extrabold text-slate-900 leading-tight">L&amp;D Task &amp; Work Portal</p>
                <p className="text-[11px] text-slate-500">ကမ္ဘောဇ အသက်အာမခံ</p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2a0505]">
      <Loader2 className="w-7 h-7 animate-spin text-amber-300" />
    </div>
  );
}

const labelCls = 'block text-xs font-bold text-slate-700 mb-1.5';
const inputCls =
  'w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 focus:bg-white transition';
const btnPrimary =
  'w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 shadow-lg shadow-red-900/30 disabled:opacity-60 transition';
const errorCls = 'text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2';
const infoCls = 'text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2';
