import React, { useState, useMemo } from 'react';
import {
  TaskItem,
  UserProfile,
  LeaveRequest,
  LeaveAttachment,
} from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import {
  WeekNumber,
  getWeekOfMonth,
  getWeeksInMonth,
  getWeekOrdinal,
  getWeekDayRange,
  shiftMonth,
  getDefaultDateForMonthWeek,
} from '../utils/weekHelpers';
import {
  isAdminOrSuper,
  canApproveLeave,
  canApproveTaskCompletion,
} from '../utils/roleHelpers';
import {
  isTaskOverdue,
  isTaskNearDeadline,
  formatDeadlineNotiLabel,
} from '../utils/taskHelpers';
import {
  Calendar,
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock4,
  FileCheck2,
  CheckSquare,
  AlertTriangle,
  Bell,
  FileText,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

interface WeeklyBoardTabProps {
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onApproveTaskCompletion: (taskId: string, approved: boolean) => void;
  onOpenAddLeave: (targetMember?: UserProfile, defaultDate?: string) => void;
  onOpenEditLeave: (leave: LeaveRequest) => void;
  onApproveLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  onDeleteLeave: (leaveId: string) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenComments: (task: TaskItem) => void;
  language: Language;
}

export const WeeklyBoardTab: React.FC<WeeklyBoardTabProps> = ({
  tasks,
  leaves,
  currentUser,
  allUsers,
  onOpenEditTask,
  onDeleteTask,
  onApproveTaskCompletion,
  onOpenAddLeave,
  onOpenEditLeave,
  onApproveLeave,
  onDeleteLeave,
  onOpenMemberSheet,
  onOpenComments,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const canApproveLeaves = canApproveLeave(currentUser.roleTier);
  const canApproveComplete = canApproveTaskCompletion(currentUser.roleTier);
  const isViewer = currentUser.roleTier === 'VIEWER';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedMonth, setSelectedMonth] = useState<string>(() => todayStr.slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(() => getWeekOfMonth(todayStr));
  const [viewMode, setViewMode] = useState<'all' | 'leaves' | 'tasks'>('all');
  const [leaveFilter, setLeaveFilter] = useState<'focus' | 'pending' | 'all'>('focus');
  const [taskScope, setTaskScope] = useState<'all' | 'week'>('all');

  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRequest | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<LeaveAttachment | null>(null);

  const weeksInMonth = getWeeksInMonth(selectedMonth);
  const safeWeek: WeekNumber = weeksInMonth.includes(selectedWeek) ? selectedWeek : 1;

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

  const weeklySummaryStats = useMemo(() => {
    const weekTasks = tasks.filter((item) => item.due >= weekStartStr && item.due <= weekEndStr);
    const activeTasks = scopedTasks.filter(
      (item) => item.status === 'Active' || item.status === 'Pending' || item.status === 'Waiting'
    ).length;
    const completedTasks = scopedTasks.filter((item) => item.status === 'Completed').length;
    const overdueTasks = scopedTasks.filter((item) => isTaskOverdue(item, todayStr)).length;
    const dueSoonTasks = scopedTasks.filter((item) => isTaskNearDeadline(item, todayStr)).length;
    const approvedWeekLeaves = weekOverlappingLeaves.filter((l) => l.status === 'Approved').length;
    return {
      totalScoped: scopedTasks.length,
      weekTasksCount: weekTasks.length,
      activeTasks,
      completedTasks,
      overdueTasks,
      dueSoonTasks,
      approvedWeekLeaves,
      pendingCount: pendingLeaves.length,
    };
  }, [tasks, scopedTasks, weekStartStr, weekEndStr, weekOverlappingLeaves, pendingLeaves.length, todayStr]);

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
                  ? 'အပတ်စဉ် ခွင့်အတည်ပြုမှုနှင့် လုပ်ငန်းခွင်ဇယား (Weekly Board)'
                  : 'Weekly Leave Approvals & Workload Board'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'my'
                ? 'အပတ်စဉ်အလိုက် ခွင့်တောင်းခံလွှာ Approve/Reject ပြုလုပ်ခြင်းနှင့် Mon–Sun Task များကို တစ်နေရာတည်းတွင် စီမံနိုင်သည်'
                : 'Approve or review leave requests and manage Monday–Sunday team tasks'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
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
              onClick={() => setViewMode('leaves')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'leaves' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'my' ? 'ခွင့်အတည်ပြုမှုများ' : 'Leave Approvals'}
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

        {/* 5 Summary Tiles for Selected Week (Overdue & Due Soon separated) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 block">
                {language === 'my' ? 'စုစုပေါင်း Task များ' : 'Scoped Tasks'}
              </span>
              <span className="text-lg font-black text-blue-950 tabular-nums">
                {weeklySummaryStats.totalScoped}{' '}
                <span className="text-xs font-semibold text-blue-700">
                  ({weeklySummaryStats.activeTasks} active)
                </span>
              </span>
            </div>
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>

          <div
            className={`rounded-xl px-4 py-2.5 flex items-center justify-between border ${
              weeklySummaryStats.overdueTasks > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div>
              <span
                className={`text-[11px] font-bold block ${
                  weeklySummaryStats.overdueTasks > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {language === 'my' ? 'ပြီးစီး / Overdue' : 'Completed / Overdue'}
              </span>
              <span className="text-lg font-black text-slate-900 tabular-nums">
                {weeklySummaryStats.completedTasks}{' '}
                <span
                  className={`text-xs font-semibold ${
                    weeklySummaryStats.overdueTasks > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  / {weeklySummaryStats.overdueTasks} {language === 'my' ? 'ကျော်' : 'overdue'}
                </span>
              </span>
            </div>
            {weeklySummaryStats.overdueTasks > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          <div
            className={`rounded-xl px-4 py-2.5 flex items-center justify-between border ${
              weeklySummaryStats.dueSoonTasks > 0
                ? 'bg-amber-50 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span
                className={`text-[11px] font-bold block ${
                  weeklySummaryStats.dueSoonTasks > 0 ? 'text-amber-800' : 'text-slate-500'
                }`}
              >
                {language === 'my' ? 'Due Soon (Deadline နီး)' : 'Due Soon Tasks'}
              </span>
              <span
                className={`text-lg font-black tabular-nums ${
                  weeklySummaryStats.dueSoonTasks > 0 ? 'text-amber-900' : 'text-slate-900'
                }`}
              >
                {weeklySummaryStats.dueSoonTasks}
              </span>
            </div>
            <Bell
              className={`w-5 h-5 ${
                weeklySummaryStats.dueSoonTasks > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}
            />
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-700 block">
                {language === 'my' ? 'ယခုအပတ် ခွင့်ယူမှု' : 'Leaves in Selected Week'}
              </span>
              <span className="text-lg font-black text-teal-900 tabular-nums">
                {weekOverlappingLeaves.length}{' '}
                <span className="text-xs font-semibold opacity-80">
                  ({weeklySummaryStats.approvedWeekLeaves} approved)
                </span>
              </span>
            </div>
            <CalendarDays className="w-5 h-5 text-teal-600" />
          </div>

          <div
            className={`rounded-xl px-4 py-2.5 flex items-center justify-between border ${
              weeklySummaryStats.pendingCount > 0
                ? 'bg-amber-50 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span
                className={`text-[11px] font-bold block ${
                  weeklySummaryStats.pendingCount > 0 ? 'text-amber-800' : 'text-slate-500'
                }`}
              >
                {language === 'my' ? 'ခွင့် Approve စောင့်ဆိုင်းဆဲ' : 'Pending Leave Approvals'}
              </span>
              <span
                className={`text-lg font-black tabular-nums ${
                  weeklySummaryStats.pendingCount > 0 ? 'text-amber-900' : 'text-slate-900'
                }`}
              >
                {weeklySummaryStats.pendingCount}
              </span>
            </div>
            <Clock4
              className={`w-5 h-5 ${
                weeklySummaryStats.pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: Leave Approvals & Requests */}
      {viewMode !== 'tasks' && (
        <div className="space-y-6">
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
                          {leave.attachments && leave.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {leave.attachments.map((att) => (
                                <button
                                  key={att.id}
                                  type="button"
                                  onClick={() => setPreviewAttachment(att)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 text-[10px] font-semibold transition"
                                  title={att.name}
                                >
                                  {att.mimeType.startsWith('image/') ? (
                                    <img
                                      src={att.dataUrl}
                                      alt={att.name}
                                      className="w-3.5 h-3.5 rounded-xs object-cover shrink-0"
                                    />
                                  ) : (
                                    <FileText className="w-3 h-3 text-red-600 shrink-0" />
                                  )}
                                  <span className="truncate max-w-[90px]">{att.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
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
                        {canApproveLeaves && leave.status === 'Pending' && (
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
                        {isAdmin && !canApproveLeaves && leave.status === 'Pending' && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold">
                            {language === 'my' ? 'Super Admin အတည်ပြုရန်' : 'Super Admin Approval'}
                          </span>
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
        </div>
      )}

      {/* SECTION 2: Weekly Tasks Kanban (Monday - Sunday) */}
      {viewMode !== 'leaves' && (
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
                        const nearLabel = formatDeadlineNotiLabel(task, todayStr, language);
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
                                : nearLabel
                                ? 'border-amber-300 bg-amber-50/20'
                                : isMyTask
                                ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-300/40'
                                : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  task.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : task.status === 'Overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : task.status === 'Pending' || task.status === 'Waiting'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {task.status === 'Active'
                                  ? 'In Progress'
                                  : task.status === 'Waiting' || task.status === 'Pending'
                                  ? 'Pending'
                                  : task.status}
                              </span>
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                {task.due}
                              </span>
                            </div>

                            {nearLabel && (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold">
                                <Bell className="w-2.5 h-2.5 text-amber-700" />
                                <span>{nearLabel}</span>
                              </div>
                            )}

                            {task.completionRequested && (
                              <div className="flex items-center justify-between gap-1 bg-amber-50 border border-amber-200 rounded px-1.5 py-1">
                                <span className="text-[9px] font-bold text-amber-800">
                                  {language === 'my' ? 'Complete အတည်ပြုရန်' : 'Pending Approval'}
                                </span>
                                {canApproveComplete && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onApproveTaskCompletion(task.id, true);
                                    }}
                                    className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[9px] transition"
                                  >
                                    {language === 'my' ? 'အတည်ပြု' : 'Approve'}
                                  </button>
                                )}
                              </div>
                            )}

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
      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        language={language}
      />
    </div>
  );
};
