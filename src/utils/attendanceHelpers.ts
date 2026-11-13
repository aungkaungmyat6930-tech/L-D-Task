import {
  UserProfile,
  LeaveRequest,
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

export type ComputedDayStatus =
  | 'Office'
  | 'WFH'
  | 'Training'
  | 'LeaveApproved'
  | 'LeavePending'
  | 'Weekend'
  | 'Holiday'
  | 'Absent';

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
  wfhDays: number;
  trainingDays: number;
  trainingHoursInMonth: number;
  approvedLeaveDaysInMonth: number;
  pendingLeaveDaysInMonth: number;
  holidayDays: number;
  absentDays: number;
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
  let wfhDays = 0;
  let trainingDays = 0;
  let approvedLeaveDaysInMonth = 0;
  let pendingLeaveDaysInMonth = 0;
  let holidayDays = 0;
  let absentDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${monthKey}-${String(d).padStart(2, '0')}`;
    const weekday = getDayOfWeekCode(date);
    const week = getWeekOfMonth(date);
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';

    const override = memberOverrides.find((o) => o.date === date);
    const coveringLeaves = memberLeaves.filter((l) => l.start <= date && date <= l.end);
    const approvedLeave = coveringLeaves.find((l) => l.status === 'Approved');
    const pendingLeave = coveringLeaves.find((l) => l.status === 'Pending');
    const dayTrainings = memberTraining.filter((tr) => tr.date === date);
    const tasksDueCount = memberTasks.filter((t) => t.due === date).length;

    let status: ComputedDayStatus;
    if (override) {
      status = override.status;
    } else if (approvedLeave) {
      status = 'LeaveApproved';
    } else if (isWeekend) {
      status = dayTrainings.length > 0 ? 'Training' : 'Weekend';
    } else if (pendingLeave) {
      status = 'LeavePending';
    } else if (dayTrainings.length > 0) {
      status = 'Training';
    } else {
      status = 'Office';
    }

    if (!isWeekend && status !== 'Holiday') {
      workingDaysInMonth += 1;
    } else if (isWeekend && (status === 'Office' || status === 'WFH' || status === 'Training')) {
      workingDaysInMonth += 1;
    }

    switch (status) {
      case 'Office':
        officePresentDays += 1;
        break;
      case 'WFH':
        wfhDays += 1;
        officePresentDays += 1;
        break;
      case 'Training':
        trainingDays += 1;
        officePresentDays += 1;
        break;
      case 'LeaveApproved':
        approvedLeaveDaysInMonth += 1;
        break;
      case 'LeavePending':
        pendingLeaveDaysInMonth += 1;
        break;
      case 'Holiday':
        holidayDays += 1;
        break;
      case 'Absent':
        absentDays += 1;
        break;
      default:
        break;
    }

    dailyRows.push({
      date,
      dayNum: d,
      weekday,
      week,
      isWeekend,
      status,
      overrideStatus: override?.status,
      leave: approvedLeave || pendingLeave,
      trainingSessions: dayTrainings,
      tasksDueCount,
      note: override?.note,
    });
  }

  // If member has approved leave requests inside this month with fractional durations (e.g. 0.5 / 1.5),
  // reflect fractional duration when all days of that leave are within this month
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
        const diff = approvedLeaveDaysInMonth - durationSum;
        approvedLeaveDaysInMonth = durationSum;
        officePresentDays = Math.max(0, officePresentDays + diff);
      }
    }
  }

  const trainingHoursInMonth = memberTraining
    .filter((tr) => tr.date.startsWith(monthKey))
    .reduce((sum, tr) => sum + (tr.calculatedHours || 0), 0);

  return {
    monthKey,
    workingDaysInMonth,
    officePresentDays,
    wfhDays,
    trainingDays,
    trainingHoursInMonth,
    approvedLeaveDaysInMonth,
    pendingLeaveDaysInMonth,
    holidayDays,
    absentDays,
    dailyRows,
  };
}
