import React, { useState, useMemo } from 'react';
import {
  TaskItem,
  UserProfile,
  LeaveRequest,
  TrainingLog,
  AttendanceRecord,
  AttendanceOverrideStatus,
} from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import {
  WeekNumber,
  getWeekOfMonth,
  getWeeksInMonth,
  getWeekLabel,
  getWeekOrdinal,
  getWeekDayRange,
  shiftMonth,
  formatMonthLabel,
  getDefaultDateForMonthWeek,
} from '../utils/weekHelpers';
import { computeMemberMonthlyAttendance, ComputedDayStatus } from '../utils/attendanceHelpers';
import {
  Calendar,
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock4,
  FileCheck2,
  Users,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface WeeklyBoardTabProps {
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  trainingLogs: TrainingLog[];
  attendanceOverrides: AttendanceRecord[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onOpenAddTask: (targetMember?: UserProfile, defaultDate?: string) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddLeave: (targetMember?: UserProfile, defaultDate?: string) => void;
  onOpenEditLeave: (leave: LeaveRequest) => void;
  onApproveLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  onDeleteLeave: (leaveId: string) => void;
  onSetAttendanceOverride: (
    memberId: string,
    date: string,
    status: AttendanceOverrideStatus | null,
    note?: string
  ) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenComments: (task: TaskItem) => void;
  language: Language;
}

export const WeeklyBoardTab: React.FC<WeeklyBoardTabProps> = ({
  tasks,
  leaves,
  trainingLogs,
  attendanceOverrides,
  currentUser,
  allUsers,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onOpenAddLeave,
  onOpenEditLeave,
  onApproveLeave,
  onDeleteLeave,
  onSetAttendanceOverride,
  onOpenMemberSheet,
  onOpenComments,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const isAdmin = currentUser.roleTier === 'ADMIN';
  const isViewer = currentUser.roleTier === 'VIEWER';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedMonth, setSelectedMonth] = useState<string>(() => todayStr.slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(() => getWeekOfMonth(todayStr));
  const [viewMode, setViewMode] = useState<'all' | 'attendance' | 'tasks'>('all');
  const [leaveFilter, setLeaveFilter] = useState<'focus' | 'pending' | 'all'>('focus');
  const [taskScope, setTaskScope] = useState<'all' | 'week'>('all');

  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRequest | null>(null);

  const weeksInMonth = getWeeksInMonth(selectedMonth);
  const safeWeek: WeekNumber = weeksInMonth.includes(selectedWeek) ? selectedWeek : 1;

  const teamMembers = useMemo(
    () => allUsers.filter((u) => u.roleTier !== 'VIEWER' && u.status !== 'Resigned'),
    [allUsers]
  );

  // Compute monthly attendance for every training team member
  const memberSummaries = useMemo(() => {
    return teamMembers.map((member) => ({
      member,
      summary: computeMemberMonthlyAttendance(
        member,
        selectedMonth,
        leaves,
        trainingLogs,
        tasks,
        attendanceOverrides
      ),
    }));
  }, [teamMembers, selectedMonth, leaves, trainingLogs, tasks, attendanceOverrides]);

  // Days in the selected week
  const weekDays = useMemo(() => {
    const first = memberSummaries[0]?.summary.dailyRows.filter((r) => r.week === safeWeek) || [];
    return first.map((r) => ({
      date: r.date,
      dayNum: r.dayNum,
      weekday: r.weekday,
      isWeekend: r.isWeekend,
    }));
  }, [memberSummaries, safeWeek]);

  const { startDay, endDay } = getWeekDayRange(selectedMonth, safeWeek);
  const weekStartStr = `${selectedMonth}-${String(startDay).padStart(2, '0')}`;
  const weekEndStr = `${selectedMonth}-${String(endDay).padStart(2, '0')}`;

  // Leaves overlapping selected week
  const weekOverlappingLeaves = useMemo(
    () => leaves.filter((l) => l.start <= weekEndStr && l.end >= weekStartStr),
    [leaves, weekStartStr, weekEndStr]
  );

  const pendingLeaves = useMemo(() => leaves.filter((l) => l.status === 'Pending'), [leaves]);

  const displayedLeaves = useMemo(() => {
    if (leaveFilter === 'pending') return pendingLeaves;
    if (leaveFilter === 'all') return leaves;
    // 'focus': all Pending leaves + any leaves overlapping the selected week (deduplicated)
    const map = new Map<string, LeaveRequest>();
    pendingLeaves.forEach((l) => map.set(l.id, l));
    weekOverlappingLeaves.forEach((l) => map.set(l.id, l));
    return Array.from(map.values());
  }, [leaveFilter, pendingLeaves, weekOverlappingLeaves, leaves]);

  // Weekly totals for KPI strip
  const weekStats = useMemo(() => {
    let presentCount = 0;
    let trainingCount = 0;
    let approvedLeaveCount = 0;

    memberSummaries.forEach(({ summary }) => {
      summary.dailyRows
        .filter((r) => r.week === safeWeek)
        .forEach((r) => {
          if (r.status === 'Office' || r.status === 'WFH' || r.status === 'Training') {
            presentCount += 1;
          }
          if (r.status === 'Training') trainingCount += 1;
          if (r.status === 'LeaveApproved') approvedLeaveCount += 1;
        });
    });

    return {
      presentCount,
      trainingCount,
      approvedLeaveCount,
      pendingCount: pendingLeaves.length,
    };
  }, [memberSummaries, safeWeek, pendingLeaves.length]);

  const getCellStyle = (status: ComputedDayStatus) => {
    switch (status) {
      case 'Office':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'WFH':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Training':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'LeaveApproved':
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
      case 'LeavePending':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Holiday':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'Weekend':
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusShortLabel = (status: ComputedDayStatus) => {
    switch (status) {
      case 'Office':
        return language === 'my' ? 'ရုံးတက်' : 'Office';
      case 'WFH':
        return 'WFH';
      case 'Training':
        return language === 'my' ? 'သင်တန်း' : 'Training';
      case 'LeaveApproved':
        return language === 'my' ? 'ခွင့် (OK)' : 'Leave';
      case 'LeavePending':
        return language === 'my' ? 'ခွင့် (Pending)' : 'Pending';
      case 'Holiday':
        return language === 'my' ? 'ပိတ်ရက်' : 'Holiday';
      case 'Absent':
        return language === 'my' ? 'ပျက်ကွက်' : 'Absent';
      case 'Weekend':
        return language === 'my' ? 'ပိတ်ရက်' : 'Wknd';
    }
  };

  const days: Array<{ code: TaskItem['day']; labelEn: string; labelMy: string }> = [
    { code: 'Mon', labelEn: 'Monday', labelMy: 'တနင်္လာ' },
    { code: 'Tue', labelEn: 'Tuesday', labelMy: 'အင်္ဂါ' },
    { code: 'Wed', labelEn: 'Wednesday', labelMy: 'ဗုဒ္ဓဟူး' },
    { code: 'Thu', labelEn: 'Thursday', labelMy: 'ကြာသပတေး' },
    { code: 'Fri', labelEn: 'Friday', labelMy: 'သောကြာ' },
    { code: 'Sat', labelEn: 'Saturday', labelMy: 'စနေ' },
    { code: 'Sun', labelEn: 'Sunday', labelMy: 'တနင်္ဂနွေ' },
  ];

  const scopedTasks = useMemo(() => {
    if (taskScope === 'all') return tasks;
    return tasks.filter((item) => item.due >= weekStartStr && item.due <= weekEndStr);
  }, [tasks, taskScope, weekStartStr, weekEndStr]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Weekly Command Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>
                {language === 'my'
                  ? 'အပတ်စဉ် Training Team တက်ရောက်မှု၊ ခွင့်အတည်ပြုမှုနှင့် လုပ်ငန်းခွင်ဇယား'
                  : 'Weekly Training Team Attendance, Leave Approvals & Workload Board'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'my'
                ? 'အပတ်စဉ်အလိုက် ဝန်ထမ်းများ၏ ရုံးတက်/သင်တန်း/ခွင့် အခြေအနေများ၊ ခွင့်တောင်းခံလွှာ Approve/Reject ပြုလုပ်ခြင်းနှင့် Mon–Sun Task များကို တစ်နေရာတည်းတွင် စီမံနိုင်သည်'
                : 'Track daily team attendance, approve or review leave requests, and manage Monday–Sunday tasks'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
              <>
                <button
                  onClick={() =>
                    onOpenAddLeave(
                      currentUser,
                      getDefaultDateForMonthWeek(selectedMonth, safeWeek)
                    )
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addMyLeave}</span>
                </button>

                <button
                  onClick={() =>
                    onOpenAddTask(
                      undefined,
                      getDefaultDateForMonthWeek(selectedMonth, safeWeek)
                    )
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addMyTask}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Month + 1st–5th Week Selector + View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) setSelectedMonth(e.target.value);
                }}
                className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {weeksInMonth.map((wk) => (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setSelectedWeek(wk)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    safeWeek === wk
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {getWeekOrdinal(wk)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'my' ? 'အားလုံးပြ' : 'All Sections'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('attendance')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'attendance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'my' ? 'Attendance & ခွင့်' : 'Attendance & Leave'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tasks')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'tasks' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'my' ? 'Weekly Tasks' : 'Weekly Tasks'}
            </button>
          </div>
        </div>

        {/* 4 Summary Tiles for Selected Week */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">
                {language === 'my' ? 'Training Team ဝန်ထမ်း' : 'Active Training Team'}
              </span>
              <span className="text-lg font-black text-slate-900 tabular-nums">
                {teamMembers.length}
              </span>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 block">
                {language === 'my'
                  ? `${getWeekOrdinal(safeWeek)} ရုံးတက်/သင်တန်း`
                  : `${getWeekOrdinal(safeWeek)} Present Days`}
              </span>
              <span className="text-lg font-black text-emerald-900 tabular-nums">
                {weekStats.presentCount}{' '}
                <span className="text-xs font-semibold text-purple-700">
                  ({weekStats.trainingCount} {language === 'my' ? 'သင်တန်း' : 'training'})
                </span>
              </span>
            </div>
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-700 block">
                {language === 'my' ? 'ယခုအပတ် ခွင့်ယူမှု' : 'Leaves in Selected Week'}
              </span>
              <span className="text-lg font-black text-teal-900 tabular-nums">
                {weekOverlappingLeaves.length}{' '}
                <span className="text-xs font-semibold opacity-80">
                  ({weekStats.approvedLeaveCount}d approved)
                </span>
              </span>
            </div>
            <CalendarDays className="w-5 h-5 text-teal-600" />
          </div>

          <div
            className={`rounded-xl px-4 py-2.5 flex items-center justify-between border ${
              weekStats.pendingCount > 0
                ? 'bg-amber-50 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span
                className={`text-[11px] font-bold block ${
                  weekStats.pendingCount > 0 ? 'text-amber-800' : 'text-slate-500'
                }`}
              >
                {language === 'my' ? 'ခွင့် Approve စောင့်ဆိုင်းဆဲ' : 'Pending Leave Approvals'}
              </span>
              <span
                className={`text-lg font-black tabular-nums ${
                  weekStats.pendingCount > 0 ? 'text-amber-900' : 'text-slate-900'
                }`}
              >
                {weekStats.pendingCount}
              </span>
            </div>
            <Clock4
              className={`w-5 h-5 ${
                weekStats.pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: Training Team Weekly Attendance Matrix + Leave Approvals */}
      {viewMode !== 'tasks' && (
        <div className="space-y-6">
          {/* 1A. Leave Approval & Leave Taken Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-600" />
                  <span>
                    {language === 'my'
                      ? 'ခွင့်တောင်းခံမှုများနှင့် Admin ခွင့်ပြုချက် (Leave Approvals & Requests)'
                      : 'Team Leave Approvals & Requests'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'my'
                    ? 'စောင့်ဆိုင်းဆဲ ခွင့်တောင်းခံလွှာများကို Admin မှ တိုက်ရိုက် Approve / Reject လုပ်နိုင်ပြီး ယခုအပတ် ခွင့်ယူထားသူများကို တစ်ပါတည်း ကြည့်ရှုနိုင်သည်'
                    : 'Review pending leave requests with 1-click Approve/Reject and monitor leaves taken this week'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLeaveFilter('focus')}
                    className={`px-2.5 py-1 rounded transition ${
                      leaveFilter === 'focus'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'my' ? 'Pending & ယခုအပတ်' : 'Pending & This Week'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveFilter('pending')}
                    className={`px-2.5 py-1 rounded transition ${
                      leaveFilter === 'pending'
                        ? 'bg-amber-500 text-white'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    Pending ({pendingLeaves.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveFilter('all')}
                    className={`px-2.5 py-1 rounded transition ${
                      leaveFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'my' ? 'အားလုံး' : 'All'} ({leaves.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2.5">
              {displayedLeaves.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {language === 'my'
                    ? 'ရွေးချယ်ထားသော အပတ်/အခြေအနေအတွင်း ခွင့်မှတ်တမ်း မရှိပါ။'
                    : 'No leave requests match this filter.'}
                </div>
              ) : (
                displayedLeaves.map((leave) => {
                  const member = allUsers.find(
                    (u) => u.id === leave.memberId || u.name === leave.memberName
                  );
                  const isMyLeave =
                    leave.memberId === currentUser.id || leave.memberName === currentUser.name;
                  const canEdit = (isMyLeave || isAdmin) && !isViewer;

                  return (
                    <div
                      key={leave.id}
                      className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 transition ${
                        leave.status === 'Pending'
                          ? 'bg-amber-50/50 border-amber-200'
                          : leave.status === 'Approved'
                          ? 'bg-emerald-50/20 border-emerald-200/80'
                          : 'bg-red-50/20 border-red-200/70'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {member && (
                          <img
                            src={member.avatar}
                            alt={leave.memberName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                          />
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => member && onOpenMemberSheet(member)}
                              className="text-xs font-extrabold text-slate-900 hover:text-blue-600 hover:underline"
                            >
                              {leave.memberName}
                            </button>
                            <span className="text-xs font-semibold text-slate-700">
                              · {leave.type}
                            </span>
                            <span className="text-xs font-extrabold text-teal-700 tabular-nums">
                              {leave.duration} {leave.duration === 1 ? 'Day' : 'Days'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                leave.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : leave.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {leave.status}
                            </span>
                            {leave.hrSynced && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                                <FileCheck2 className="w-3 h-3 text-teal-600" />
                                <span>{leave.hrRefId || 'HR Matched'}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2 tabular-nums">
                            <span className="font-semibold text-slate-800">
                              {leave.start} ~ {leave.end}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-md">{leave.reason}</span>
                          </div>
                          {(leave.approvedBy || leave.adminNote) && (
                            <div className="text-[10px] text-purple-700 font-medium">
                              {leave.approvedBy ? `Reviewed by ${leave.approvedBy}` : ''}
                              {leave.approvedBy && leave.adminNote ? ' · ' : ''}
                              {leave.adminNote ? `Note: ${leave.adminNote}` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {isAdmin && leave.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onApproveLeave(leave.id, 'Approved')}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.approve}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onApproveLeave(leave.id, 'Rejected')}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t.reject}</span>
                            </button>
                          </>
                        )}

                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenEditLeave(leave)}
                              className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                              title={isAdmin ? 'HR Align / Edit' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isAdmin ? (language === 'my' ? 'HR ချိန်ညှိ' : 'HR Align') : t.edit}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setLeaveToDelete(leave)}
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                              title="Delete Leave"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 1B. Training Team Weekly Attendance Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'my'
                      ? `Training Team အပတ်စဉ် တက်ရောက်မှု ဇယား — ${formatMonthLabel(selectedMonth, language)} · ${getWeekLabel(selectedMonth, safeWeek, language)}`
                      : `Training Team Attendance Matrix — ${formatMonthLabel(selectedMonth, language)} · ${getWeekLabel(selectedMonth, safeWeek, language)}`}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {language === 'my'
                    ? 'နေ့ရက်အလိုက် ရုံးတက်၊ WFH၊ သင်တန်း၊ ခွင့်ရက်များကို ပြသထားပြီး Admin/ကိုယ်တိုင်က တိုက်ရိုက်ပြင်ဆင်နိုင်ပါသည်'
                    : 'Daily attendance across Office, WFH, Training, and Leaves (click cell status to override or adjust)'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  {language === 'my' ? 'ရုံးတက်' : 'Office'}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  {language === 'my' ? 'သင်တန်း' : 'Training'}
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {language === 'my' ? 'ခွင့် (Approved)' : 'Approved Leave'}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  {language === 'my' ? 'ခွင့် (Pending)' : 'Pending Leave'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-3 font-extrabold min-w-[180px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                      {language === 'my' ? 'Training Team အဖွဲ့ဝင်' : 'Team Member'}
                    </th>
                    {weekDays.map((wd) => (
                      <th key={wd.date} className="p-2.5 text-center min-w-[112px]">
                        <div className="font-extrabold text-slate-900">{wd.weekday}</div>
                        <div className="text-[10px] text-slate-500 tabular-nums font-semibold">
                          {wd.date.slice(5)}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center font-extrabold min-w-[100px] border-l border-slate-200 bg-slate-50">
                      {language === 'my' ? 'အပတ်ချုပ်' : 'Week Total'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memberSummaries.map(({ member, summary }) => {
                    const weekRows = summary.dailyRows.filter((r) => r.week === safeWeek);
                    const wkOffice = weekRows.filter(
                      (r) => r.status === 'Office' || r.status === 'WFH' || r.status === 'Training'
                    ).length;
                    const wkLeave = weekRows.filter(
                      (r) => r.status === 'LeaveApproved' || r.status === 'LeavePending'
                    ).length;
                    const isMe = member.id === currentUser.id || member.name === currentUser.name;
                    const canEditRow = (isMe || isAdmin) && !isViewer;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => onOpenMemberSheet(member)}
                            className="flex items-center gap-2.5 text-left group"
                          >
                            <img
                              src={member.avatar}
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="block font-bold text-slate-900 group-hover:text-blue-600 group-hover:underline truncate">
                                {member.name}
                              </span>
                              <span className="block text-[10px] text-slate-500 truncate">
                                {member.roleLabel}
                              </span>
                            </div>
                          </button>
                        </td>

                        {weekRows.map((row) => {
                          const cellCls = getCellStyle(row.status);
                          const titleTip = [
                            row.date,
                            getStatusShortLabel(row.status),
                            row.leave ? `${row.leave.type} (${row.leave.status})` : '',
                            row.trainingSessions.length > 0
                              ? `Training: ${row.trainingSessions.map((tr) => tr.name).join(', ')}`
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ');

                          return (
                            <td key={row.date} className="p-1.5 text-center align-middle" title={titleTip}>
                              {canEditRow ? (
                                <select
                                  value={row.overrideStatus || 'AUTO'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    onSetAttendanceOverride(
                                      member.id,
                                      row.date,
                                      val === 'AUTO' ? null : (val as AttendanceOverrideStatus)
                                    );
                                  }}
                                  className={`w-full text-[11px] font-semibold px-1.5 py-1.5 rounded-lg border text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${cellCls}`}
                                >
                                  <option value="AUTO">
                                    {getStatusShortLabel(row.status)}
                                  </option>
                                  <option value="Office">
                                    {language === 'my' ? 'ရုံးတက် (Office)' : 'Office'}
                                  </option>
                                  <option value="WFH">WFH</option>
                                  <option value="Training">
                                    {language === 'my' ? 'သင်တန်း' : 'Training'}
                                  </option>
                                  <option value="Holiday">
                                    {language === 'my' ? 'ပိတ်ရက်' : 'Holiday'}
                                  </option>
                                  <option value="Absent">
                                    {language === 'my' ? 'ပျက်ကွက်' : 'Absent'}
                                  </option>
                                </select>
                              ) : (
                                <span
                                  className={`inline-block w-full text-[11px] px-1.5 py-1.5 rounded-lg border ${cellCls}`}
                                >
                                  {getStatusShortLabel(row.status)}
                                </span>
                              )}

                              {row.trainingSessions.length > 0 && (
                                <div className="text-[9px] text-purple-700 font-semibold truncate max-w-[100px] mx-auto mt-0.5">
                                  {row.trainingSessions[0].name}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        <td className="p-2.5 text-center border-l border-slate-200 tabular-nums">
                          <div className="text-[11px] font-extrabold text-emerald-700">
                            {wkOffice}d {language === 'my' ? 'တက်' : 'in'}
                          </div>
                          <div className="text-[10px] font-bold text-teal-700">
                            {wkLeave}d {language === 'my' ? 'ခွင့်' : 'leave'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Weekly Tasks Kanban (Monday - Sunday) */}
      {viewMode !== 'attendance' && (
        <div className="space-y-3">
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'my'
                  ? '၇ ရက်တာ အပတ်စဉ် Task ဇယား (Monday – Sunday)'
                  : 'Weekly Tasks Board (Monday – Sunday)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'my'
                  ? 'နေ့ရက်အလိုက် Task ခွဲဝေမှုများ (ကတ်ကိုနှိပ်၍ မှတ်ချက်/Follow-up ရေးနိုင်ပြီး Edit/Delete လုပ်နိုင်သည်)'
                  : 'Tasks grouped by weekday with direct comments, Edit, and Delete controls'}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setTaskScope('all')}
                className={`px-2.5 py-1 rounded transition ${
                  taskScope === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {language === 'my' ? 'Task အားလုံး' : 'All Tasks'} ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setTaskScope('week')}
                className={`px-2.5 py-1 rounded transition ${
                  taskScope === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                {getWeekOrdinal(safeWeek)}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {days.map((d) => {
              const dayTasks = scopedTasks.filter((item) => item.day === d.code);

              return (
                <div
                  key={d.code}
                  className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/80 flex flex-col min-h-[380px]"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        {language === 'my' ? d.labelMy : d.labelEn}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">{d.code}</span>
                    </div>
                    <span className="text-xs font-extrabold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full shadow-2xs tabular-nums">
                      {dayTasks.length}
                    </span>
                  </div>

                  {/* Tasks in this day */}
                  <div className="space-y-2 flex-grow overflow-y-auto">
                    {dayTasks.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-8 italic border border-dashed border-slate-300 rounded-lg">
                        {language === 'my' ? 'တာဝန်မရှိပါ' : 'No tasks'}
                      </div>
                    ) : (
                      dayTasks.map((task) => {
                        const isOverdue = task.status === 'Overdue';
                        const isMyTask =
                          task.ownerId === currentUser.id ||
                          task.ownerName === currentUser.name ||
                          task.coAssigneeIds?.includes(currentUser.id);
                        const canEdit = (isMyTask || isAdmin) && !isViewer;

                        return (
                          <div
                            key={task.id}
                            onClick={() => onOpenComments(task)}
                            className={`bg-white p-3 rounded-xl border cursor-pointer hover:shadow-md transition space-y-2 relative group ${
                              isOverdue
                                ? 'border-red-300 bg-red-50/20'
                                : isMyTask
                                ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-300/40'
                                : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  task.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : task.status === 'Overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : task.status === 'Waiting'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {task.status}
                              </span>
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                {task.due}
                              </span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                              {task.title}
                            </h5>

                            {task.coAssigneeNames && task.coAssigneeNames.length > 0 && (
                              <div className="text-[10px] text-indigo-700 font-semibold truncate">
                                Co: {task.coAssigneeNames.join(', ')}
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const found = allUsers.find(
                                    (u) => u.id === task.ownerId || u.name === task.ownerName
                                  );
                                  if (found) onOpenMemberSheet(found);
                                }}
                                className="font-bold text-slate-700 hover:text-blue-600 hover:underline truncate max-w-[90px] text-left"
                                title={`Open sheet for ${task.ownerName}`}
                              >
                                {task.ownerName}
                              </button>

                              <div className="flex items-center gap-1">
                                <span className="text-blue-600 font-bold flex items-center gap-0.5 mr-1" title="Comments">
                                  <MessageSquare className="w-3 h-3" />
                                  {task.comments ? task.comments.length : 0}
                                </span>

                                {canEdit && (
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenEditTask(task);
                                      }}
                                      className="p-1 text-amber-600 hover:bg-amber-50 rounded transition"
                                      title={language === 'my' ? 'Task ပြင်ရန်' : 'Edit task'}
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTaskToDelete(task);
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                      title={language === 'my' ? 'Task ဖျက်ရန်' : 'Delete task'}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
        title={language === 'my' ? 'Task ကို ဖျက်ရန် အတည်ပြုပါ' : 'Confirm Task Deletion'}
        message={
          language === 'my'
            ? `"${taskToDelete?.title}" ကို စနစ်ထဲမှ အပြီးပိုင် ဖျက်ရန် သေချာပါသလား?`
            : `Are you sure you want to delete "${taskToDelete?.title}"?`
        }
        confirmLabel={language === 'my' ? 'ဖျက်မည်' : 'Delete Task'}
        cancelLabel={language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
        language={language}
      />

      {/* Delete Leave Confirmation Modal */}
      <ConfirmModal
        isOpen={!!leaveToDelete}
        onClose={() => setLeaveToDelete(null)}
        onConfirm={() => {
          if (leaveToDelete) {
            onDeleteLeave(leaveToDelete.id);
            setLeaveToDelete(null);
          }
        }}
        title={language === 'my' ? 'ခွင့်မှတ်တမ်း ဖျက်ရန် အတည်ပြုပါ' : 'Confirm Leave Deletion'}
        message={
          language === 'my'
            ? `${leaveToDelete?.memberName} ၏ ခွင့်မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?`
            : `Delete leave request for ${leaveToDelete?.memberName}?`
        }
        confirmLabel={language === 'my' ? 'ဖျက်မည်' : 'Delete Leave'}
        cancelLabel={language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
        language={language}
      />
    </div>
  );
};
