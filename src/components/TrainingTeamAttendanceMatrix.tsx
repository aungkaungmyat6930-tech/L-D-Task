import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  TaskItem,
  LeaveRequest,
  TrainingLog,
  AttendanceRecord,
  AttendanceOverrideStatus,
} from '../types';
import { Language } from '../utils/translations';
import {
  WeekNumber,
  getWeekOfMonth,
  getWeeksInMonth,
  getWeekLabel,
  getWeekOrdinal,
  shiftMonth,
  formatMonthLabel,
} from '../utils/weekHelpers';
import { computeMemberMonthlyAttendance, ComputedDayStatus } from '../utils/attendanceHelpers';
import { isAdminOrSuper } from '../utils/roleHelpers';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';

interface TrainingTeamAttendanceMatrixProps {
  allUsers: UserProfile[];
  currentUser: UserProfile;
  tasks: TaskItem[];
  leaves: LeaveRequest[];
  trainingLogs: TrainingLog[];
  attendanceOverrides: AttendanceRecord[];
  onSetAttendanceOverride: (
    memberId: string,
    date: string,
    status: AttendanceOverrideStatus | null,
    note?: string
  ) => void;
  onOpenMemberSheet: (member: UserProfile) => void;
  language: Language;
  controlledMonth?: string;
  controlledWeek?: WeekNumber;
  showControls?: boolean;
}

export const TrainingTeamAttendanceMatrix: React.FC<TrainingTeamAttendanceMatrixProps> = ({
  allUsers,
  currentUser,
  tasks,
  leaves,
  trainingLogs,
  attendanceOverrides,
  onSetAttendanceOverride,
  onOpenMemberSheet,
  language,
  controlledMonth,
  controlledWeek,
  showControls = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [internalMonth, setInternalMonth] = useState<string>(() => todayStr.slice(0, 7));
  const [internalWeek, setInternalWeek] = useState<WeekNumber>(() => getWeekOfMonth(todayStr));

  const selectedMonth = controlledMonth ?? internalMonth;
  const weeksInMonth = getWeeksInMonth(selectedMonth);
  const rawWeek = controlledWeek ?? internalWeek;
  const safeWeek: WeekNumber = weeksInMonth.includes(rawWeek) ? rawWeek : 1;

  const isAdmin = isAdminOrSuper(currentUser.roleTier);
  const isViewer = currentUser.roleTier === 'VIEWER';

  const teamMembers = useMemo(
    () => allUsers.filter((u) => u.roleTier !== 'VIEWER' && u.status !== 'Resigned'),
    [allUsers]
  );

  const memberSummaries = useMemo(() => {
    return teamMembers.map((member) => ({
      member,
      summary: computeMemberMonthlyAttendance(
        member,
        selectedMonth,
        leaves,
        trainingLogs,
        tasks,
        attendanceOverrides
      ),
    }));
  }, [teamMembers, selectedMonth, leaves, trainingLogs, tasks, attendanceOverrides]);

  const weekDays = useMemo(() => {
    const first = memberSummaries[0]?.summary.dailyRows.filter((r) => r.week === safeWeek) || [];
    return first.map((r) => ({
      date: r.date,
      dayNum: r.dayNum,
      weekday: r.weekday,
      isWeekend: r.isWeekend,
    }));
  }, [memberSummaries, safeWeek]);

  const getCellStyle = (status: ComputedDayStatus) => {
    switch (status) {
      case 'Office':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'LeaveApproved':
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
      case 'LeavePending':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Weekend':
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusShortLabel = (status: ComputedDayStatus) => {
    switch (status) {
      case 'Office':
        return language === 'my' ? 'ရုံးတက်' : 'Office';
      case 'LeaveApproved':
        return language === 'my' ? 'ခွင့် (OK)' : 'Leave';
      case 'LeavePending':
        return language === 'my' ? 'ခွင့် (Pending)' : 'Pending';
      case 'Weekend':
        return language === 'my' ? 'ပိတ်ရက်' : 'Wknd';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>
              {language === 'my'
                ? `Training Team အပတ်စဉ် တက်ရောက်မှု ဇယား — ${formatMonthLabel(selectedMonth, language)} · ${getWeekLabel(selectedMonth, safeWeek, language)}`
                : `Training Team Attendance — ${formatMonthLabel(selectedMonth, language)} · ${getWeekLabel(selectedMonth, safeWeek, language)}`}
            </span>
          </h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {language === 'my'
              ? 'နေ့ရက်အလိုက် ရုံးတက် (Office) နှင့် ခွင့်ရက် (Leave) များကို ပြသထားပြီး Admin/ကိုယ်တိုင်က တိုက်ရိုက်ပြင်ဆင်နိုင်ပါသည်'
              : 'Daily attendance tracking Office and Leave status (click cell to adjust)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            {language === 'my' ? 'ရုံးတက် (Office)' : 'Office'}
          </span>
          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">
            {language === 'my' ? 'ခွင့် (Approved)' : 'Approved Leave'}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
            {language === 'my' ? 'ခွင့် (Pending)' : 'Pending Leave'}
          </span>
        </div>
      </div>

      {showControls && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setInternalMonth((prev) => shiftMonth(prev, -1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) setInternalMonth(e.target.value);
              }}
              className="text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setInternalMonth((prev) => shiftMonth(prev, 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {weeksInMonth.map((wk) => (
              <button
                key={wk}
                type="button"
                onClick={() => setInternalWeek(wk)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  safeWeek === wk
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {getWeekOrdinal(wk)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
            <tr>
              <th className="p-3 font-extrabold min-w-[180px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                {language === 'my' ? 'Training Team အဖွဲ့ဝင်' : 'Team Member'}
              </th>
              {weekDays.map((wd) => (
                <th key={wd.date} className="p-2.5 text-center min-w-[112px]">
                  <div className="font-extrabold text-slate-900">{wd.weekday}</div>
                  <div className="text-[10px] text-slate-500 tabular-nums font-semibold">
                    {wd.date.slice(5)}
                  </div>
                </th>
              ))}
              <th className="p-3 text-center font-extrabold min-w-[100px] border-l border-slate-200 bg-slate-50">
                {language === 'my' ? 'အပတ်ချုပ်' : 'Week Total'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberSummaries.map(({ member, summary }) => {
              const weekRows = summary.dailyRows.filter((r) => r.week === safeWeek);
              const wkOffice = weekRows.filter((r) => r.status === 'Office').length;
              const wkLeave = weekRows.filter(
                (r) => r.status === 'LeaveApproved' || r.status === 'LeavePending'
              ).length;
              const isMe = member.id === currentUser.id || member.name === currentUser.name;
              const canEditRow = (isMe || isAdmin) && !isViewer;

              return (
                <tr key={member.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200">
                    <button
                      type="button"
                      onClick={() => onOpenMemberSheet(member)}
                      className="flex items-center gap-2.5 text-left group"
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900 group-hover:text-blue-600 group-hover:underline truncate">
                          {member.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 truncate">
                          {member.roleLabel}
                        </span>
                      </div>
                    </button>
                  </td>

                  {weekRows.map((row) => {
                    const cellCls = getCellStyle(row.status);
                    const titleTip = [
                      row.date,
                      getStatusShortLabel(row.status),
                      row.leave ? `${row.leave.type} (${row.leave.status})` : '',
                      row.trainingSessions.length > 0
                        ? `Training: ${row.trainingSessions.map((tr) => tr.name).join(', ')}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <td key={row.date} className="p-1.5 text-center align-middle" title={titleTip}>
                        {canEditRow ? (
                          <select
                            value={row.overrideStatus || 'AUTO'}
                            onChange={(e) => {
                              const val = e.target.value;
                              onSetAttendanceOverride(
                                member.id,
                                row.date,
                                val === 'AUTO' ? null : (val as AttendanceOverrideStatus)
                              );
                            }}
                            className={`w-full text-[11px] font-semibold px-1.5 py-1.5 rounded-lg border text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${cellCls}`}
                          >
                            <option value="AUTO">{getStatusShortLabel(row.status)}</option>
                            <option value="Office">
                              {language === 'my' ? 'ရုံးတက် (Office)' : 'Office'}
                            </option>
                            <option value="Leave">
                              {language === 'my' ? 'ခွင့် (Leave)' : 'Leave'}
                            </option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block w-full text-[11px] px-1.5 py-1.5 rounded-lg border ${cellCls}`}
                          >
                            {getStatusShortLabel(row.status)}
                          </span>
                        )}

                        {row.trainingSessions.length > 0 && (
                          <div className="text-[9px] text-purple-700 font-semibold truncate max-w-[100px] mx-auto mt-0.5">
                            {row.trainingSessions[0].name}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="p-2.5 text-center border-l border-slate-200 tabular-nums">
                    <div className="text-[11px] font-extrabold text-emerald-700">
                      {wkOffice}d {language === 'my' ? 'တက်' : 'in'}
                    </div>
                    <div className="text-[10px] font-bold text-teal-700">
                      {wkLeave}d {language === 'my' ? 'ခွင့်' : 'leave'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
