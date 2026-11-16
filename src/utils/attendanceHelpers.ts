import {
  UserProfile,
  LeaveRequest,
  LeaveType,
  TrainingLog,
  TaskItem,
  AttendanceRecord,
  AttendanceOverrideStatus,
} from '../types';
import {
  WeekNumber,
  WeekdayCode,
  getDaysInMonth,
  getDayOfWeekCode,
  getWeekOfMonth,
} from './weekHelpers';
import { getMemberHoursForTrainingLog } from './trainingHelpers';
import { Language } from './translations';

export function getShortLeaveTypeLabel(type: LeaveType, language: Language): string {
  switch (type) {
    case 'Casual Leave':
      return language === 'my' ? 'ရှောင်တခင်' : 'Casual';
    case 'Earned Leave':
      return language === 'my' ? 'လုပ်သက်' : 'Earned';
    case 'Medical Leave':
      return language === 'my' ? 'ဆေးခွင့်' : 'Medical';
    case 'Replacement Leave':
      return language === 'my' ? 'အစားထိုးခွင့်' : 'Replacement';
    case 'Training/Exam Leave':
      return language === 'my' ? 'သင်တန်း/စာမေးပွဲ' : 'Training';
    case 'Maternity/Paternity Leave':
      return language === 'my' ? 'မီးဖွားခွင့်' : 'Maternity';
    case 'Compassionate Leave':
      return language === 'my' ? 'သာ/နာခွင့်' : 'Compassionate';
    case 'Unpaid Leave':
      return language === 'my' ? 'လစာမဲ့' : 'Unpaid';
    default:
      return type;
  }
}

export type ComputedDayStatus = 'Office' | 'Leave' | 'Unmarked';

export interface DailyAttendanceRow {
  date: string;
  dayNum: number;
  weekday: WeekdayCode;
  week: WeekNumber;
  isWeekend: boolean;
  status: ComputedDayStatus;
  overrideStatus?: AttendanceOverrideStatus;
  leave?: LeaveRequest;
  trainingSessions: TrainingLog[];
  tasksDueCount: number;
  note?: string;
}

export interface MemberMonthlyAttendanceSummary {
  monthKey: string;
  workingDaysInMonth: number;
  officePresentDays: number;
  trainingDays: number;
  trainingHoursInMonth: number;
  approvedLeaveDaysInMonth: number;
  dailyRows: DailyAttendanceRow[];
}

export function computeMemberMonthlyAttendance(
  member: UserProfile,
  monthKey: string,
  leaves: LeaveRequest[],
  trainingLogs: TrainingLog[],
  tasks: TaskItem[],
  attendanceOverrides: AttendanceRecord[]
): MemberMonthlyAttendanceSummary {
  const daysInMonth = getDaysInMonth(monthKey);

  const memberLeaves = leaves.filter(
    (l) => l.memberId === member.id || l.memberName === member.name
  );
  const memberTraining = trainingLogs.filter(
    (tr) =>
      tr.attendeeIds?.includes(member.id) ||
      tr.attendeeNames?.includes(member.name) ||
      tr.coTrainerIds?.includes(member.id) ||
      tr.coTrainerNames?.includes(member.name) ||
      tr.trainerName === member.name
  );
  const memberTasks = tasks.filter(
    (t) => t.ownerId === member.id || t.ownerName === member.name
  );
  const memberOverrides = attendanceOverrides.filter((a) => a.memberId === member.id);

  const dailyRows: DailyAttendanceRow[] = [];
  let workingDaysInMonth = 0;
  let officePresentDays = 0;
  let trainingDays = 0;
  let approvedLeaveDaysInMonth = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${monthKey}-${String(d).padStart(2, '0')}`;
    const weekday = getDayOfWeekCode(date);
    const week = getWeekOfMonth(date);
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';

    const override = memberOverrides.find((o) => o.date === date);
    const coveringLeaves = memberLeaves.filter((l) => l.start <= date && date <= l.end);
    // Only Super Admin Approved leaves appear in Attendance as Leave
    const approvedLeave = coveringLeaves.find((l) => l.status === 'Approved');
    const dayTrainings = memberTraining.filter((tr) => tr.date === date);
    const tasksDueCount = memberTasks.filter((t) => t.due === date).length;

    let status: ComputedDayStatus;
    let normalizedOverride: AttendanceOverrideStatus | undefined;

    if (override) {
      const raw = override.status as string;
      if (raw === 'Leave') {
        status = 'Leave';
        normalizedOverride = 'Leave';
      } else {
        status = 'Office';
        normalizedOverride = 'Office';
      }
    } else if (approvedLeave) {
      status = 'Leave';
    } else {
      status = 'Unmarked';
    }

    if (!isWeekend || status === 'Office' || status === 'Leave') {
      workingDaysInMonth += 1;
    }

    if (dayTrainings.length > 0 && status === 'Office') {
      trainingDays += 1;
    }

    if (status === 'Office') {
      officePresentDays += 1;
    } else if (status === 'Leave') {
      approvedLeaveDaysInMonth += 1;
    }

    dailyRows.push({
      date,
      dayNum: d,
      weekday,
      week,
      isWeekend,
      status,
      overrideStatus: normalizedOverride,
      leave: approvedLeave,
      trainingSessions: dayTrainings,
      tasksDueCount,
      note: override?.note,
    });
  }

  // Reflect fractional approved leave durations (e.g. 0.5 / 1.5 days) within this month
  const approvedLeavesThisMonth = memberLeaves.filter(
    (l) => l.status === 'Approved' && (l.start.startsWith(monthKey) || l.end.startsWith(monthKey))
  );
  if (approvedLeavesThisMonth.length > 0) {
    const exactSingleMonthDuration = approvedLeavesThisMonth.every(
      (l) => l.start.startsWith(monthKey) && l.end.startsWith(monthKey)
    );
    if (exactSingleMonthDuration) {
      const durationSum = approvedLeavesThisMonth.reduce((sum, l) => sum + (l.duration || 0), 0);
      if (durationSum > 0 && durationSum !== approvedLeaveDaysInMonth) {
        approvedLeaveDaysInMonth = durationSum;
      }
    }
  }

  const trainingHoursInMonth = memberTraining
    .filter((tr) => tr.date.startsWith(monthKey))
    .reduce((sum, tr) => sum + getMemberHoursForTrainingLog(tr, member), 0);

  return {
    monthKey,
    workingDaysInMonth,
    officePresentDays,
    trainingDays,
    trainingHoursInMonth,
    approvedLeaveDaysInMonth,
    dailyRows,
  };
}
