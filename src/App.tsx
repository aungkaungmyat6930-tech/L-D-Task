import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  TaskItem, 
  LeaveRequest, 
  TrainingLog, 
  StrategicProject, 
  TabType,
  MemberStatus,
  AttendanceRecord,
  AttendanceOverrideStatus
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_TASKS, 
  INITIAL_LEAVES, 
  INITIAL_TRAINING, 
  INITIAL_PROJECTS 
} from './data/initialData';
import { Language, TRANSLATIONS } from './utils/translations';

// Components
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { DirectoryTab } from './components/DirectoryTab';
import { TasksTab } from './components/TasksTab';
import { LeaveTab } from './components/LeaveTab';
import { TrainingTab } from './components/TrainingTab';
import { WeeklyBoardTab } from './components/WeeklyBoardTab';
import { ProjectsTab } from './components/ProjectsTab';

// Modals
import { ProfileEditModal } from './components/ProfileEditModal';
import { MemberSheetModal } from './components/MemberSheetModal';
import { TaskModal } from './components/TaskModal';
import { TaskCommentsModal } from './components/TaskCommentsModal';
import { LeaveModal } from './components/LeaveModal';
import { TrainingModal } from './components/TrainingModal';
import { WorkflowModal } from './components/WorkflowModal';
import { UserManagementModal } from './components/UserManagementModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';

const STORAGE_KEYS = {
  USERS: 'kbz_ld_portal_users_v3',
  TASKS: 'kbz_ld_portal_tasks_v3',
  LEAVES: 'kbz_ld_portal_leaves_v3',
  TRAINING: 'kbz_ld_portal_training_v3',
  PROJECTS: 'kbz_ld_portal_projects_v3',
  ACTIVE_USER: 'kbz_ld_portal_active_user_v3',
  LANG: 'kbz_ld_portal_lang_v3',
  ADMIN_PWD: 'kbz_ld_portal_admin_pwd_v1',
  ATTENDANCE: 'kbz_ld_portal_attendance_v1',
  ALLOW_MEMBER_DEADLINE: 'kbz_ld_allow_member_deadline_v1',
};

const SESSION_ADMIN_UNLOCKED = 'kbz_ld_admin_unlocked_v1';

export default function App() {
  // State Initialization from LocalStorage or Defaults
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_PWD) || 'admin123';
    } catch {
      return 'admin123';
    }
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_ADMIN_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const unlocked = sessionStorage.getItem(SESSION_ADMIN_UNLOCKED) === 'true';
      const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
      if (savedId) {
        const found = users.find((u) => u.id === savedId);
        if (found && (found.roleTier !== 'ADMIN' || unlocked)) {
          return found;
        }
      }
      return users.find((u) => u.name === 'Aung Kyaw') || users.find((u) => u.roleTier !== 'ADMIN') || users[0];
    } catch {
      return users[0];
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEAVES);
      return saved ? JSON.parse(saved) : INITIAL_LEAVES;
    } catch {
      return INITIAL_LEAVES;
    }
  });

  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRAINING);
      return saved ? JSON.parse(saved) : INITIAL_TRAINING;
    } catch {
      return INITIAL_TRAINING;
    }
  });

  const [projects, setProjects] = useState<StrategicProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [attendanceOverrides, setAttendanceOverrides] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [allowMemberDeadlineSetup, setAllowMemberDeadlineSetup] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALLOW_MEMBER_DEADLINE);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG);
      return (saved as Language) || 'my';
    } catch {
      return 'my';
    }
  });

  const [currentTab, setCurrentTab] = useState<TabType>('directory');

  // Modal Visibility States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOrgChartModalOpen, setIsOrgChartModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Admin Password Modal States
  const [adminPwdModalOpen, setAdminPwdModalOpen] = useState(false);
  const [adminPwdMode, setAdminPwdMode] = useState<'verify' | 'change'>('verify');
  const [pendingAdminUser, setPendingAdminUser] = useState<UserProfile | null>(null);

  // Selected Item Modals
  const [sheetMember, setSheetMember] = useState<UserProfile | null>(null);
  const [actionTargetMember, setActionTargetMember] = useState<UserProfile | null>(null);
  const [actionDefaultDate, setActionDefaultDate] = useState<string | undefined>(undefined);
  const [profileUserToEdit, setProfileUserToEdit] = useState<UserProfile | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);

  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedCommentTask, setSelectedCommentTask] = useState<TaskItem | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveRequest | null>(null);

  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trainingToEdit, setTrainingToEdit] = useState<TrainingLog | null>(null);

  // Quick Direct Action Openers
  const handleOpenAddTask = (targetMember?: UserProfile, defaultDate?: string) => {
    setActionTargetMember(targetMember || null);
    setActionDefaultDate(defaultDate);
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenAddLeave = (targetMember?: UserProfile, defaultDate?: string) => {
    setActionTargetMember(targetMember || null);
    setActionDefaultDate(defaultDate);
    setLeaveToEdit(null);
    setIsLeaveModalOpen(true);
  };

  const handleOpenAddTraining = (targetMember?: UserProfile, defaultDate?: string) => {
    setActionTargetMember(targetMember || null);
    setActionDefaultDate(defaultDate);
    setTrainingToEdit(null);
    setIsTrainingModalOpen(true);
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRAINING, JSON.stringify(trainingLogs));
  }, [trainingLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, language);
  }, [language]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PWD, adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceOverrides));
  }, [attendanceOverrides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALLOW_MEMBER_DEADLINE, String(allowMemberDeadlineSetup));
  }, [allowMemberDeadlineSetup]);

  // Auto-evaluate Overdue Tasks
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let hasChanges = false;
    const updated = tasks.map((t) => {
      if (t.status !== 'Completed' && t.status !== 'Cancelled') {
        if (t.due < todayStr && t.status !== 'Overdue') {
          hasChanges = true;
          return { ...t, status: 'Overdue' as const };
        }
      }
      return t;
    });

    if (hasChanges) {
      setTasks(updated);
    }
  }, []);

  // Sync selected comment task with latest state
  useEffect(() => {
    if (selectedCommentTask) {
      const refreshed = tasks.find((t) => t.id === selectedCommentTask.id);
      if (refreshed) {
        setSelectedCommentTask(refreshed);
      }
    }
  }, [tasks]);

  // Sync sheet member with latest user state
  useEffect(() => {
    if (sheetMember) {
      const refreshed = users.find((u) => u.id === sheetMember.id);
      if (refreshed) {
        setSheetMember(refreshed);
      }
    }
  }, [users]);

  // Switch Active User (Protected by Admin Password when switching to ADMIN)
  const handleSwitchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (!found) return;

    if (found.roleTier === 'ADMIN' && !isAdminUnlocked) {
      setPendingAdminUser(found);
      setAdminPwdMode('verify');
      setAdminPwdModalOpen(true);
      return;
    }

    if (found.roleTier !== 'ADMIN' && isAdminUnlocked) {
      setIsAdminUnlocked(false);
      sessionStorage.removeItem(SESSION_ADMIN_UNLOCKED);
    }

    setCurrentUser(found);
    showToast(
      language === 'my'
        ? `အသုံးပြုသူပြောင်းလဲမှု - ${found.name} (${found.roleLabel})`
        : `Switched user context to ${found.name}`
    );
  };

  const handleAdminUnlockSuccess = () => {
    setIsAdminUnlocked(true);
    sessionStorage.setItem(SESSION_ADMIN_UNLOCKED, 'true');
    if (pendingAdminUser) {
      setCurrentUser(pendingAdminUser);
      showToast(
        language === 'my'
          ? `Admin ဝင်ရောက်မှု အောင်မြင်ပါသည် - ${pendingAdminUser.name}`
          : `Admin authenticated: ${pendingAdminUser.name}`
      );
    }
    setPendingAdminUser(null);
    setAdminPwdModalOpen(false);
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    sessionStorage.removeItem(SESSION_ADMIN_UNLOCKED);
    const fallbackMember =
      users.find((u) => u.name === 'Aung Kyaw') ||
      users.find((u) => u.roleTier === 'MEMBER') ||
      users[0];
    if (fallbackMember) {
      setCurrentUser(fallbackMember);
    }
    showToast(
      language === 'my'
        ? 'Admin အခွင့်အရေးကို Lock ချပြီး Member အကောင့်သို့ ပြောင်းလိုက်ပါပြီ။'
        : 'Admin session locked. Switched to Member view.'
    );
  };

  const handleChangeAdminPassword = (newPwd: string) => {
    setAdminPassword(newPwd);
    showToast(
      language === 'my'
        ? 'Admin Password အသစ်ကို အောင်မြင်စွာ ပြောင်းလဲသိမ်းဆည်းပြီးပါပြီ။'
        : 'Admin password updated successfully.'
    );
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'my' ? 'en' : 'my'));
  };

  // Reset Data to Default
  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const confirmResetData = () => {
    localStorage.clear();
    sessionStorage.removeItem(SESSION_ADMIN_UNLOCKED);
    setIsAdminUnlocked(false);
    setAdminPassword('admin123');
    setUsers(INITIAL_USERS);
    setTasks(INITIAL_TASKS);
    setLeaves(INITIAL_LEAVES);
    setTrainingLogs(INITIAL_TRAINING);
    setProjects(INITIAL_PROJECTS);
    setAttendanceOverrides([]);
    setAllowMemberDeadlineSetup(true);
    const defaultUser = INITIAL_USERS.find((u) => u.name === 'Aung Kyaw') || INITIAL_USERS[0];
    setCurrentUser(defaultUser);
    showToast(
      language === 'my'
        ? 'မူလဒေတာများ အောင်မြင်စွာ ပြန်လည်ရယူပြီးပါပြီ။'
        : 'Data reset to demo state.'
    );
  };

  const handleSetAttendanceOverride = (
    memberId: string,
    date: string,
    status: AttendanceOverrideStatus | null,
    note?: string
  ) => {
    const id = `${memberId}_${date}`;
    setAttendanceOverrides((prev) => {
      const filtered = prev.filter((item) => !(item.memberId === memberId && item.date === date));
      if (!status) return filtered;
      return [...filtered, { id, memberId, date, status, note }];
    });
    showToast(
      language === 'my'
        ? `${date} ရက်နေ့ တက်ရောက်မှု အခြေအနေကို သိမ်းဆည်းပြီးပါပြီ။`
        : `Attendance status updated for ${date}.`
    );
  };

  // Core Requirement: User Profile / Name Change
  // When user edits their name, propagate across ALL records!
  const handleSaveProfile = (updatedUser: UserProfile, oldName: string) => {
    const newName = updatedUser.name;

    // 1. Update Users list
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );

    // 2. Update Current User
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }

    // 3. Propagate to Tasks (ownerName & comments)
    setTasks((prev) =>
      prev.map((t) => {
        const isOwner = t.ownerId === updatedUser.id || t.ownerName === oldName;
        const updatedComments = (t.comments || []).map((c) => {
          if (c.authorId === updatedUser.id || c.authorName === oldName) {
            return {
              ...c,
              authorName: newName,
              authorAvatar: updatedUser.avatar,
            };
          }
          return c;
        });

        const updatedCoNames = (t.coAssigneeNames || []).map((cn) =>
          cn === oldName ? newName : cn
        );

        return {
          ...t,
          ownerName: isOwner ? newName : t.ownerName,
          coAssigneeNames: t.coAssigneeNames ? updatedCoNames : undefined,
          comments: updatedComments,
        };
      })
    );

    // 4. Propagate to Leaves
    setLeaves((prev) =>
      prev.map((l) => {
        if (l.memberId === updatedUser.id || l.memberName === oldName) {
          return { ...l, memberName: newName };
        }
        return l;
      })
    );

    // 5. Propagate to Training Logs
    setTrainingLogs((prev) =>
      prev.map((tr) => {
        const updatedAttendees = (tr.attendeeNames || []).map((att) =>
          att === oldName ? newName : att
        );
        const updatedCoTrainers = (tr.coTrainerNames || []).map((co) =>
          co === oldName ? newName : co
        );
        const updatedTrainer = tr.trainerName === oldName ? newName : tr.trainerName;
        const updatedEditedBy = tr.editedBy === oldName ? newName : tr.editedBy;
        return {
          ...tr,
          attendeeNames: updatedAttendees,
          coTrainerNames: tr.coTrainerNames ? updatedCoTrainers : undefined,
          trainerName: updatedTrainer,
          editedBy: updatedEditedBy,
        };
      })
    );

    // 6. Propagate to Projects
    setProjects((prev) =>
      prev.map((p) => {
        const isOwner = p.ownerId === updatedUser.id || p.ownerName === oldName;
        const updatedCoNames = (p.coAssigneeNames || []).map((cn) =>
          cn === oldName ? newName : cn
        );
        return {
          ...p,
          ownerName: isOwner ? newName : p.ownerName,
          coAssigneeNames: p.coAssigneeNames ? updatedCoNames : undefined,
        };
      })
    );

    showToast(
      language === 'my'
        ? `အမည် "${newName}" သို့ အောင်မြင်စွာ ပြောင်းလဲပြီး Task၊ Leave နှင့် Training မှတ်တမ်းများ အားလုံးတွင် အလိုအလျောက် အဆင့်မြှင့်တင်ပြီးပါပြီ။`
        : `Profile updated: Name changed to "${newName}" and synced across all records.`
    );
  };

  // Add or Update Task
  const handleSaveTask = (taskData: Partial<TaskItem>) => {
    if (taskData.id) {
      // Update existing
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as TaskItem) : t))
      );
      showToast(
        language === 'my' ? 'Task ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။' : 'Task updated successfully.'
      );
    } else {
      // Create new
      const newTask: TaskItem = {
        id: `t-${Date.now()}`,
        title: taskData.title || 'New Task',
        ownerId: taskData.ownerId || currentUser.id,
        ownerName: taskData.ownerName || currentUser.name,
        coAssigneeIds: taskData.coAssigneeIds,
        coAssigneeNames: taskData.coAssigneeNames,
        projectId: taskData.projectId,
        due: taskData.due || new Date().toISOString().split('T')[0],
        followup: taskData.followup || new Date().toISOString().split('T')[0],
        day: taskData.day || 'Wed',
        status: taskData.status || 'Active',
        note: taskData.note || '',
        comments: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTasks((prev) => [newTask, ...prev]);
      showToast(
        language === 'my'
          ? `Task အသစ်ကို ${newTask.ownerName} အောက်တွင် ထည့်သွင်းပြီးပါပြီ။`
          : `New task added under ${newTask.ownerName}.`
      );
    }
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast(
      language === 'my' ? 'Task ကို အောင်မြင်စွာ ဖျက်ပြီးပါပြီ။' : 'Task deleted successfully.'
    );
  };

  // Task Comments: Add Comment
  const handleAddComment = (taskId: string, text: string) => {
    const now = new Date();
    const timeStr =
      now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text,
      timestamp: timeStr,
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedComments = [...(t.comments || []), newComment];
          return {
            ...t,
            comments: updatedComments,
            note: text, // sync note as latest comment
          };
        }
        return t;
      })
    );

    showToast(
      language === 'my' ? 'မှတ်ချက် တင်ပြီးပါပြီ။' : 'Comment posted successfully.'
    );
  };

  // Task Comments: Delete Comment
  const handleDeleteComment = (taskId: string, commentId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            comments: (t.comments || []).filter((c) => c.id !== commentId),
          };
        }
        return t;
      })
    );
  };

  // Task Comments: Update Status
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskItem['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // Task Comments: Update Followup Date
  const handleUpdateFollowupDate = (taskId: string, newFollowup: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, followup: newFollowup } : t))
    );
  };

  // Add or Update Leave (with Admin HR alignment support)
  const handleSaveLeave = (leaveData: Partial<LeaveRequest>) => {
    const isAdmin = currentUser.roleTier === 'ADMIN';
    const todayStr = new Date().toISOString().split('T')[0];

    if (leaveData.id) {
      // Edit
      setLeaves((prev) =>
        prev.map((l) => {
          if (l.id !== leaveData.id) return l;
          const nextStatus = isAdmin && leaveData.status ? leaveData.status : l.status;
          const statusChangedByAdmin = isAdmin && leaveData.status && leaveData.status !== l.status;
          return {
            ...l,
            ...leaveData,
            status: nextStatus,
            approvedBy:
              statusChangedByAdmin && (nextStatus === 'Approved' || nextStatus === 'Rejected')
                ? currentUser.name
                : nextStatus === 'Pending'
                ? undefined
                : l.approvedBy,
            approvedAt:
              statusChangedByAdmin && (nextStatus === 'Approved' || nextStatus === 'Rejected')
                ? todayStr
                : nextStatus === 'Pending'
                ? undefined
                : l.approvedAt,
          } as LeaveRequest;
        })
      );
      showToast(
        language === 'my'
          ? isAdmin
            ? 'ခွင့်မှတ်တမ်းနှင့် HR ချိန်ညှိမှုကို သိမ်းဆည်းပြီးပါပြီ။'
            : 'ခွင့်မှတ်တမ်း ပြင်ဆင်ပြီးပါပြီ။'
          : 'Leave record updated.'
      );
    } else {
      // New
      const initialStatus = isAdmin && leaveData.status ? leaveData.status : 'Pending';
      const newLeave: LeaveRequest = {
        id: `l-${Date.now()}`,
        memberId: leaveData.memberId || currentUser.id,
        memberName: leaveData.memberName || currentUser.name,
        type: leaveData.type || 'Casual Leave',
        start: leaveData.start || todayStr,
        end: leaveData.end || todayStr,
        duration: leaveData.duration || 1,
        reason: leaveData.reason || '',
        status: initialStatus,
        approvedBy:
          isAdmin && (initialStatus === 'Approved' || initialStatus === 'Rejected')
            ? currentUser.name
            : undefined,
        approvedAt:
          isAdmin && (initialStatus === 'Approved' || initialStatus === 'Rejected')
            ? todayStr
            : undefined,
        hrRefId: isAdmin ? leaveData.hrRefId : undefined,
        hrSynced: isAdmin ? leaveData.hrSynced : false,
        adminNote: isAdmin ? leaveData.adminNote : undefined,
        createdAt: todayStr,
      };
      setLeaves((prev) => [newLeave, ...prev]);
      showToast(
        language === 'my'
          ? `ခွင့်တောင်းခံလွှာကို ${newLeave.memberName} အောက်တွင် တင်သွင်းပြီးပါပြီ။`
          : `Leave request submitted under ${newLeave.memberName}.`
      );
    }
  };

  // Delete Leave
  const handleDeleteLeave = (leaveId: string) => {
    setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    showToast(
      language === 'my' ? 'ခွင့်မှတ်တမ်း ဖျက်ပြီးပါပြီ။' : 'Leave record deleted.'
    );
  };

  // Approve or Reject Leave (Admin Action)
  const handleApproveLeave = (leaveId: string, status: 'Approved' | 'Rejected') => {
    setLeaves((prev) =>
      prev.map((l) => {
        if (l.id === leaveId) {
          return {
            ...l,
            status,
            approvedBy: currentUser.name,
            approvedAt: new Date().toISOString().split('T')[0],
          };
        }
        return l;
      })
    );
    showToast(
      language === 'my'
        ? `ခွင့်တောင်းခံလွှာကို ${currentUser.name} မှ "${status === 'Approved' ? 'အတည်ပြု' : 'ငြင်းပယ်'}" လိုက်ပါပြီ။`
        : `Leave request marked as ${status} by ${currentUser.name}.`
    );
  };

  // Add or Update Training Log (with Co-Trainer & Editor Audit Trail)
  const handleSaveTraining = (trainingData: Partial<TrainingLog>) => {
    if (trainingData.id) {
      const now = new Date();
      const editedAt = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
      setTrainingLogs((prev) =>
        prev.map((tr) =>
          tr.id === trainingData.id
            ? ({
                ...tr,
                ...trainingData,
                editedBy: currentUser.name,
                editedAt,
              } as TrainingLog)
            : tr
        )
      );
      showToast(
        language === 'my'
          ? `သင်တန်းမှတ်တမ်းကို ${currentUser.name} မှ ပြင်ဆင်သိမ်းဆည်းပြီးပါပြီ။`
          : `Training session log updated by ${currentUser.name}.`
      );
    } else {
      const newTraining: TrainingLog = {
        id: `tr-${Date.now()}`,
        name: trainingData.name || 'Training Session',
        date: trainingData.date || new Date().toISOString().split('T')[0],
        start: trainingData.start || '09:00',
        end: trainingData.end || '17:00',
        breakHrs: trainingData.breakHrs || 1.0,
        calculatedHours: trainingData.calculatedHours || 7.0,
        trainerName: trainingData.trainerName || currentUser.name,
        coTrainerIds: trainingData.coTrainerIds || [],
        coTrainerNames: trainingData.coTrainerNames || [],
        attendeeIds: trainingData.attendeeIds || [currentUser.id],
        attendeeNames: trainingData.attendeeNames || [currentUser.name],
        location: trainingData.location || '',
        notes: trainingData.notes || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTrainingLogs((prev) => [newTraining, ...prev]);
      showToast(
        language === 'my'
          ? `သင်တန်းနာရီ (${newTraining.calculatedHours} hrs) ကို မှတ်တမ်းတင်ပြီးပါပြီ။`
          : `Training session logged with ${newTraining.calculatedHours} hrs.`
      );
    }
  };

  // Delete Training Log
  const handleDeleteTraining = (trainingId: string) => {
    setTrainingLogs((prev) => prev.filter((tr) => tr.id !== trainingId));
    showToast(
      language === 'my'
        ? 'သင်တန်းမှတ်တမ်း ဖျက်ပြီးပါပြီ။'
        : 'Training log deleted.'
    );
  };

  // Add Strategic Project
  const handleAddProject = (proj: Partial<StrategicProject>) => {
    const newProj: StrategicProject = {
      id: `p-${Date.now()}`,
      title: proj.title || 'New Initiative',
      ownerId: proj.ownerId || currentUser.id,
      ownerName: proj.ownerName || currentUser.name,
      coAssigneeIds: proj.coAssigneeIds || [],
      coAssigneeNames: proj.coAssigneeNames || [],
      deadline: proj.deadline || '2026-12-31',
      followupDate: proj.followupDate,
      followupNote: proj.followupNote,
      deliverables: proj.deliverables || '',
      progress: proj.progress ?? 10,
      status: proj.status || 'In Progress',
    };
    setProjects((prev) => [newProj, ...prev]);
    showToast(
      language === 'my' ? 'စီမံကိန်းအသစ် စတင်လိုက်ပါပြီ။' : 'New strategic project launched.'
    );
  };

  const handleUpdateProject = (updatedProj: StrategicProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
    );
    showToast(
      language === 'my'
        ? `စီမံကိန်း "${updatedProj.title}" ကို ပြင်ဆင်သိမ်းဆည်းပြီးပါပြီ။`
        : `Project "${updatedProj.title}" updated.`
    );
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    showToast(
      language === 'my' ? 'စီမံကိန်းနှင့် ဆက်စပ် Task များကို ဖျက်ပြီးပါပြီ။' : 'Project deleted.'
    );
  };

  const handleToggleAllowMemberDeadlineSetup = (enabled: boolean) => {
    if (currentUser.roleTier !== 'ADMIN') return;
    setAllowMemberDeadlineSetup(enabled);
    showToast(
      language === 'my'
        ? enabled
          ? 'အဖွဲ့ဝင်တိုင်း Strategic Project Deadline များ Setup ပြုလုပ်ခွင့်ကို Admin မှ ဖွင့်ပေးလိုက်ပါပြီ။'
          : 'Strategic Project Deadline Setup ကို Admin သီးသန့်အဖြစ် ကန့်သတ်လိုက်ပါပြီ။'
        : enabled
        ? 'Admin enabled Deadline Setup for all team members.'
        : 'Admin restricted Deadline Setup to Admins only.'
    );
  };

  // Add New Team Member (Onboard - Admin Only)
  const handleAddUser = (userData: Partial<UserProfile>) => {
    if (currentUser.roleTier !== 'ADMIN') {
      showToast(
        language === 'my'
          ? 'Admin များသာ ဝန်ထမ်းအသစ် ထည့်သွင်းခွင့်ရှိပါသည်။'
          : 'Only Admins are permitted to add team members.'
      );
      return;
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: userData.name || 'New Member',
      roleLabel: userData.roleLabel || 'L&D Officer',
      dept: userData.dept || 'L&D Department',
      roleTier: userData.roleTier || 'MEMBER',
      status: userData.status || 'Active',
      joinDate: userData.joinDate || new Date().toISOString().split('T')[0],
      email: userData.email,
      phone: userData.phone,
      avatar:
        userData.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
    setUsers((prev) => [...prev, newUser]);
    showToast(
      language === 'my'
        ? `အဖွဲ့ဝင်သစ် "${newUser.name}" ကို တာဝန်ထမ်းဆောင်ဆဲ (အဝင်) အဖြစ် အောင်မြင်စွာ စာရင်းသွင်းပြီးပါပြီ။`
        : `New team member "${newUser.name}" onboarded.`
    );
  };

  // Update Member Status (Onboard / Offboard / Resign - Admin Only)
  const handleUpdateMemberStatus = (userId: string, newStatus: MemberStatus) => {
    if (currentUser.roleTier !== 'ADMIN') {
      showToast(
        language === 'my'
          ? 'Admin များသာ ဝန်ထမ်းအဝင်/အထွက် အခြေအနေ ပြောင်းလဲခွင့်ရှိပါသည်။'
          : 'Only Admins can change staff onboarding/offboarding status.'
      );
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: newStatus,
            resignedDate:
              newStatus === 'Resigned' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return u;
      })
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({
        ...prev,
        status: newStatus,
        resignedDate:
          newStatus === 'Resigned' ? new Date().toISOString().split('T')[0] : undefined,
      }));
    }

    if (sheetMember && sheetMember.id === userId) {
      setSheetMember((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    const userFound = users.find((u) => u.id === userId);
    showToast(
      language === 'my'
        ? `"${userFound?.name || 'ဝန်ထမ်း'}" အား ${
            newStatus === 'Resigned' ? 'နုတ်ထွက် (အထွက်)' : 'တာဝန်ထမ်းဆောင်ဆဲ (အဝင်)'
          } အဖြစ် ပြောင်းလဲပြီးပါပြီ။`
        : `Updated status of ${userFound?.name} to ${newStatus}`
    );
  };

  // Permanently Delete Team Member (Admin Only)
  const handleDeleteUser = (userId: string) => {
    if (currentUser.roleTier !== 'ADMIN') {
      showToast(
        language === 'my'
          ? 'Admin များသာ ဝန်ထမ်းဖယ်ရှားခွင့်ရှိပါသည်။'
          : 'Only Admins can remove team members.'
      );
      return;
    }

    if (currentUser.id === userId) {
      showToast(
        language === 'my'
          ? 'လက်ရှိ Login ဝင်ထားသော ကိုယ်ပိုင်အကောင့်ကို ဖျက်၍မရပါ။ အခြားအကောင့်သို့ အရင်ပြောင်းပါ။'
          : 'Cannot delete the currently active user context.'
      );
      return;
    }

    const userToDelete = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (sheetMember && sheetMember.id === userId) {
      setSheetMember(null);
    }

    showToast(
      language === 'my'
        ? `အဖွဲ့ဝင် "${userToDelete?.name || ''}" အား အဖွဲ့မှ ဖျက်ပြီးပါပြီ။`
        : `Team member "${userToDelete?.name}" removed.`
    );
  };

  const handleOpenEditProfile = (userToEdit?: UserProfile) => {
    setProfileUserToEdit(userToEdit || currentUser);
    setIsProfileModalOpen(true);
  };

  // Calculated Metric Totals
  const activeTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'Active' || t.status === 'Waiting').length,
    [tasks]
  );
  const overdueTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'Overdue').length,
    [tasks]
  );
  const pendingLeavesCount = useMemo(
    () => leaves.filter((l) => l.status === 'Pending').length,
    [leaves]
  );
  const totalTrainingHours = useMemo(
    () => trainingLogs.reduce((acc, tr) => acc + (tr.calculatedHours || 0), 0),
    [trainingLogs]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slideUp text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        onOpenEditProfile={() => handleOpenEditProfile(currentUser)}
        onOpenOrgChart={() => setIsOrgChartModalOpen(true)}
        onResetData={handleResetData}
        onOpenChangeAdminPassword={() => {
          setPendingAdminUser(null);
          setAdminPwdMode('change');
          setAdminPwdModalOpen(true);
        }}
        onLockAdmin={handleLockAdmin}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        pendingLeavesCount={pendingLeavesCount}
        overdueTasksCount={overdueTasksCount}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-6">
        {/* Executive Metrics Overview */}
        <MetricsOverview
          activeTasksCount={activeTasksCount}
          overdueTasksCount={overdueTasksCount}
          pendingLeavesCount={pendingLeavesCount}
          totalTrainingHours={totalTrainingHours}
          onSelectMetric={(tab) => setCurrentTab(tab)}
          language={language}
        />

        {/* View Routing */}
        {currentTab === 'directory' && (
          <DirectoryTab
            allUsers={users}
            currentUser={currentUser}
            tasks={tasks}
            leaves={leaves}
            trainingLogs={trainingLogs}
            attendanceOverrides={attendanceOverrides}
            onNotify={showToast}
            onOpenMemberSheet={(member) => setSheetMember(member)}
            onOpenEditProfile={handleOpenEditProfile}
            onOpenAddTask={handleOpenAddTask}
            onOpenAddLeave={handleOpenAddLeave}
            onOpenAddTraining={handleOpenAddTraining}
            onOpenAddUser={() => setIsAddUserModalOpen(true)}
            language={language}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            currentUser={currentUser}
            allUsers={users}
            onOpenAddTask={handleOpenAddTask}
            onOpenAddLeave={handleOpenAddLeave}
            onOpenAddTraining={handleOpenAddTraining}
            onOpenMemberSheet={(member) => setSheetMember(member)}
            onOpenEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onOpenComments={(task) => {
              setSelectedCommentTask(task);
              setIsCommentsModalOpen(true);
            }}
            language={language}
          />
        )}

        {currentTab === 'leave' && (
          <LeaveTab
            leaves={leaves}
            tasks={tasks}
            trainingLogs={trainingLogs}
            attendanceOverrides={attendanceOverrides}
            currentUser={currentUser}
            allUsers={users}
            onOpenAddLeave={handleOpenAddLeave}
            onOpenAddTask={handleOpenAddTask}
            onOpenAddTraining={handleOpenAddTraining}
            onOpenMemberSheet={(member) => setSheetMember(member)}
            onOpenEditLeave={(leave) => {
              setLeaveToEdit(leave);
              setIsLeaveModalOpen(true);
            }}
            onDeleteLeave={handleDeleteLeave}
            onApproveLeave={handleApproveLeave}
            onSetAttendanceOverride={handleSetAttendanceOverride}
            language={language}
          />
        )}

        {currentTab === 'training' && (
          <TrainingTab
            trainingLogs={trainingLogs}
            currentUser={currentUser}
            allUsers={users}
            onOpenAddTraining={handleOpenAddTraining}
            onOpenAddTask={handleOpenAddTask}
            onOpenAddLeave={handleOpenAddLeave}
            onOpenMemberSheet={(member) => setSheetMember(member)}
            onOpenEditTraining={(training) => {
              setTrainingToEdit(training);
              setIsTrainingModalOpen(true);
            }}
            onDeleteTraining={handleDeleteTraining}
            onQuickSaveTraining={handleSaveTraining}
            language={language}
          />
        )}

        {currentTab === 'weekly' && (
          <WeeklyBoardTab
            tasks={tasks}
            leaves={leaves}
            currentUser={currentUser}
            allUsers={users}
            onOpenAddTask={handleOpenAddTask}
            onOpenEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onOpenAddLeave={handleOpenAddLeave}
            onOpenEditLeave={(leave) => {
              setLeaveToEdit(leave);
              setIsLeaveModalOpen(true);
            }}
            onApproveLeave={handleApproveLeave}
            onDeleteLeave={handleDeleteLeave}
            onOpenMemberSheet={(member) => setSheetMember(member)}
            onOpenComments={(task) => {
              setSelectedCommentTask(task);
              setIsCommentsModalOpen(true);
            }}
            language={language}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            tasks={tasks}
            currentUser={currentUser}
            allUsers={users}
            allowMemberDeadlineSetup={allowMemberDeadlineSetup}
            onToggleAllowMemberDeadlineSetup={handleToggleAllowMemberDeadlineSetup}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onOpenComments={(task) => {
              setSelectedCommentTask(task);
              setIsCommentsModalOpen(true);
            }}
            onOpenMemberSheet={(member) => setSheetMember(member)}
            language={language}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            © 2026 KBZ Life Insurance Co., Ltd. — Learning & Development Department.
          </span>
          <div className="flex items-center gap-3 font-semibold text-slate-600">
            <span>Branch & Agency Channels</span>
            <span>•</span>
            <span>Digital LMS Integration</span>
            <span>•</span>
            <button
              onClick={() => setIsOrgChartModalOpen(true)}
              className="text-blue-600 hover:underline"
            >
              System Org-Chart
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MODALS ================= */}

      {/* 1. Edit Profile / Name Change Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileUserToEdit(null);
        }}
        currentUser={currentUser}
        userToEdit={profileUserToEdit}
        onSaveProfile={handleSaveProfile}
        language={language}
      />

      {/* 2. Interactive 3D Member Sheet Drawer / Modal */}
      <MemberSheetModal
        isOpen={!!sheetMember}
        onClose={() => setSheetMember(null)}
        member={sheetMember}
        currentUser={currentUser}
        tasks={tasks}
        leaves={leaves}
        trainingLogs={trainingLogs}
        attendanceOverrides={attendanceOverrides}
        onSetAttendanceOverride={handleSetAttendanceOverride}
        onExportExcelSuccess={(filename) =>
          showToast(
            language === 'my'
              ? `Excel ဖိုင် "${filename}" ကို ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ။`
              : `Exported ${filename}`
          )
        }
        onOpenAddTask={(member, defaultDate) => {
          handleOpenAddTask(member, defaultDate);
        }}
        onOpenEditTask={(task) => {
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
        onDeleteTask={handleDeleteTask}
        onOpenComments={(task) => {
          setSelectedCommentTask(task);
          setIsCommentsModalOpen(true);
        }}
        onOpenAddLeave={(member, defaultDate) => {
          handleOpenAddLeave(member, defaultDate);
        }}
        onOpenEditLeave={(leave) => {
          setLeaveToEdit(leave);
          setIsLeaveModalOpen(true);
        }}
        onDeleteLeave={handleDeleteLeave}
        onApproveLeave={handleApproveLeave}
        onOpenAddTraining={(member, defaultDate) => {
          handleOpenAddTraining(member, defaultDate);
        }}
        onOpenEditTraining={(training) => {
          setTrainingToEdit(training);
          setIsTrainingModalOpen(true);
        }}
        onDeleteTraining={handleDeleteTraining}
        onOpenEditProfile={(member) => {
          handleOpenEditProfile(member);
        }}
        onUpdateMemberStatus={handleUpdateMemberStatus}
        language={language}
      />

      {/* 3. Add / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
          setActionTargetMember(null);
          setActionDefaultDate(undefined);
        }}
        taskToEdit={taskToEdit}
        targetMember={actionTargetMember}
        defaultDate={actionDefaultDate}
        currentUser={currentUser}
        allUsers={users}
        onSaveTask={handleSaveTask}
        language={language}
      />

      {/* 4. Task Discussion & Comments Thread Modal */}
      <TaskCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false);
          setSelectedCommentTask(null);
        }}
        task={selectedCommentTask}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onUpdateFollowupDate={handleUpdateFollowupDate}
        language={language}
      />

      {/* 5. Add / Edit Leave Modal */}
      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setLeaveToEdit(null);
          setActionTargetMember(null);
          setActionDefaultDate(undefined);
        }}
        leaveToEdit={leaveToEdit}
        targetMember={actionTargetMember}
        defaultDate={actionDefaultDate}
        currentUser={currentUser}
        allUsers={users}
        onSaveLeave={handleSaveLeave}
        language={language}
      />

      {/* 6. Add / Edit Training Log Modal */}
      <TrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => {
          setIsTrainingModalOpen(false);
          setTrainingToEdit(null);
          setActionTargetMember(null);
          setActionDefaultDate(undefined);
        }}
        trainingToEdit={trainingToEdit}
        targetMember={actionTargetMember}
        defaultDate={actionDefaultDate}
        currentUser={currentUser}
        allUsers={users}
        onSaveTraining={handleSaveTraining}
        language={language}
      />

      {/* 7. Workflow Org-Chart Modal */}
      <WorkflowModal
        isOpen={isOrgChartModalOpen}
        onClose={() => setIsOrgChartModalOpen(false)}
        language={language}
      />

      {/* 8. Add New Team Member Modal (Admin) */}
      <UserManagementModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        currentUser={currentUser}
        allUsers={users}
        onAddUser={handleAddUser}
        onUpdateUserStatus={handleUpdateMemberStatus}
        onDeleteUser={handleDeleteUser}
        onOpenEditProfile={handleOpenEditProfile}
        onOpenChangeAdminPassword={() => {
          setPendingAdminUser(null);
          setAdminPwdMode('change');
          setAdminPwdModalOpen(true);
        }}
        language={language}
      />

      {/* 9. Reset Demo Data Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={confirmResetData}
        title={language === 'my' ? 'မူလဒေတာ ပြန်ထားရန် အတည်ပြုပါ' : 'Confirm Portal Reset'}
        message={
          language === 'my'
            ? 'ဒေတာအားလုံးကို မူလနမူနာ အခြေအနေသို့ ပြန်လည်ထားရှိရန် သေချာပါသလား?'
            : 'Reset all portal data back to original demo values?'
        }
        confirmLabel={language === 'my' ? 'ပြန်လည်ထားရှိမည်' : 'Reset Data'}
        cancelLabel={language === 'my' ? 'မလုပ်တော့ပါ' : 'Cancel'}
        isDestructive={false}
        language={language}
      />

      {/* 10. Admin Password Verification & Change Modal */}
      <AdminPasswordModal
        isOpen={adminPwdModalOpen}
        mode={adminPwdMode}
        targetAdminName={pendingAdminUser?.name}
        currentPasswordStored={adminPassword}
        onVerifySuccess={handleAdminUnlockSuccess}
        onChangePassword={handleChangeAdminPassword}
        onClose={() => {
          setAdminPwdModalOpen(false);
          setPendingAdminUser(null);
        }}
        language={language}
      />
    </div>
  );
}
