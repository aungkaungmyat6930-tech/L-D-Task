import React, { useEffect, useRef, useState } from 'react';
import { changeOwnPassword } from '../lib/staffLogins';
import { UserProfile, TabType, AppearanceSettings } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { isSuperAdmin, isAdminOrSuper } from '../utils/roleHelpers';
import { processBannerImageFile } from '../utils/imageUpload';
import { 
  UserPen, 
  Network, 
  RotateCcw,
  Globe,
  User,
  Eye,
  AlertTriangle,
  KeyRound,
  Lock,
  Palette,
  Bell,
  History,
  ImagePlus,
  Camera,
  LogOut,
  LogIn
} from 'lucide-react';
import {
  Icon3DTeamDirectory,
  Icon3DTasks,
  Icon3DLeaveCalendar,
  Icon3DTrainingClock,
  Icon3DWeeklyBoard,
  Icon3DProjects,
  Icon3DCrown,
  Icon3DShield,
} from './Icons3D';

interface HeaderProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  canSwitchUser?: boolean;
  canResetData?: boolean;
  authEmail?: string;
  onSignOut?: () => void;
  onSignIn?: () => void;
  onOpenEditProfile: () => void;
  onOpenOrgChart: () => void;
  onResetData: () => void;
  onOpenChangeAdminPassword?: () => void;
  onLockAdmin: () => void;
  onOpenAppearanceSettings: () => void;
  onQuickUpdateAppearance?: (patch: Partial<AppearanceSettings>, feedbackMsg?: string) => void;
  appearanceSettings: AppearanceSettings;
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onJumpToFiltered?: (tab: 'tasks' | 'leave', filter: 'overdue' | 'due-soon' | 'pending') => void;
  language: Language;
  onToggleLanguage: () => void;
  pendingLeavesCount: number;
  /** Admins: number of "forgot password" requests waiting for a temporary password. */
  passwordRequestCount?: number;
  onOpenPasswordRequests?: () => void;
  overdueTasksCount: number;
  dueSoonTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  canSwitchUser = true,
  canResetData = true,
  authEmail,
  onSignOut,
  onSignIn,
  onOpenEditProfile,
  onOpenOrgChart,
  onResetData,
  onOpenChangeAdminPassword,
  onLockAdmin,
  onOpenAppearanceSettings,
  onQuickUpdateAppearance,
  appearanceSettings,
  currentTab,
  onSelectTab,
  onJumpToFiltered,
  language,
  onToggleLanguage,
  pendingLeavesCount,
  passwordRequestCount = 0,
  onOpenPasswordRequests,
  overdueTasksCount,
  dueSoonTasksCount,
}) => {
  const [pwOpen, setPwOpen] = useState(false);
  const navScrollRef = useRef<HTMLElement>(null);
  // Keep the selected tab visible when the tab row scrolls sideways.
  useEffect(() => {
    const nav = navScrollRef.current;
    const active = nav?.querySelector<HTMLElement>('[data-nav-tab][data-active="true"]');
    if (nav && active) {
      const left = active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2;
      nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }, [currentTab]);
  const [pwValue, setPwValue] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const submitOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwValue.length < 6) {
      setPwMsg({ ok: false, text: language === 'my' ? 'အနည်းဆုံး စာလုံး ၆ လုံး ရှိရပါမည်။' : 'At least 6 characters.' });
      return;
    }
    setPwBusy(true);
    const err = await changeOwnPassword(pwValue);
    setPwBusy(false);
    if (err) setPwMsg({ ok: false, text: err });
    else {
      setPwValue('');
      setPwMsg({ ok: true, text: language === 'my' ? 'Password ပြောင်းပြီးပါပြီ။' : 'Password changed.' });
    }
  };

  const t = TRANSLATIONS[language];
  const isSuper = isSuperAdmin(currentUser.roleTier);
  const isAnyAdmin = isAdminOrSuper(currentUser.roleTier);
  const themeColor = appearanceSettings.themeColor || '#0f172a';
  const accentColor = appearanceSettings.accentColor || '#2563eb';
  const logoText = appearanceSettings.logoText?.trim() || 'KBZ';
  const logoSize = appearanceSettings.logoSize || 'lg';
  const isCustomLogoImage =
    appearanceSettings.logoType === 'image' && Boolean(appearanceSettings.logoImageDataUrl);
  const navbarImageDataUrl = appearanceSettings.navbarImageDataUrl;
  const navImageInputRef = useRef<HTMLInputElement>(null);

  const logoHeightClass =
    logoSize === 'xl'
      ? 'h-16 sm:h-20'
      : logoSize === 'md'
      ? 'h-12'
      : 'h-14 sm:h-16';

  const badgeWidthClass =
    logoSize === 'xl'
      ? 'min-w-[5.25rem] sm:min-w-[6.25rem] px-3.5'
      : logoSize === 'md'
      ? 'min-w-[3.75rem] sm:min-w-[4.25rem] px-2.5'
      : 'min-w-[4.75rem] sm:min-w-[5.5rem] px-3';

  const handleDirectNavImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onQuickUpdateAppearance) return;
    try {
      const dataUrl = await processBannerImageFile(file, 1440);
      onQuickUpdateAppearance(
        { navbarImageDataUrl: dataUrl },
        language === 'my'
          ? 'Navigation Bar ပုံကို အောင်မြင်စွာ တင်ပြီးပါပြီ။'
          : 'Navigation bar image uploaded.'
      );
    } catch (err) {
      onQuickUpdateAppearance(
        {},
        err instanceof Error ? err.message : 'Failed to upload navigation bar image.'
      );
    } finally {
      e.target.value = '';
    }
  };

  return (
    <header
      className="text-white border-b border-white/10 relative lg:sticky lg:top-0 z-40 shadow-md"
      style={
        navbarImageDataUrl
          ? {
              backgroundColor: themeColor,
              backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.68), rgba(15, 23, 42, 0.78)), url(${navbarImageDataUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: themeColor }
      }
    >
      {/* Top Brand & Workspace Row */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div
            onClick={isAnyAdmin ? onOpenAppearanceSettings : undefined}
            title={
              isAnyAdmin
                ? language === 'my'
                  ? 'KBZ Logo ပြင်ဆင် / ပုံတင်ရန် နှိပ်ပါ'
                  : 'Click to edit or upload KBZ Logo'
                : undefined
            }
            className={`relative shrink-0 ${isAnyAdmin ? 'cursor-pointer group' : ''}`}
          >
            {isCustomLogoImage ? (
              <img
                src={appearanceSettings.logoImageDataUrl}
                alt="Portal Logo"
                className={`${logoHeightClass} w-auto min-w-[3.75rem] max-w-[12rem] rounded-2xl object-contain bg-white/10 p-1 ring-2 ring-white/30 shadow-md transition-transform group-hover:scale-[1.03]`}
              />
            ) : (
              <div
                className={`${logoHeightClass} ${badgeWidthClass} rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex flex-col items-center justify-center font-black text-slate-950 shadow-md ring-2 ring-amber-300/60 transition-transform group-hover:scale-[1.03]`}
              >
                <span
                  className={`${
                    logoSize === 'xl'
                      ? 'text-xl sm:text-2xl'
                      : logoSize === 'md'
                      ? 'text-base sm:text-lg'
                      : 'text-lg sm:text-2xl'
                  } font-black tracking-tight leading-none truncate max-w-full`}
                >
                  {logoText}
                </span>
                {logoText.toUpperCase() === 'KBZ' && (
                  <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.22em] text-slate-900 mt-0.5 leading-none">
                    LIFE
                  </span>
                )}
              </div>
            )}
            {isAnyAdmin && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-amber-300 border border-amber-400/70 flex items-center justify-center shadow-sm group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                <Camera className="w-3 h-3" />
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white whitespace-nowrap">
                {t.brandName}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-3 py-1 rounded-lg whitespace-nowrap">
                {t.subBrand}
              </span>
            </div>
            <p className="text-sm text-slate-300/90 hidden sm:block mt-1">
              {t.portalTagline}
            </p>
          </div>
        </div>

        {/* Workspace Switcher & Tools (Clean Top-Right Cluster) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Reset Data Button */}
          {canResetData && (
          <button
            onClick={onResetData}
            title={t.resetData}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          )}

          {/* Sign in (visitors) */}
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'my' ? 'ဝင်ရန် (Sign in)' : 'Sign in'}</span>
            </button>
          )}

          {/* Sign out (staff login) */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              title={authEmail ? `Sign out (${authEmail})` : 'Sign out'}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-red-100 bg-red-900/50 hover:bg-red-800/70 border border-red-500/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'my' ? 'ထွက်ရန်' : 'Sign out'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Evenly Spread User & Admin Utility Strip */}
      <div className="border-t border-white/10 bg-black/25">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Active User Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full border-2 border-amber-400 object-cover shadow-sm shrink-0"
            />
            <div className="min-w-0 leading-tight">
              <div className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span className="truncate">{currentUser.name}</span>
                {isSuper ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold">
                    <Icon3DCrown className="w-4 h-4" />
                    <span>Super Admin</span>
                  </span>
                ) : isAnyAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[11px] font-extrabold">
                    <Icon3DShield className="w-4 h-4" />
                    <span>Admin</span>
                  </span>
                ) : currentUser.roleTier === 'VIEWER' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-[11px] font-bold">
                    <Eye className="w-3 h-3" />
                    <span>Viewer</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[11px] font-bold">
                    <User className="w-3 h-3" />
                    <span>Member</span>
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-medium truncate">
                {currentUser.roleLabel} · {currentUser.dept}
              </div>
            </div>
          </div>

          {/* Spread-Out Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 flex-1">
            {currentUser.roleTier !== 'VIEWER' && (
              <button
                onClick={onOpenEditProfile}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all whitespace-nowrap"
                title={t.editProfile}
              >
                <UserPen className="w-4 h-4" />
                <span>{t.editProfile}</span>
              </button>
            )}

            {isAnyAdmin && (
              <>
                <button
                  onClick={onOpenAppearanceSettings}
                  title={
                    language === 'my'
                      ? 'Logo, Theme Color နှင့် Font Style ပြင်ဆင်ရန်'
                      : 'Customize Logo, Theme Color & Font Style'
                  }
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-cyan-100 bg-cyan-800/75 hover:bg-cyan-700 border border-cyan-400/50 rounded-lg shadow-xs transition whitespace-nowrap"
                >
                  <Palette className="w-4 h-4 text-cyan-300" />
                  <span>{language === 'my' ? 'Logo / Theme / Font' : 'Theme & Logo'}</span>
                </button>
                {onOpenChangeAdminPassword && (
                <button
                  onClick={onOpenChangeAdminPassword}
                  title={language === 'my' ? 'Admin Password ပြောင်းရန်' : 'Change Admin Password'}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-purple-100 bg-purple-700/80 hover:bg-purple-600 border border-purple-400/50 rounded-lg shadow-xs transition whitespace-nowrap"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>
                    {language === 'my' ? 'Password ပြောင်း' : 'Change Password'}
                  </span>
                </button>
                )}
              </>
            )}
            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 rounded-lg border border-amber-600/40 transition-colors whitespace-nowrap"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'my' ? 'ENG' : 'မြန်မာ'}</span>
            </button>

            {/* Active User Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner">
              <span className="text-sm text-slate-300 font-medium hidden xl:inline">
                {t.activeUserContext}
              </span>
              {!canSwitchUser ? (
                <span className="text-white text-sm font-semibold px-2 py-1">{currentUser.name}</span>
              ) : (
              <select
                value={currentUser.id}
                onChange={(e) => onSwitchUser(e.target.value)}
                className="bg-slate-900 text-white text-sm font-semibold rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                <optgroup label="👑 Super Admins (Full Control + Leave Approval)">
                  {allUsers
                    .filter((u) => u.roleTier === 'SUPER_ADMIN')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        👑 {u.name} ({u.roleLabel})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="🔐 Admins (Management, Except Leave Approval)">
                  {allUsers
                    .filter((u) => u.roleTier === 'ADMIN')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        🔐 {u.name} ({u.roleLabel})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="👤 Team Members (Self-Service: Name, Tasks, Leaves, Hours)">
                  {allUsers
                    .filter((u) => u.roleTier === 'MEMBER')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleLabel})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="👁 Viewers (Read-Only)">
                  {allUsers
                    .filter((u) => u.roleTier === 'VIEWER')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleLabel})
                      </option>
                    ))}
                </optgroup>
              </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admins: staff who forgot their password and are waiting for a temporary one */}
      {isAnyAdmin && passwordRequestCount > 0 && onOpenPasswordRequests && (
        <button
          type="button"
          onClick={onOpenPasswordRequests}
          className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white px-4 py-1.5 text-xs font-bold transition"
        >
          <span className="max-w-[1600px] mx-auto flex items-center justify-center gap-2">
            <Bell className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>
              {language === 'my'
                ? `ဝန်ထမ်း ${passwordRequestCount} ဦး Password မေ့နေပါသည် — ယာယီ Password ပေးရန် နှိပ်ပါ`
                : `${passwordRequestCount} staff forgot their password — click to give a temporary one`}
            </span>
          </span>
        </button>
      )}

      {/* Navigation Tabs Bar */}
      <nav
        ref={navScrollRef}
        className="nav-scroll border-t border-white/10 px-4 sm:px-6 lg:px-10 overflow-x-auto"
        style={
          navbarImageDataUrl
            ? { background: 'rgba(15, 23, 42, 0.35)' }
            : {
                background: `linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.34)), ${themeColor}`,
              }
        }
      >
        <div className="max-w-[1600px] mx-auto py-2.5 text-sm w-max min-w-full">
          <div className="flex flex-nowrap items-center gap-2">
            <button
              onClick={() => onSelectTab('directory')}
              data-active={currentTab === 'directory'}
              style={currentTab === 'directory' ? { backgroundColor: accentColor } : undefined}
              data-nav-tab
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                currentTab === 'directory'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DTeamDirectory className="w-5 h-5 shrink-0" />
              <span>{t.tabDirectory}</span>
            </button>

            <button
              onClick={() => onSelectTab('tasks')}
              data-active={currentTab === 'tasks'}
              style={currentTab === 'tasks' ? { backgroundColor: accentColor } : undefined}
              data-nav-tab
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                currentTab === 'tasks'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DTasks className="w-5 h-5 shrink-0" />
              <span>{t.tabTasks}</span>
              {overdueTasksCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-red-500 text-white font-bold rounded-full">
                  {overdueTasksCount}
                </span>
              )}
              {dueSoonTasksCount > 0 && (
                <span
                  className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-amber-400 text-slate-950 font-bold rounded-full"
                  title={language === 'my' ? 'Deadline နီးနေသော Task များ' : 'Tasks nearing deadline'}
                >
                  {dueSoonTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('leave')}
              data-active={currentTab === 'leave'}
              style={currentTab === 'leave' ? { backgroundColor: accentColor } : undefined}
              data-nav-tab
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                currentTab === 'leave'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DLeaveCalendar className="w-5 h-5 shrink-0" />
              <span>{t.tabLeave}</span>
              {pendingLeavesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-amber-500 text-slate-950 font-bold rounded-full">
                  {pendingLeavesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('training')}
              data-active={currentTab === 'training'}
              style={currentTab === 'training' ? { backgroundColor: accentColor } : undefined}
              data-nav-tab
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                currentTab === 'training'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DTrainingClock className="w-5 h-5 shrink-0" />
              <span>{t.tabTraining}</span>
            </button>

            <button
              onClick={() => onSelectTab('weekly')}
              data-active={currentTab === 'weekly'}
              style={currentTab === 'weekly' ? { backgroundColor: accentColor } : undefined}
              data-nav-tab
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                currentTab === 'weekly'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DWeeklyBoard className="w-5 h-5 shrink-0" />
              <span>{t.tabWeekly}</span>
            </button>

            <button
              onClick={() => onSelectTab('projects')}
              data-active={currentTab === 'projects'}
              style={currentTab === 'projects' ? { backgroundColor: accentColor } : undefined}
              data-nav-tab
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                currentTab === 'projects'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DProjects className="w-5 h-5 shrink-0" />
              <span>{t.tabProjects}</span>
            </button>

            {/* Audit: change history, Admins and Super Admins only */}
            {isAnyAdmin && (
              <button
                onClick={() => onSelectTab('audit')}
              data-active={currentTab === 'audit'}
                style={currentTab === 'audit' ? { backgroundColor: accentColor } : undefined}
                data-nav-tab
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  currentTab === 'audit'
                    ? 'text-white shadow-sm'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <History className="w-5 h-5 shrink-0 text-amber-300" />
                <span>Audit</span>
              </button>
            )}
          </div>

        </div>
      </nav>
    
      {pwOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60" onClick={() => setPwOpen(false)}>
          <form
            onSubmit={submitOwnPassword}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-3 text-slate-900"
          >
            <h3 className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              {language === 'my' ? 'Login Password ပြောင်းရန်' : 'Change login password'}
            </h3>
            <p className="text-[11px] text-slate-500">{authEmail}</p>
            <input
              type="password"
              autoFocus
              autoComplete="new-password"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              placeholder={language === 'my' ? 'Password အသစ် (အနည်းဆုံး ၆ လုံး)' : 'New password (at least 6 characters)'}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {pwMsg && (
              <p className={`text-xs font-semibold ${pwMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{pwMsg.text}</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPwOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600">
                {language === 'my' ? 'ပိတ်ရန်' : 'Close'}
              </button>
              <button
                type="submit"
                disabled={pwBusy}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-60"
              >
                {pwBusy ? '...' : language === 'my' ? 'သိမ်းမည်' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
</header>
  );
};
