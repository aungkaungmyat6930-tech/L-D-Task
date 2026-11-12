import React, { useState } from 'react';
import { UserProfile, TaskItem, LeaveRequest, TrainingLog, MemberStatus } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
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
  Check, 
  AlertCircle,
  User,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPen
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
  onOpenAddTask: (member: UserProfile) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenComments: (task: TaskItem) => void;
  onOpenAddLeave: (member: UserProfile) => void;
  onOpenEditLeave: (leave: LeaveRequest) => void;
  onDeleteLeave: (leaveId: string) => void;
  onApproveLeave: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  onOpenAddTraining: (member: UserProfile) => void;
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
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
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
  const [activeSubtab, setActiveSubtab] = useState<'tasks' | 'leaves' | 'training'>('tasks');

  if (!isOpen || !member) return null;

  const isMe = currentUser.id === member.id || currentUser.name === member.name;
  const isAdmin = currentUser.roleTier === 'ADMIN';
  const isViewer = currentUser.roleTier === 'VIEWER';
  const isResigned = member.status === 'Resigned';

  // Has management rights over this member's sheet
  const canEditMemberProfile = (isMe || isAdmin) && !isViewer;
  const hasSheetControl = (isMe || isAdmin) && !isViewer;

  // Filter records for this member
  const memberTasks = tasks.filter(
    (t) => t.ownerId === member.id || t.ownerName === member.name
  );
  const memberLeaves = leaves.filter(
    (l) => l.memberId === member.id || l.memberName === member.name
  );
  const memberTraining = trainingLogs.filter(
    (tr) =>
      tr.attendeeIds?.includes(member.id) ||
      tr.attendeeNames?.includes(member.name)
  );

  const totalTrainingHours = memberTraining.reduce(
    (acc, tr) => acc + (tr.calculatedHours || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Member Info */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={member.avatar}
                alt={member.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-sm bg-slate-800"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  isResigned ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                title={isResigned ? 'Resigned' : 'Active'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  {member.name}
                </h3>
                {isMe && (
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                    {language === 'my' ? 'သင့်အကောင့် (You)' : 'You'}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    member.roleTier === 'ADMIN'
                      ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40'
                      : member.roleTier === 'VIEWER'
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-blue-900/80 text-blue-200 border border-blue-500/40'
                  }`}
                >
                  {member.roleTier}
                </span>

                {isResigned ? (
                  <span className="text-[10px] font-bold bg-red-900/80 text-red-200 border border-red-500/50 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span>{language === 'my' ? 'နုတ်ထွက်ပြီး (အထွက်)' : 'Resigned'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 px-2 py-0.5 rounded flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    <span>{language === 'my' ? 'တာဝန်ထမ်းဆောင်ဆဲ (အဝင်)' : 'Active'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {member.roleLabel} • <span className="text-slate-400">{member.dept}</span>
                {member.email && <span className="text-slate-400 ml-2">✉ {member.email}</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick 1-Click Action Adders */}
            {!isViewer && (
              <div className="flex items-center gap-1 mr-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => onOpenAddTask(member)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm transition"
                  title={`Add Task directly for ${member.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Task</span>
                </button>
                <button
                  onClick={() => onOpenAddLeave(member)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-md shadow-sm transition"
                  title={`Submit Leave directly for ${member.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Leave</span>
                </button>
                <button
                  onClick={() => onOpenAddTraining(member)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-md shadow-sm transition"
                  title={`Log Training directly for ${member.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Training</span>
                </button>
              </div>
            )}

            {/* Direct Profile Edit Button (Core Requirement) */}
            {canEditMemberProfile && (
              <button
                onClick={() => onOpenEditProfile(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition"
                title={`Edit Profile of ${member.name}`}
              >
                <UserPen className="w-3.5 h-3.5" />
                <span>{language === 'my' ? 'Profile ပြင်ဆင်ရန်' : 'Edit Profile'}</span>
              </button>
            )}

            {/* Admin Offboard / Reactivate Toggle */}
            {isAdmin && onUpdateMemberStatus && (
              <button
                onClick={() => {
                  if (isResigned) {
                    onUpdateMemberStatus(member.id, 'Active');
                  } else {
                    if (
                      confirm(
                        language === 'my'
                          ? `"${member.name}" အား ဝန်ထမ်းအထွက် (Resigned) အဖြစ် သတ်မှတ်ရန် သေချာပါသလား?`
                          : `Mark "${member.name}" as Resigned / Offboarded?`
                      )
                    ) {
                      onUpdateMemberStatus(member.id, 'Resigned');
                    }
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                  isResigned
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 hover:bg-emerald-600/40'
                    : 'bg-red-600/20 text-red-300 border-red-500 hover:bg-red-600/40'
                }`}
                title={isResigned ? 'Reactivate member' : 'Offboard member'}
              >
                {isResigned ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{language === 'my' ? 'ပြန်လည်ခန့်ရန်' : 'Reactivate'}</span>
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
              className="text-slate-400 hover:text-white p-1 rounded-md transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtabs & Permission Indicator Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Subtab Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveSubtab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeSubtab === 'tasks'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{t.tabTasks} ({memberTasks.length})</span>
            </button>

            <button
              onClick={() => setActiveSubtab('leaves')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeSubtab === 'leaves'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t.tabLeave} ({memberLeaves.length})</span>
            </button>

            <button
              onClick={() => setActiveSubtab('training')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeSubtab === 'training'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.tabTraining} ({totalTrainingHours.toFixed(1)} hrs)</span>
            </button>
          </div>

          {/* Permission / Status Badge */}
          <div className="flex items-center gap-2 font-semibold text-[11px]">
            {isMe ? (
              <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {t.myPersonalSheet}
              </span>
            ) : isAdmin ? (
              <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'my' ? 'Admin အခွင့်အရေး - စိတ်ကြိုက် ပြင်/ဖျက်/ခွင့်ပြုနိုင်သည်' : 'Admin: Full Control'}
              </span>
            ) : (
              <span className="text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{member.name} ၏ အချက်အလက်များ</span>
              </span>
            )}
          </div>
        </div>

        {/* Subtab Contents Container */}
        <div className="p-6 overflow-y-auto flex-grow space-y-4 bg-slate-50/50">
          {/* SUBTAB 1: TASKS */}
          {activeSubtab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    {language === 'my' ? `"${member.name}" ၏ လုပ်ငန်းတာဝန်များ` : `Tasks Assigned to ${member.name}`}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'my'
                      ? 'Task များ တိုက်ရိုက်ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်း၊ ဖျက်ခြင်းနှင့် မှတ်ချက် ရေးသားခြင်း'
                      : 'Add, edit, delete tasks and write progress comments'}
                  </p>
                </div>
                {!isViewer && (
                  <button
                    onClick={() => onOpenAddTask(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Task for {member.name}</span>
                  </button>
                )}
              </div>

              {memberTasks.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 italic">
                    {language === 'my' ? 'ဤအဖွဲ့ဝင်တွင် Task မရှိသေးပါ။' : `No tasks assigned to ${member.name} yet.`}
                  </p>
                  {!isViewer && (
                    <button
                      onClick={() => onOpenAddTask(member)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {language === 'my' ? `+ ${member.name} အတွက် Task စတင်ထည့်သွင်းရန်` : `+ Add task for ${member.name}`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Task Title</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Next Follow-up</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Latest Note</th>
                        <th className="p-3 text-center">Manage / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberTasks.map((task) => {
                        const isOverdue = task.status === 'Overdue';
                        const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
                        const canEditTask = (isMyTask || hasSheetControl) && !isViewer;

                        return (
                          <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-semibold text-slate-900 max-w-xs">
                              <span className="block font-bold">{task.title}</span>
                              {isMyTask && (
                                <span className="inline-block text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded mt-0.5">
                                  {language === 'my' ? 'သင့် Task' : 'Your Task'}
                                </span>
                              )}
                            </td>
                            <td className={`p-3 tabular-nums ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                              {task.due}
                            </td>
                            <td className="p-3 tabular-nums text-slate-600">
                              {task.followup}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
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
                            </td>
                            <td className="p-3 text-slate-500 max-w-xs truncate">
                              {task.note || '-'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Comment button */}
                                <button
                                  onClick={() => onOpenComments(task)}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold text-xs transition"
                                  title={t.comments}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>({task.comments ? task.comments.length : 0})</span>
                                </button>

                                {/* Direct Edit Button (Core Requirement) */}
                                {canEditTask && (
                                  <>
                                    <button
                                      onClick={() => onOpenEditTask(task)}
                                      className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-bold text-xs transition"
                                      title={language === 'my' ? 'Task ပြင်ဆင်ရန်' : 'Edit task'}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>{language === 'my' ? 'ပြင်ရန်' : 'Edit'}</span>
                                    </button>

                                    {/* Direct Delete Button (Core Requirement) */}
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            language === 'my'
                                              ? `"${task.title}" ကို ဖျက်ရန် သေချာပါသလား?`
                                              : `Delete task "${task.title}"?`
                                          )
                                        ) {
                                          onDeleteTask(task.id);
                                        }
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-bold text-xs transition"
                                      title={language === 'my' ? 'Task ဖျက်ရန်' : 'Delete task'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{language === 'my' ? 'ဖျက်ရန်' : 'Del'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: LEAVES */}
          {activeSubtab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    {language === 'my' ? `"${member.name}" ၏ ခွင့်ရက်မှတ်တမ်းများ` : `Leave Requests for ${member.name}`}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'my'
                      ? 'ခွင့်ရက် တင်သွင်းခြင်း၊ ပြင်ဆင်ခြင်း၊ ဖျက်ခြင်းနှင့် Admin အတည်ပြုချက်'
                      : 'Submit, edit, delete leave records and manage approval'}
                  </p>
                </div>
                {!isViewer && (
                  <button
                    onClick={() => onOpenAddLeave(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Leave for {member.name}</span>
                  </button>
                )}
              </div>

              {memberLeaves.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 italic">
                    {language === 'my' ? 'ခွင့်မှတ်တမ်း မရှိသေးပါ။' : `No leave records logged for ${member.name}.`}
                  </p>
                  {!isViewer && (
                    <button
                      onClick={() => onOpenAddLeave(member)}
                      className="text-xs font-bold text-teal-600 hover:underline"
                    >
                      {language === 'my' ? `+ ${member.name} အတွက် ခွင့်တောင်းခံလွှာ တင်သွင်းရန်` : `+ Submit leave request for ${member.name}`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Leave Type</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Date Range</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Manage / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberLeaves.map((leave) => {
                        const canEditLeave = (isMe || isAdmin) && !isViewer;

                        return (
                          <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-semibold text-slate-900">
                              {leave.type}
                            </td>
                            <td className="p-3 font-bold text-slate-700 tabular-nums">
                              {leave.duration} Days
                            </td>
                            <td className="p-3 tabular-nums text-slate-600">
                              {leave.start} ~ {leave.end}
                            </td>
                            <td className="p-3 text-slate-500 max-w-xs truncate">
                              {leave.reason}
                            </td>
                            <td className="p-3">
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
                              {leave.approvedBy && (
                                <span className="block text-[10px] text-slate-400">
                                  by {leave.approvedBy}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Admin Approve / Reject actions */}
                                {isAdmin && leave.status === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => onApproveLeave(leave.id, 'Approved')}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] shadow"
                                      title={t.approve}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => onApproveLeave(leave.id, 'Rejected')}
                                      className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px] shadow"
                                      title={t.reject}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {canEditLeave && (
                                  <>
                                    <button
                                      onClick={() => onOpenEditLeave(leave)}
                                      className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-bold text-xs transition"
                                      title={language === 'my' ? 'ခွင့်ပြင်ရန်' : 'Edit leave'}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>{language === 'my' ? 'ပြင်ရန်' : 'Edit'}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            language === 'my'
                                              ? 'ဤခွင့်မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?'
                                              : 'Delete this leave entry?'
                                          )
                                        ) {
                                          onDeleteLeave(leave.id);
                                        }
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-bold text-xs transition"
                                      title={language === 'my' ? 'ခွင့်ဖျက်ရန်' : 'Delete leave'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{language === 'my' ? 'ဖျက်ရန်' : 'Del'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: TRAINING HOURS */}
          {activeSubtab === 'training' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    {language === 'my' ? `"${member.name}" ၏ သင်တန်းနာရီ မှတ်တမ်းများ` : `Training Hours for ${member.name}`}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'my'
                      ? `စုစုပေါင်း သင်တန်းနာရီ: ${totalTrainingHours.toFixed(1)} hrs • ပုံသေနည်း: (ပြီးဆုံးချိန် − စတင်ချိန်) − အနားယူချိန်`
                      : `Total Accumulated: ${totalTrainingHours.toFixed(1)} hrs • Formula: (End - Start) - Break`}
                  </p>
                </div>
                {!isViewer && (
                  <button
                    onClick={() => onOpenAddTraining(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Training for {member.name}</span>
                  </button>
                )}
              </div>

              {memberTraining.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 italic">
                    {language === 'my' ? 'သင်တန်းမှတ်တမ်း မရှိသေးပါ။' : `No training sessions logged for ${member.name}.`}
                  </p>
                  {!isViewer && (
                    <button
                      onClick={() => onOpenAddTraining(member)}
                      className="text-xs font-bold text-purple-700 hover:underline"
                    >
                      {language === 'my' ? `+ ${member.name} အတွက် သင်တန်းနာရီ စတင်ထည့်သွင်းရန်` : `+ Log training session for ${member.name}`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Course / Session</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Time Window</th>
                        <th className="p-3">Break</th>
                        <th className="p-3">Calculated Hours</th>
                        <th className="p-3 text-center">Manage / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberTraining.map((tr) => {
                        const canEditTraining = (isMe || isAdmin) && !isViewer;

                        return (
                          <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-semibold text-slate-900 max-w-xs">
                              {tr.name}
                            </td>
                            <td className="p-3 tabular-nums text-slate-600">
                              {tr.date}
                            </td>
                            <td className="p-3 tabular-nums text-slate-600">
                              {tr.start} ~ {tr.end}
                            </td>
                            <td className="p-3 tabular-nums text-slate-600">
                              {tr.breakHrs} hr
                            </td>
                            <td className="p-3 font-bold text-purple-700 tabular-nums">
                              {tr.calculatedHours.toFixed(1)} hrs
                            </td>
                            <td className="p-3 text-center">
                              {canEditTraining ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => onOpenEditTraining(tr)}
                                    className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-bold text-xs transition"
                                    title={language === 'my' ? 'သင်တန်းပြင်ရန်' : 'Edit training'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{language === 'my' ? 'ပြင်ရန်' : 'Edit'}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          language === 'my'
                                            ? 'ဤသင်တန်းမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?'
                                            : 'Delete this training session?'
                                        )
                                      ) {
                                        onDeleteTraining(tr.id);
                                      }
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-bold text-xs transition"
                                    title={language === 'my' ? 'သင်တန်းဖျက်ရန်' : 'Delete training'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{language === 'my' ? 'ဖျက်ရန်' : 'Del'}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
