import React, { useState } from 'react';
import { UserProfile, TaskItem, LeaveRequest, TrainingLog, MemberStatus } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { 
  Users, 
  ArrowRight, 
  UserPen, 
  UserPlus, 
  MessageSquare, 
  Filter, 
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserMinus,
  Edit3,
  Trash2
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface DirectoryTabProps {
  allUsers: UserProfile[];
  currentUser: UserProfile;
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  trainingLogs: TrainingLog[];
  onOpenMemberSheet: (member: UserProfile) => void;
  onOpenEditProfile: (user?: UserProfile) => void;
  onOpenAddTask: (targetMember?: UserProfile) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddLeave: (targetMember?: UserProfile) => void;
  onOpenAddTraining: (targetMember?: UserProfile) => void;
  onOpenComments: (task: TaskItem) => void;
  onOpenAddUser: () => void;
  onUpdateMemberStatus?: (userId: string, newStatus: MemberStatus) => void;
  language: Language;
}

export const DirectoryTab: React.FC<DirectoryTabProps> = ({
  allUsers,
  currentUser,
  tasks,
  leaves,
  trainingLogs,
  onOpenMemberSheet,
  onOpenEditProfile,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onOpenAddLeave,
  onOpenAddTraining,
  onOpenComments,
  onOpenAddUser,
  onUpdateMemberStatus,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [taskFilter, setTaskFilter] = useState<'all' | 'my' | 'overdue' | 'followup'>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'resigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const isAdmin = currentUser.roleTier === 'ADMIN';

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

  // Filter tasks for master table
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'my') {
      const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
      if (!isMyTask) return false;
    } else if (taskFilter === 'overdue') {
      if (task.status !== 'Overdue') return false;
    } else if (taskFilter === 'followup') {
      if (task.status !== 'Active' && task.status !== 'Waiting') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.ownerName.toLowerCase().includes(q) ||
        (task.note && task.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Notice for User Self-Management & Admin Portal */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-blue-800/50 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {language === 'my' ? 'မိမိကိုယ်တိုင် စီမံခွင့်စနစ်' : 'Self-Service Enabled'}
            </span>
            <span className="text-xs text-blue-200">
              {language === 'my' ? `လက်ရှိအကောင့်: ${currentUser.name} (${currentUser.roleLabel})` : `Logged in as: ${currentUser.name}`}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">
            {language === 'my'
              ? 'ကိုယ့်နာမည်ဖြင့် Task၊ ခွင့်ရက်နှင့် သင်တန်းများကို စိတ်ကြိုက်ထည့်သွင်း/ပြင်ဆင်/ဖျက်နိုင်ပါသည်'
              : 'Directly add, edit, and delete tasks, leaves, and training under your name'}
          </h2>
          <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
            {language === 'my'
              ? 'အဖွဲ့ဝင်ကတ်များပေါ်ရှိ +Task, +Leave, +Topic ကို နှိပ်၍ အပေါ်မှလူရွေးစရာမလိုဘဲ တိုက်ရိုက်ထည့်သွင်းနိုင်ပြီး ကတ်ကိုနှိပ်၍ ထိုသူ၏ Profile နှင့် မှတ်တမ်းများကို တန်းပြင်နိုင်ပါသည်။'
              : 'Click 1-click action buttons on any card to add records directly without header switching, or click the card to view and edit details.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {currentUser.roleTier !== 'VIEWER' && (
            <button
              onClick={() => onOpenEditProfile(currentUser)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition"
            >
              <UserPen className="w-4 h-4" />
              <span>{t.editProfile}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenAddUser}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition border border-blue-400"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'my' ? 'ဝန်ထမ်းအဝင်/အထွက် စီမံရန် (Admin)' : 'Staff In/Out Portal'}</span>
            </button>
          )}
        </div>
      </div>

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

          {/* Onboarding / Offboarding (အဝင်/အထွက်) Member Filter Tabs */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => {
            const isMe = user.id === currentUser.id || user.name === currentUser.name;
            const isResigned = user.status === 'Resigned';
            const uTasks = tasks.filter((t) => t.ownerId === user.id || t.ownerName === user.name);
            const uLeaves = leaves.filter((l) => l.memberId === user.id || l.memberName === user.name);
            const uTraining = trainingLogs.filter(
              (tr) => tr.attendeeIds?.includes(user.id) || tr.attendeeNames?.includes(user.name)
            );
            const uHours = uTraining.reduce((sum, tr) => sum + (tr.calculatedHours || 0), 0);

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

                  {/* Name & Titles */}
                  <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {user.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{user.roleLabel}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.dept || 'L&D Dept'}</p>
                </div>

                {/* Micro Stats Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
                  <div className="bg-blue-50/60 p-1 rounded-md">
                    <span className="text-[9px] text-blue-600 font-bold uppercase block">
                      Tasks
                    </span>
                    <span className="text-xs font-extrabold text-blue-900 tabular-nums">
                      {uTasks.length}
                    </span>
                  </div>
                  <div className="bg-teal-50/60 p-1 rounded-md">
                    <span className="text-[9px] text-teal-600 font-bold uppercase block">
                      Leaves
                    </span>
                    <span className="text-xs font-extrabold text-teal-900 tabular-nums">
                      {uLeaves.length}
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

      {/* Live Department Master Task Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'my' ? 'ဌာနတွင်း လုပ်ငန်းတာဝန်များ တိုက်ရိုက်စောင့်ကြည့်ဘုတ်' : 'Live Department Task Overview'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'my'
                ? 'ကိုယ့် Task များကို Edit / Delete ပြုလုပ်နိုင်ပြီး Due Date၊ Follow-up Date များနှင့် Status အခြေအနေများကို စီမံနိုင်သည်'
                : 'Directly edit/delete tasks, due dates, follow-up dates and status monitoring'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={language === 'my' ? 'Task ရှာရန်...' : 'Search tasks...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-48"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-2.5 py-1 rounded-md transition ${
                  taskFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'my' ? 'အားလုံး' : 'All'}
              </button>
              <button
                onClick={() => setTaskFilter('my')}
                className={`px-2.5 py-1 rounded-md transition ${
                  taskFilter === 'my' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'my' ? 'ကိုယ့် Task' : 'My Tasks'}
              </button>
              <button
                onClick={() => setTaskFilter('overdue')}
                className={`px-2.5 py-1 rounded-md transition ${
                  taskFilter === 'overdue' ? 'bg-red-500 text-white shadow-sm font-bold' : 'text-red-700 hover:bg-red-50'
                }`}
              >
                {t.overdue}
              </button>
            </div>

            {currentUser.roleTier !== 'VIEWER' && (
              <button
                onClick={() => onOpenAddTask()}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                + {t.addMyTask}
              </button>
            )}
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Task Title</th>
                <th className="py-3 px-3">Assignee (တာဝန်ခံ)</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Next Follow-up</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Latest Note / Progress</th>
                <th className="py-3 px-3 text-center">Manage / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    {language === 'my' ? 'ကိုက်ညီသော Task မရှိပါ။' : 'No tasks match the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue = task.status === 'Overdue';
                  const isMyTask = task.ownerId === currentUser.id || task.ownerName === currentUser.name;
                  const canEdit = (isMyTask || isAdmin) && currentUser.roleTier !== 'VIEWER';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-red-50/30' : isMyTask ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                        <span className="block font-bold">{task.title}</span>
                        {isMyTask && (
                          <span className="inline-block text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 rounded mt-0.5">
                            {language === 'my' ? 'သင့် Task' : 'Your Task'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            const found = allUsers.find(
                              (u) => u.id === task.ownerId || u.name === task.ownerName
                            );
                            if (found) onOpenMemberSheet(found);
                          }}
                          className="font-bold text-slate-800 hover:text-blue-600 hover:underline flex items-center gap-1 text-left"
                          title={language === 'my' ? `${task.ownerName} ၏ Sheet ဖွင့်ရန်` : `Open sheet for ${task.ownerName}`}
                        >
                          <span>{task.ownerName}</span>
                        </button>
                      </td>
                      <td className={`py-3 px-3 tabular-nums ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                        {task.due}
                      </td>
                      <td className="py-3 px-3 tabular-nums text-slate-600">
                        {task.followup}
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                        {task.note || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => onOpenComments(task)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                            title="Comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>({task.comments ? task.comments.length : 0})</span>
                          </button>

                          {/* Direct Task Edit (Core Requirement) */}
                          {canEdit && (
                            <>
                              <button
                                onClick={() => onOpenEditTask(task)}
                                className="flex items-center gap-0.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-1.5 py-1 rounded font-bold text-[11px]"
                                title={language === 'my' ? 'Task ပြင်ဆင်ရန်' : 'Edit task'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{language === 'my' ? 'ပြင်' : 'Edit'}</span>
                              </button>

                              {/* Direct Task Delete (In-App Guaranteed Deletion) */}
                              <button
                                onClick={() => setTaskToDelete(task)}
                                className="flex items-center gap-0.5 text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-1.5 py-1 rounded font-bold text-[11px]"
                                title={language === 'my' ? 'Task ဖျက်ရန်' : 'Delete task'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{language === 'my' ? 'ဖျက်' : 'Del'}</span>
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
