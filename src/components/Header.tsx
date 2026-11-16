import React, { useRef } from 'react';
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
  ImagePlus,
  Pencil,
  Camera
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
  onOpenEditProfile: () => void;
  onOpenOrgChart: () => void;
  onResetData: () => void;
  onOpenChangeAdminPassword: () => void;
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
  overdueTasksCount: number;
  dueSoonTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
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
  overdueTasksCount,
  dueSoonTasksCount,
}) => {
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
      className="text-white border-b border-white/10 sticky top-0 z-40 shadow-md"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3.5">
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
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                {t.brandName}
              </span>
              <span className="text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                {t.subBrand}
              </span>
            </div>
            <p className="text-xs text-slate-300/90 hidden sm:block mt-0.5">
              {t.portalTagline}
            </p>
          </div>
        </div>

        {/* Workspace Switcher & Tools (Clean Top-Right Cluster) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Org Chart Button */}
          <button
            onClick={onOpenOrgChart}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            title={t.orgChart}
          >
            <Network className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.orgChart}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 rounded-lg border border-amber-600/40 transition-colors whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'my' ? 'ENG' : 'မြန်မာ'}</span>
          </button>

          {/* Active User Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 shadow-inner">
            <span className="text-xs text-slate-300 font-medium hidden xl:inline">
              {t.activeUserContext}
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="bg-slate-900 text-white text-xs font-semibold rounded px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
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
          </div>

          {/* Reset Data Button */}
          <button
            onClick={onResetData}
            title={t.resetData}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Evenly Spread User & Admin Utility Strip */}
      <div className="border-t border-white/10 bg-black/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Active User Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover shadow-sm shrink-0"
            />
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span className="truncate">{currentUser.name}</span>
                {isSuper ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold">
                    <Icon3DCrown className="w-3.5 h-3.5" />
                    <span>Super Admin</span>
                  </span>
                ) : isAnyAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-extrabold">
                    <Icon3DShield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </span>
                ) : currentUser.roleTier === 'VIEWER' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px] font-bold">
                    <Eye className="w-3 h-3" />
                    <span>Viewer</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[10px] font-bold">
                    <User className="w-3 h-3" />
                    <span>Member</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 font-medium truncate">
                {currentUser.roleLabel} · {currentUser.dept}
              </div>
            </div>
          </div>

          {/* Spread-Out Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 flex-1">
            {currentUser.roleTier !== 'VIEWER' && (
              <button
                onClick={onOpenEditProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all whitespace-nowrap"
                title={t.editProfile}
              >
                <UserPen className="w-3.5 h-3.5" />
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-100 bg-cyan-800/75 hover:bg-cyan-700 border border-cyan-400/50 rounded-lg shadow-xs transition whitespace-nowrap"
                >
                  <Palette className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{language === 'my' ? 'Logo / Theme / Font' : 'Theme & Logo'}</span>
                </button>
                <button
                  onClick={onOpenChangeAdminPassword}
                  title={language === 'my' ? 'Admin Password ပြောင်းရန်' : 'Change Admin Password'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-100 bg-purple-700/80 hover:bg-purple-600 border border-purple-400/50 rounded-lg shadow-xs transition whitespace-nowrap"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {language === 'my' ? 'Password ပြောင်း' : 'Change Password'}
                  </span>
                </button>
                <button
                  onClick={onLockAdmin}
                  title={language === 'my' ? 'Admin Lock ချရန်' : 'Lock Admin Session'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lock</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin Alert Notice Bar if overdue, near deadline, or pending leaves exist */}
      {(pendingLeavesCount > 0 || overdueTasksCount > 0 || dueSoonTasksCount > 0) && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
              <span className="flex flex-wrap items-center gap-2">
                <strong>
                  {isSuper
                    ? 'Super Admin Notice:'
                    : isAnyAdmin
                    ? 'Admin Action Notice:'
                    : 'Notice:'}
                </strong>
                {pendingLeavesCount > 0 && (
                  <span
                    className="font-semibold underline cursor-pointer"
                    onClick={() =>
                      onJumpToFiltered ? onJumpToFiltered('leave', 'pending') : onSelectTab('leave')
                    }
                  >
                    {pendingLeavesCount} {t.metricPendingLeaves.toLowerCase()}
                  </span>
                )}
                {overdueTasksCount > 0 && (
                  <span
                    className="font-semibold underline cursor-pointer"
                    onClick={() =>
                      onJumpToFiltered ? onJumpToFiltered('tasks', 'overdue') : onSelectTab('tasks')
                    }
                  >
                    {overdueTasksCount} {t.metricOverdue.toLowerCase()}
                  </span>
                )}
                {dueSoonTasksCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 font-bold bg-amber-950/35 hover:bg-amber-950/55 px-2 py-0.5 rounded-full cursor-pointer transition"
                    onClick={() =>
                      onJumpToFiltered ? onJumpToFiltered('tasks', 'due-soon') : onSelectTab('tasks')
                    }
                  >
                    <Bell className="w-3 h-3 text-yellow-300" />
                    <span>
                      {dueSoonTasksCount} {language === 'my' ? 'Deadline နီးနေသည်' : 'due soon'}
                    </span>
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() =>
                pendingLeavesCount > 0
                  ? onJumpToFiltered
                    ? onJumpToFiltered('leave', 'pending')
                    : onSelectTab('leave')
                  : overdueTasksCount > 0
                  ? onJumpToFiltered
                    ? onJumpToFiltered('tasks', 'overdue')
                    : onSelectTab('tasks')
                  : onJumpToFiltered
                  ? onJumpToFiltered('tasks', 'due-soon')
                  : onSelectTab('tasks')
              }
              className="text-[11px] font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition"
            >
              {language === 'my' ? 'စစ်ဆေးရန် →' : 'Review →'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <nav
        className="border-t border-white/10 px-4 sm:px-6 lg:px-8 overflow-x-auto"
        style={
          navbarImageDataUrl
            ? { background: 'rgba(15, 23, 42, 0.35)' }
            : {
                background: `linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.34)), ${themeColor}`,
              }
        }
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-1.5 text-xs min-w-max lg:min-w-0">
          <div className="flex-1 flex items-center justify-between gap-1.5 sm:gap-2">
            <button
              onClick={() => onSelectTab('directory')}
              style={currentTab === 'directory' ? { backgroundColor: accentColor } : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                currentTab === 'directory'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DTeamDirectory className="w-4 h-4 shrink-0" />
              <span>{t.tabDirectory}</span>
            </button>

            <button
              onClick={() => onSelectTab('tasks')}
              style={currentTab === 'tasks' ? { backgroundColor: accentColor } : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                currentTab === 'tasks'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DTasks className="w-4 h-4 shrink-0" />
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
              style={currentTab === 'leave' ? { backgroundColor: accentColor } : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                currentTab === 'leave'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DLeaveCalendar className="w-4 h-4 shrink-0" />
              <span>{t.tabLeave}</span>
              {pendingLeavesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-amber-500 text-slate-950 font-bold rounded-full">
                  {pendingLeavesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('training')}
              style={currentTab === 'training' ? { backgroundColor: accentColor } : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                currentTab === 'training'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DTrainingClock className="w-4 h-4 shrink-0" />
              <span>{t.tabTraining}</span>
            </button>

            <button
              onClick={() => onSelectTab('weekly')}
              style={currentTab === 'weekly' ? { backgroundColor: accentColor } : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                currentTab === 'weekly'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DWeeklyBoard className="w-4 h-4 shrink-0" />
              <span>{t.tabWeekly}</span>
            </button>

            <button
              onClick={() => onSelectTab('projects')}
              style={currentTab === 'projects' ? { backgroundColor: accentColor } : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                currentTab === 'projects'
                  ? 'text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon3DProjects className="w-4 h-4 shrink-0" />
              <span>{t.tabProjects}</span>
            </button>
          </div>

          {/* Admin & Super Admin Direct Nav Bar Image Upload & Edit Controls */}
          {isAnyAdmin && (
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-white/15 shrink-0">
              <input
                ref={navImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleDirectNavImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => navImageInputRef.current?.click()}
                title={
                  language === 'my'
                    ? 'Navi Bar တွင် ပုံတင်ရန် (Admin / Super Admin)'
                    : 'Upload Image to Navigation Bar'
                }
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/35 transition whitespace-nowrap"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ပုံတင်ရန်' : 'Upload Image'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenAppearanceSettings}
                title={
                  language === 'my'
                    ? 'Logo နှင့် Navi Bar ပုံ Edit လုပ်ရန်'
                    : 'Edit Logo, Nav Bar Image & Theme'
                }
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 transition whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
