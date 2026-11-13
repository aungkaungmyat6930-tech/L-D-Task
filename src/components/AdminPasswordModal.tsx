import React, { useState, useEffect } from 'react';
import { Language } from '../utils/translations';
import { Lock, ShieldCheck, KeyRound, Eye, EyeOff, X, Check, AlertCircle } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  mode: 'verify' | 'change';
  targetAdminName?: string;
  currentPasswordStored: string;
  onVerifySuccess: () => void;
  onChangePassword: (newPassword: string) => void;
  onClose: () => void;
  language: Language;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  mode,
  targetAdminName,
  currentPasswordStored,
  onVerifySuccess,
  onChangePassword,
  onClose,
  language,
}) => {
  const [activeMode, setActiveMode] = useState<'verify' | 'change'>(mode);
  const [password, setPassword] = useState('');
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveMode(mode);
      setPassword('');
      setCurrentPwdInput('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPwd(false);
      setError(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentPasswordStored) {
      setError(null);
      onVerifySuccess();
    } else {
      setError(
        language === 'my'
          ? 'Admin Password မှားယွင်းနေပါသည်။ ထပ်မံစစ်ဆေးပြီး ရိုက်ထည့်ပါ။'
          : 'Incorrect Admin password. Please try again.'
      );
    }
  };

  const handleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPwdInput !== currentPasswordStored) {
      setError(
        language === 'my'
          ? 'လက်ရှိ Password မှားယွင်းနေပါသည်။'
          : 'Current password is incorrect.'
      );
      return;
    }
    if (newPassword.trim().length < 4) {
      setError(
        language === 'my'
          ? 'Password အသစ်သည် အနည်းဆုံး စာလုံး ၄ လုံး ရှိရပါမည်။'
          : 'New password must be at least 4 characters.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(
        language === 'my'
          ? 'Password အသစ် နှစ်ခု တူညီမှုမရှိပါ။'
          : 'New passwords do not match.'
      );
      return;
    }

    setError(null);
    onChangePassword(newPassword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow">
              {activeMode === 'verify' ? <Lock className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {activeMode === 'verify'
                  ? language === 'my'
                    ? 'Admin အကောင့် ဝင်ရောက်ရန် Password လိုအပ်သည်'
                    : 'Admin Password Required'
                  : language === 'my'
                  ? 'Admin Password ပြောင်းလဲသတ်မှတ်ရန်'
                  : 'Change Admin Password'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {activeMode === 'verify'
                  ? targetAdminName
                    ? `${targetAdminName} (Admin Access)`
                    : 'Admin Authentication'
                  : language === 'my'
                  ? 'လုံခြုံရေးအတွက် Admin Password အသစ်ပြောင်းလဲခြင်း'
                  : 'Update portal Admin security password'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2 text-xs">
          {mode === 'verify' && (
            <button
              type="button"
              onClick={() => {
                setActiveMode('verify');
                setError(null);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                activeMode === 'verify'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              {language === 'my' ? 'Admin ဝင်ရောက်ရန်' : 'Unlock Admin'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setActiveMode('change');
              setError(null);
            }}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              activeMode === 'change'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            {language === 'my' ? 'Admin Password ပြောင်းရန်' : 'Change Admin Password'}
          </button>
        </div>

        {activeMode === 'verify' ? (
          <form onSubmit={handleVerifySubmit} className="p-6 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {language === 'my'
                    ? 'Admin အခွင့်အရေးများ (ဝန်ထမ်းအဝင်/အထွက်၊ HR Leave ပြင်ဆင်မှု) ကို Password ဖြင့် ကာကွယ်ထားပါသည်။'
                    : 'Admin controls (staff onboarding/offboarding & HR leave alignment) are password-protected.'}
                </p>
                {currentPasswordStored === 'admin123' && (
                  <p className="text-[11px] text-purple-700">
                    {language === 'my'
                      ? 'မူလ Password: admin123 (အပေါ်မှ "Admin Password ပြောင်းရန်" တွင် ပြောင်းနိုင်ပါသည်)'
                      : 'Default Password: admin123 (changeable via "Change Admin Password" tab above)'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'my' ? 'Admin Password ရိုက်ထည့်ပါ' : 'Enter Admin Password'}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full text-sm px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  title={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                {language === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'my' ? 'Admin ဝင်မည်' : 'Unlock Admin'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangeSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'my' ? 'လက်ရှိ Admin Password' : 'Current Admin Password'}
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={currentPwdInput}
                onChange={(e) => setCurrentPwdInput(e.target.value)}
                placeholder={currentPasswordStored === 'admin123' ? 'Default: admin123' : '••••••••'}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'my' ? 'Password အသစ် (အနည်းဆုံး ၄ လုံး)' : 'New Password (min 4 chars)'}
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'my' ? 'Password အသစ် ထပ်မံအတည်ပြုပါ' : 'Confirm New Password'}
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showPwd}
                onChange={(e) => setShowPwd(e.target.checked)}
                className="rounded text-purple-600"
              />
              <span>{language === 'my' ? 'Password ကို ဖော်ပြမည်' : 'Show passwords'}</span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                {language === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'my' ? 'Password သိမ်းဆည်းမည်' : 'Save New Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
