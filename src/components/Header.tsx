import React from 'react';
import { UserProfile, TabType } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { isSuperAdmin, isAdminOrSuper } from '../utils/roleHelpers';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  CalendarDays, 
  Clock, 
  FolderKanban, 
  UserPen, 
  Network, 
  RotateCcw,
  Globe,
  ShieldCheck,
  Crown,
  User,
  Eye,
  AlertTriangle,
  KeyRound,
  Lock
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onOpenEditProfile: () => void;
  onOpenOrgChart: () => void;
  onResetData: () => void;
  onOpenChangeAdminPassword: () => void;
  onLockAdmin: () => void;
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onJumpToFiltered?: (tab: 'tasks' | 'leave', filter: 'overdue' | 'pending') => void;
  language: Language;
  onToggleLanguage: () => void;
  pendingLeavesCount: number;
  overdueTasksCount: number;
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
  currentTab,
  onSelectTab,
  onJumpToFiltered,
  language,
  onToggleLanguage,
  pendingLeavesCount,
  overdueTasksCount,
}) => {
  const t = TRANSLATIONS[language];
  const isSuper = isSuperAdmin(currentUser.roleTier);
  const isAnyAdmin = isAdminOrSuper(currentUser.roleTier);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center font-extrabold text-slate-950 text-base shadow-sm ring-2 ring-amber-400/40 shrink-0">
            KBZ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                {t.brandName}
              </span>
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-md whitespace-nowrap">
                {t.subBrand}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {t.portalTagline}
            </p>
          </div>
        </div>

        {/* User Context, Profile & Action Zone */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Org Chart Button */}
          <button
            onClick={onOpenOrgChart}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            title={t.orgChart}
          >
            <Network className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t.orgChart}</span>
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
            <span className="text-xs text-slate-300 font-medium hidden lg:inline">
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

          {/* Current User Profile Pill & Quick Edit Name */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-700">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border-2 border-amber-400 object-cover shadow-sm shrink-0"
            />
            <div className="hidden xl:block text-left leading-tight">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                {currentUser.name}
                {isSuper ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                ) : isAnyAdmin ? (
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                ) : currentUser.roleTier === 'VIEWER' ? (
                  <Eye className="w-3 h-3 text-slate-400" />
                ) : (
                  <User className="w-3 h-3 text-blue-400" />
                )}
              </div>
              <div className="text-[10px] text-amber-300 font-medium truncate max-w-[140px]">
                {isSuper ? 'Super Admin · ' : isAnyAdmin ? 'Admin · ' : ''}
                {currentUser.roleLabel}
              </div>
            </div>

            {/* Direct Edit My Name / Profile button */}
            {currentUser.roleTier !== 'VIEWER' && (
              <button
                onClick={onOpenEditProfile}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all whitespace-nowrap"
                title={t.editProfile}
              >
                <UserPen className="w-3.5 h-3.5" />
                <span>{t.editProfile}</span>
              </button>
            )}

            {/* Admin Password & Lock Controls */}
            {isAnyAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenChangeAdminPassword}
                  title={language === 'my' ? 'Admin Password ပြောင်းရန်' : 'Change Admin Password'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-purple-100 bg-purple-700/80 hover:bg-purple-600 border border-purple-400/50 rounded-lg shadow-xs transition whitespace-nowrap"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {language === 'my' ? 'Password ပြောင်း' : 'Change Password'}
                  </span>
                </button>
                <button
                  onClick={onLockAdmin}
                  title={language === 'my' ? 'Admin Lock ချရန်' : 'Lock Admin Session'}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              </div>
            )}

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              title={t.resetData}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Alert Notice Bar if overdue or pending leaves exist */}
      {(pendingLeavesCount > 0 || overdueTasksCount > 0) && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
              <span>
                <strong>
                  {isSuper
                    ? 'Super Admin Notice:'
                    : isAnyAdmin
                    ? 'Admin Action Notice:'
                    : 'Notice:'}
                </strong>{' '}
                {pendingLeavesCount > 0 && (
                  <span
                    className="font-semibold underline cursor-pointer mr-2"
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
              </span>
            </div>
            <button
              onClick={() =>
                pendingLeavesCount > 0
                  ? onJumpToFiltered
                    ? onJumpToFiltered('leave', 'pending')
                    : onSelectTab('leave')
                  : onJumpToFiltered
                  ? onJumpToFiltered('tasks', 'overdue')
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
      <nav className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 py-1 text-xs">
          <button
            onClick={() => onSelectTab('directory')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${
              currentTab === 'directory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.tabDirectory}</span>
          </button>

          <button
            onClick={() => onSelectTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${
              currentTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{t.tabTasks}</span>
            {overdueTasksCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-red-500 text-white font-bold rounded-full">
                {overdueTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('leave')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${
              currentTab === 'leave'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{t.tabLeave}</span>
            {pendingLeavesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-amber-500 text-slate-950 font-bold rounded-full">
                {pendingLeavesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('training')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${
              currentTab === 'training'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.tabTraining}</span>
          </button>

          <button
            onClick={() => onSelectTab('weekly')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${
              currentTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.tabWeekly}</span>
          </button>

          <button
            onClick={() => onSelectTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${
              currentTab === 'projects'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>{t.tabProjects}</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
