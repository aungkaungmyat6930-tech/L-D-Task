import * as XLSX from 'xlsx';
import {
  UserProfile,
  TaskItem,
  LeaveRequest,
  TrainingLog,
  AttendanceRecord,
} from '../types';
import {
  computeMemberMonthlyAttendance,
  ComputedDayStatus,
} from './attendanceHelpers';
import { getWeekOrdinal, getWeekOfMonth, formatMonthLabel } from './weekHelpers';
import { getMemberHoursForTrainingLog, getTrainerEntriesForLog, formatBreakDuration } from './trainingHelpers';
import { Language } from './translations';

function formatStatusLabel(status: ComputedDayStatus, language: Language): string {
  switch (status) {
    case 'Office':
      return language === 'my' ? 'ရုံးတက် (Office)' : 'Office';
    case 'Leave':
      return language === 'my' ? 'ခွင့် (Leave)' : 'Leave';
    case 'Unmarked':
      return '-';
  }
}

export function exportMemberMonthlyExcel(params: {
  member: UserProfile;
  monthKey: string;
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  trainingLogs: TrainingLog[];
  attendanceOverrides: AttendanceRecord[];
  language: Language;
}): string {
  const { member, monthKey, tasks, leaves, trainingLogs, attendanceOverrides, language } = params;

  const summary = computeMemberMonthlyAttendance(
    member,
    monthKey,
    leaves,
    trainingLogs,
    tasks,
    attendanceOverrides
  );

  const memberTasks = tasks.filter(
    (t) => t.ownerId === member.id || t.ownerName === member.name
  );
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

  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryRows = [
    ['KBZ Life L&D Portal — Member Attendance, Leave & Work Report'],
    ['Generated At', new Date().toISOString().split('T')[0]],
    ['Report Month', formatMonthLabel(monthKey, 'en')],
    [],
    ['Member Name', member.name],
    ['Role / Designation', member.roleLabel],
    ['Department', member.dept],
    ['Status', member.status || 'Active'],
    ['Email', member.email || '-'],
    ['Phone', member.phone || '-'],
    [],
    ['Monthly Attendance & Leave Summary', 'Value'],
    ['Working Days in Month', summary.workingDaysInMonth],
    ['Office Attendance Days (ရုံးတက်ရက်)', summary.officePresentDays],
    ['Leave Days (ခွင့်ရက်)', summary.approvedLeaveDaysInMonth],
    ['Training Hours (Month)', Number(summary.trainingHoursInMonth.toFixed(1))],
    ['Total Tasks (All)', memberTasks.length],
    ['Completed Tasks', memberTasks.filter((t) => t.status === 'Completed').length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 42 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Daily Attendance & Leave
  const dailyData = summary.dailyRows.map((row) => ({
    Date: row.date,
    Weekday: row.weekday,
    Week: getWeekOrdinal(row.week),
    'Attendance Status': formatStatusLabel(row.status, language),
    'Leave Type': row.leave ? row.leave.type : '-',
    'Leave Duration (Days)': row.leave ? row.leave.duration : '-',
    'Leave Dates': row.leave ? `${row.leave.start} ~ ${row.leave.end}` : '-',
    'Leave Status': row.leave ? row.leave.status : '-',
    'HR Ref ID': row.leave?.hrRefId || '-',
    'Training Topic': row.trainingSessions.map((tr) => tr.name).join('; ') || '-',
    'Tasks Due': row.tasksDueCount,
    Note: row.note || row.leave?.reason || '',
  }));
  const wsDaily = XLSX.utils.json_to_sheet(dailyData);
  wsDaily['!cols'] = [
    { wch: 13 },
    { wch: 10 },
    { wch: 11 },
    { wch: 24 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
    { wch: 11 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Attendance & Leave');

  // Sheet 3: Leave Requests
  const leaveData = memberLeaves.map((l) => ({
    Month: l.start.slice(0, 7),
    Week: getWeekOrdinal(getWeekOfMonth(l.start)),
    'Leave Type': l.type,
    'Start Date': l.start,
    'End Date': l.end,
    'Duration (Days)': l.duration,
    Status: l.status,
    'HR Matched': l.hrSynced ? 'Yes' : 'No',
    'HR Ref ID': l.hrRefId || '-',
    'Approved By': l.approvedBy || '-',
    Reason: l.reason,
    'Admin / HR Note': l.adminNote || '-',
  }));
  const wsLeaves = XLSX.utils.json_to_sheet(
    leaveData.length > 0
      ? leaveData
      : [{ Info: 'No leave records for this member' }]
  );
  wsLeaves['!cols'] = [
    { wch: 10 },
    { wch: 11 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 30 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLeaves, 'Leave Records');

  // Sheet 4: Tasks
  const taskData = memberTasks.map((t) => ({
    Month: t.due.slice(0, 7),
    Week: getWeekOrdinal(getWeekOfMonth(t.due)),
    'Task Title': t.title,
    'Due Date': t.due,
    Weekday: t.day,
    'Follow-up Date': t.followup,
    Status: t.status,
    Note: t.note || '-',
  }));
  const wsTasks = XLSX.utils.json_to_sheet(
    taskData.length > 0
      ? taskData
      : [{ Info: 'No task records for this member' }]
  );
  wsTasks['!cols'] = [
    { wch: 10 },
    { wch: 11 },
    { wch: 36 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 13 },
    { wch: 34 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');

  // Sheet 5: Training Topics
  const trainingData = memberTraining.map((tr) => {
    const entries = getTrainerEntriesForLog(tr);
    const subTopicSummary =
      entries
        .map((e) =>
          e.topic
            ? `${e.name} (${e.topic}: ${formatBreakDuration(e.hours)})`
            : `${e.name} (${formatBreakDuration(e.hours)})`
        )
        .join('; ') || '-';

    return {
      Month: tr.date.slice(0, 7),
      Week: getWeekOrdinal(getWeekOfMonth(tr.date)),
      'Main Topic': tr.name,
      'Trainer · Sub-Topic · Time': subTopicSummary,
      Trainer: tr.trainerName || '-',
      'Co-Trainer':
        (tr.coTrainerNames && tr.coTrainerNames.length > 0
          ? tr.coTrainerNames
          : tr.attendeeNames || []
        ).join(', ') || '-',
      Date: tr.date,
      Start: tr.start,
      End: tr.end,
      Break: formatBreakDuration(tr.breakHrs),
      'My Hours': getMemberHoursForTrainingLog(tr, member),
      Location: tr.location || '-',
      'Edited By': tr.editedBy ? `${tr.editedBy} (${tr.editedAt || ''})` : '-',
    };
  });
  const wsTraining = XLSX.utils.json_to_sheet(
    trainingData.length > 0
      ? trainingData
      : [{ Info: 'No training records for this member' }]
  );
  wsTraining['!cols'] = [
    { wch: 10 },
    { wch: 11 },
    { wch: 30 },
    { wch: 40 },
    { wch: 20 },
    { wch: 24 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 11 },
    { wch: 9 },
    { wch: 26 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTraining, 'Training Topics');

  const safeName = member.name.replace(/[^a-zA-Z0-9\u1000-\u109F_-]+/g, '_');
  const filename = `KBZ_LD_${safeName}_${monthKey}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

export function exportAllMembersMonthlyExcel(params: {
  users: UserProfile[];
  monthKey: string;
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  trainingLogs: TrainingLog[];
  attendanceOverrides: AttendanceRecord[];
}): string {
  const { users, monthKey, tasks, leaves, trainingLogs, attendanceOverrides } = params;
  const wb = XLSX.utils.book_new();

  const teamRows = users
    .filter((u) => u.roleTier !== 'VIEWER')
    .map((u) => {
      const summary = computeMemberMonthlyAttendance(
        u,
        monthKey,
        leaves,
        trainingLogs,
        tasks,
        attendanceOverrides
      );
      const uTasks = tasks.filter((t) => t.ownerId === u.id || t.ownerName === u.name);
      return {
        'Member Name': u.name,
        Role: u.roleLabel,
        Department: u.dept,
        Status: u.status || 'Active',
        Month: monthKey,
        'Working Days': summary.workingDaysInMonth,
        'Office Attendance Days (ရုံးတက်ရက်)': summary.officePresentDays,
        'Leave Days (ခွင့်ရက်)': summary.approvedLeaveDaysInMonth,
        'Training Hours (Month)': Number(summary.trainingHoursInMonth.toFixed(1)),
        'Total Tasks': uTasks.length,
        'Completed Tasks': uTasks.filter((t) => t.status === 'Completed').length,
      };
    });

  const wsTeam = XLSX.utils.json_to_sheet(teamRows);
  wsTeam['!cols'] = [
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 11 },
    { wch: 10 },
    { wch: 13 },
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTeam, 'Team Attendance & Leave');

  const leaveRows = leaves.map((l) => ({
    'Member Name': l.memberName,
    'Leave Type': l.type,
    'Start Date': l.start,
    'End Date': l.end,
    'Duration (Days)': l.duration,
    Status: l.status,
    'HR Matched': l.hrSynced ? 'Yes' : 'No',
    'HR Ref ID': l.hrRefId || '-',
    'Approved By': l.approvedBy || '-',
    Reason: l.reason,
    'Admin / HR Note': l.adminNote || '-',
  }));
  const wsLeaves = XLSX.utils.json_to_sheet(
    leaveRows.length > 0 ? leaveRows : [{ Info: 'No leave records' }]
  );
  wsLeaves['!cols'] = [
    { wch: 20 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 30 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLeaves, 'All Leave Records');

  const filename = `KBZ_LD_Team_Attendance_Leave_${monthKey}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
