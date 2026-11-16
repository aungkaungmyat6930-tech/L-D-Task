import React, { useState } from 'react';
import {
  UserProfile,
  TaskItem,
  LeaveRequest,
  TrainingLog,
  MemberStatus,
  AttendanceRecord,
} from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { computeMemberMonthlyAttendance } from '../utils/attendanceHelpers';
import { isTaskOverdue, isTaskNearDeadline } from '../utils/taskHelpers';
import { getMemberHoursForTrainingLog } from '../utils/trainingHelpers';
import { exportAllMembersMonthlyExcel } from '../utils/excelExport';
import { isAdminOrSuper } from '../utils/roleHelpers';
import { 
  ArrowRight, 
  UserPen, 
  UserPlus, 
  Plus,
  BellRing,
  Bell
} from 'lucide-react';
import {
  Icon3DTeamDirectory,
  Icon3DExcel,
  Icon3DCrown,
  Icon3DShield,
  Icon3DTasks,
  Icon3DOffice,
  Icon3DLeaveCalendar,
  Icon3DTrainingClock,
} from './Icons3D';

interface DirectoryTabProps {
  allUsers: UserProfile[];
  currentUser: UserProfile;
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  trainingLogs: TrainingLog[];
  attendanceOverrides: AttendanceRecord[];
  onNotify?: (msg: string) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenEditProfile: (user?: UserProfile) => void;
  onOpenAddLeave: (targetMember?: UserProfile) => void;
  onOpenAddTraining: (targetMember?: UserProfile) => void;
  onOpenAddUser: () => void;
  language: Language;
}

export const DirectoryTab: React.FC<DirectoryTabProps> = ({
  allUsers,
  currentUser,
  tasks,
  leaves,
  trainingLogs,
  attendanceOverrides,
  onNotify,
  onOpenMemberSheet,
  onOpenEditProfile,
  onOpenAddLeave,
  onOpenAddTraining,
  onOpenAddUser,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'resigned'>('all');
  const [reportMonth, setReportMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleExportAllExcel = () => {
    const filename = exportAllMembersMonthlyExcel({
      users: allUsers,
      monthKey: reportMonth,
      tasks,
      leaves,
      trainingLogs,
      attendanceOverrides,
    });
    onNotify?.(
      language === 'my'
        ? `Excel ဖိုင် "${filename}" ကို ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ။`
        : `Exported ${filename}`
    );
  };

  // Counts for staff status
  const activeMembersCount = allUsers.filter((u) => (u.status || 'Active') === 'Active').length;
  const resignedMembersCount = allUsers.filter((u) => u.status === 'Resigned').length;

  // Filter members
  const filteredUsers = allUsers.filter((user) => {
    const status = user.status || 'Active';
    if (memberFilter === 'active' && status !== 'Active') return false;
    if (memberFilter === 'resigned' && status !== 'Resigned') return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Team Member Cards Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="icon-3d-float shrink-0">
              <Icon3DTeamDirectory className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {language === 'my' ? 'L&D အဖွဲ့ဝင်များနှင့် ကိုယ်ပိုင်မှတ်တမ်းကတ်များ' : 'L&D Team Directory & Member Sheets'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'my' ? 'ကတ်တစ်ခုချင်းစီကို နှိပ်၍ အသေးစိတ် Sheet တွင် Profile, Task, Leave, Training များကို တန်းပြင်နိုင်ပါသည်' : 'Click any card to open the interactive Member Sheet and edit records directly'}
              </p>
            </div>
          </div>

          {/* Admin Staff In/Out, Month Selector, Team Excel Export & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenAddUser}
                className="cube-3d-tile flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-600 rounded-xl border border-blue-400/40 whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ဝန်ထမ်းအဝင်/အထွက် (Admin)' : 'Staff In/Out Portal'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => {
                  if (e.target.value) setReportMonth(e.target.value);
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                title={language === 'my' ? 'ရုံးတက်/ခွင့် စာရင်းလ ရွေးချယ်ရန်' : 'Select month for attendance & Excel export'}
              />
              <button
                type="button"
                onClick={handleExportAllExcel}
                className="cube-3d-tile flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 rounded-lg whitespace-nowrap"
                title={language === 'my' ? 'အဖွဲ့တစ်ခုလုံး၏ ရုံးတက် & ခွင့် Excel ထုတ်ရန်' : 'Export Team Attendance & Leave Excel (.xlsx)'}
              >
                <Icon3DExcel className="w-4 h-4" />
                <span>Team Excel (.xlsx)</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/80">
              <button
                onClick={() => setMemberFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  memberFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'my' ? 'အားလုံး' : 'All'} ({allUsers.length})
              </button>
              <button
                onClick={() => setMemberFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  memberFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {language === 'my' ? 'တာဝန်ထမ်းဆောင်ဆဲ (အဝင်)' : 'Active (In)'} ({activeMembersCount})
              </button>
              <button
                onClick={() => setMemberFilter('resigned')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  memberFilter === 'resigned'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                {language === 'my' ? 'နုတ်ထွက်ပြီး (အထွက်)' : 'Resigned (Out)'} ({resignedMembersCount})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => {
            const isMe = user.id === currentUser.id || user.name === currentUser.name;
            const isResigned = user.status === 'Resigned';
            const uTasks = tasks.filter(
              (item) =>
                item.ownerId === user.id ||
                item.ownerName === user.name ||
                item.coAssigneeIds?.includes(user.id) ||
                item.coAssigneeNames?.includes(user.name)
            );
            const uOverdueCount = uTasks.filter((item) => isTaskOverdue(item, todayStr)).length;
            const uDueSoonCount = uTasks.filter((item) => isTaskNearDeadline(item, todayStr)).length;
            const uTraining = trainingLogs.filter(
              (tr) =>
                tr.attendeeIds?.includes(user.id) ||
                tr.attendeeNames?.includes(user.name) ||
                tr.coTrainerIds?.includes(user.id) ||
                tr.coTrainerNames?.includes(user.name) ||
                tr.trainerName === user.name
            );
            const uHours = uTraining.reduce(
              (sum, tr) => sum + getMemberHoursForTrainingLog(tr, user),
              0
            );
            const uAttendance = computeMemberMonthlyAttendance(
              user,
              reportMonth,
              leaves,
              trainingLogs,
              tasks,
              attendanceOverrides
            );

            return (
              <div
                key={user.id}
                onClick={() => onOpenMemberSheet(user)}
                className={`member-3d-card group p-4 rounded-2xl border cursor-pointer flex flex-col justify-between ${
                  isResigned
                    ? 'border-red-200 bg-gradient-to-b from-white to-red-50/40'
                    : isMe
                    ? 'border-amber-400 bg-gradient-to-b from-white via-amber-50/20 to-amber-50/40 ring-2 ring-amber-400/25'
                    : 'border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Avatar & 3D Role Indicator */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 shadow-md">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full rounded-[13px] object-cover bg-slate-100"
                        />
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                          isResigned ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        title={isResigned ? 'Resigned' : 'Active'}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-2xs ${
                          user.roleTier === 'SUPER_ADMIN'
                            ? 'bg-gradient-to-b from-amber-100 to-amber-200/80 text-amber-950 border border-amber-300'
                            : user.roleTier === 'ADMIN'
                            ? 'bg-gradient-to-b from-purple-100 to-purple-200/70 text-purple-900 border border-purple-200'
                            : user.roleTier === 'VIEWER'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-gradient-to-b from-blue-50 to-blue-100/80 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {user.roleTier === 'SUPER_ADMIN' && <Icon3DCrown className="w-3.5 h-3.5" />}
                        {user.roleTier === 'ADMIN' && <Icon3DShield className="w-3.5 h-3.5" />}
                        <span>{user.roleTier === 'SUPER_ADMIN' ? 'Super Admin' : user.roleTier === 'ADMIN' ? 'Admin' : user.roleTier === 'VIEWER' ? 'Viewer' : 'Member'}</span>
                      </span>
                      {isResigned ? (
                        <span className="text-[10px] font-bold text-red-700">
                          {language === 'my' ? 'နုတ်ထွက်ပြီး' : 'Resigned'}
                        </span>
                      ) : isMe ? (
                        <span className="text-[10px] font-extrabold text-amber-700">
                          {language === 'my' ? '· သင့်အကောင့်' : '· You'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Name & Overdue + Near Deadline Alerts */}
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="truncate">{user.name}</span>
                    {uOverdueCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold shadow-xs tabular-nums"
                        title={
                          language === 'my'
                            ? `${user.name} တွင် ရက်ကျော်လွန်နေသော Task ${uOverdueCount} ခု ရှိပါသည်`
                            : `${user.name} has ${uOverdueCount} overdue task(s)`
                        }
                      >
                        <BellRing className="w-2.5 h-2.5" />
                        <span>{uOverdueCount}</span>
                      </span>
                    )}
                    {uDueSoonCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold tabular-nums"
                        title={
                          language === 'my'
                            ? `${user.name} တွင် Deadline နီးနေသော Task ${uDueSoonCount} ခု ရှိပါသည်`
                            : `${user.name} has ${uDueSoonCount} task(s) nearing deadline`
                        }
                      >
                        <Bell className="w-2.5 h-2.5 text-amber-700" />
                        <span>
                          {uDueSoonCount} {language === 'my' ? 'နီး' : 'soon'}
                        </span>
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium truncate mt-0.5">{user.roleLabel}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.dept || 'L&D Dept'}</p>
                </div>

                {/* Tactile 3D Mini Stat Bar: Tasks, Office, Leave, Hours */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/80 grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-gradient-to-b from-blue-50/90 to-blue-100/50 border border-blue-200/70 p-1.5 rounded-xl flex flex-col items-center">
                    <Icon3DTasks className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] text-blue-700 font-bold leading-none">
                      Tasks
                    </span>
                    <span className="text-xs font-black text-blue-950 tabular-nums mt-0.5">
                      {uTasks.length}
                    </span>
                  </div>
                  <div
                    className="bg-gradient-to-b from-emerald-50/90 to-emerald-100/50 border border-emerald-200/70 p-1.5 rounded-xl flex flex-col items-center"
                    title={language === 'my' ? `${reportMonth} ရုံးတက်ရက်` : `${reportMonth} Office Days`}
                  >
                    <Icon3DOffice className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] text-emerald-700 font-bold leading-none">
                      {language === 'my' ? 'ရုံးတက်' : 'Office'}
                    </span>
                    <span className="text-xs font-black text-emerald-950 tabular-nums mt-0.5">
                      {uAttendance.officePresentDays}d
                    </span>
                  </div>
                  <div
                    className="bg-gradient-to-b from-teal-50/90 to-teal-100/50 border border-teal-200/70 p-1.5 rounded-xl flex flex-col items-center"
                    title={language === 'my' ? `${reportMonth} ခွင့်ရက်` : `${reportMonth} Leave Days`}
                  >
                    <Icon3DLeaveCalendar className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] text-teal-700 font-bold leading-none">
                      {language === 'my' ? 'ခွင့်' : 'Leave'}
                    </span>
                    <span className="text-xs font-black text-teal-950 tabular-nums mt-0.5">
                      {uAttendance.approvedLeaveDaysInMonth}d
                    </span>
                  </div>
                  <div className="bg-gradient-to-b from-purple-50/90 to-purple-100/50 border border-purple-200/70 p-1.5 rounded-xl flex flex-col items-center">
                    <Icon3DTrainingClock className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] text-purple-700 font-bold leading-none">
                      Hours
                    </span>
                    <span className="text-xs font-black text-purple-950 tabular-nums mt-0.5">
                      {uHours.toFixed(0)}h
                    </span>
                  </div>
                </div>

                {/* Direct Leave & Topic 3D Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddLeave(user);
                    }}
                    className="cube-3d-tile flex-1 py-1.5 px-2 bg-gradient-to-b from-teal-50 to-teal-100/80 hover:from-teal-500 hover:to-teal-600 text-teal-800 hover:text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 border border-teal-200 hover:border-teal-600"
                    title={`+ Submit Leave for ${user.name}`}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Leave</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddTraining(user);
                    }}
                    className="cube-3d-tile flex-1 py-1.5 px-2 bg-gradient-to-b from-purple-50 to-purple-100/80 hover:from-purple-600 hover:to-purple-700 text-purple-800 hover:text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 border border-purple-200 hover:border-purple-700"
                    title={`+ Log Training Topic for ${user.name}`}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Topic</span>
                  </button>
                </div>

                {/* Card Action Link & Edit Profile Shortcut */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span className="flex items-center gap-1 group-hover:underline">
                    {language === 'my' ? 'Sheet ဖွင့်ရန်' : 'Open Sheet'}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>

                  {(isMe || isAdmin) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditProfile(user);
                      }}
                      className="text-[11px] text-amber-800 bg-gradient-to-b from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-300/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-2xs"
                      title={`Edit profile for ${user.name}`}
                    >
                      <UserPen className="w-3 h-3" />
                      <span>{language === 'my' ? 'Profile ပြင်ရန်' : 'Edit Profile'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
