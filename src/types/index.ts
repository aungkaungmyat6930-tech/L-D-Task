export type RoleTier = 'ADMIN' | 'MEMBER' | 'VIEWER';
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

export type TaskStatus = 'Active' | 'Waiting' | 'Completed' | 'Cancelled' | 'Overdue';

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
  comments: TaskComment[];
  createdAt: string;
}

export type LeaveType =
  | 'Casual Leave'
  | 'Earned Leave'
  | 'Medical Leave'
  | 'Training/Exam Leave'
  | 'Maternity/Paternity Leave'
  | 'Unpaid Leave'
  | 'Compassionate Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  memberId: string;
  memberName: string;
  type: LeaveType;
  start: string;
  end: string;
  duration: number; // in days
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  adminNote?: string;
  hrRefId?: string;
  hrSynced?: boolean;
  createdAt: string;
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
  attendeeNames: string[];
  attendeeIds: string[];
  location?: string;
  notes?: string;
  createdAt: string;
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
}

export type AttendanceOverrideStatus = 'Office' | 'WFH' | 'Training' | 'Holiday' | 'Absent';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceOverrideStatus;
  note?: string;
}

export type TabType = 'directory' | 'weekly' | 'tasks' | 'leave' | 'training' | 'projects';
