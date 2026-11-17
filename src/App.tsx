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
  AttendanceOverrideStatus,
  AppearanceSettings,
  RoleTier,
  PasswordRequest
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_TASKS, 
  INITIAL_LEAVES, 
  INITIAL_TRAINING, 
  INITIAL_PROJECTS 
} from './data/initialData';
import { Language, TRANSLATIONS } from './utils/translations';
import {
  isAdminOrSuper,
  canApproveLeave,
  canApproveTaskCompletion,
} from './utils/roleHelpers';
import { isTaskOverdue, isTaskNearDeadline } from './utils/taskHelpers';
import { formatTotalTrainerHours } from './utils/trainingHelpers';
import { useCloudSync } from './lib/cloudSync';
import { sendOverdueEmails } from './lib/staffLogins';
import { stageFromTasks } from './utils/projectStage';

// Components
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { DirectoryTab } from './components/DirectoryTab';
import { TasksTab } from './components/TasksTab';
import { LeaveTab } from './components/LeaveTab';
import { TrainingTab } from './components/TrainingTab';
import { WeeklyBoardTab } from './components/WeeklyBoardTab';
import { ProjectsTab } from './components/ProjectsTab';
import { AuditTab } from './components/AuditTab';

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
import { AppearanceSettingsModal } from './components/AppearanceSettingsModal';

const DEFAULT_APPEARANCE: AppearanceSettings = {
  fontScale: 'md',
  customFontSizePx: 16,
  textColor: '#1e293b',
  themeColor: '#0f172a',
  accentColor: '#2563eb',
  logoType: 'badge',
  logoText: 'KBZ',
  logoSize: 'lg',
};

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
  APPEARANCE: 'kbz_ld_portal_appearance_v1',
};

const SESSION_ADMIN_UNLOCKED = 'kbz_ld_admin_unlocked_v1';

/** Browser storage is only a cache (Supabase holds the data); a full storage must never crash the app. */
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[storage] could not cache "${key}" in this browser:`, err);
  }
}

interface AppProps {
  /** Email of the signed-in staff member (Supabase Auth). Undefined when login is not configured. */
  authEmail?: string;
  onSignOut?: () => void;
  /** Signed in: switch to another admin account by signing in as them (login form, email filled in). */
  onSwitchAccount?: (email: string) => void;
  /** Visitor who is not signed in: can act as any Member/Viewer; admin work needs sign-in. */
  guest?: boolean;
  onSignIn?: () => void;
}

/** Fallback for visitors when the staff list has no Members (read-only Viewer). */
const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Guest',
  roleLabel: 'Visitor (read-only)',
  dept: '',
  roleTier: 'VIEWER',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export default function App({ authEmail, onSignOut, onSwitchAccount, guest, onSignIn }: AppProps = {}) {
  // State Initialization from LocalStorage or Defaults
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        const hasSuperAdmin = parsed.some((u) => u.roleTier === 'SUPER_ADMIN');
        if (!hasSuperAdmin) {
          let promoted = false;
          return parsed.map((u) => {
            if (!promoted && (u.id === 'u1' || u.roleTier === 'ADMIN')) {
              promoted = true;
              return { ...u, roleTier: 'SUPER_ADMIN' as const };
            }
            return u;
          });
        }
        return parsed;
      }
      return INITIAL_USERS;
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
        if (found && (!isAdminOrSuper(found.roleTier) || unlocked)) {
          return found;
        }
      }
      return (
        users.find((u) => u.name === 'Aung Kyaw') ||
        users.find((u) => !isAdminOrSuper(u.roleTier)) ||
        users[0]
      );
    } catch {
      return users[0];
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        const parsed: TaskItem[] = JSON.parse(saved);
        return parsed.map((tk) =>
          tk.status === 'Waiting' ? { ...tk, status: 'Pending' as const } : tk
        );
      }
      return INITIAL_TASKS;
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

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPEARANCE);
      return saved ? { ...DEFAULT_APPEARANCE, ...JSON.parse(saved) } : DEFAULT_APPEARANCE;
    } catch {
      return DEFAULT_APPEARANCE;
    }
  });

  // "Forgot password" requests from the login page (shared through Supabase; admins act on them).
  const [passwordRequests, setPasswordRequests] = useState<PasswordRequest[]>([]);
  const [userModalTab, setUserModalTab] = useState<'onboard' | 'offboard' | 'requests' | undefined>(undefined);

  const [currentTab, setCurrentTab] = useState<TabType>('directory');
  const [taskFilterRequest, setTaskFilterRequest] = useState<{
    filter: 'all' | 'my' | 'overdue' | 'due-soon' | 'active' | 'pending' | 'completed';
    key: number;
  } | null>(null);
  const [leaveFilterRequest, setLeaveFilterRequest] = useState<{
    filter: 'all' | 'my' | 'pending' | 'approved' | 'rejected' | 'hr-unsynced';
    key: number;
  } | null>(null);

  // Modal Visibility States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOrgChartModalOpen, setIsOrgChartModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);

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
    if (!targetMember) {
      setCurrentTab('directory');
      showToast(
        language === 'my'
          ? 'သက်ဆိုင်ရာ ဝန်ထမ်းနာမည် (Member Sheet) ထဲသို့ ဝင်ရောက်ပြီးမှ Task အသစ် ဖြည့်သွင်းနိုင်ပါသည်။'
          : 'Please open a specific member sheet first to fill in a new task.'
      );
      return;
    }
    setActionTargetMember(targetMember);
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
    safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.TRAINING, JSON.stringify(trainingLogs));
  }, [trainingLogs]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.LANG, language);
  }, [language]);

  useEffect(() => {
    if (currentUser) {
      safeSetItem(STORAGE_KEYS.ACTIVE_USER, currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.ADMIN_PWD, adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceOverrides));
  }, [attendanceOverrides]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.ALLOW_MEMBER_DEADLINE, String(allowMemberDeadlineSetup));
  }, [allowMemberDeadlineSetup]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.APPEARANCE, JSON.stringify(appearanceSettings));
    const fontSizeMap: Record<AppearanceSettings['fontScale'], number> = {
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    };
    const resolvedPx =
      appearanceSettings.customFontSizePx || fontSizeMap[appearanceSettings.fontScale] || 16;
    document.documentElement.style.fontSize = `${resolvedPx}px`;
    document.documentElement.style.setProperty('--app-text-color', appearanceSettings.textColor);
    document.documentElement.style.setProperty(
      '--app-theme-color',
      appearanceSettings.themeColor || '#0f172a'
    );
    document.documentElement.style.setProperty(
      '--app-accent-color',
      appearanceSettings.accentColor || '#2563eb'
    );
    if (appearanceSettings.textColor && appearanceSettings.textColor.toLowerCase() !== '#1e293b') {
      document.documentElement.setAttribute('data-custom-text-color', 'true');
    } else {
      document.documentElement.removeAttribute('data-custom-text-color');
    }
  }, [appearanceSettings]);

  // Sync shared data with Supabase (table `app_state`). Language and the active user stay per-browser.
  const cloudSlices = [
    { key: 'users', value: users, apply: (v: UserProfile[]) => Array.isArray(v) && setUsers(v) },
    {
      key: 'tasks',
      value: tasks,
      apply: (v: TaskItem[]) =>
        Array.isArray(v) &&
        setTasks(v.map((tk) => (tk.status === 'Waiting' ? { ...tk, status: 'Pending' as const } : tk))),
    },
    { key: 'leaves', value: leaves, apply: (v: LeaveRequest[]) => Array.isArray(v) && setLeaves(v) },
    { key: 'training', value: trainingLogs, apply: (v: TrainingLog[]) => Array.isArray(v) && setTrainingLogs(v) },
    { key: 'projects', value: projects, apply: (v: StrategicProject[]) => Array.isArray(v) && setProjects(v) },
    {
      key: 'attendance',
      value: attendanceOverrides,
      apply: (v: AttendanceRecord[]) => Array.isArray(v) && setAttendanceOverrides(v),
    },
    {
      key: 'allow_member_deadline',
      value: allowMemberDeadlineSetup,
      apply: (v: boolean) => setAllowMemberDeadlineSetup(v !== false),
    },
    {
      key: 'appearance',
      value: appearanceSettings,
      apply: (v: AppearanceSettings) => v && setAppearanceSettings({ ...DEFAULT_APPEARANCE, ...v }),
    },
    {
      key: 'password_requests',
      value: passwordRequests,
      apply: (v: PasswordRequest[]) => Array.isArray(v) && setPasswordRequests(v),
    },
    { key: 'admin_password', value: adminPassword, apply: (v: string) => typeof v === 'string' && v && setAdminPassword(v) },
  ];
  const { status: cloudStatus, error: cloudError } = useCloudSync(
    guest ? cloudSlices.filter((sl) => sl.key !== 'admin_password') : cloudSlices,
    { guest }
  );

  useEffect(() => {
    if (cloudStatus === 'error') {
      console.warn('Supabase sync failed; changes are still saved in this browser.');
    }
  }, [cloudStatus]);

  // Signed-in staff profile, matched by email.
  const authProfile = useMemo(
    () =>
      authEmail
        ? users.find((u) => u.email && u.email.trim().toLowerCase() === authEmail.trim().toLowerCase())
        : undefined,
    [users, authEmail]
  );
  const authIsAdmin = !!authProfile && isAdminOrSuper(authProfile.roleTier);
  const canSwitchUser = guest || !authEmail || authIsAdmin;
  const canResetData = !guest && (!authEmail || authProfile?.roleTier === 'SUPER_ADMIN');

  // Visitors can act as any Member/Viewer, never as an admin (that needs a real sign-in).
  useEffect(() => {
    if (!guest) return;
    if (isAdminUnlocked) {
      setIsAdminUnlocked(false);
      try {
        sessionStorage.removeItem(SESSION_ADMIN_UNLOCKED);
      } catch {}
    }
    const current = users.find((u) => u.id === currentUser?.id);
    if (!current || isAdminOrSuper(current.roleTier) || current.status === 'Resigned') {
      const fallback =
        users.find((u) => u.roleTier === 'MEMBER' && u.status !== 'Resigned') ||
        users.find((u) => u.roleTier === 'VIEWER' && u.status !== 'Resigned') ||
        GUEST_PROFILE;
      if (fallback.id !== currentUser?.id) setCurrentUser(fallback);
    }
  }, [guest, users, currentUser, isAdminUnlocked]);

  // On sign-in, act as the signed-in person. Admins are unlocked automatically; members stay on their own profile.
  const lastAuthProfileId = React.useRef<string | null>(null);
  useEffect(() => {
    if (!authProfile) return;
    const firstMatch = lastAuthProfileId.current !== authProfile.id;
    lastAuthProfileId.current = authProfile.id;
    if (authIsAdmin) {
      if (firstMatch) {
        setIsAdminUnlocked(true);
        try {
          sessionStorage.setItem(SESSION_ADMIN_UNLOCKED, 'true');
        } catch {}
        setCurrentUser(authProfile);
      }
    } else if (firstMatch || currentUser?.id !== authProfile.id) {
      setCurrentUser(authProfile);
    }
  }, [authProfile, authIsAdmin]);

  useEffect(() => {
    if (currentTab === 'audit' && !isAdminOrSuper(currentUser?.roleTier)) setCurrentTab('directory');
  }, [currentTab, currentUser]);

  // Project stage and % follow their tasks' Current Stage automatically.
  useEffect(() => {
    if (guest) return;
    setProjects((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const auto = stageFromTasks(tasks.filter((t) => t.projectId === p.id));
        if (!auto || (auto.status === p.status && auto.progress === p.progress)) return p;
        changed = true;
        return { ...p, status: auto.status, progress: auto.progress };
      });
      return changed ? next : prev;
    });
  }, [tasks, projects, guest]);

  // Keep the active user in step with the user list (e.g. after edits from another browser).
  // Uses the latest value so it never undoes a switch made in the same update (e.g. on sign-in).
  useEffect(() => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const refreshed = users.find((u) => u.id === prev.id);
      return refreshed && JSON.stringify(refreshed) !== JSON.stringify(prev) ? refreshed : prev;
    });
  }, [users]);

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

  // Switch Active User (Protected by Admin Password when switching to ADMIN or SUPER_ADMIN)
  const handleSwitchUser = (userId: string) => {
    if (!canSwitchUser) return;
    const found = users.find((u) => u.id === userId);
    if (!found) return;

    // Signed in: going (back) into any admin account, your own included, always needs that
    // account's password on the login form, so a locked or member view can't be taken over.
    if (authEmail && isAdminOrSuper(found.roleTier)) {
      if (found.id === currentUser.id) return;
      if (found.email && onSwitchAccount) onSwitchAccount(found.email);
      else
        showToast(
          language === 'my'
            ? `${found.name} အဖြစ် ဝင်ရန် ၎င်း၏ Email နှင့် Password ဖြင့် Login ဝင်ပါ။`
            : `Sign in with ${found.name}'s own email and password to use their account.`
        );
      return;
    }

    // Visitors: admin accounts need a real sign-in with email and password.
    if (guest && isAdminOrSuper(found.roleTier)) {
      showToast(
        language === 'my'
          ? 'Admin အဖြစ် ဆောင်ရွက်ရန် Email နှင့် Password ဖြင့် ဝင်ပါ။'
          : 'Sign in with your email and password to work as an admin.'
      );
      onSignIn?.();
      return;
    }

    if (isAdminOrSuper(found.roleTier) && !isAdminUnlocked) {
      setPendingAdminUser(found);
      setAdminPwdMode('verify');
      setAdminPwdModalOpen(true);
      return;
    }

    if (!isAdminOrSuper(found.roleTier) && isAdminUnlocked) {
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
    if (!canResetData) return;
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
    setAppearanceSettings(DEFAULT_APPEARANCE);
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
    // Marking a day as Leave counts as approved leave: Super Admin only.
    if (status === 'Leave' && !canApproveLeave(currentUser.roleTier)) {
      showToast(
        language === 'my'
          ? 'ခွင့် (Leave) အဖြစ် သတ်မှတ်ခြင်းကို Super Admin သာ ပြုလုပ်နိုင်ပါသည်။ ခွင့်တောင်းခံလွှာ တင်ပါ။'
          : 'Only a Super Admin can mark a day as Leave. Please submit a leave request.'
      );
      return;
    }
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
        const updatedTrainerHours = tr.trainerHours?.map((th) =>
          th.userId === updatedUser.id || th.name === oldName ? { ...th, name: newName } : th
        );
        const updatedTrainer = tr.trainerName === oldName ? newName : tr.trainerName;
        const updatedEditedBy = tr.editedBy === oldName ? newName : tr.editedBy;
        return {
          ...tr,
          attendeeNames: updatedAttendees,
          coTrainerNames: tr.coTrainerNames ? updatedCoTrainers : undefined,
          trainerHours: updatedTrainerHours,
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
        const updatedProjectComments = (p.comments || []).map((c) => {
          if (c.authorId === updatedUser.id || c.authorName === oldName) {
            return {
              ...c,
              authorName: newName,
              authorAvatar: updatedUser.avatar,
            };
          }
          return c;
        });
        return {
          ...p,
          ownerName: isOwner ? newName : p.ownerName,
          coAssigneeNames: p.coAssigneeNames ? updatedCoNames : undefined,
          comments: updatedProjectComments,
        };
      })
    );

    showToast(
      language === 'my'
        ? `အမည် "${newName}" သို့ အောင်မြင်စွာ ပြောင်းလဲပြီး Task၊ Leave နှင့် Training မှတ်တမ်းများ အားလုံးတွင် အလိုအလျောက် အဆင့်မြှင့်တင်ပြီးပါပြီ။`
        : `Profile updated: Name changed to "${newName}" and synced across all records.`
    );
  };

  // Add or Update Task (Enforce Admin/Super Admin approval for Completed)
  const handleSaveTask = (taskData: Partial<TaskItem>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const canApproveComplete = canApproveTaskCompletion(currentUser.roleTier);

    const resolveStatusFields = (
      requestedStatus: TaskItem['status'],
      existing?: TaskItem
    ): Pick<
      TaskItem,
      | 'status'
      | 'completionRequested'
      | 'completionRequestedBy'
      | 'completionRequestedAt'
      | 'completionApprovedBy'
      | 'completionApprovedAt'
    > => {
      if (requestedStatus === 'Completed') {
        if (canApproveComplete) {
          return {
            status: 'Completed',
            completionRequested: false,
            completionRequestedBy: existing?.completionRequestedBy,
            completionRequestedAt: existing?.completionRequestedAt,
            completionApprovedBy: currentUser.name,
            completionApprovedAt: todayStr,
          };
        }
        // Member requested completion -> Pending until Admin / Super Admin approves
        return {
          status: 'Pending',
          completionRequested: true,
          completionRequestedBy: currentUser.name,
          completionRequestedAt: todayStr,
          completionApprovedBy: undefined,
          completionApprovedAt: undefined,
        };
      }
      return {
        status: requestedStatus,
        completionRequested: false,
        completionRequestedBy: undefined,
        completionRequestedAt: undefined,
        completionApprovedBy: undefined,
        completionApprovedAt: undefined,
      };
    };

    if (taskData.id) {
      let sentForApproval = false;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskData.id) return t;
          const reqStatus = taskData.status ?? t.status;
          const statusFields =
            taskData.status !== undefined
              ? resolveStatusFields(reqStatus, t)
              : {
                  status: t.status,
                  completionRequested: t.completionRequested,
                  completionRequestedBy: t.completionRequestedBy,
                  completionRequestedAt: t.completionRequestedAt,
                  completionApprovedBy: t.completionApprovedBy,
                  completionApprovedAt: t.completionApprovedAt,
                };
          if (reqStatus === 'Completed' && !canApproveComplete) {
            sentForApproval = true;
          }
          return { ...t, ...taskData, ...statusFields } as TaskItem;
        })
      );
      showToast(
        sentForApproval
          ? language === 'my'
            ? 'ပြီးစီးကြောင်း တောင်းဆိုမှုကို Admin / Super Admin ထံ ပေးပို့ပြီးပါပြီ။ Admin အတည်ပြုမှသာ Completed ဖြစ်ပါမည်။'
            : 'Completion submitted for Admin / Super Admin approval.'
          : language === 'my'
          ? 'Task ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။'
          : 'Task updated successfully.'
      );
    } else {
      const requestedStatus = taskData.status || 'Active';
      const statusFields = resolveStatusFields(requestedStatus);
      const sentForApproval = requestedStatus === 'Completed' && !canApproveComplete;
      const newTask: TaskItem = {
        id: `t-${Date.now()}`,
        title: taskData.title || 'New Task',
        ownerId: taskData.ownerId || currentUser.id,
        ownerName: taskData.ownerName || currentUser.name,
        coAssigneeIds: taskData.coAssigneeIds,
        coAssigneeNames: taskData.coAssigneeNames,
        projectId: taskData.projectId,
        due: taskData.due || todayStr,
        followup: taskData.followup || todayStr,
        day: taskData.day || 'Wed',
        ...statusFields,
        note: taskData.note || '',
        comments: [],
        createdAt: todayStr,
      };
      setTasks((prev) => [newTask, ...prev]);
      showToast(
        sentForApproval
          ? language === 'my'
            ? `Task ကို ${newTask.ownerName} အောက်တွင် ထည့်သွင်းပြီး ပြီးစီးမှုအတွက် Admin အတည်ပြုချက် စောင့်ဆိုင်းနေပါသည်။`
            : `Task added under ${newTask.ownerName} (pending Admin completion approval).`
          : language === 'my'
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
            note: text,
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

  // Task Status Update (Enforces Admin/Super Admin approval for Completed)
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskItem['status']) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const canApproveComplete = canApproveTaskCompletion(currentUser.roleTier);

    if (newStatus === 'Completed' && !canApproveComplete) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'Pending',
                completionRequested: true,
                completionRequestedBy: currentUser.name,
                completionRequestedAt: todayStr,
                completionApprovedBy: undefined,
                completionApprovedAt: undefined,
              }
            : t
        )
      );
      showToast(
        language === 'my'
          ? 'ပြီးစီးကြောင်း တောင်းဆိုမှုကို Admin / Super Admin ထံ ပေးပို့ပြီးပါပြီ။'
          : 'Completion request sent to Admin / Super Admin for approval.'
      );
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completionRequested: false,
              completionApprovedBy: newStatus === 'Completed' ? currentUser.name : undefined,
              completionApprovedAt: newStatus === 'Completed' ? todayStr : undefined,
            }
          : t
      )
    );
  };

  // Admin / Super Admin Approve or Return Task Completion
  const handleApproveTaskCompletion = (taskId: string, approved: boolean) => {
    if (!canApproveTaskCompletion(currentUser.roleTier)) {
      showToast(
        language === 'my'
          ? 'Admin သို့မဟုတ် Super Admin များသာ Task Completed အတည်ပြုခွင့်ရှိပါသည်။'
          : 'Only Admin or Super Admin can approve task completion.'
      );
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (approved) {
          return {
            ...t,
            status: 'Completed',
            completionRequested: false,
            completionApprovedBy: currentUser.name,
            completionApprovedAt: todayStr,
          };
        }
        return {
          ...t,
          status: 'Active',
          completionRequested: false,
          completionApprovedBy: undefined,
          completionApprovedAt: undefined,
        };
      })
    );
    showToast(
      approved
        ? language === 'my'
          ? `Task ပြီးစီးမှုကို ${currentUser.name} မှ အတည်ပြု (Completed) ပြီးပါပြီ။`
          : `Task completion approved by ${currentUser.name}.`
        : language === 'my'
        ? `Task ကို In Progress သို့ ပြန်လည်သတ်မှတ်ပြီးပါပြီ။`
        : `Task returned to In Progress.`
    );
  };

  // Task Comments: Update Followup Date
  const handleUpdateFollowupDate = (taskId: string, newFollowup: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, followup: newFollowup } : t))
    );
  };

  // Add or Update Leave (Admin can edit HR alignment fields; ONLY Super Admin can approve/reject)
  const handleSaveLeave = (leaveData: Partial<LeaveRequest>) => {
    const isAnyAdmin = isAdminOrSuper(currentUser.roleTier);
    const canApprove = canApproveLeave(currentUser.roleTier);
    const todayStr = new Date().toISOString().split('T')[0];

    if (leaveData.id) {
      setLeaves((prev) =>
        prev.map((l) => {
          if (l.id !== leaveData.id) return l;
          const nextStatus = canApprove && leaveData.status ? leaveData.status : l.status;
          const statusChanged = canApprove && leaveData.status && leaveData.status !== l.status;
          return {
            ...l,
            ...leaveData,
            status: nextStatus,
            approvedBy:
              statusChanged && (nextStatus === 'Approved' || nextStatus === 'Rejected')
                ? currentUser.name
                : nextStatus === 'Pending'
                ? undefined
                : l.approvedBy,
            approvedAt:
              statusChanged && (nextStatus === 'Approved' || nextStatus === 'Rejected')
                ? todayStr
                : nextStatus === 'Pending'
                ? undefined
                : l.approvedAt,
          } as LeaveRequest;
        })
      );
      showToast(
        language === 'my'
          ? isAnyAdmin
            ? 'ခွင့်မှတ်တမ်းနှင့် HR ချိန်ညှိမှုကို သိမ်းဆည်းပြီးပါပြီ။'
            : 'ခွင့်မှတ်တမ်း ပြင်ဆင်ပြီးပါပြီ။'
          : 'Leave record updated.'
      );
    } else {
      const initialStatus = canApprove && leaveData.status ? leaveData.status : 'Pending';
      const newLeave: LeaveRequest = {
        id: `l-${Date.now()}`,
        memberId: leaveData.memberId || currentUser.id,
        memberName: leaveData.memberName || currentUser.name,
        type: leaveData.type || 'Casual Leave',
        start: leaveData.start || todayStr,
        end: leaveData.end || todayStr,
        duration: leaveData.duration || 1,
        reason: leaveData.reason || '',
        attachments: leaveData.attachments || [],
        status: initialStatus,
        approvedBy:
          canApprove && (initialStatus === 'Approved' || initialStatus === 'Rejected')
            ? currentUser.name
            : undefined,
        approvedAt:
          canApprove && (initialStatus === 'Approved' || initialStatus === 'Rejected')
            ? todayStr
            : undefined,
        hrRefId: isAnyAdmin ? leaveData.hrRefId : undefined,
        hrSynced: isAnyAdmin ? leaveData.hrSynced : false,
        adminNote: isAnyAdmin ? leaveData.adminNote : undefined,
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

  // Approve or Reject Leave (STRICTLY SUPER_ADMIN ONLY)
  const handleApproveLeave = (leaveId: string, status: 'Approved' | 'Rejected') => {
    if (!canApproveLeave(currentUser.roleTier)) {
      showToast(
        language === 'my'
          ? 'Super Admin သာလျှင် ခွင့်တောင်းခံလွှာကို Approve / Reject ပြုလုပ်ခွင့်ရှိပါသည်။'
          : 'Only Super Admin is permitted to approve or reject leave requests.'
      );
      return;
    }

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
        ? `ခွင့်တောင်းခံလွှာကို Super Admin (${currentUser.name}) မှ "${status === 'Approved' ? 'အတည်ပြု' : 'ငြင်းပယ်'}" လိုက်ပါပြီ။`
        : `Leave request marked as ${status} by Super Admin (${currentUser.name}).`
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
        trainerHours: trainingData.trainerHours || [],
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
    const isAdmin = isAdminOrSuper(currentUser.roleTier);
    const todayStr = new Date().toISOString().split('T')[0];
    const requestedComplete = proj.status === 'Completed' && !isAdmin;
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
      progress: proj.status === 'Completed' && isAdmin ? 100 : proj.progress ?? 10,
      status: requestedComplete ? 'Final Review' : proj.status || 'In Progress',
      completionRequested: requestedComplete,
      completionRequestedBy: requestedComplete ? currentUser.name : undefined,
      completionRequestedAt: requestedComplete ? todayStr : undefined,
      completionStatus: requestedComplete
        ? 'Pending'
        : proj.status === 'Completed' && isAdmin
        ? 'Approved'
        : undefined,
      completionApprovedBy: proj.status === 'Completed' && isAdmin ? currentUser.name : undefined,
      completionApprovedAt: proj.status === 'Completed' && isAdmin ? todayStr : undefined,
      comments: [],
    };
    setProjects((prev) => [newProj, ...prev]);
    showToast(
      language === 'my' ? 'စီမံကိန်းအသစ် စတင်လိုက်ပါပြီ။' : 'New strategic project launched.'
    );
  };

  const handleUpdateProject = (updatedProj: StrategicProject) => {
    const isAdmin = isAdminOrSuper(currentUser.roleTier);
    const todayStr = new Date().toISOString().split('T')[0];

    // Enforce Admin / Super Admin approval when a non-admin tries to mark a Project Completed
    if (updatedProj.status === 'Completed' && !isAdmin) {
      const pendingProj: StrategicProject = {
        ...updatedProj,
        status: 'Final Review',
        completionRequested: true,
        completionStatus: 'Pending',
        completionRequestedBy: currentUser.name,
        completionRequestedAt: todayStr,
        completionApprovedBy: undefined,
        completionApprovedAt: undefined,
      };
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProj.id ? pendingProj : p))
      );
      showToast(
        language === 'my'
          ? `"${updatedProj.title}" Complete ဖြစ်ရန် Admin / Super Admin ထံ Approval တောင်းခံပြီးပါပြီ။`
          : `Completion approval requested from Admin / Super Admin for "${updatedProj.title}".`
      );
      return;
    }

    const normalizedProj: StrategicProject =
      updatedProj.status === 'Completed' && isAdmin
        ? {
            ...updatedProj,
            progress: 100,
            completionRequested: false,
            completionStatus: 'Approved',
            completionApprovedBy: updatedProj.completionApprovedBy || currentUser.name,
            completionApprovedAt: updatedProj.completionApprovedAt || todayStr,
          }
        : updatedProj;

    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProj.id ? normalizedProj : p))
    );
    showToast(
      language === 'my'
        ? `စီမံကိန်း "${updatedProj.title}" ကို ပြင်ဆင်သိမ်းဆည်းပြီးပါပြီ။`
        : `Project "${updatedProj.title}" updated.`
    );
  };

  const handleRequestProjectCompletion = (projectId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              status: 'Final Review',
              completionRequested: true,
              completionStatus: 'Pending',
              completionRequestedBy: currentUser.name,
              completionRequestedAt: todayStr,
              completionApprovedBy: undefined,
              completionApprovedAt: undefined,
            }
          : p
      )
    );
    showToast(
      language === 'my'
        ? 'Project Complete ဖြစ်/မဖြစ် Admin / Super Admin ထံ Approval တောင်းခံပြီးပါပြီ။'
        : 'Project completion approval requested from Admin / Super Admin.'
    );
  };

  const handleReviewProjectCompletion = (
    projectId: string,
    decision: 'Approved' | 'Pending' | 'Rejected'
  ) => {
    if (!isAdminOrSuper(currentUser.roleTier)) {
      showToast(
        language === 'my'
          ? 'Admin သို့မဟုတ် Super Admin များသာ Project Complete Approval ဆုံးဖြတ်ခွင့်ရှိပါသည်။'
          : 'Only Admin or Super Admin can approve, mark pending, or reject project completion.'
      );
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        if (decision === 'Approved') {
          return {
            ...p,
            status: 'Completed',
            progress: 100,
            completionRequested: false,
            completionStatus: 'Approved',
            completionApprovedBy: currentUser.name,
            completionApprovedAt: todayStr,
          };
        }
        if (decision === 'Pending') {
          return {
            ...p,
            status: 'Final Review',
            completionRequested: true,
            completionStatus: 'Pending',
            completionApprovedBy: currentUser.name,
            completionApprovedAt: todayStr,
          };
        }
        return {
          ...p,
          status: 'In Progress',
          completionRequested: false,
          completionStatus: 'Rejected',
          completionApprovedBy: currentUser.name,
          completionApprovedAt: todayStr,
        };
      })
    );

    showToast(
      decision === 'Approved'
        ? language === 'my'
          ? `Project ပြီးစီးမှုကို ${currentUser.name} မှ Approve လုပ်ပြီးပါပြီ။`
          : `Project completion approved by ${currentUser.name}.`
        : decision === 'Pending'
        ? language === 'my'
          ? `Project ကို ${currentUser.name} မှ Pending အဖြစ် သတ်မှတ်ထားပါသည်။`
          : `Project kept Pending by ${currentUser.name}.`
        : language === 'my'
        ? `Project ပြီးစီးမှုကို ${currentUser.name} မှ Reject လုပ်ပြီး In Progress သို့ ပြန်ပို့လိုက်ပါပြီ။`
        : `Project completion rejected by ${currentUser.name}.`
    );
  };

  const handleAddProjectComment = (projectId: string, text: string) => {
    const now = new Date();
    const timeStr =
      now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      id: `pc-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text,
      timestamp: timeStr,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, comments: [...(p.comments || []), newComment] } : p
      )
    );
    showToast(
      language === 'my' ? 'Project မှတ်ချက် တင်ပြီးပါပြီ။' : 'Project comment added.'
    );
  };

  const handleDeleteProjectComment = (projectId: string, commentId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, comments: (p.comments || []).filter((c) => c.id !== commentId) }
          : p
      )
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
    if (!isAdminOrSuper(currentUser.roleTier)) return;
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

  // Add New Team Member (Onboard - Admin / Super Admin Only)
  const handleAddUser = (userData: Partial<UserProfile>) => {
    if (!isAdminOrSuper(currentUser.roleTier)) {
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
      email: userData.email ? userData.email.trim().toLowerCase() : undefined,
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

  // Update Member Status (Onboard / Offboard / Resign - Admin / Super Admin Only)
  // Admins: email one person about their overdue tasks now (button on their card).
  const handleSendOverdueMail = async (user: UserProfile) => {
    if (!isAdminOrSuper(currentUser.roleTier)) return;
    const res = await sendOverdueEmails(user.id);
    if (!res.ok) {
      showToast((language === 'my' ? '⚠️ Mail မပို့နိုင်ပါ: ' : '⚠️ Could not send email: ') + res.error);
      return;
    }
    if (res.failed.length) {
      showToast((language === 'my' ? '⚠️ Mail မပို့နိုင်ပါ: ' : '⚠️ Could not send email: ') + res.failed[0].error);
      return;
    }
    showToast(
      res.emailsSent > 0
        ? language === 'my'
          ? `📧 ${user.name} (${user.email}) ထံ Overdue Task ${res.newOverdueTasks} ခု အကြောင်း Mail ပို့ပြီးပါပြီ။`
          : `📧 Emailed ${user.name} (${user.email}) about ${res.newOverdueTasks} overdue task(s).`
        : language === 'my'
          ? `${user.name} တွင် Overdue Task မရှိတော့ပါ။`
          : `${user.name} has no overdue tasks now.`
    );
  };

  // Change a staff member's role from the Staff In/Out portal (admins only).
  const handleUpdateUserRole = (userId: string, newRole: RoleTier) => {
    if (!isAdminOrSuper(currentUser.roleTier)) return;
    const target = users.find((u) => u.id === userId);
    if (!target || target.roleTier === newRole) return;
    const isMe = userId === currentUser.id || (authProfile && userId === authProfile.id);
    if (isMe) {
      showToast(
        language === 'my'
          ? 'ကိုယ့် Role ကို ကိုယ်တိုင် ပြောင်း၍ မရပါ။ အခြား Admin တစ်ဦးကို ပြောင်းခိုင်းပါ။'
          : "You can't change your own role. Ask another admin."
      );
      return;
    }
    const activeSupers = users.filter((u) => u.roleTier === 'SUPER_ADMIN' && u.status !== 'Resigned');
    if (target.roleTier === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN' && activeSupers.length <= 1) {
      showToast(
        language === 'my'
          ? 'Super Admin အနည်းဆုံး တစ်ဦး ရှိရပါမည် (ခွင့်ခွင့်ပြုရန် လိုအပ်သည်)။'
          : 'At least one Super Admin is required (needed for leave approval).'
      );
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roleTier: newRole } : u)));
    showToast(
      language === 'my'
        ? `${target.name} ၏ Role ကို ${newRole} သို့ ပြောင်းပြီးပါပြီ။`
        : `${target.name} is now ${newRole}.`
    );
  };

  const handleUpdateMemberStatus = (userId: string, newStatus: MemberStatus) => {
    if (!isAdminOrSuper(currentUser.roleTier)) {
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

  // Permanently Delete Team Member (Admin / Super Admin Only)
  const handleDeleteUser = (userId: string) => {
    if (!isAdminOrSuper(currentUser.roleTier)) {
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
    if (guest) {
      showToast(
        language === 'my'
          ? 'Profile ပြင်ရန် Sign in ဝင်ပါ။'
          : 'Sign in to edit profiles.'
      );
      return;
    }
    setProfileUserToEdit(userToEdit || currentUser);
    setIsProfileModalOpen(true);
  };

  // Calculated Metric Totals
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTasksCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'Active' || t.status === 'Pending' || t.status === 'Waiting'
      ).length,
    [tasks]
  );
  const overdueTasksCount = useMemo(
    () => tasks.filter((t) => isTaskOverdue(t, todayStr)).length,
    [tasks, todayStr]
  );
  const dueSoonTasksCount = useMemo(
    () => tasks.filter((t) => isTaskNearDeadline(t, todayStr)).length,
    [tasks, todayStr]
  );
  const pendingLeavesCount = useMemo(
    () => leaves.filter((l) => l.status === 'Pending').length,
    [leaves]
  );
  const totalTrainingHours = useMemo(
    () => trainingLogs.reduce((acc, tr) => acc + formatTotalTrainerHours(tr), 0),
    [trainingLogs]
  );

  // Don't flash data saved in this browser while the shared data is loading.
  if (cloudStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold">
          {language === 'my' ? 'Data များ ရယူနေသည်...' : 'Loading shared data...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Shared database problem: say so instead of silently showing this browser's copy */}
      {cloudStatus === 'error' && (
        <div className="sticky top-0 z-[70] bg-red-600 text-white px-4 py-2 text-xs font-semibold text-center shadow">
          {language === 'my'
            ? '⚠️ Supabase (Shared Database) နှင့် ချိတ်ဆက်၍ မရပါ။ ဤ Browser ထဲ သိမ်းထားသော Data အဟောင်းကိုသာ ပြနေပါသည်။ ပြင်ဆင်မှုများ အခြားသူများထံ မရောက်ပါ။'
            : '⚠️ Cannot reach Supabase (shared database). Showing data saved in this browser only; changes will not reach others.'}
          {cloudError && <span className="block font-mono font-normal opacity-90 mt-0.5">{cloudError}</span>}
        </div>
      )}
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
        canSwitchUser={canSwitchUser}
        canResetData={canResetData}
        authEmail={authEmail}
        onSignOut={onSignOut}
        onSignIn={onSignIn}
        onOpenEditProfile={() => handleOpenEditProfile(currentUser)}
        onOpenOrgChart={() => setIsOrgChartModalOpen(true)}
        onResetData={handleResetData}
        onOpenChangeAdminPassword={
          authEmail
            ? undefined
            : () => {
                setPendingAdminUser(null);
                setAdminPwdMode('change');
                setAdminPwdModalOpen(true);
              }
        }
        onLockAdmin={handleLockAdmin}
        onOpenAppearanceSettings={() => setIsAppearanceModalOpen(true)}
        onQuickUpdateAppearance={(patch, feedbackMsg) => {
          if (Object.keys(patch).length > 0) {
            setAppearanceSettings((prev) => ({ ...prev, ...patch }));
          }
          if (feedbackMsg) {
            showToast(feedbackMsg);
          }
        }}
        appearanceSettings={appearanceSettings}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onJumpToFiltered={(tab, filter) => {
          setCurrentTab(tab);
          if (tab === 'tasks') {
            setTaskFilterRequest({
              filter: filter === 'due-soon' ? 'due-soon' : 'overdue',
              key: Date.now(),
            });
          } else if (tab === 'leave' && filter === 'pending') {
            setLeaveFilterRequest({ filter: 'pending', key: Date.now() });
          }
        }}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        passwordRequestCount={isAdminOrSuper(currentUser.roleTier) ? passwordRequests.length : 0}
        onOpenPasswordRequests={() => {
          setUserModalTab('requests');
          setIsAddUserModalOpen(true);
        }}
        pendingLeavesCount={pendingLeavesCount}
        overdueTasksCount={overdueTasksCount}
        dueSoonTasksCount={dueSoonTasksCount}
      />

      {/* Main Content Area */}
      <main
        className={
          currentTab === 'projects'
            ? 'w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-6 flex-grow flex flex-col'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-6'
        }
      >
        {/* Summary cards: only on the Team Directory & Sheets tab */}
        {currentTab === 'directory' && (
          <MetricsOverview
            activeTasksCount={activeTasksCount}
            overdueTasksCount={overdueTasksCount}
            dueSoonTasksCount={dueSoonTasksCount}
            pendingLeavesCount={pendingLeavesCount}
            totalTrainingHours={totalTrainingHours}
            onSelectMetric={(tab, filter) => {
              setCurrentTab(tab);
              if (tab === 'tasks') {
                const targetFilter =
                  filter === 'overdue'
                    ? 'overdue'
                    : filter === 'due-soon'
                    ? 'due-soon'
                    : 'active';
                setTaskFilterRequest({ filter: targetFilter, key: Date.now() });
              } else if (tab === 'leave') {
                setLeaveFilterRequest({ filter: 'pending', key: Date.now() });
              }
            }}
            language={language}
          />
        )}

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
            onOpenAddLeave={handleOpenAddLeave}
            onOpenAddTraining={handleOpenAddTraining}
            onOpenAddUser={() => setIsAddUserModalOpen(true)}
            onSendOverdueMail={guest ? undefined : handleSendOverdueMail}
            language={language}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            currentUser={currentUser}
            allUsers={users}
            filterRequest={taskFilterRequest}
            onGoToDirectory={() => setCurrentTab('directory')}
            onOpenMemberSheet={(member) => setSheetMember(member)}
            onOpenEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onApproveTaskCompletion={handleApproveTaskCompletion}
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
            filterRequest={leaveFilterRequest}
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
            onOpenEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onApproveTaskCompletion={handleApproveTaskCompletion}
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

        {currentTab === 'audit' && isAdminOrSuper(currentUser.roleTier) && (
          <AuditTab users={users} language={language} />
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
            onRequestProjectCompletion={handleRequestProjectCompletion}
            onReviewProjectCompletion={handleReviewProjectCompletion}
            onAddProjectComment={handleAddProjectComment}
            onDeleteProjectComment={handleDeleteProjectComment}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onApproveTaskCompletion={handleApproveTaskCompletion}
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
        onQuickSaveTask={handleSaveTask}
        onQuickUpdateTaskStatus={handleUpdateTaskStatus}
        onOpenEditTask={(task) => {
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
        onDeleteTask={handleDeleteTask}
        onApproveTaskCompletion={handleApproveTaskCompletion}
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
        onApproveTaskCompletion={handleApproveTaskCompletion}
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
        onClose={() => {
          setIsAddUserModalOpen(false);
          setUserModalTab(undefined);
        }}
        initialTab={userModalTab}
        passwordRequests={passwordRequests}
        onResolvePasswordRequest={(id) => setPasswordRequests((prev) => prev.filter((r) => r.id !== id))}
        currentUser={currentUser}
        allUsers={users}
        onAddUser={handleAddUser}
        onUpdateUserStatus={handleUpdateMemberStatus}
        onUpdateUserRole={handleUpdateUserRole}
        onDeleteUser={handleDeleteUser}
        onOpenEditProfile={handleOpenEditProfile}
        onOpenChangeAdminPassword={
          authEmail
            ? undefined
            : () => {
                setPendingAdminUser(null);
                setAdminPwdMode('change');
                setAdminPwdModalOpen(true);
              }
        }
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

      {/* 11. Admin / Super Admin Logo, Theme Color, Custom Font Size & Font Color Modal */}
      <AppearanceSettingsModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        settings={appearanceSettings}
        onQuickSave={(patch, message) => {
          setAppearanceSettings((prev) => ({ ...prev, ...patch }));
          showToast(message);
        }}
        onSaveSettings={(next) => {
          setAppearanceSettings(next);
          showToast(
            language === 'my'
              ? 'Portal Logo, Theme Color နှင့် Font Style ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။'
              : 'Portal logo, theme color, and font settings updated.'
          );
        }}
        onResetSettings={() => {
          setAppearanceSettings(DEFAULT_APPEARANCE);
          showToast(
            language === 'my'
              ? 'Logo, Theme Color နှင့် Font Style ကို မူလအတိုင်း ပြန်ထားပြီးပါပြီ။'
              : 'Appearance settings reset to default.'
          );
        }}
        language={language}
      />
    </div>
  );
}
