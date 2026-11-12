import React, { useState } from 'react';
import { TaskItem, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { 
  CheckSquare, 
  Plus, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Filter 
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface TasksTabProps {
  tasks: TaskItem[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onOpenAddTask: (targetMember?: UserProfile) => void;
  onOpenAddLeave: (targetMember?: UserProfile) => void;
  onOpenAddTraining: (targetMember?: UserProfile) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenComments: (task: TaskItem) => void;
  language: Language;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  currentUser,
  allUsers,
  onOpenAddTask,
  onOpenMemberSheet,
  onOpenEditTask,
  onDeleteTask,
  onOpenComments,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<'all' | 'my' | 'overdue' | 'active' | 'waiting' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const isAdmin = currentUser.roleTier === 'ADMIN';
  const isViewer = currentUser.roleTier === 'VIEWER';

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // 1. Tab Status Filter
    if (filter === 'my') {
      const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
      if (!isMyTask) return false;
    } else if (filter === 'overdue') {
      if (task.status !== 'Overdue') return false;
    } else if (filter === 'active') {
      if (task.status !== 'Active') return false;
    } else if (filter === 'waiting') {
      if (task.status !== 'Waiting') return false;
    } else if (filter === 'completed') {
      if (task.status !== 'Completed') return false;
    }

    // 2. Search Query
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
              ? 'ကိုယ့်နာမည်ဖြင့် Task အသစ်ထည့်ရန်၊ ပြင်ဆင်ရန်၊ အလွယ်တကူ ပြန်ဖျက်ရန်နှင့် မှတ်ချက် ရေးသားရန်'
              : 'Add, edit, delete tasks under your name, and write discussion comments'}
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => onOpenAddTask()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addMyTask}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
        {/* Filter Pills */}
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
            {language === 'my' ? 'ကိုယ့် Task' : 'My Tasks'} ({tasks.filter((t) => t.ownerId === currentUser.id || t.ownerName === currentUser.name).length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'overdue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            {t.overdue} ({tasks.filter((t) => t.status === 'Overdue').length})
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
            onClick={() => setFilter('waiting')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'waiting'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {t.waiting} ({tasks.filter((t) => t.status === 'Waiting').length})
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
                  const isOverdue = task.status === 'Overdue';
                  const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
                  const canEdit = (isMyTask || isAdmin) && !isViewer;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-red-50/20' : isMyTask ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-sm">
                        <span className="block">{task.title}</span>
                      </td>

                      {/* Clean Assignee cell without +task, +leave, +topic clutter */}
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
                        {task.due}
                      </td>

                      <td className="py-3.5 px-4 tabular-nums text-slate-600">
                        {task.followup}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded ${
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

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {task.note || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Comments button with badge */}
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

      {/* Guaranteed In-App Delete Confirmation Modal (no browser window.confirm) */}
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
