import React, { useState, useEffect } from 'react';
import { TaskItem, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { isAdminOrSuper, canApproveTaskCompletion } from '../utils/roleHelpers';
import { isTaskOverdue, isTaskNearDeadline, formatDeadlineNotiLabel } from '../utils/taskHelpers';
import {
  CheckSquare,
  MessageSquare,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  RotateCcw,
  Users,
  Clock,
  Bell,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface TasksTabProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  filterRequest?: {
    filter: 'all' | 'my' | 'overdue' | 'due-soon' | 'active' | 'pending' | 'completed';
    key: number;
  } | null;
  onGoToDirectory: () => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onApproveTaskCompletion: (taskId: string, approved: boolean) => void;
  onOpenComments: (task: TaskItem) => void;
  language: Language;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  currentUser,
  allUsers,
  filterRequest,
  onGoToDirectory,
  onOpenMemberSheet,
  onOpenEditTask,
  onDeleteTask,
  onApproveTaskCompletion,
  onOpenComments,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<
    'all' | 'my' | 'overdue' | 'due-soon' | 'active' | 'pending' | 'completed'
  >('all');
  const [search, setSearch] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (filterRequest) {
      setFilter(filterRequest.filter);
    }
  }, [filterRequest]);

  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const canApproveComplete = canApproveTaskCompletion(currentUser.roleTier);
  const isViewer = currentUser.roleTier === 'VIEWER';
  const todayStr = new Date().toISOString().split('T')[0];

  const isPendingTask = (task: TaskItem) =>
    task.status === 'Pending' || task.status === 'Waiting';

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'my') {
      const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
      if (!isMyTask) return false;
    } else if (filter === 'overdue') {
      if (!isTaskOverdue(task, todayStr)) return false;
    } else if (filter === 'due-soon') {
      if (!isTaskNearDeadline(task, todayStr)) return false;
    } else if (filter === 'active') {
      if (task.status !== 'Active') return false;
    } else if (filter === 'pending') {
      if (!isPendingTask(task)) return false;
    } else if (filter === 'completed') {
      if (task.status !== 'Completed') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchOwner = task.ownerName.toLowerCase().includes(q);
      const matchNote = task.note ? task.note.toLowerCase().includes(q) : false;
      return matchTitle || matchOwner || matchNote;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Notice */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>{t.tabTasks}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'my'
              ? 'Task အသစ်များကို L&D Team Directory ထဲရှိ သက်ဆိုင်ရာအဖွဲ့ဝင် Member Sheet မှသာ ဝင်ရောက်ဖြည့်သွင်းနိုင်ပါသည်။ Completed ဖြစ်ရန် Admin / Super Admin အတည်ပြုချက် လိုအပ်ပါသည်။'
              : 'Add new tasks directly inside the assigned member’s Member Sheet. Completed status requires Admin / Super Admin approval.'}
          </p>
        </div>

        <button
          onClick={onGoToDirectory}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
        >
          <Users className="w-4 h-4" />
          <span>{language === 'my' ? 'Member Sheet မှ Task ထည့်ရန်' : 'Open Member Sheets'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {language === 'my' ? 'အားလုံး' : 'All'} ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'my'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {language === 'my' ? 'ကိုယ့် Task' : 'My Tasks'} (
            {tasks.filter((t) => t.ownerId === currentUser.id || t.ownerName === currentUser.name).length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'overdue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            {t.overdue} ({tasks.filter((t) => isTaskOverdue(t, todayStr)).length})
          </button>
          <button
            onClick={() => setFilter('due-soon')}
            className={`px-3 py-1.5 rounded-lg font-bold transition inline-flex items-center gap-1 ${
              filter === 'due-soon'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>
              {language === 'my' ? 'Deadline နီး' : 'Due Soon'} (
              {tasks.filter((t) => isTaskNearDeadline(t, todayStr)).length})
            </span>
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.inProgress} ({tasks.filter((t) => t.status === 'Active').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {t.waiting} ({tasks.filter(isPendingTask).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {t.completed} ({tasks.filter((t) => t.status === 'Completed').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'my' ? 'ခေါင်းစဉ်၊ တာဝန်ခံ ရှာရန်...' : 'Search tasks...'}
            className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Main Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Assignee (တာဝန်ခံ)</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Follow-up</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Note / Progress</th>
                <th className="py-3 px-4 text-center">Manage / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    {language === 'my' ? 'ကိုက်ညီသော Task မရှိပါ။' : 'No tasks match current filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue = isTaskOverdue(task, todayStr);
                  const nearLabel = formatDeadlineNotiLabel(task, todayStr, language);
                  const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
                  const canEdit = (isMyTask || isAdmin) && !isViewer;
                  const displayStatus =
                    task.status === 'Active'
                      ? 'In Progress'
                      : task.status === 'Waiting' || task.status === 'Pending'
                      ? 'Pending'
                      : task.status;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-red-50/20' : nearLabel ? 'bg-amber-50/20' : isMyTask ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-sm">
                        <span className="block">{task.title}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            const found = allUsers.find(
                              (u) => u.id === task.ownerId || u.name === task.ownerName
                            );
                            if (found) onOpenMemberSheet(found);
                          }}
                          className="font-semibold text-slate-800 hover:text-blue-600 hover:underline flex items-center gap-1.5 text-left"
                          title={`Open sheet for ${task.ownerName}`}
                        >
                          <span>{task.ownerName}</span>
                          {isMyTask && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                              {language === 'my' ? 'သင်' : 'You'}
                            </span>
                          )}
                        </button>
                      </td>

                      <td className={`py-3.5 px-4 tabular-nums ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                        <div>{task.due}</div>
                        {nearLabel && (
                          <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                            <Bell className="w-2.5 h-2.5 text-amber-700" />
                            <span>{nearLabel}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 tabular-nums text-slate-600">
                        {task.followup}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded inline-block ${
                            task.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'Overdue'
                              ? 'bg-red-100 text-red-800'
                              : isPendingTask(task)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {displayStatus}
                        </span>
                        {task.completionRequested && (
                          <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit">
                            <Clock className="w-3 h-3" />
                            <span>
                              {language === 'my' ? 'Admin အတည်ပြုရန်' : 'Pending Approval'}
                            </span>
                          </span>
                        )}
                        {task.status === 'Completed' && task.completionApprovedBy && (
                          <span className="block text-[10px] text-emerald-700 mt-0.5">
                            ✓ {task.completionApprovedBy}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {task.note || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {canApproveComplete && task.completionRequested && (
                            <>
                              <button
                                onClick={() => onApproveTaskCompletion(task.id, true)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition"
                                title={language === 'my' ? 'ပြီးစီးကြောင်း အတည်ပြုရန်' : 'Approve Complete'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{language === 'my' ? 'Complete အတည်ပြု' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => onApproveTaskCompletion(task.id, false)}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition"
                                title={language === 'my' ? 'In Progress သို့ ပြန်ပို့ရန်' : 'Return to In Progress'}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => onOpenComments(task)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                            title={t.comments}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{task.comments ? task.comments.length : 0}</span>
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => onOpenEditTask(task)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-xs transition"
                                title={language === 'my' ? 'Task ပြင်ဆင်ရန်' : 'Edit task'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{language === 'my' ? 'ပြင်ရန်' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={() => setTaskToDelete(task)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 rounded-lg font-bold text-xs transition"
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};

