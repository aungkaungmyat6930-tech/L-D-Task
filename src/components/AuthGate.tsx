import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogIn, LogOut, Mail, KeyRound, Loader2 } from 'lucide-react';
import { supabase, STATE_TABLE } from '../lib/supabase';
import App from '../App';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';
type Access = 'checking' | 'allowed' | 'not-registered';

const normalize = (email: string) => email.trim().toLowerCase();

/** Staff sign-in screen in front of the portal. Without Supabase configured it renders the app as before. */
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

  // After sign-in, make sure the email belongs to a staff profile.
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
        const users: { email?: string }[] = Array.isArray(data?.value) ? data!.value : [];
        // No staff list saved yet: first setup, let the first person in.
        const ok = !data || users.some((u) => u.email && normalize(u.email) === normalize(email));
        setAccess(ok ? 'allowed' : 'not-registered');
      });
  }, [session?.user.email]);

  const signOut = async () => {
    try {
      sessionStorage.removeItem('kbz_ld_admin_unlocked_v1');
    } catch {}
    await client.auth.signOut();
    setMode('signin');
  };

  if (!ready) return <Splash />;

  if (session && mode === 'reset') {
    return <AuthCard title="Set a new password"><ResetPasswordForm onDone={() => setMode('signin')} /></AuthCard>;
  }

  if (!session) {
    return (
      <AuthCard
        title={mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset password' : 'Staff sign in'}
      >
        <LoginForm mode={mode} setMode={setMode} />
      </AuthCard>
    );
  }

  if (access === 'checking') return <Splash />;

  if (access === 'not-registered') {
    return (
      <AuthCard title="No staff profile found">
        <p className="text-sm text-slate-600 mb-4">
          <b>{session.user.email}</b> is not in the staff list. Ask an admin to add this email in User
          Management, then sign in again.
        </p>
        <button onClick={signOut} className={btnPrimary}>
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </AuthCard>
    );
  }

  return <App authEmail={session.user.email} onSignOut={signOut} />;
}

function LoginForm({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const client = supabase!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      if (mode === 'signin') {
        const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
      } else if (mode === 'signup') {
        const { data: registered, error: checkError } = await client.rpc('is_registered_email', {
          p_email: cleanEmail,
        });
        if (!checkError && registered === false) {
          setError('This email is not in the staff list. Ask an admin to add it first.');
          return;
        }
        const { data, error } = await client.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(error.message);
        else if (!data.session) setInfo('Account created. Check your email to confirm it, then sign in.');
      } else if (mode === 'forgot') {
        const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        });
        if (error) setError(error.message);
        else setInfo('If this email has an account, a reset link has been sent.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className={labelCls}>Work email</span>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="name@company.com"
          />
        </div>
      </label>
      {mode !== 'forgot' && (
        <label className="block">
          <span className={labelCls}>Password</span>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
            />
          </div>
        </label>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {info && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{info}</p>}

      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
      </button>

      <div className="flex justify-between text-xs text-slate-500 pt-1">
        {mode === 'signin' ? (
          <>
            <button type="button" onClick={() => setMode('signup')} className="hover:text-blue-600">
              First time? Create account
            </button>
            <button type="button" onClick={() => setMode('forgot')} className="hover:text-blue-600">
              Forgot password?
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setMode('signin')} className="hover:text-blue-600">
            ← Back to sign in
          </button>
        )}
      </div>
    </form>
  );
}

function ResetPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputCls.replace('pl-9', 'pl-3')}
        placeholder="New password (at least 6 characters)"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={btnPrimary}>
        Save password
      </button>
    </form>
  );
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="text-center mb-5">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 text-amber-300 font-black flex items-center justify-center mb-2">
            L&amp;D
          </div>
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500">L&amp;D Management Portal</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
    </div>
  );
}

const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
const inputCls =
  'w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
const btnPrimary =
  'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-60';
