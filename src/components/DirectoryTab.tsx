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
import { exportAllMembersMonthlyExcel } from '../utils/excelExport';
import { 
  Users, 
  ArrowRight, 
  UserPen, 
  UserPlus, 
  Plus,
  FileSpreadsheet,
  BellRing
} from 'lucide-react';

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
  onOpenAddTask: (targetMember?: UserProfile) => void;
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
  onOpenAddTask,
  onOpenAddLeave,
  onOpenAddTraining,
  onOpenAddUser,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'resigned'>('all');
  const [reportMonth, setReportMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const isAdmin = currentUser.roleTier === 'ADMIN';
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{language === 'my' ? 'L&D အဖွဲ့ဝင်များနှင့် ကိုယ်ပိုင်မှတ်တမ်းကတ်များ' : 'L&D Team Directory & Member Sheets'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'my' ? 'ကတ်တစ်ခုချင်းစီကို နှိပ်၍ အသေးစိတ် Sheet တွင် Profile, Task, Leave, Training များကို တန်းပြင်နိုင်ပါသည်' : 'Click any card to open the interactive Member Sheet and edit records directly'}
            </p>
          </div>

          {/* Admin Staff In/Out, Month Selector, Team Excel Export & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenAddUser}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ဝန်ထမ်းအဝင်/အထွက် (Admin)' : 'Staff In/Out Portal'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
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
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-2xs"
                title={language === 'my' ? 'အဖွဲ့တစ်ခုလုံး၏ ရုံးတက် & ခွင့် Excel ထုတ်ရန်' : 'Export Team Attendance & Leave Excel (.xlsx)'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'Team Excel (.xlsx)' : 'Team Excel (.xlsx)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setMemberFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  memberFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'my' ? 'အားလုံး' : 'All'} ({allUsers.length})
              </button>
              <button
                onClick={() => setMemberFilter('active')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                  memberFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{language === 'my' ? 'တာဝန်ထမ်းဆောင်ဆဲ (အဝင်)' : 'Active (In)'} ({activeMembersCount})</span>
              </button>
              <button
                onClick={() => setMemberFilter('resigned')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                  memberFilter === 'resigned'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>{language === 'my' ? 'နုတ်ထွက်ပြီး (အထွက်)' : 'Resigned (Out)'} ({resignedMembersCount})</span>
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
            const uOverdueCount = uTasks.filter(
              (item) =>
                item.status === 'Overdue' ||
                (item.status !== 'Completed' && item.status !== 'Cancelled' && item.due < todayStr)
            ).length;
            const uTraining = trainingLogs.filter(
              (tr) =>
                tr.attendeeIds?.includes(user.id) ||
                tr.attendeeNames?.includes(user.name) ||
                tr.coTrainerIds?.includes(user.id) ||
                tr.coTrainerNames?.includes(user.name) ||
                tr.trainerName === user.name
            );
            const uHours = uTraining.reduce((sum, tr) => sum + (tr.calculatedHours || 0), 0);
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
                className={`bg-white p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between ${
                  isResigned
                    ? 'border-red-200 bg-red-50/10'
                    : isMe
                    ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Avatar & Badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-sm bg-slate-100"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isResigned ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        title={isResigned ? 'Resigned' : 'Active'}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                          user.roleTier === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : user.roleTier === 'VIEWER'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.roleTier}
                      </span>
                      {isResigned ? (
                        <span className="text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.2 rounded">
                          {language === 'my' ? 'နုတ်ထွက်ပြီး' : 'Resigned'}
                        </span>
                      ) : isMe ? (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                          {language === 'my' ? 'သင့်အကောင့်' : 'You'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Name & Overdue Noti + Titles */}
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{user.name}</span>
                    {uOverdueCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-extrabold shadow-xs tabular-nums"
                        title={
                          language === 'my'
                            ? `${user.name} တွင် ရက်ကျော်လွန်နေသော Task ${uOverdueCount} ခု ရှိပါသည်`
                            : `${user.name} has ${uOverdueCount} overdue task(s)`
                        }
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                        <BellRing className="w-2.5 h-2.5" />
                        <span>{uOverdueCount}</span>
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{user.roleLabel}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.dept || 'L&D Dept'}</p>
                </div>

                {/* Micro Stats Bar: Tasks, Office Days, Leave Days, Training Hours */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-4 gap-1 text-center">
                  <div className="bg-blue-50/60 p-1 rounded-md">
                    <span className="text-[9px] text-blue-600 font-bold uppercase block">
                      Tasks
                    </span>
                    <span className="text-xs font-extrabold text-blue-900 tabular-nums">
                      {uTasks.length}
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 p-1 rounded-md" title={language === 'my' ? `${reportMonth} ရုံးတက်ရက်` : `${reportMonth} Office Days`}>
                    <span className="text-[9px] text-emerald-700 font-bold uppercase block">
                      {language === 'my' ? 'ရုံးတက်' : 'Office'}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-900 tabular-nums">
                      {uAttendance.officePresentDays}d
                    </span>
                  </div>
                  <div className="bg-teal-50/60 p-1 rounded-md" title={language === 'my' ? `${reportMonth} ခွင့်ရက်` : `${reportMonth} Leave Days`}>
                    <span className="text-[9px] text-teal-600 font-bold uppercase block">
                      {language === 'my' ? 'ခွင့်' : 'Leave'}
                    </span>
                    <span className="text-xs font-extrabold text-teal-900 tabular-nums">
                      {uAttendance.approvedLeaveDaysInMonth}d
                    </span>
                  </div>
                  <div className="bg-purple-50/60 p-1 rounded-md">
                    <span className="text-[9px] text-purple-600 font-bold uppercase block">
                      Hours
                    </span>
                    <span className="text-xs font-extrabold text-purple-900 tabular-nums">
                      {uHours.toFixed(0)}h
                    </span>
                  </div>
                </div>

                {/* Direct 1-Click Action Buttons for this Member (အပေါ်မှရွေးစရာမလိုဘဲ တိုက်ရိုက်ထည့်ရန်) */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddTask(user);
                    }}
                    className="flex-1 py-1.5 px-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-0.5 border border-blue-200 hover:border-blue-600 shadow-xs"
                    title={`+ Add Task for ${user.name}`}
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>Task</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddLeave(user);
                    }}
                    className="flex-1 py-1.5 px-1 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-0.5 border border-teal-200 hover:border-teal-600 shadow-xs"
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
                    className="flex-1 py-1.5 px-1 bg-purple-50 hover:bg-purple-700 text-purple-700 hover:text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-0.5 border border-purple-200 hover:border-purple-700 shadow-xs"
                    title={`+ Log Training Topic for ${user.name}`}
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>Topic</span>
                  </button>
                </div>

                {/* Card Action Link & Edit Profile Shortcut */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span className="flex items-center gap-1 hover:underline">
                    {language === 'my' ? 'Sheet ဖွင့်ရန်' : 'Open Sheet'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  {(isMe || isAdmin) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditProfile(user);
                      }}
                      className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 transition"
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
