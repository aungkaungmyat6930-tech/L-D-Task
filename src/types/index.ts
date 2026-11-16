export type RoleTier = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type MemberStatus = 'Active' | 'Resigned' | 'Transferred' | 'On Leave';

export interface UserProfile {
  id: string;
  name: string;
  roleLabel: string;
  dept: string;
  roleTier: RoleTier;
  avatar: string;
  email?: string;
  phone?: string;
  status?: MemberStatus;
  joinDate?: string;
  resignedDate?: string;
  notes?: string;
}

export type TaskStatus = 'Active' | 'Pending' | 'Waiting' | 'Completed' | 'Cancelled' | 'Overdue';

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
}

export interface TaskItem {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  coAssigneeIds?: string[];
  coAssigneeNames?: string[];
  projectId?: string;
  due: string;
  followup: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  status: TaskStatus;
  note?: string;
  completionRequested?: boolean;
  completionRequestedBy?: string;
  completionRequestedAt?: string;
  completionApprovedBy?: string;
  completionApprovedAt?: string;
  comments: TaskComment[];
  createdAt: string;
}

export type LeaveType =
  | 'Casual Leave'
  | 'Earned Leave'
  | 'Medical Leave'
  | 'Replacement Leave'
  | 'Training/Exam Leave'
  | 'Maternity/Paternity Leave'
  | 'Unpaid Leave'
  | 'Compassionate Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveAttachment {
  id: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf';
  dataUrl: string;
  sizeBytes?: number;
}

export interface LeaveRequest {
  id: string;
  memberId: string;
  memberName: string;
  type: LeaveType;
  start: string;
  end: string;
  duration: number; // in days
  reason: string;
  attachments?: LeaveAttachment[];
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  adminNote?: string;
  hrRefId?: string;
  hrSynced?: boolean;
  createdAt: string;
}

export interface TrainerHourEntry {
  userId?: string;
  name: string;
  role: 'Lead Trainer' | 'Co-Trainer';
  topic?: string;
  startTime?: string;
  endTime?: string;
  hours: number;
}

export interface TrainingLog {
  id: string;
  name: string;
  date: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  breakHrs: number;
  calculatedHours: number;
  trainerName?: string;
  coTrainerNames?: string[];
  coTrainerIds?: string[];
  trainerHours?: TrainerHourEntry[];
  attendeeNames: string[];
  attendeeIds: string[];
  location?: string;
  notes?: string;
  createdAt: string;
  editedBy?: string;
  editedAt?: string;
}

export interface StrategicProject {
  id: string;
  title: string;
  ownerName: string;
  ownerId: string;
  coAssigneeIds?: string[];
  coAssigneeNames?: string[];
  progress: number;
  deadline: string;
  followupDate?: string;
  followupNote?: string;
  deliverables: string;
  status: 'In Progress' | 'On Track' | 'Final Review' | 'Completed';
  completionRequested?: boolean;
  completionRequestedBy?: string;
  completionRequestedAt?: string;
  completionApprovedBy?: string;
  completionApprovedAt?: string;
  completionStatus?: 'Pending' | 'Approved' | 'Rejected';
  comments?: TaskComment[];
}

export type AttendanceOverrideStatus = 'Office' | 'Leave';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceOverrideStatus;
  note?: string;
}

export type FontScaleOption = 'sm' | 'md' | 'lg' | 'xl';

export interface AppearanceSettings {
  fontScale: FontScaleOption;
  customFontSizePx?: number;
  textColor: string;
  themeColor?: string;
  accentColor?: string;
  logoType?: 'badge' | 'image';
  logoText?: string;
  logoImageDataUrl?: string;
  logoSize?: 'md' | 'lg' | 'xl';
  navbarImageDataUrl?: string;
}

export type TabType = 'directory' | 'weekly' | 'tasks' | 'leave' | 'training' | 'projects';
