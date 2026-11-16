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

        <div className="glass-showcase-stage rounded-3xl p-4 sm:p-6 border border-white/70 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                  className={`glass-member-card group rounded-[28px] p-5 border cursor-pointer flex flex-col items-center justify-between text-center ${
                    isResigned
                      ? 'border-red-300/80'
                      : isMe
                      ? 'border-amber-400/90 ring-2 ring-amber-400/35'
                      : 'border-white/85 hover:border-white'
                  }`}
                >
                  {/* Top Subtle Corner Indicators (Role + Deadline Alerts) */}
                  <div className="w-full flex items-center justify-between gap-2 min-h-[24px]">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          user.roleTier === 'SUPER_ADMIN'
                            ? 'bg-amber-100/90 text-amber-950 border border-amber-300/80'
                            : user.roleTier === 'ADMIN'
                            ? 'bg-purple-100/90 text-purple-900 border border-purple-200'
                            : user.roleTier === 'VIEWER'
                            ? 'bg-slate-200/80 text-slate-700'
                            : 'bg-white/80 text-slate-700 border border-slate-200/80'
                        }`}
                      >
                        {user.roleTier === 'SUPER_ADMIN' && <Icon3DCrown className="w-3 h-3" />}
                        {user.roleTier === 'ADMIN' && <Icon3DShield className="w-3 h-3" />}
                        <span>
                          {user.roleTier === 'SUPER_ADMIN'
                            ? 'Super Admin'
                            : user.roleTier === 'ADMIN'
                            ? 'Admin'
                            : user.roleTier === 'VIEWER'
                            ? 'Viewer'
                            : 'Member'}
                        </span>
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-extrabold text-amber-700">
                          · {language === 'my' ? 'သင်' : 'You'}
                        </span>
                      )}
                      {isResigned && (
                        <span className="text-[10px] font-extrabold text-red-700">
                          · {language === 'my' ? 'နုတ်ထွက်' : 'Resigned'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {uOverdueCount > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold shadow-xs tabular-nums"
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
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold tabular-nums"
                          title={
                            language === 'my'
                              ? `${user.name} တွင် Deadline နီးနေသော Task ${uDueSoonCount} ခု ရှိပါသည်`
                              : `${user.name} has ${uDueSoonCount} task(s) nearing deadline`
                          }
                        >
                          <Bell className="w-2.5 h-2.5 text-amber-700" />
                          <span>{uDueSoonCount}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Centered 3D Floating Avatar Medallion (Reference Style) */}
                  <div className="my-4 relative flex flex-col items-center">
                    <div className="relative z-10 w-24 h-24 rounded-full p-1 bg-gradient-to-b from-white via-amber-200 to-amber-500 shadow-[0_14px_24px_-8px_rgba(15,23,42,0.35)] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:scale-105">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full rounded-full object-cover bg-slate-100 border-2 border-white"
                      />
                      <span
                        className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          isResigned ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        title={isResigned ? 'Resigned' : 'Active'}
                      />
                    </div>
                    {/* Soft Ground Contact Shadow beneath 3D Medallion */}
                    <div className="w-16 h-2.5 bg-slate-900/15 blur-[3px] rounded-full mt-2 transition-transform duration-300 group-hover:scale-90 group-hover:opacity-75" />
                  </div>

                  {/* Elevated Floating White Pill Nameplate (Exact Reference Focus) */}
                  <div className="w-full flex flex-col items-center">
                    <div className="inline-flex items-center justify-center max-w-full bg-white px-5 py-2 rounded-full shadow-[0_10px_22px_-6px_rgba(15,23,42,0.16)] border border-white group-hover:shadow-[0_12px_26px_-6px_rgba(37,99,235,0.22)] transition-all">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">
                        {user.name}
                      </h4>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 truncate max-w-full mt-2">
                      {user.roleLabel}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate max-w-full">
                      {user.dept || 'L&D Dept'}
                    </p>
                  </div>

                  {/* Clean Unboxed Stats Strip */}
                  <div className="w-full mt-4 pt-3 border-t border-slate-300/50 grid grid-cols-4 gap-1 text-center">
                    <div className="flex flex-col items-center">
                      <Icon3DTasks className="w-4 h-4 mb-0.5" />
                      <span className="text-[11px] font-black text-slate-900 tabular-nums leading-tight">
                        {uTasks.length}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">Tasks</span>
                    </div>
                    <div
                      className="flex flex-col items-center"
                      title={language === 'my' ? `${reportMonth} ရုံးတက်ရက်` : `${reportMonth} Office Days`}
                    >
                      <Icon3DOffice className="w-4 h-4 mb-0.5" />
                      <span className="text-[11px] font-black text-emerald-800 tabular-nums leading-tight">
                        {uAttendance.officePresentDays}d
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">
                        {language === 'my' ? 'ရုံးတက်' : 'Office'}
                      </span>
                    </div>
                    <div
                      className="flex flex-col items-center"
                      title={language === 'my' ? `${reportMonth} ခွင့်ရက်` : `${reportMonth} Leave Days`}
                    >
                      <Icon3DLeaveCalendar className="w-4 h-4 mb-0.5" />
                      <span className="text-[11px] font-black text-teal-800 tabular-nums leading-tight">
                        {uAttendance.approvedLeaveDaysInMonth}d
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">
                        {language === 'my' ? 'ခွင့်' : 'Leave'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Icon3DTrainingClock className="w-4 h-4 mb-0.5" />
                      <span className="text-[11px] font-black text-purple-800 tabular-nums leading-tight">
                        {uHours.toFixed(0)}h
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">Hours</span>
                    </div>
                  </div>

                  {/* Bottom Frosted Pill Actions */}
                  <div className="w-full mt-3.5 pt-3 border-t border-slate-300/40 flex items-center justify-between gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddLeave(user);
                      }}
                      className="flex-1 py-1.5 px-2 bg-white/90 hover:bg-teal-600 text-teal-800 hover:text-white font-bold rounded-full text-[11px] flex items-center justify-center gap-0.5 shadow-xs border border-white transition"
                      title={`+ Submit Leave for ${user.name}`}
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Leave</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddTraining(user);
                      }}
                      className="flex-1 py-1.5 px-2 bg-white/90 hover:bg-purple-700 text-purple-800 hover:text-white font-bold rounded-full text-[11px] flex items-center justify-center gap-0.5 shadow-xs border border-white transition"
                      title={`+ Log Training Topic for ${user.name}`}
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Topic</span>
                    </button>

                    {(isMe || isAdmin) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditProfile(user);
                        }}
                        className="py-1.5 px-2.5 bg-white/90 hover:bg-amber-400 text-amber-800 hover:text-slate-950 font-bold rounded-full text-[11px] flex items-center justify-center gap-1 shadow-xs border border-white transition shrink-0"
                        title={`Edit profile for ${user.name}`}
                      >
                        <UserPen className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="py-1.5 px-2.5 bg-white/90 text-blue-700 rounded-full text-[11px] font-bold inline-flex items-center shadow-xs border border-white shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
