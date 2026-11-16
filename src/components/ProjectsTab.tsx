import React, { useState, useMemo } from 'react';
import { StrategicProject, TaskItem, TaskStatus, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { getDayOfWeekCode } from '../utils/weekHelpers';
import { isAdminOrSuper, canApproveTaskCompletion } from '../utils/roleHelpers';
import {
  FolderKanban,
  Plus,
  X,
  Check,
  Edit3,
  Trash2,
  MessageSquare,
  BellRing,
  ShieldCheck,
  Eye,
  Lock,
  Unlock,
  Layers,
  CheckCircle2,
  XCircle,
  Clock4,
  Send,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ProjectsTabProps {
  projects: StrategicProject[];
  tasks: TaskItem[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  allowMemberDeadlineSetup: boolean;
  onToggleAllowMemberDeadlineSetup: (enabled: boolean) => void;
  onAddProject: (proj: Partial<StrategicProject>) => void;
  onUpdateProject: (proj: StrategicProject) => void;
  onDeleteProject: (projectId: string) => void;
  onRequestProjectCompletion: (projectId: string) => void;
  onReviewProjectCompletion: (
    projectId: string,
    decision: 'Approved' | 'Pending' | 'Rejected'
  ) => void;
  onAddProjectComment: (projectId: string, text: string) => void;
  onDeleteProjectComment: (projectId: string, commentId: string) => void;
  onSaveTask: (taskData: Partial<TaskItem>) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenComments: (task: TaskItem) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  onApproveTaskCompletion: (taskId: string, approved: boolean) => void;
  language: Language;
}

const PROJECT_STAGES: StrategicProject['status'][] = [
  'In Progress',
  'On Track',
  'Final Review',
  'Completed',
];

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  tasks,
  currentUser,
  allUsers,
  allowMemberDeadlineSetup,
  onToggleAllowMemberDeadlineSetup,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onRequestProjectCompletion,
  onReviewProjectCompletion,
  onAddProjectComment,
  onDeleteProjectComment,
  onSaveTask,
  onDeleteTask,
  onOpenComments,
  onOpenMemberSheet,
  onApproveTaskCompletion,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const canApproveComplete = canApproveTaskCompletion(currentUser.roleTier);
  const isViewer = currentUser.roleTier === 'VIEWER';
  const canSetupDeadline = !isViewer && (isAdmin || allowMemberDeadlineSetup);
  const todayStr = new Date().toISOString().split('T')[0];

  const assignableUsers = useMemo(
    () => allUsers.filter((u) => u.roleTier !== 'VIEWER' && u.status !== 'Resigned'),
    [allUsers]
  );

  // Filters & Detail Modal
  const [filterMode, setFilterMode] = useState<'all' | 'followup' | 'my'>('all');
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [detailMemberFilter, setDetailMemberFilter] = useState<string>('all');
  const [projectCommentText, setProjectCommentText] = useState('');

  // Project Create/Edit Modal State
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<StrategicProject | null>(null);
  const [projTitle, setProjTitle] = useState('');
  const [projOwnerId, setProjOwnerId] = useState(currentUser.id);
  const [projCoIds, setProjCoIds] = useState<string[]>([]);
  const [projDeadline, setProjDeadline] = useState('2026-12-31');
  const [projFollowup, setProjFollowup] = useState(todayStr);
  const [projFollowupNote, setProjFollowupNote] = useState('');
  const [projDeliverables, setProjDeliverables] = useState('');
  const [projStatus, setProjStatus] = useState<StrategicProject['status']>('In Progress');
  const [projProgress, setProjProgress] = useState<number>(15);

  // Project Task Create/Edit Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskProjectTarget, setTaskProjectTarget] = useState<StrategicProject | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwnerId, setTaskOwnerId] = useState(currentUser.id);
  const [taskCoIds, setTaskCoIds] = useState<string[]>([]);
  const [taskDue, setTaskDue] = useState(todayStr);
  const [taskFollowup, setTaskFollowup] = useState(todayStr);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Active');
  const [taskNote, setTaskNote] = useState('');

  // Confirm delete states
  const [projectToDelete, setProjectToDelete] = useState<StrategicProject | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const openCreateProjectModal = () => {
    setEditingProject(null);
    setProjTitle('');
    setProjOwnerId(assignableUsers[0]?.id || currentUser.id);
    setProjCoIds([]);
    setProjDeadline('2026-12-31');
    setProjFollowup(todayStr);
    setProjFollowupNote('');
    setProjDeliverables('');
    setProjStatus('In Progress');
    setProjProgress(10);
    setIsProjModalOpen(true);
  };

  const openEditProjectModal = (proj: StrategicProject) => {
    setEditingProject(proj);
    setProjTitle(proj.title);
    setProjOwnerId(proj.ownerId);
    setProjCoIds(proj.coAssigneeIds || []);
    setProjDeadline(proj.deadline);
    setProjFollowup(proj.followupDate || todayStr);
    setProjFollowupNote(proj.followupNote || '');
    setProjDeliverables(proj.deliverables);
    setProjStatus(proj.status);
    setProjProgress(proj.progress);
    setIsProjModalOpen(true);
  };

  const toggleProjCoAssignee = (uid: string) => {
    setProjCoIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSaveProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    const owner = allUsers.find((u) => u.id === projOwnerId) || currentUser;
    const filteredCoIds = projCoIds.filter((id) => id !== owner.id);
    const coNames = filteredCoIds
      .map((id) => allUsers.find((u) => u.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    if (editingProject) {
      onUpdateProject({
        ...editingProject,
        title: projTitle.trim(),
        ownerId: owner.id,
        ownerName: owner.name,
        coAssigneeIds: filteredCoIds,
        coAssigneeNames: coNames,
        deadline: projDeadline,
        followupDate: projFollowup,
        followupNote: projFollowupNote.trim(),
        deliverables: projDeliverables.trim(),
        status: projStatus,
        progress: Math.min(100, Math.max(0, Number(projProgress) || 0)),
      });
    } else {
      onAddProject({
        title: projTitle.trim(),
        ownerId: owner.id,
        ownerName: owner.name,
        coAssigneeIds: filteredCoIds,
        coAssigneeNames: coNames,
        deadline: projDeadline,
        followupDate: projFollowup,
        followupNote: projFollowupNote.trim(),
        deliverables: projDeliverables.trim(),
        progress: Math.min(100, Math.max(0, Number(projProgress) || 10)),
        status: projStatus,
      });
    }

    setIsProjModalOpen(false);
  };

  const openCreateProjectTaskModal = (proj: StrategicProject) => {
    setTaskProjectTarget(proj);
    setEditingTask(null);
    setTaskTitle('');
    setTaskOwnerId(proj.ownerId || currentUser.id);
    setTaskCoIds(proj.coAssigneeIds || []);
    setTaskDue(proj.deadline >= todayStr ? proj.deadline : todayStr);
    setTaskFollowup(todayStr);
    setTaskStatus('Active');
    setTaskNote('');
    setIsTaskModalOpen(true);
  };

  const openEditProjectTaskModal = (proj: StrategicProject, task: TaskItem) => {
    setTaskProjectTarget(proj);
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskOwnerId(task.ownerId);
    setTaskCoIds(task.coAssigneeIds || []);
    setTaskDue(task.due);
    setTaskFollowup(task.followup);
    setTaskStatus(task.status === 'Waiting' ? 'Pending' : task.status);
    setTaskNote(task.note || '');
    setIsTaskModalOpen(true);
  };

  const toggleTaskCoAssignee = (uid: string) => {
    setTaskCoIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSaveProjectTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskProjectTarget) return;

    const owner = allUsers.find((u) => u.id === taskOwnerId) || currentUser;
    const filteredCoIds = taskCoIds.filter((id) => id !== owner.id);
    const coNames = filteredCoIds
      .map((id) => allUsers.find((u) => u.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    onSaveTask({
      id: editingTask?.id,
      projectId: taskProjectTarget.id,
      title: taskTitle.trim(),
      ownerId: owner.id,
      ownerName: owner.name,
      coAssigneeIds: filteredCoIds,
      coAssigneeNames: coNames,
      due: taskDue,
      followup: taskFollowup,
      day: getDayOfWeekCode(taskDue),
      status: taskStatus,
      note: taskNote.trim(),
    });

    setIsTaskModalOpen(false);
  };

  const projectTasksAll = useMemo(
    () => tasks.filter((item) => Boolean(item.projectId)),
    [tasks]
  );

  const dueFollowupsCount = useMemo(() => {
    return projects.filter((p) => {
      const pTasks = tasks.filter((item) => item.projectId === p.id);
      const projFollowDue =
        p.status !== 'Completed' &&
        ((p.followupDate && p.followupDate <= todayStr) || p.deadline < todayStr);
      const taskFollowDue = pTasks.some(
        (tk) =>
          tk.status !== 'Completed' &&
          tk.status !== 'Cancelled' &&
          (tk.followup <= todayStr || tk.due < todayStr)
      );
      return projFollowDue || taskFollowDue;
    }).length;
  }, [projects, tasks, todayStr]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const pTasks = tasks.filter((item) => item.projectId === p.id);
      if (filterMode === 'followup') {
        const projFollowDue =
          p.status !== 'Completed' &&
          ((p.followupDate && p.followupDate <= todayStr) || p.deadline < todayStr);
        const taskFollowDue = pTasks.some(
          (tk) =>
            tk.status !== 'Completed' &&
            tk.status !== 'Cancelled' &&
            (tk.followup <= todayStr || tk.due < todayStr)
        );
        return projFollowDue || taskFollowDue;
      }
      if (filterMode === 'my') {
        const isProjMember =
          p.ownerId === currentUser.id ||
          p.ownerName === currentUser.name ||
          p.coAssigneeIds?.includes(currentUser.id);
        const isTaskMember = pTasks.some(
          (tk) =>
            tk.ownerId === currentUser.id ||
            tk.ownerName === currentUser.name ||
            tk.coAssigneeIds?.includes(currentUser.id)
        );
        return isProjMember || isTaskMember;
      }
      return true;
    });
  }, [projects, tasks, filterMode, currentUser, todayStr]);

  const getDeadlineBadge = (deadlineStr: string, isDone: boolean) => {
    if (isDone) {
      return { text: language === 'my' ? 'ပြီးစီး' : 'Done', cls: 'bg-emerald-100 text-emerald-800' };
    }
    if (deadlineStr < todayStr) {
      return { text: language === 'my' ? 'Deadline ကျော်' : 'Overdue', cls: 'bg-red-100 text-red-800' };
    }
    if (deadlineStr === todayStr) {
      return { text: language === 'my' ? 'ယနေ့ Deadline' : 'Due Today', cls: 'bg-amber-100 text-amber-800' };
    }
    return { text: deadlineStr, cls: 'bg-slate-100 text-slate-700' };
  };

  const getStageLabelMy = (stage: StrategicProject['status']) => {
    switch (stage) {
      case 'In Progress':
        return 'စတင်လုပ်ဆောင်ဆဲ (In Progress)';
      case 'On Track':
        return 'သတ်မှတ်ချက်အတိုင်း တိုးတက်နေ (On Track)';
      case 'Final Review':
        return 'နောက်ဆုံးစစ်ဆေးနေဆဲ (Final Review)';
      case 'Completed':
        return 'ပြီးစီးပြီ (Completed)';
    }
  };

  const detailProject = useMemo(
    () => (detailProjectId ? projects.find((p) => p.id === detailProjectId) || null : null),
    [detailProjectId, projects]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <FolderKanban className="w-5 h-5 text-blue-600" />
              <span>
                {language === 'my'
                  ? 'L&D မဟာဗျူဟာမြောက် စီမံကိန်းများ (Strategic Projects)'
                  : 'Strategic L&D Projects, Tasks & Follow-up Workspace'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {language === 'my' ? 'လူတိုင်း ဝင်ကြည့်နိုင်သည်' : 'Visible to Everyone'}
              </span>
              {isAdmin && (
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Mode
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'my'
                ? 'ခေါင်းစဉ်တစ်ခုချင်းစီတွင် မည်သူ့ကို တာဝန်ပေးထားသည်နှင့် မည်သည့်အဆင့်ရောက်နေပြီကို လူတိုင်းကြည့်ရှုနိုင်ပြီး Admin မှ Deadline Setup ခွင့်ပြုချက်နှင့် Task များကို စီမံနိုင်ပါသည်'
                : 'Everyone can view assignees, progress stages, and deadlines per project; Admin controls project tasks & universal deadline setup permissions'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Admin Deadline Setup Control Toggle */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => onToggleAllowMemberDeadlineSetup(!allowMemberDeadlineSetup)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border shadow-2xs transition ${
                  allowMemberDeadlineSetup
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title={
                  language === 'my'
                    ? 'အဖွဲ့ဝင်တိုင်း Deadline Setup လုပ်ခွင့် ဖွင့်/ပိတ်ရန် (Admin Control)'
                    : 'Toggle whether all team members can set up deadlines'
                }
              >
                {allowMemberDeadlineSetup ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>
                  {language === 'my'
                    ? `လူတိုင်း Deadline Setup ခွင့်: ${allowMemberDeadlineSetup ? 'ON' : 'OFF'}`
                    : `All-Member Deadline Setup: ${allowMemberDeadlineSetup ? 'ON' : 'OFF'}`}
                </span>
              </button>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl border ${
                  canSetupDeadline
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {canSetupDeadline ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {canSetupDeadline
                    ? language === 'my'
                      ? 'Deadline Setup လုပ်ခွင့်ရှိသည် (Admin ခွင့်ပြု)'
                      : 'Deadline Setup Enabled by Admin'
                    : language === 'my'
                    ? 'Deadline Setup (Admin သီးသန့်)'
                    : 'Deadline Setup: Admin Only'}
                </span>
              </span>
            )}

            {isAdmin && (
              <button
                onClick={openCreateProjectModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'my' ? 'Project အသစ် စတင်ရန် (Admin)' : 'Launch Project (Admin)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-800 tabular-nums">
              {language === 'my' ? 'စီမံကိန်း' : 'Projects'}: {projects.length}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 font-bold text-blue-900 tabular-nums">
              {language === 'my' ? 'Project Task စုစုပေါင်း' : 'Project Tasks'}: {projectTasksAll.length}
            </span>
            <span
              className={`px-3 py-1.5 rounded-lg border font-bold tabular-nums ${
                dueFollowupsCount > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {language === 'my' ? 'Follow-up စစ်ဆေးရန်' : 'Follow-up Due'}: {dueFollowupsCount}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'my' ? 'အားလုံး' : 'All Projects'}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('followup')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                filterMode === 'followup' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-800'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{language === 'my' ? 'Follow-up လိုက်ရန်' : 'Follow-ups'} ({dueFollowupsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('my')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'my' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'my' ? 'ကိုယ်ပါဝင်သည့် Project' : 'My Projects'}
            </button>
          </div>
        </div>
      </div>

      {/* Overall Strategic Projects Table (Click any topic to view/manage individually) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>
                {language === 'my'
                  ? 'Strategic Planning — Overall & ခေါင်းစဉ်တစ်ခုချင်းစီ စာရင်း'
                  : 'Strategic Planning — Overall Overview & Topic List'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {language === 'my'
                ? 'Overall အခြေအနေကို ကြည့်ရှုနိုင်ပြီး ခေါင်းစဉ်တစ်ခုချင်းစီကို နှိပ်၍ အသေးစိတ် ဝင်ကြည့်နိုင်ပါသည်'
                : 'Overall summary view — click any topic row to open and manage that topic individually'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
              <tr>
                <th className="p-3.5 min-w-[220px]">
                  {language === 'my' ? 'Topic / Project ခေါင်းစဉ်' : 'Topic / Project Title'}
                </th>
                <th className="p-3.5 min-w-[190px]">
                  {language === 'my' ? 'တာဝန်ပေးထားသူ (Assign / Co-Assign)' : 'Assigned To'}
                </th>
                <th className="p-3.5 min-w-[200px]">
                  {language === 'my' ? 'ရောက်ရှိနေသည့်အဆင့် (Stage)' : 'Current Stage & Progress'}
                </th>
                <th className="p-3.5 min-w-[175px]">
                  {language === 'my' ? 'Deadline Setup' : 'Deadline Setup'}
                </th>
                <th className="p-3.5 text-center whitespace-nowrap">
                  {language === 'my' ? 'Topic ဝင်ကြည့်ရန်' : 'Open Topic'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-xs text-slate-400">
                    {language === 'my'
                      ? 'ကိုက်ညီသော စီမံကိန်း မရှိပါ။'
                      : 'No strategic projects match the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const pTasks = tasks.filter((item) => item.projectId === proj.id);
                  const completedCount = pTasks.filter((tk) => tk.status === 'Completed').length;
                  const pct =
                    pTasks.length > 0
                      ? Math.round((completedCount / pTasks.length) * 100)
                      : proj.progress;
                  const stageIdx = Math.max(0, PROJECT_STAGES.indexOf(proj.status));
                  const ownerUser = allUsers.find(
                    (u) => u.id === proj.ownerId || u.name === proj.ownerName
                  );
                  const deadlineBadge = getDeadlineBadge(proj.deadline, proj.status === 'Completed');

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => {
                        setDetailMemberFilter('all');
                        setDetailProjectId(proj.id);
                      }}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline block">
                          {proj.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                          <span>
                            {pTasks.length} tasks
                            {proj.followupDate ? ` · Follow-up: ${proj.followupDate}` : ''}
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {proj.comments?.length || 0}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {ownerUser && (
                            <img
                              src={ownerUser.avatar}
                              alt={proj.ownerName}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => ownerUser && onOpenMemberSheet(ownerUser)}
                              className="font-bold text-slate-900 hover:text-blue-600 hover:underline block truncate"
                            >
                              {proj.ownerName}
                            </button>
                            {proj.coAssigneeNames && proj.coAssigneeNames.length > 0 && (
                              <span className="text-[10px] text-indigo-700 font-semibold block truncate">
                                Co: {proj.coAssigneeNames.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            {!isViewer ? (
                              <select
                                value={proj.status}
                                onChange={(e) => {
                                  const nextSt = e.target.value as StrategicProject['status'];
                                  if (nextSt === 'Completed' && !isAdmin) {
                                    onRequestProjectCompletion(proj.id);
                                    return;
                                  }
                                  onUpdateProject({
                                    ...proj,
                                    status: nextSt,
                                    progress: nextSt === 'Completed' ? 100 : proj.progress,
                                  });
                                }}
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                                  proj.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : proj.status === 'Final Review'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : proj.status === 'On Track'
                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                              >
                                {PROJECT_STAGES.map((st) => (
                                  <option key={st} value={st}>
                                    {st === 'Completed' && !isAdmin
                                      ? language === 'my'
                                        ? 'Completed (Approval တောင်းရန်)'
                                        : 'Completed (Request Approval)'
                                      : st}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  proj.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : proj.status === 'Final Review'
                                    ? 'bg-purple-100 text-purple-800'
                                    : proj.status === 'On Track'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {proj.status}
                              </span>
                            )}
                            <span className="text-[11px] font-black text-blue-700 tabular-nums">
                              {pct}%
                            </span>
                          </div>

                          {/* 4-Step Stage Indicator */}
                          <div className="grid grid-cols-4 gap-1">
                            {PROJECT_STAGES.map((st, idx) => (
                              <div
                                key={st}
                                title={st}
                                className={`h-1.5 rounded-full ${
                                  idx <= stageIdx
                                    ? proj.status === 'Completed'
                                      ? 'bg-emerald-500'
                                      : 'bg-blue-600'
                                    : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Completion Approval Status Pill & Admin Review Actions */}
                          {(proj.completionRequested || proj.completionStatus) && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {proj.completionStatus === 'Pending' || proj.completionRequested ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold">
                                  <Clock4 className="w-2.5 h-2.5" />
                                  <span>
                                    {language === 'my'
                                      ? 'Approval စောင့်ဆိုင်းဆဲ (Pending)'
                                      : 'Completion Pending'}
                                  </span>
                                </span>
                              ) : proj.completionStatus === 'Rejected' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 text-[9px] font-extrabold">
                                  <XCircle className="w-2.5 h-2.5" />
                                  <span>
                                    {language === 'my' ? 'ငြင်းပယ်ထားသည် (Rejected)' : 'Rejected'}
                                  </span>
                                </span>
                              ) : proj.completionStatus === 'Approved' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>
                                    {language === 'my' ? 'Approved' : 'Approved'}
                                  </span>
                                </span>
                              ) : null}

                              {isAdmin && (proj.completionRequested || proj.completionStatus === 'Pending') && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onReviewProjectCompletion(proj.id, 'Approved')}
                                    className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold"
                                    title="Approve Completion"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReviewProjectCompletion(proj.id, 'Pending')}
                                    className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[9px] font-bold"
                                    title="Keep Pending"
                                  >
                                    Pending
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReviewProjectCompletion(proj.id, 'Rejected')}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold"
                                    title="Reject Completion"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {!isViewer && !isAdmin && proj.status !== 'Completed' && !proj.completionRequested && (
                            <button
                              type="button"
                              onClick={() => onRequestProjectCompletion(proj.id)}
                              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition"
                            >
                              {language === 'my'
                                ? 'Complete Approval တောင်းရန်'
                                : 'Request Complete Approval'}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-start gap-1">
                          {canSetupDeadline ? (
                            <input
                              type="date"
                              value={proj.deadline}
                              onChange={(e) => {
                                if (e.target.value) {
                                  onUpdateProject({ ...proj, deadline: e.target.value });
                                }
                              }}
                              className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                            />
                          ) : (
                            <span className="font-bold text-slate-800 tabular-nums">
                              {proj.deadline}
                            </span>
                          )}
                          {(proj.status === 'Completed' || proj.deadline <= todayStr) && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deadlineBadge.cls}`}>
                              {deadlineBadge.text}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailMemberFilter('all');
                              setDetailProjectId(proj.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'my' ? 'ဝင်ကြည့်ရန်' : 'Open'}</span>
                          </button>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => openEditProjectModal(proj)}
                              className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                              title={language === 'my' ? 'Project ပြင်ရန်' : 'Edit project'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setProjectToDelete(proj)}
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                              title={language === 'my' ? 'Project ဖျက်ရန်' : 'Delete project'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Modal 1: Launch / Edit Strategic Project */}
      {isProjModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {editingProject
                  ? language === 'my'
                    ? 'Project ပြင်ဆင်ရန် (Deadline / Assign / Co-Assign)'
                    : 'Edit Strategic Project'
                  : language === 'my'
                  ? 'စီမံကိန်းအသစ် စတင်ရန် (Admin)'
                  : 'Launch Strategic L&D Project'}
              </h3>
              <button
                onClick={() => setIsProjModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. Agency Onboarding Excellence 2026"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Lead (Assign)
                  </label>
                  <select
                    value={projOwnerId}
                    onChange={(e) => setProjOwnerId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Status
                  </label>
                  <select
                    value={projStatus}
                    onChange={(e) => setProjStatus(e.target.value as StrategicProject['status'])}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="On Track">On Track</option>
                    <option value="Final Review">Final Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Co-Assignees */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Co-Assignees (Co-Assign တွဲဖက်တာဝန်ယူသူများ)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-28 overflow-y-auto">
                  {assignableUsers
                    .filter((u) => u.id !== projOwnerId)
                    .map((u) => {
                      const checked = projCoIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition ${
                            checked
                              ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-300'
                              : 'hover:bg-slate-200/70 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProjCoAssignee(u.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{u.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline Setup <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={projDeadline}
                    onChange={(e) => setProjDeadline(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={projFollowup}
                    onChange={(e) => setProjFollowup(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={projProgress}
                    onChange={(e) => setProjProgress(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-up Plan / Check-in Note
                </label>
                <input
                  type="text"
                  value={projFollowupNote}
                  onChange={(e) => setProjFollowupNote(e.target.value)}
                  placeholder="e.g. Weekly check-in with Sales Channel Head"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverables & Scope
                </label>
                <textarea
                  rows={2}
                  value={projDeliverables}
                  onChange={(e) => setProjDeliverables(e.target.value)}
                  placeholder="Summarize courseware, digital assets, or target participants..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsProjModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProject ? 'Save Project' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Project Task with Assign, Co-Assign, Deadline & Follow-up */}
      {isTaskModalOpen && taskProjectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingTask
                    ? language === 'my'
                      ? 'Project Task ပြင်ဆင်ရန်'
                      : 'Edit Project Task'
                    : language === 'my'
                    ? 'Project Task အသစ်ထည့်ရန်'
                    : 'Add Task to Project'}
                </h3>
                <p className="text-[11px] text-amber-300 truncate max-w-sm">
                  Project: {taskProjectTarget.title}
                </p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectTaskSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Finalize Module 2 Facilitator Guide"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assign (Primary Owner) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={taskOwnerId}
                    onChange={(e) => setTaskOwnerId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={taskStatus === 'Waiting' ? 'Pending' : taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    <option value="Active">{t.inProgress}</option>
                    <option value="Pending">{t.waiting}</option>
                    <option value="Completed">{t.completed}</option>
                    {taskStatus === 'Overdue' && (
                      <option value="Overdue" disabled>
                        {t.overdue}
                      </option>
                    )}
                  </select>
                  {currentUser.roleTier === 'MEMBER' && taskStatus === 'Completed' && (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">
                      {language === 'my'
                        ? 'Admin / Super Admin အတည်ပြုပြီးမှ Completed ဖြစ်ပါမည်။'
                        : 'Admin / Super Admin approval required before Completed.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Co-Assign Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Co-Assign (တွဲဖက်တာဝန်ယူမည့်သူများ)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-28 overflow-y-auto">
                  {assignableUsers
                    .filter((u) => u.id !== taskOwnerId)
                    .map((u) => {
                      const checked = taskCoIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition ${
                            checked
                              ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-300'
                              : 'hover:bg-slate-200/70 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTaskCoAssignee(u.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{u.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline Setup <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Follow-up Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={taskFollowup}
                    onChange={(e) => setTaskFollowup(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-up Instruction / Progress Note
                </label>
                <textarea
                  rows={2}
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Instructions for primary & co-assignees or follow-up checkpoints..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTask ? 'Save Task' : 'Assign Project Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Public Project Stage, Assignees, Who's Doing What & Open Editing Modal */}
      {detailProject && (() => {
        const dTasks = tasks.filter((item) => item.projectId === detailProject.id);
        const dCompleted = dTasks.filter((tk) => tk.status === 'Completed').length;
        const dProgress =
          dTasks.length > 0
            ? Math.round((dCompleted / dTasks.length) * 100)
            : detailProject.progress;
        const dStageIdx = Math.max(0, PROJECT_STAGES.indexOf(detailProject.status));

        // Build per-member task breakdown ("Who is doing what")
        const memberTaskCounts = assignableUsers
          .map((u) => {
            const count = dTasks.filter(
              (tk) =>
                tk.ownerId === u.id ||
                tk.ownerName === u.name ||
                tk.coAssigneeIds?.includes(u.id) ||
                tk.coAssigneeNames?.includes(u.name)
            ).length;
            return { user: u, count };
          })
          .filter((entry) => entry.count > 0);

        const visibleDetailTasks =
          detailMemberFilter === 'all'
            ? dTasks
            : dTasks.filter(
                (tk) =>
                  tk.ownerId === detailMemberFilter ||
                  tk.coAssigneeIds?.includes(detailMemberFilter)
              );

        const projectOwnerUser = allUsers.find(
          (u) => u.id === detailProject.ownerId || u.name === detailProject.ownerName
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                      Strategic Project · Excel Overview
                    </span>
                    <span className="text-[11px] text-emerald-300 font-semibold">
                      {getStageLabelMy(detailProject.status)} ({dProgress}%)
                    </span>
                    {!isViewer && (
                      <span className="text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded">
                        {language === 'my' ? 'Edit ခွင့်ပြုထားသည်' : 'Editing Unlocked'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1 truncate">
                    {detailProject.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => openEditProjectModal(detailProject)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'my' ? 'Project ပြင်ရန်' : 'Edit Project'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDetailProjectId(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto">
                {/* 1. Excel-Style Project Overview Summary Sheet */}
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-emerald-800 text-white px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold tracking-wide uppercase">
                      {language === 'my'
                        ? 'Project အနှစ်ချုပ်ဇယား (Excel Overview)'
                        : 'Project Summary Sheet (Excel Overview)'}
                    </span>
                    <span className="text-[11px] text-emerald-100 font-semibold tabular-nums">
                      {dCompleted} / {dTasks.length} {language === 'my' ? 'Task ပြီးစီး' : 'Tasks Completed'} ({dProgress}%)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase">
                          <th className="border border-slate-300 px-3 py-2 text-left min-w-[200px]">
                            Title
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left min-w-[140px]">
                            Assigner
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left min-w-[150px]">
                            Co-Assigner
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">
                            Deadline
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">
                            Follow-up
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left min-w-[170px]">
                            {language === 'my' ? 'လုပ်နေတဲ့အဆင့် (Stage)' : 'Current Stage'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="border border-slate-300 px-3 py-2.5 align-top">
                            <div className="font-extrabold text-slate-900">{detailProject.title}</div>
                            {detailProject.deliverables && (
                              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {detailProject.deliverables}
                              </div>
                            )}
                            {detailProject.followupNote && (
                              <div className="text-[10px] text-indigo-700 font-semibold mt-1">
                                Note: {detailProject.followupNote}
                              </div>
                            )}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 align-top">
                            <button
                              type="button"
                              onClick={() => projectOwnerUser && onOpenMemberSheet(projectOwnerUser)}
                              className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-blue-600 hover:underline text-left"
                            >
                              {projectOwnerUser && (
                                <img
                                  src={projectOwnerUser.avatar}
                                  alt={detailProject.ownerName}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              )}
                              <span>{detailProject.ownerName}</span>
                            </button>
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 align-top font-semibold text-indigo-800">
                            {detailProject.coAssigneeNames && detailProject.coAssigneeNames.length > 0
                              ? detailProject.coAssigneeNames.join(', ')
                              : '-'}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 align-top tabular-nums whitespace-nowrap">
                            {canSetupDeadline ? (
                              <input
                                type="date"
                                value={detailProject.deadline}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onUpdateProject({ ...detailProject, deadline: e.target.value });
                                  }
                                }}
                                className="text-xs font-bold border border-slate-300 rounded px-2 py-1 text-slate-900 bg-slate-50"
                              />
                            ) : (
                              <span className="font-bold text-slate-900">{detailProject.deadline}</span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 align-top tabular-nums whitespace-nowrap">
                            {!isViewer ? (
                              <input
                                type="date"
                                value={detailProject.followupDate || todayStr}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onUpdateProject({ ...detailProject, followupDate: e.target.value });
                                  }
                                }}
                                className="text-xs font-bold border border-indigo-200 bg-indigo-50/50 rounded px-2 py-1 text-indigo-900"
                              />
                            ) : (
                              <span className="font-bold text-indigo-800">
                                {detailProject.followupDate || '-'}
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-3 py-2.5 align-top">
                            {!isViewer ? (
                              <select
                                value={detailProject.status}
                                onChange={(e) => {
                                  const nextSt = e.target.value as StrategicProject['status'];
                                  if (nextSt === 'Completed' && !isAdmin) {
                                    onRequestProjectCompletion(detailProject.id);
                                    return;
                                  }
                                  onUpdateProject({
                                    ...detailProject,
                                    status: nextSt,
                                    progress: nextSt === 'Completed' ? 100 : detailProject.progress,
                                  });
                                }}
                                className={`w-full text-xs font-extrabold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                                  detailProject.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : detailProject.status === 'Final Review'
                                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                                    : detailProject.status === 'On Track'
                                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                                    : 'bg-blue-50 text-blue-800 border-blue-300'
                                }`}
                              >
                                {PROJECT_STAGES.map((st) => (
                                  <option key={st} value={st}>
                                    {st === 'Completed' && !isAdmin
                                      ? language === 'my'
                                        ? 'Completed (Approval တောင်းရန်)'
                                        : 'Completed (Request Approval)'
                                      : `${st} — ${getStageLabelMy(st)}`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-bold text-slate-800">
                                {detailProject.status} ({getStageLabelMy(detailProject.status)})
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Interactive 4-Stage Roadmap Strip */}
                  <div className="bg-slate-50 border-t border-slate-300 px-3.5 py-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PROJECT_STAGES.map((st, idx) => {
                        const active = idx <= dStageIdx;
                        return (
                          <button
                            key={st}
                            type="button"
                            disabled={isViewer}
                            onClick={() => {
                              if (!isViewer) {
                                if (st === 'Completed' && !isAdmin) {
                                  onRequestProjectCompletion(detailProject.id);
                                  return;
                                }
                                onUpdateProject({
                                  ...detailProject,
                                  status: st,
                                  progress: st === 'Completed' ? 100 : detailProject.progress,
                                });
                              }
                            }}
                            className={`text-left space-y-1 p-1.5 rounded-lg transition ${
                              !isViewer ? 'hover:bg-white cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            <div
                              className={`h-1.5 rounded-full ${
                                active
                                  ? detailProject.status === 'Completed'
                                    ? 'bg-emerald-500'
                                    : 'bg-blue-600'
                                  : 'bg-slate-200'
                              }`}
                            />
                            <span
                              className={`block text-[10px] font-bold text-center ${
                                idx === dStageIdx
                                  ? 'text-blue-700'
                                  : active
                                  ? 'text-slate-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {idx + 1}. {st}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Project Completion Approval Bar (Member Request + Admin/Super Admin Approve / Pending / Reject) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>
                        {language === 'my'
                          ? 'Project Complete ဖြစ်/မဖြစ် Approval စီမံခန့်ခွဲမှု (Admin / Super Admin)'
                          : 'Project Completion Approval Control'}
                      </span>
                      {detailProject.completionStatus === 'Pending' || detailProject.completionRequested ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px]">
                          {language === 'my' ? 'Pending (အတည်ပြုရန် စောင့်ဆိုင်းဆဲ)' : 'Pending Approval'}
                        </span>
                      ) : detailProject.completionStatus === 'Approved' || detailProject.status === 'Completed' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px]">
                          {language === 'my' ? 'Approved (ပြီးစီးကြောင်း အတည်ပြုပြီး)' : 'Approved'}
                        </span>
                      ) : detailProject.completionStatus === 'Rejected' ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 text-[10px]">
                          {language === 'my' ? 'Rejected (ငြင်းပယ်ထားသည်)' : 'Rejected'}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {detailProject.completionApprovedBy
                        ? `${
                            detailProject.completionStatus === 'Rejected'
                              ? language === 'my'
                                ? 'ငြင်းပယ်သူ:'
                                : 'Rejected by'
                              : detailProject.completionStatus === 'Pending'
                              ? language === 'my'
                                ? 'Pending ထားသူ:'
                                : 'Marked Pending by'
                              : language === 'my'
                              ? 'အတည်ပြုသူ:'
                              : 'Approved by'
                          } ${detailProject.completionApprovedBy} (${detailProject.completionApprovedAt || ''})`
                        : detailProject.completionRequestedBy
                        ? language === 'my'
                          ? `Approval တောင်းခံသူ: ${detailProject.completionRequestedBy} (${detailProject.completionRequestedAt || ''})`
                          : `Requested by ${detailProject.completionRequestedBy}`
                        : language === 'my'
                        ? 'Project ပြီးစီးပါက Admin / Super Admin ထံ Approval တောင်းခံရပါမည်။'
                        : 'Submit completion request for Admin / Super Admin to Approve, Pending, or Reject.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isViewer && !isAdmin && detailProject.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => onRequestProjectCompletion(detailProject.id)}
                        disabled={Boolean(detailProject.completionRequested)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                          detailProject.completionRequested
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Clock4 className="w-3.5 h-3.5" />
                        <span>
                          {detailProject.completionRequested
                            ? language === 'my'
                              ? 'Approval တောင်းခံပြီး (Pending)'
                              : 'Approval Requested (Pending)'
                            : language === 'my'
                            ? 'Complete Approval တောင်းခံရန်'
                            : 'Request Completion Approval'}
                        </span>
                      </button>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => onReviewProjectCompletion(detailProject.id, 'Approved')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'my' ? 'Approve (Complete)' : 'Approve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewProjectCompletion(detailProject.id, 'Pending')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs transition"
                        >
                          <Clock4 className="w-3.5 h-3.5" />
                          <span>{language === 'my' ? 'Pending ထားမည်' : 'Pending'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewProjectCompletion(detailProject.id, 'Rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{language === 'my' ? 'Reject (ငြင်းပယ်)' : 'Reject'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Excel-Style Project Tasks Overview Sheet */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        {language === 'my'
                          ? `လုပ်ငန်းခွဲများ အသေးစိတ် Excel ဇယား — Task Overview (${visibleDetailTasks.length})`
                          : `Project Tasks Excel Overview (${visibleDetailTasks.length})`}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {language === 'my'
                          ? 'Title, Assigner, Co-Assigner, Deadline နှင့် လုပ်နေတဲ့အဆင့် (Stage) များကို Excel ဇယားကဲ့သို့ ရှင်းလင်းစွာ ကြည့်ရှုပြင်ဆင်နိုင်ပါသည်'
                          : 'Clear spreadsheet-style overview of Title, Assigner, Co-Assigner, Deadline, Follow-up, and Current Stage'}
                      </p>
                    </div>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => openCreateProjectTaskModal(detailProject)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'my' ? 'Task အသစ်ထည့်ရန်' : 'Add Task'}</span>
                      </button>
                    )}
                  </div>

                  {/* Per-Member Filter Chips */}
                  {memberTaskCounts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setDetailMemberFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          detailMemberFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {language === 'my' ? 'အားလုံး' : 'All'} ({dTasks.length})
                      </button>
                      {memberTaskCounts.map(({ user, count }) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setDetailMemberFilter(user.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            detailMemberFilter === user.id
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
                          }`}
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>
                            {user.name} ({count})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {visibleDetailTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl">
                      {language === 'my' ? 'Task မရှိသေးပါ' : 'No tasks yet'}
                    </div>
                  ) : (
                    <div className="border border-slate-300 rounded-xl overflow-x-auto shadow-2xs">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wide">
                            <th className="border border-slate-600 px-2.5 py-2.5 text-center w-9">
                              #
                            </th>
                            <th className="border border-slate-600 px-3 py-2.5 text-left min-w-[210px]">
                              Title
                            </th>
                            <th className="border border-slate-600 px-3 py-2.5 text-left min-w-[140px]">
                              Assigner
                            </th>
                            <th className="border border-slate-600 px-3 py-2.5 text-left min-w-[130px]">
                              Co-Assigner
                            </th>
                            <th className="border border-slate-600 px-2.5 py-2.5 text-left whitespace-nowrap">
                              Deadline
                            </th>
                            <th className="border border-slate-600 px-2.5 py-2.5 text-left whitespace-nowrap">
                              Follow-up
                            </th>
                            <th className="border border-slate-600 px-3 py-2.5 text-left min-w-[155px]">
                              {language === 'my' ? 'လုပ်နေတဲ့အဆင့်' : 'Current Stage'}
                            </th>
                            <th className="border border-slate-600 px-2.5 py-2.5 text-center whitespace-nowrap">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleDetailTasks.map((tk, idx) => {
                            const ownerUsr = allUsers.find(
                              (u) => u.id === tk.ownerId || u.name === tk.ownerName
                            );
                            const isTaskFollowDue =
                              tk.status !== 'Completed' &&
                              tk.status !== 'Cancelled' &&
                              tk.followup <= todayStr;

                            return (
                              <tr
                                key={tk.id}
                                className={`transition-colors ${
                                  tk.status === 'Overdue'
                                    ? 'bg-red-50/60 hover:bg-red-50'
                                    : isTaskFollowDue
                                    ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                    : idx % 2 === 0
                                    ? 'bg-white hover:bg-blue-50/40'
                                    : 'bg-slate-50/70 hover:bg-blue-50/40'
                                }`}
                              >
                                <td className="border border-slate-300 px-2.5 py-2 text-center font-bold text-slate-500 tabular-nums">
                                  {idx + 1}
                                </td>
                                <td className="border border-slate-300 px-3 py-2 align-top">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-extrabold text-slate-900">
                                      {tk.title}
                                    </span>
                                    {isTaskFollowDue && (
                                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                                        Follow-up Due
                                      </span>
                                    )}
                                    {tk.completionRequested && tk.status !== 'Completed' && (
                                      <span className="text-[9px] font-bold text-purple-800 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded">
                                        {language === 'my' ? 'ပြီးစီးမှု အတည်ပြုရန်' : 'Completion Pending Approval'}
                                      </span>
                                    )}
                                  </div>
                                  {tk.note && (
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                      {tk.note}
                                    </p>
                                  )}
                                </td>
                                <td className="border border-slate-300 px-3 py-2 align-top">
                                  <button
                                    type="button"
                                    onClick={() => ownerUsr && onOpenMemberSheet(ownerUsr)}
                                    className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-blue-600 hover:underline text-left"
                                  >
                                    {ownerUsr && (
                                      <img
                                        src={ownerUsr.avatar}
                                        alt={tk.ownerName}
                                        referrerPolicy="no-referrer"
                                        className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                                      />
                                    )}
                                    <span>{tk.ownerName}</span>
                                  </button>
                                </td>
                                <td className="border border-slate-300 px-3 py-2 align-top">
                                  {tk.coAssigneeNames && tk.coAssigneeNames.length > 0 ? (
                                    <span className="font-semibold text-indigo-800">
                                      {tk.coAssigneeNames.join(', ')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="border border-slate-300 px-2.5 py-2 align-top tabular-nums whitespace-nowrap">
                                  {canSetupDeadline ? (
                                    <input
                                      type="date"
                                      value={tk.due}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          onSaveTask({
                                            ...tk,
                                            due: e.target.value,
                                            day: getDayOfWeekCode(e.target.value),
                                          });
                                        }
                                      }}
                                      className="text-[11px] font-bold border border-slate-300 rounded px-1.5 py-0.5 text-slate-900 bg-white"
                                    />
                                  ) : (
                                    <span className="font-bold text-slate-900">{tk.due}</span>
                                  )}
                                </td>
                                <td className="border border-slate-300 px-2.5 py-2 align-top tabular-nums whitespace-nowrap">
                                  {!isViewer ? (
                                    <input
                                      type="date"
                                      value={tk.followup}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          onSaveTask({ ...tk, followup: e.target.value });
                                        }
                                      }}
                                      className="text-[11px] font-bold border border-indigo-200 rounded px-1.5 py-0.5 text-indigo-900 bg-indigo-50/50"
                                    />
                                  ) : (
                                    <span className="font-bold text-slate-900">{tk.followup}</span>
                                  )}
                                </td>
                                <td className="border border-slate-300 px-2.5 py-2 align-top">
                                  {!isViewer ? (
                                    <div className="space-y-1">
                                      <select
                                        value={tk.status === 'Waiting' ? 'Pending' : tk.status}
                                        onChange={(e) =>
                                          onSaveTask({
                                            ...tk,
                                            status: e.target.value as TaskStatus,
                                          })
                                        }
                                        className={`w-full text-[11px] font-extrabold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                                          tk.status === 'Completed'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                            : tk.status === 'Overdue'
                                            ? 'bg-red-100 text-red-800 border-red-300'
                                            : tk.status === 'Pending' || tk.status === 'Waiting'
                                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                                            : 'bg-blue-100 text-blue-800 border-blue-300'
                                        }`}
                                      >
                                        <option value="Active">{t.inProgress}</option>
                                        <option value="Pending">{t.waiting}</option>
                                        <option value="Completed">{t.completed}</option>
                                        {tk.status === 'Overdue' && (
                                          <option value="Overdue" disabled>
                                            {t.overdue}
                                          </option>
                                        )}
                                      </select>
                                      {tk.completionRequested && tk.status !== 'Completed' && canApproveComplete && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => onApproveTaskCompletion(tk.id, true)}
                                            className="flex-1 inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded transition"
                                            title={language === 'my' ? 'Completed အတည်ပြုမည်' : 'Approve Complete'}
                                          >
                                            <Check className="w-2.5 h-2.5" />
                                            <span>{language === 'my' ? 'အတည်ပြု' : 'Approve'}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onApproveTaskCompletion(tk.id, false)}
                                            className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold rounded transition"
                                            title={language === 'my' ? 'ပြန်ပို့မည်' : 'Return to In Progress'}
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span
                                      className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                        tk.status === 'Completed'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : tk.status === 'Overdue'
                                          ? 'bg-red-100 text-red-800'
                                          : tk.status === 'Pending' || tk.status === 'Waiting'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {tk.status === 'Active'
                                        ? 'In Progress'
                                        : tk.status === 'Waiting' || tk.status === 'Pending'
                                        ? 'Pending'
                                        : tk.status}
                                    </span>
                                  )}
                                </td>
                                <td className="border border-slate-300 px-2.5 py-2 align-top">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onOpenComments(tk)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition"
                                      title="Comments"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span className="tabular-nums">{tk.comments?.length || 0}</span>
                                    </button>
                                    {!isViewer && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openEditProjectTaskModal(detailProject, tk)}
                                          className="p-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition"
                                          title={language === 'my' ? 'ပြင်ရန်' : 'Edit'}
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setTaskToDelete(tk)}
                                          className="p-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition"
                                          title="Delete Task"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
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

                {/* 3. Project Comments & Admin Review Discussion */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>
                        {language === 'my'
                          ? `Project မှတ်ချက်များနှင့် Admin Review Comments (${detailProject.comments?.length || 0})`
                          : `Project Discussion & Review Comments (${detailProject.comments?.length || 0})`}
                      </span>
                    </h4>
                  </div>

                  <div className="p-4 space-y-3">
                    {(!detailProject.comments || detailProject.comments.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-3">
                        {language === 'my'
                          ? 'Project အတွက် မှတ်ချက် မရှိသေးပါ — Admin / Super Admin နှင့် အဖွဲ့ဝင်များ ဤနေရာတွင် Comment ရေးသားနိုင်ပါသည်'
                          : 'No project comments yet. Admin, Super Admin, and team members can post comments here.'}
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {detailProject.comments.map((cmt) => {
                          const canDeleteComment =
                            !isViewer &&
                            (cmt.authorId === currentUser.id || isAdmin);
                          const authorUser = allUsers.find((u) => u.id === cmt.authorId);
                          return (
                            <div
                              key={cmt.id}
                              className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                            >
                              <img
                                src={cmt.authorAvatar}
                                alt={cmt.authorName}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-900">
                                      {cmt.authorName}
                                    </span>
                                    {authorUser && isAdminOrSuper(authorUser.roleTier) && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                        {authorUser.roleTier === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 tabular-nums">
                                      {cmt.timestamp}
                                    </span>
                                  </div>
                                  {canDeleteComment && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteProjectComment(detailProject.id, cmt.id)}
                                      className="text-slate-400 hover:text-red-600 p-0.5 rounded transition"
                                      title="Delete comment"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                                  {cmt.text}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isViewer && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!projectCommentText.trim()) return;
                          onAddProjectComment(detailProject.id, projectCommentText.trim());
                          setProjectCommentText('');
                        }}
                        className="flex items-center gap-2 pt-2 border-t border-slate-100"
                      >
                        <input
                          type="text"
                          value={projectCommentText}
                          onChange={(e) => setProjectCommentText(e.target.value)}
                          placeholder={
                            language === 'my'
                              ? 'Project အတွက် မှတ်ချက် / Feedback ရေးရန်...'
                              : 'Write a project comment or review note...'
                          }
                          className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                        />
                        <button
                          type="submit"
                          disabled={!projectCommentText.trim()}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{language === 'my' ? 'ပေးပို့မည်' : 'Comment'}</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Project Confirm Modal */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
          }
        }}
        title={language === 'my' ? 'Project ဖျက်ရန် အတည်ပြုပါ' : 'Confirm Project Deletion'}
        message={
          language === 'my'
            ? `"${projectToDelete?.title}" ကို ဖျက်ရန် သေချာပါသလား?`
            : `Delete strategic project "${projectToDelete?.title}"?`
        }
        confirmLabel={language === 'my' ? 'ဖျက်မည်' : 'Delete Project'}
        cancelLabel={language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
        language={language}
      />

      {/* Delete Project Task Confirm Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
        title={language === 'my' ? 'Project Task ဖျက်ရန်' : 'Confirm Task Deletion'}
        message={
          language === 'my'
            ? `"${taskToDelete?.title}" ကို ဖျက်ရန် သေချာပါသလား?`
            : `Delete task "${taskToDelete?.title}"?`
        }
        confirmLabel={language === 'my' ? 'ဖျက်မည်' : 'Delete Task'}
        cancelLabel={language === 'my' ? 'မဖျက်တော့ပါ' : 'Cancel'}
        language={language}
      />
    </div>
  );
};
