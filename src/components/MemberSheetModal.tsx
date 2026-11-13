import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  TaskItem,
  LeaveRequest,
  TrainingLog,
  MemberStatus,
  AttendanceRecord,
  AttendanceOverrideStatus,
} from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import {
  WeekNumber,
  getMonthKey,
  getWeekOfMonth,
  getWeeksInMonth,
  getWeekLabel,
  getWeekOrdinal,
  getWeekDayRange,
  getDefaultDateForMonthWeek,
  shiftMonth,
  formatMonthLabel,
} from '../utils/weekHelpers';
import {
  computeMemberMonthlyAttendance,
  ComputedDayStatus,
  DailyAttendanceRow,
} from '../utils/attendanceHelpers';
import { exportMemberMonthlyExcel } from '../utils/excelExport';
import {
  isAdminOrSuper,
  canApproveLeave,
  canApproveTaskCompletion,
} from '../utils/roleHelpers';
import { 
  X, 
  CheckSquare, 
  CalendarDays, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  ShieldCheck, 
  User,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileCheck2,
  Building2,
  FileSpreadsheet,
  BellRing,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface MemberSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserProfile | null;
  currentUser: UserProfile;
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  trainingLogs: TrainingLog[];
  attendanceOverrides: AttendanceRecord[];
  onSetAttendanceOverride: (
    memberId: string,
    date: string,
    status: AttendanceOverrideStatus | null,
    note?: string
  ) => void;
  onExportExcelSuccess?: (filename: string) => void;
  onOpenAddTask: (member: UserProfile, defaultDate?: string) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onApproveTaskCompletion: (taskId: string, approved: boolean) => void;
  onOpenComments: (task: TaskItem) => void;
  onOpenAddLeave: (member: UserProfile, defaultDate?: string) => void;
  onOpenEditLeave: (leave: LeaveRequest) => void;
  onDeleteLeave: (leaveId: string) => void;
  onApproveLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  onOpenAddTraining: (member: UserProfile, defaultDate?: string) => void;
  onOpenEditTraining: (training: TrainingLog) => void;
  onDeleteTraining: (trainingId: string) => void;
  onOpenEditProfile: (member: UserProfile) => void;
  onUpdateMemberStatus?: (userId: string, newStatus: MemberStatus) => void;
  language: Language;
}

export const MemberSheetModal: React.FC<MemberSheetModalProps> = ({
  isOpen,
  onClose,
  member,
  currentUser,
  tasks,
  leaves,
  trainingLogs,
  attendanceOverrides,
  onSetAttendanceOverride,
  onExportExcelSuccess,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onApproveTaskCompletion,
  onOpenComments,
  onOpenAddLeave,
  onOpenEditLeave,
  onDeleteLeave,
  onApproveLeave,
  onOpenAddTraining,
  onOpenEditTraining,
  onDeleteTraining,
  onOpenEditProfile,
  onUpdateMemberStatus,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [activeSubtab, setActiveSubtab] = useState<'tasks' | 'leaves' | 'training' | 'attendance'>('tasks');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber | 'all'>('all');
  const [viewAllMonths, setViewAllMonths] = useState(false);

  // Interactive 3D Tilt state for Profile Identity Card
  const tiltCardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(new Date().toISOString().slice(0, 7));
      setSelectedWeek('all');
      setViewAllMonths(false);
    }
  }, [isOpen, member?.id]);

  if (!isOpen || !member) return null;

  const isMe = currentUser.id === member.id || currentUser.name === member.name;
  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const canApproveLeaves = canApproveLeave(currentUser.roleTier);
  const canApproveComplete = canApproveTaskCompletion(currentUser.roleTier);
  const isViewer = currentUser.roleTier === 'VIEWER';
  const isResigned = member.status === 'Resigned';

  const canEditMemberProfile = (isMe || isAdmin) && !isViewer;
  const hasSheetControl = (isMe || isAdmin) && !isViewer;

  // All records for this member (including Co-Assigned project tasks)
  const memberTasks = tasks.filter(
    (item) =>
      item.ownerId === member.id ||
      item.ownerName === member.name ||
      item.coAssigneeIds?.includes(member.id) ||
      item.coAssigneeNames?.includes(member.name)
  );
  const memberLeaves = leaves.filter(
    (item) => item.memberId === member.id || item.memberName === member.name
  );
  const memberTraining = trainingLogs.filter(
    (item) =>
      item.attendeeIds?.includes(member.id) ||
      item.attendeeNames?.includes(member.name) ||
      item.coTrainerIds?.includes(member.id) ||
      item.coTrainerNames?.includes(member.name) ||
      item.trainerName === member.name
  );

  const totalTrainingHours = memberTraining.reduce(
    (acc, tr) => acc + (tr.calculatedHours || 0),
    0
  );
  const totalLeaveDays = memberLeaves.reduce((acc, l) => acc + (l.duration || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTaskCount = memberTasks.filter(
    (item) =>
      item.status === 'Overdue' ||
      (item.status !== 'Completed' && item.status !== 'Cancelled' && item.due < todayStr)
  ).length;
  const activeTaskCount = memberTasks.filter(
    (item) =>
      item.status === 'Active' ||
      item.status === 'Pending' ||
      item.status === 'Waiting' ||
      item.status === 'Overdue'
  ).length;

  // Month filtering helpers
  const monthTasks = viewAllMonths
    ? memberTasks
    : memberTasks.filter((item) => getMonthKey(item.due) === selectedMonth);
  const monthLeaves = viewAllMonths
    ? memberLeaves
    : memberLeaves.filter((item) => getMonthKey(item.start) === selectedMonth);
  const monthTraining = viewAllMonths
    ? memberTraining
    : memberTraining.filter((item) => getMonthKey(item.date) === selectedMonth);

  const weeksInMonth = getWeeksInMonth(selectedMonth);

  const monthlyAttendance = computeMemberMonthlyAttendance(
    member,
    selectedMonth,
    leaves,
    trainingLogs,
    tasks,
    attendanceOverrides
  );

  // Get date string for a record based on active tab
  const getRecordCountForWeek = (wk: WeekNumber): number => {
    if (activeSubtab === 'tasks') {
      return monthTasks.filter((item) => getWeekOfMonth(item.due) === wk).length;
    }
    if (activeSubtab === 'leaves') {
      return monthLeaves.filter((item) => getWeekOfMonth(item.start) === wk).length;
    }
    if (activeSubtab === 'attendance') {
      return monthlyAttendance.dailyRows.filter(
        (r) => r.week === wk && r.status === 'Office'
      ).length;
    }
    return monthTraining.filter((item) => getWeekOfMonth(item.date) === wk).length;
  };

  const handleExportMemberExcel = () => {
    const filename = exportMemberMonthlyExcel({
      member,
      monthKey: selectedMonth,
      tasks,
      leaves,
      trainingLogs,
      attendanceOverrides,
      language,
    });
    onExportExcelSuccess?.(filename);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltCardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 9;
    const rx = (0.5 - py) * 8;
    setTilt({ rx, ry, gx: px * 100, gy: py * 100, active: true });
  };

  const handleCardMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  const handleAddForWeek = (wk: WeekNumber | 'all') => {
    const targetDate = viewAllMonths
      ? new Date().toISOString().split('T')[0]
      : getDefaultDateForMonthWeek(selectedMonth, wk);

    if (activeSubtab === 'tasks') {
      onOpenAddTask(member, targetDate);
    } else if (activeSubtab === 'leaves') {
      onOpenAddLeave(member, targetDate);
    } else {
      onOpenAddTraining(member, targetDate);
    }
  };

  // Render Task card row
  const renderTaskCard = (task: TaskItem) => {
    const isOverdue = task.status === 'Overdue';
    const isPending = task.status === 'Pending' || task.status === 'Waiting';
    const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
    const canEditTask = (isMyTask || hasSheetControl) && !isViewer;
    const displayStatus =
      task.status === 'Active'
        ? 'In Progress'
        : isPending
        ? 'Pending'
        : task.status;

    return (
      <div
        key={task.id}
        className="row-3d-card bg-white rounded-lg border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{task.title}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                task.status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : task.status === 'Overdue'
                  ? 'bg-red-100 text-red-800'
                  : isPending
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {displayStatus}
            </span>
            {task.completionRequested && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3" />
                <span>
                  {language === 'my' ? 'Admin အတည်ပြုရန် စောင့်ဆိုင်းဆဲ' : 'Pending Admin Approval'}
                </span>
              </span>
            )}
            {task.status === 'Completed' && task.completionApprovedBy && (
              <span className="text-[10px] font-bold text-emerald-700">
                ✓ {task.completionApprovedBy}
              </span>
            )}
            {isMyTask && (
              <span className="text-[10px] font-bold text-blue-700">
                · {language === 'my' ? 'သင့် Task' : 'Your Task'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 tabular-nums">
            <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
              Due: {task.due}
            </span>
            <span aria-hidden="true">·</span>
            <span>Follow-up: {task.followup}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-600">
              {getWeekOrdinal(getWeekOfMonth(task.due))}
            </span>
            {task.note && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-xs text-slate-600">{task.note}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {canApproveComplete && task.completionRequested && (
            <>
              <button
                onClick={() => onApproveTaskCompletion(task.id, true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                title={language === 'my' ? 'ပြီးစီးကြောင်း အတည်ပြုရန်' : 'Approve Complete'}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'Complete အတည်ပြု' : 'Approve'}</span>
              </button>
              <button
                onClick={() => onApproveTaskCompletion(task.id, false)}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition"
                title={language === 'my' ? 'In Progress သို့ ပြန်ပို့ရန်' : 'Return to In Progress'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => onOpenComments(task)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs transition"
            title={t.comments}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{task.comments ? task.comments.length : 0}</span>
          </button>

          {canEditTask && (
            <>
              <button
                onClick={() => onOpenEditTask(task)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-bold text-xs transition"
                title={language === 'my' ? 'Task ပြင်ဆင်ရန်' : 'Edit task'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ပြင်ရန်' : 'Edit'}</span>
              </button>

              <button
                onClick={() =>
                  setPendingConfirm({
                    title: language === 'my' ? 'Task ကို ဖျက်ရန် အတည်ပြုပါ' : 'Confirm Task Deletion',
                    message:
                      language === 'my'
                        ? `"${task.title}" ကို စနစ်ထဲမှ အပြီးပိုင် ဖျက်ရန် သေချာပါသလား?`
                        : `Delete task "${task.title}"?`,
                    confirmLabel: language === 'my' ? 'ဖျက်မည်' : 'Delete Task',
                    isDestructive: true,
                    onConfirm: () => onDeleteTask(task.id),
                  })
                }
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold text-xs transition"
                title={language === 'my' ? 'Task ဖျက်ရန်' : 'Delete task'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ဖျက်ရန်' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render Leave card row
  const renderLeaveCard = (leave: LeaveRequest) => {
    const canEditLeave = (isMe || isAdmin) && !isViewer;

    return (
      <div
        key={leave.id}
        className="row-3d-card bg-white rounded-xl border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{leave.type}</span>
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
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                <FileCheck2 className="w-3 h-3 text-teal-600" />
                <span>
                  {language === 'my' ? 'HR ကိုက်ညီပြီး' : 'HR Matched'}
                  {leave.hrRefId ? ` · ${leave.hrRefId}` : ''}
                </span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 tabular-nums">
            <span>
              {leave.start} ~ {leave.end}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-600">
              {getWeekOrdinal(getWeekOfMonth(leave.start))}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-600 truncate max-w-sm">{leave.reason}</span>
          </div>
          {(leave.adminNote || leave.approvedBy) && (
            <div className="text-[10px] text-purple-700 font-medium">
              {leave.approvedBy ? `Reviewed by ${leave.approvedBy}` : ''}
              {leave.approvedBy && leave.adminNote ? ' · ' : ''}
              {leave.adminNote ? `HR Note: ${leave.adminNote}` : ''}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {canApproveLeaves && leave.status === 'Pending' && (
            <>
              <button
                onClick={() => onApproveLeave(leave.id, 'Approved')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition"
                title={t.approve}
              >
                Approve
              </button>
              <button
                onClick={() => onApproveLeave(leave.id, 'Rejected')}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition"
                title={t.reject}
              >
                Reject
              </button>
            </>
          )}
          {isAdmin && !canApproveLeaves && leave.status === 'Pending' && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold">
              {language === 'my' ? 'Super Admin အတည်ပြုရန်' : 'Super Admin Approval'}
            </span>
          )}

          {canEditLeave && (
            <>
              <button
                onClick={() => onOpenEditLeave(leave)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-bold text-xs transition"
                title={isAdmin ? (language === 'my' ? 'HR နှင့်ကိုက်ညှိပြင်ဆင်ရန်' : 'Edit & Align HR') : t.edit}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {isAdmin
                    ? language === 'my'
                      ? 'HR ချိန်ညှိ'
                      : 'HR Align'
                    : language === 'my'
                    ? 'ပြင်ရန်'
                    : 'Edit'}
                </span>
              </button>
              <button
                onClick={() =>
                  setPendingConfirm({
                    title: language === 'my' ? 'ခွင့်မှတ်တမ်း ဖျက်ရန်' : 'Confirm Leave Deletion',
                    message:
                      language === 'my'
                        ? 'ဤခွင့်မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?'
                        : 'Delete this leave entry?',
                    confirmLabel: language === 'my' ? 'ဖျက်မည်' : 'Delete',
                    isDestructive: true,
                    onConfirm: () => onDeleteLeave(leave.id),
                  })
                }
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold text-xs transition"
                title={language === 'my' ? 'ခွင့်ဖျက်ရန်' : 'Delete leave'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ဖျက်ရန်' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render Training Topic card row
  const renderTrainingCard = (tr: TrainingLog) => {
    const canEditTraining = (isMe || isAdmin) && !isViewer;

    return (
      <div
        key={tr.id}
        className="row-3d-card bg-white rounded-xl border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{tr.name}</span>
            <span className="text-xs font-extrabold text-purple-700 tabular-nums">
              {tr.calculatedHours.toFixed(1)} hrs
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 tabular-nums">
            <span className="font-semibold text-purple-800 inline-flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
              Trainer: {tr.trainerName || '-'}
            </span>
            {tr.coTrainerNames && tr.coTrainerNames.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-indigo-700">
                  Co-Trainer: {tr.coTrainerNames.join(', ')}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{tr.date}</span>
            <span aria-hidden="true">·</span>
            <span>
              {tr.start} ~ {tr.end} (Break {tr.breakHrs}h)
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-600">
              {getWeekOrdinal(getWeekOfMonth(tr.date))}
            </span>
          </div>
          {tr.editedBy && (
            <div className="text-[10px] font-bold text-amber-700">
              {language === 'my' ? 'ပြင်ဆင်သူ:' : 'Edited by:'} {tr.editedBy}
              {tr.editedAt ? ` (${tr.editedAt})` : ''}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {canEditTraining && (
            <>
              <button
                onClick={() => onOpenEditTraining(tr)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-bold text-xs transition"
                title={language === 'my' ? 'သင်တန်းပြင်ရန်' : 'Edit training'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ပြင်ရန်' : 'Edit'}</span>
              </button>
              <button
                onClick={() =>
                  setPendingConfirm({
                    title: language === 'my' ? 'သင်တန်းမှတ်တမ်း ဖျက်ရန်' : 'Confirm Training Deletion',
                    message:
                      language === 'my'
                        ? 'ဤသင်တန်းမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?'
                        : 'Delete this training session?',
                    confirmLabel: language === 'my' ? 'ဖျက်မည်' : 'Delete',
                    isDestructive: true,
                    onConfirm: () => onDeleteTraining(tr.id),
                  })
                }
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold text-xs transition"
                title={language === 'my' ? 'သင်တန်းဖျက်ရန်' : 'Delete training'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'ဖျက်ရန်' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const getAttendanceBadge = (status: ComputedDayStatus) => {
    switch (status) {
      case 'Office':
        return {
          label: language === 'my' ? 'ရုံးတက် (Office)' : 'Office Present',
          cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        };
      case 'LeaveApproved':
        return {
          label: language === 'my' ? 'ခွင့် (အတည်ပြု)' : 'On Leave',
          cls: 'bg-teal-100 text-teal-800 border border-teal-200',
        };
      case 'LeavePending':
        return {
          label: language === 'my' ? 'ခွင့် (စောင့်ဆိုင်း)' : 'Leave Pending',
          cls: 'bg-amber-100 text-amber-800 border border-amber-200',
        };
      case 'Weekend':
        return {
          label: language === 'my' ? 'စနေ/တနင်္ဂနွေ' : 'Weekend',
          cls: 'bg-slate-100 text-slate-500 border border-slate-200',
        };
    }
  };

  const renderAttendanceRow = (row: DailyAttendanceRow) => {
    const badge = getAttendanceBadge(row.status);
    const selectVal = row.overrideStatus || 'AUTO';

    return (
      <div
        key={row.date}
        className={`rounded-lg border px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs ${
          row.isWeekend && !row.overrideStatus && row.status === 'Weekend'
            ? 'bg-slate-50/80 border-slate-200/70 text-slate-500'
            : row.status === 'LeaveApproved'
            ? 'bg-teal-50/40 border-teal-200/80'
            : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5 min-w-0 flex-1">
          <span className="font-mono font-bold text-slate-900 tabular-nums">{row.date}</span>
          <span className="w-9 text-center py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
            {row.weekday}
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${badge.cls}`}>
            {badge.label}
          </span>
          {row.overrideStatus && (
            <span className="text-[10px] font-bold text-indigo-700">
              · {language === 'my' ? 'Manual ပြင်ထား' : 'Override'}
            </span>
          )}
          {row.leave && (
            <span className="text-[11px] text-teal-800 font-semibold truncate max-w-xs">
              · {row.leave.type}
              {row.leave.hrRefId ? ` (${row.leave.hrRefId})` : ''}
            </span>
          )}
          {row.tasksDueCount > 0 && (
            <span className="text-[11px] text-blue-700 font-semibold tabular-nums">
              · {row.tasksDueCount} {row.tasksDueCount === 1 ? 'task due' : 'tasks due'}
            </span>
          )}
        </div>

        {hasSheetControl && (
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={selectVal}
              onChange={(e) => {
                const val = e.target.value;
                onSetAttendanceOverride(
                  member.id,
                  row.date,
                  val === 'AUTO' ? null : (val as AttendanceOverrideStatus)
                );
              }}
              className="text-[11px] font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              title={language === 'my' ? 'တက်ရောက်မှု အခြေအနေ ပြောင်းရန်' : 'Set daily attendance status'}
            >
              <option value="AUTO">{language === 'my' ? 'Auto (စနစ်အတိုင်း)' : 'Auto'}</option>
              <option value="Office">{language === 'my' ? 'ရုံးတက် (Office)' : 'Office'}</option>
              <option value="Leave">{language === 'my' ? 'ခွင့် (Leave)' : 'Leave'}</option>
            </select>

            {!row.leave && (
              <button
                type="button"
                onClick={() => onOpenAddLeave(member, row.date)}
                className="px-2 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition"
                title={language === 'my' ? 'ဤရက်အတွက် ခွင့်တင်ရန်' : 'Add leave for this date'}
              >
                + Leave
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render weekly grouped view or single week view for active tab
  const renderActiveRecords = () => {
    if (activeSubtab === 'attendance') {
      const weeksToRender: WeekNumber[] =
        selectedWeek === 'all' ? weeksInMonth : [selectedWeek];

      return (
        <div className="space-y-4">
          {/* Combined Monthly Attendance & Leave Summary Strip (Office & Leave Only) */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  {language === 'my'
                    ? `${formatMonthLabel(selectedMonth, language)} — ရုံးတက်ရက် နှင့် ခွင့်ရက် ပေါင်းချုပ်`
                    : `${formatMonthLabel(selectedMonth, language)} — Office Attendance & Leave Summary`}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {language === 'my'
                    ? 'ရုံးတက် (Office) နှင့် ခွင့်ရက် (Leave) များကို အလိုအလျောက် တွက်ချက်ပြသထားပါသည်။'
                    : 'Automatically calculated from Office days and approved/pending Leave records.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportMemberExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{language === 'my' ? 'Excel ထုတ်မည် (.xlsx)' : 'Export Excel (.xlsx)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-[10px] font-bold text-slate-500 block">
                  {language === 'my' ? 'အလုပ်တက်ရက်စုစုပေါင်း' : 'Working Days'}
                </span>
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  {monthlyAttendance.workingDaysInMonth}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <span className="text-[10px] font-bold text-emerald-700 block">
                  {language === 'my' ? 'ရုံးတက် (Office)' : 'Office Present'}
                </span>
                <span className="text-lg font-black text-emerald-900 tabular-nums">
                  {monthlyAttendance.officePresentDays}
                </span>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5">
                <span className="text-[10px] font-bold text-teal-700 block">
                  {language === 'my' ? 'အတည်ပြု ခွင့် (Leave)' : 'Approved Leave'}
                </span>
                <span className="text-lg font-black text-teal-900 tabular-nums">
                  {monthlyAttendance.approvedLeaveDaysInMonth}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <span className="text-[10px] font-bold text-amber-700 block">
                  {language === 'my' ? 'စောင့်ဆိုင်း ခွင့်' : 'Pending Leave'}
                </span>
                <span className="text-lg font-black text-amber-900 tabular-nums">
                  {monthlyAttendance.pendingLeaveDaysInMonth}
                </span>
              </div>
            </div>
          </div>

          {weeksToRender.map((wk) => {
            const wkRows = monthlyAttendance.dailyRows.filter((r) => r.week === wk);
            const wkPresent = wkRows.filter((r) => r.status === 'Office').length;
            const wkLeave = wkRows.filter(
              (r) => r.status === 'LeaveApproved' || r.status === 'LeavePending'
            ).length;

            return (
              <div
                key={wk}
                className="rounded-lg bg-gradient-to-b from-white to-slate-50/90 border-2 border-slate-200 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.1)] overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-900 text-white text-[11px] font-black shadow-xs">
                      W{wk}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {getWeekLabel(selectedMonth, wk, language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold tabular-nums">
                    <span className="text-emerald-700">
                      {language === 'my' ? `ရုံးတက် ${wkPresent} ရက်` : `Office: ${wkPresent}d`}
                    </span>
                    <span className="text-teal-700">
                      {language === 'my' ? `ခွင့် ${wkLeave} ရက်` : `Leave: ${wkLeave}d`}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  {wkRows.map(renderAttendanceRow)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const activeItems =
      activeSubtab === 'tasks' ? monthTasks : activeSubtab === 'leaves' ? monthLeaves : monthTraining;

    const addButtonLabel =
      activeSubtab === 'tasks'
        ? '+ Task'
        : activeSubtab === 'leaves'
        ? '+ Leave'
        : '+ Topic';

    const addButtonAccent =
      activeSubtab === 'tasks'
        ? 'bg-blue-600 hover:bg-blue-700'
        : activeSubtab === 'leaves'
        ? 'bg-teal-600 hover:bg-teal-700'
        : 'bg-purple-700 hover:bg-purple-800';

    if (viewAllMonths) {
      if (activeItems.length === 0) {
        return (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs text-slate-500">
              {language === 'my' ? 'မှတ်တမ်း မရှိသေးပါ။' : 'No records found across all months.'}
            </p>
            {!isViewer && (
              <button
                onClick={() => handleAddForWeek('all')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg ${addButtonAccent}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addButtonLabel}</span>
              </button>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-2.5">
          {activeSubtab === 'tasks' && monthTasks.map(renderTaskCard)}
          {activeSubtab === 'leaves' && monthLeaves.map(renderLeaveCard)}
          {activeSubtab === 'training' && monthTraining.map(renderTrainingCard)}
        </div>
      );
    }

    const weeksToRender: WeekNumber[] =
      selectedWeek === 'all' ? weeksInMonth : [selectedWeek];

    return (
      <div className="space-y-4">
        {weeksToRender.map((wk) => {
          const wkTasks = monthTasks.filter((item) => getWeekOfMonth(item.due) === wk);
          const wkLeaves = monthLeaves.filter((item) => getWeekOfMonth(item.start) === wk);
          const wkTraining = monthTraining.filter((item) => getWeekOfMonth(item.date) === wk);
          const count =
            activeSubtab === 'tasks'
              ? wkTasks.length
              : activeSubtab === 'leaves'
              ? wkLeaves.length
              : wkTraining.length;

          return (
            <div
              key={wk}
              className="rounded-lg bg-gradient-to-b from-white to-slate-50/90 border-2 border-slate-200 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.1)] overflow-hidden"
            >
              {/* Week Header Bar */}
              <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-900 text-white text-[11px] font-black shadow-xs">
                    W{wk}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {getWeekLabel(selectedMonth, wk, language)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                    · {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => handleAddForWeek(wk)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white rounded-lg shadow-xs transition ${addButtonAccent}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {addButtonLabel} ({getWeekOrdinal(wk)})
                    </span>
                  </button>
                )}
              </div>

              {/* Week Records */}
              <div className="p-3 space-y-2.5">
                {count === 0 ? (
                  <div className="py-3 px-4 text-center text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      {language === 'my'
                        ? `${getWeekOrdinal(wk)} အတွင်း မှတ်တမ်းမရှိသေးပါ`
                        : `No records scheduled in ${getWeekOrdinal(wk)}`}
                    </span>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleAddForWeek(wk)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        {language === 'my' ? `+ ${getWeekOrdinal(wk)} တွင် ထည့်ရန်` : `+ Add in ${getWeekOrdinal(wk)}`}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {activeSubtab === 'tasks' && wkTasks.map(renderTaskCard)}
                    {activeSubtab === 'leaves' && wkLeaves.map(renderLeaveCard)}
                    {activeSubtab === 'training' && wkTraining.map(renderTrainingCard)}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 perspective-stage flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="sheet-3d-shell bg-slate-100 rounded-3xl w-full max-w-5xl max-h-[93vh] flex flex-col overflow-hidden border border-white/25">
        {/* 3D Depth Stage Header */}
        <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white px-5 sm:px-7 py-5 border-b border-slate-700/80 overflow-hidden">
          {/* Subtle 3D Architectural Grid & Light Glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(251, 191, 36, 0.35), transparent 45%), radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.28), transparent 45%)',
            }}
          />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            {/* Interactive 3D Tilting Identity Card */}
            <div
              ref={tiltCardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              }}
              className="card-3d-tilt relative flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.65)] max-w-xl"
            >
              {/* Dynamic 3D Specular Sheen */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200"
                style={{
                  opacity: tilt.active ? 0.35 : 0.12,
                  background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.45), transparent 60%)`,
                }}
              />

              {/* 3D Avatar Medallion */}
              <div className="relative shrink-0" style={{ transform: 'translateZ(20px)' }}>
                <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 shadow-[0_10px_20px_-6px_rgba(245,158,11,0.6)]">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-[14px] object-cover bg-slate-800"
                  />
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 shadow ${
                    isResigned ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  title={isResigned ? 'Resigned' : 'Active'}
                />
              </div>

              {/* Member Identity Text */}
              <div className="relative min-w-0" style={{ transform: 'translateZ(14px)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    {member.name}
                  </h3>
                  {overdueTaskCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSubtab('tasks')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 hover:bg-red-400 text-white text-[10px] font-extrabold shadow-sm transition tabular-nums"
                      title={
                        language === 'my'
                          ? `${member.name} တွင် Overdue Task ${overdueTaskCount} ခု ရှိပါသည်`
                          : `${member.name} has ${overdueTaskCount} overdue task(s)`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                      <BellRing className="w-3 h-3" />
                      <span>{overdueTaskCount} Overdue</span>
                    </button>
                  )}
                  <span className="text-[11px] font-bold text-amber-300">
                    {member.roleTier}
                    {isMe ? ` · ${language === 'my' ? 'သင့်အကောင့်' : 'You'}` : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  {member.roleLabel} · <span className="text-slate-300">{member.dept}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 mt-1">
                  <span className={isResigned ? 'text-red-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                    {isResigned
                      ? language === 'my' ? 'နုတ်ထွက်ပြီး (Resigned)' : 'Resigned'
                      : language === 'my' ? 'တာဝန်ထမ်းဆောင်ဆဲ (Active)' : 'Active'}
                  </span>
                  {member.email && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{member.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action Cluster */}
            <div className="relative flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportMemberExcel}
                className="cube-3d-tile flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl border border-emerald-300/40"
                title={language === 'my' ? 'Excel (.xlsx) ဖြင့် ထုတ်ယူရန်' : 'Export Monthly Attendance & Leave Excel'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'Excel ထုတ်ရန်' : 'Export Excel'}</span>
              </button>

              {canEditMemberProfile && (
                <button
                  onClick={() => onOpenEditProfile(member)}
                  className="cube-3d-tile flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 rounded-xl"
                  title={`Edit Profile of ${member.name}`}
                >
                  <UserPen className="w-3.5 h-3.5" />
                  <span>{language === 'my' ? 'Profile & ဓာတ်ပုံ ပြင်ရန်' : 'Edit Profile & Photo'}</span>
                </button>
              )}

              {isAdmin && onUpdateMemberStatus && (
                <button
                  onClick={() => {
                    if (isResigned) {
                      onUpdateMemberStatus(member.id, 'Active');
                    } else {
                      setPendingConfirm({
                        title: language === 'my' ? 'ဝန်ထမ်းအထွက် သတ်မှတ်ရန်' : 'Offboard Team Member',
                        message:
                          language === 'my'
                            ? `"${member.name}" အား ဝန်ထမ်းအထွက် (Resigned) အဖြစ် သတ်မှတ်ရန် သေချာပါသလား?`
                            : `Mark "${member.name}" as Resigned / Offboarded?`,
                        confirmLabel: language === 'my' ? 'နုတ်ထွက်မှတ်မည်' : 'Offboard',
                        isDestructive: false,
                        onConfirm: () => onUpdateMemberStatus(member.id, 'Resigned'),
                      });
                    }
                  }}
                  className={`cube-3d-tile flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border ${
                    isResigned
                      ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400/50 hover:bg-emerald-600/50'
                      : 'bg-red-600/25 text-red-200 border-red-400/50 hover:bg-red-600/45'
                  }`}
                >
                  {isResigned ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{language === 'my' ? 'ပြန်ခန့်ရန်' : 'Reactivate'}</span>
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>{language === 'my' ? 'နုတ်ထွက်မှတ်ရန်' : 'Offboard'}</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-200 hover:text-white transition"
                title="Close Member Sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 4 Tactile 3D KPI Cubes */}
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <button
              type="button"
              onClick={() => setActiveSubtab('tasks')}
              className={`cube-3d-tile text-left rounded-2xl px-4 py-3 border transition ${
                activeSubtab === 'tasks'
                  ? 'bg-gradient-to-b from-blue-600 to-blue-700 border-blue-400/60 text-white'
                  : 'bg-white/10 border-white/15 text-slate-100 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold opacity-85">
                <span>{language === 'my' ? 'စုစုပေါင်း Task' : 'Total Tasks'}</span>
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5">
                {memberTasks.length}
                <span className="text-[11px] font-semibold opacity-80 ml-1.5">
                  ({activeTaskCount} active{overdueTaskCount > 0 ? `, ${overdueTaskCount} overdue` : ''})
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('leaves')}
              className={`cube-3d-tile text-left rounded-2xl px-4 py-3 border transition ${
                activeSubtab === 'leaves'
                  ? 'bg-gradient-to-b from-teal-600 to-teal-700 border-teal-400/60 text-white'
                  : 'bg-white/10 border-white/15 text-slate-100 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold opacity-85">
                <span>{language === 'my' ? 'ခွင့်ရက် စုစုပေါင်း' : 'Leave Days'}</span>
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5">
                {totalLeaveDays} <span className="text-xs font-semibold opacity-85">days</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubtab('training')}
              className={`cube-3d-tile text-left rounded-2xl px-4 py-3 border transition ${
                activeSubtab === 'training'
                  ? 'bg-gradient-to-b from-purple-600 to-purple-700 border-purple-400/60 text-white'
                  : 'bg-white/10 border-white/15 text-slate-100 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold opacity-85">
                <span>{language === 'my' ? 'Training Topics & နာရီ' : 'Topics & Hours'}</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5">
                {totalTrainingHours.toFixed(1)}{' '}
                <span className="text-xs font-semibold opacity-85">
                  hrs · {memberTraining.length} topics
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubtab('attendance');
                setViewAllMonths(false);
              }}
              className={`cube-3d-tile text-left rounded-2xl px-4 py-3 border transition ${
                activeSubtab === 'attendance'
                  ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 border-emerald-400/60 text-white'
                  : 'bg-white/10 border-white/15 text-slate-100 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold opacity-85">
                <span>
                  {language === 'my'
                    ? `ရုံးတက် & ခွင့် (${formatMonthLabel(selectedMonth, language)})`
                    : `Attendance (${formatMonthLabel(selectedMonth, language)})`}
                </span>
                <Building2 className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-xl font-black tabular-nums mt-0.5">
                {monthlyAttendance.officePresentDays}d{' '}
                <span className="text-xs font-semibold opacity-90">
                  {language === 'my' ? 'တက်' : 'in'} · {monthlyAttendance.approvedLeaveDaysInMonth}d{' '}
                  {language === 'my' ? 'ခွင့်' : 'leave'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Subtabs & Quick Action Bar */}
        <div className="bg-white border-b border-slate-200 px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubtab('tasks')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition ${
                activeSubtab === 'tasks'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks ({monthTasks.length})</span>
            </button>

            <button
              onClick={() => setActiveSubtab('leaves')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition ${
                activeSubtab === 'leaves'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Leaves ({monthLeaves.length})</span>
            </button>

            <button
              onClick={() => setActiveSubtab('training')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition ${
                activeSubtab === 'training'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Topics / Training ({monthTraining.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubtab('attendance');
                setViewAllMonths(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition ${
                activeSubtab === 'attendance'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {language === 'my'
                  ? `ရုံးတက် & ခွင့် (${monthlyAttendance.officePresentDays}/${monthlyAttendance.workingDaysInMonth})`
                  : `Attendance & Leave (${monthlyAttendance.officePresentDays}/${monthlyAttendance.workingDaysInMonth})`}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onOpenAddTask(
                      member,
                      viewAllMonths ? undefined : getDefaultDateForMonthWeek(selectedMonth, selectedWeek)
                    )
                  }
                  className="cube-3d-tile flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Task</span>
                </button>
                <button
                  onClick={() =>
                    onOpenAddLeave(
                      member,
                      viewAllMonths ? undefined : getDefaultDateForMonthWeek(selectedMonth, selectedWeek)
                    )
                  }
                  className="cube-3d-tile flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Leave</span>
                </button>
                <button
                  onClick={() =>
                    onOpenAddTraining(
                      member,
                      viewAllMonths ? undefined : getDefaultDateForMonthWeek(selectedMonth, selectedWeek)
                    )
                  }
                  className="cube-3d-tile flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Topic</span>
                </button>
              </div>
            )}

            <span className="text-[11px] font-semibold text-slate-600 hidden md:inline-flex items-center gap-1 pl-2 border-l border-slate-200">
              {isMe ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-blue-700">{t.myPersonalSheet}</span>
                </>
              ) : isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                  <span className="text-purple-700">Admin Full Control</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{member.name}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Month & Weekly Breakdown Bar (1st Week, 2nd Week, 3rd Week, 4th Week, 5th Week) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-7 py-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Month Navigator */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setViewAllMonths(false);
                  setSelectedMonth((prev) => shiftMonth(prev, -1));
                }}
                className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                    setViewAllMonths(false);
                  }
                }}
                className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />

              <button
                type="button"
                onClick={() => {
                  setViewAllMonths(false);
                  setSelectedMonth((prev) => shiftMonth(prev, 1));
                }}
                className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition shadow-2xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewAllMonths((prev) => !prev)}
                disabled={activeSubtab === 'attendance'}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  activeSubtab === 'attendance'
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : viewAllMonths
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {language === 'my' ? 'လအားလုံးကြည့်မည်' : 'All Months'}
              </button>
            </div>

            <div className="text-[11px] font-semibold text-slate-500">
              {viewAllMonths && activeSubtab !== 'attendance'
                ? language === 'my'
                  ? 'လအားလုံးရှိ မှတ်တမ်းများကို ပြသထားသည်'
                  : 'Showing records across all months'
                : language === 'my'
                ? `${formatMonthLabel(selectedMonth, language)} အတွက် အပတ်စဉ်ခွဲခြားမှု`
                : `Weekly Breakdown · ${formatMonthLabel(selectedMonth, language)}`}
            </div>
          </div>

          {/* 1st Week, 2nd Week, 3rd Week, 4th Week, 5th Week Square Box Cards */}
          {(!viewAllMonths || activeSubtab === 'attendance') && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedWeek('all')}
                className={`cube-3d-tile p-3 rounded-lg text-left border-2 transition flex flex-col justify-between min-h-[72px] ${
                  selectedWeek === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-extrabold leading-tight">
                    {language === 'my' ? 'တစ်လလုံး' : 'All Weeks'}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-black tabular-nums ${
                      selectedWeek === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {activeSubtab === 'tasks'
                      ? monthTasks.length
                      : activeSubtab === 'leaves'
                      ? monthLeaves.length
                      : activeSubtab === 'attendance'
                      ? `${monthlyAttendance.officePresentDays}d`
                      : monthTraining.length}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold mt-1.5 ${
                    selectedWeek === 'all' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {language === 'my' ? 'အပတ်အားလုံး' : 'Full Month'}
                </span>
              </button>

              {weeksInMonth.map((wk) => {
                const wkCount = getRecordCountForWeek(wk);
                const { startDay, endDay } = getWeekDayRange(selectedMonth, wk);
                const isSelected = selectedWeek === wk;
                const activeBoxCls =
                  activeSubtab === 'tasks'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : activeSubtab === 'leaves'
                    ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                    : activeSubtab === 'attendance'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-purple-700 text-white border-purple-800 shadow-sm';

                return (
                  <button
                    key={wk}
                    type="button"
                    onClick={() => setSelectedWeek(wk)}
                    className={`cube-3d-tile p-3 rounded-lg text-left border-2 transition flex flex-col justify-between min-h-[72px] ${
                      isSelected
                        ? activeBoxCls
                        : 'bg-white text-slate-800 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold">{getWeekOrdinal(wk)}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-black tabular-nums ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : wkCount > 0
                            ? 'bg-slate-900/10 text-slate-900'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {wkCount}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold tabular-nums mt-1.5 ${
                        isSelected ? 'text-white/85' : 'text-slate-500'
                      }`}
                    >
                      {language === 'my' ? `ရက် ${startDay}–${endDay}` : `Days ${startDay}–${endDay}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable 3D Sheet Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-grow space-y-4 bg-gradient-to-b from-slate-100 to-slate-200/70">
          {renderActiveRecords()}
        </div>
      </div>

      {/* In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => {
          pendingConfirm?.onConfirm();
          setPendingConfirm(null);
        }}
        title={pendingConfirm?.title}
        message={pendingConfirm?.message}
        confirmLabel={pendingConfirm?.confirmLabel}
        isDestructive={pendingConfirm?.isDestructive ?? true}
        language={language}
      />
    </div>
  );
};
