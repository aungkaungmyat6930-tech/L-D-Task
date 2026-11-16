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
import { computeMemberMonthlyAttendance, ComputedDayStatus, getShortLeaveTypeLabel } from '../utils/attendanceHelpers';
import { isAdminOrSuper } from '../utils/roleHelpers';
import { Building2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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

  const [quickMemberId, setQuickMemberId] = useState<string>(currentUser.id);
  const [quickDate, setQuickDate] = useState<string>(todayStr);
  const [quickSavedMsg, setQuickSavedMsg] = useState<string | null>(null);

  const handleQuickMarkOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !quickDate) return;
    const targetId = quickMemberId || currentUser.id;
    onSetAttendanceOverride(targetId, quickDate, 'Office');
    const targetName = teamMembers.find((m) => m.id === targetId)?.name || currentUser.name;
    setQuickSavedMsg(
      language === 'my'
        ? `${targetName} (${quickDate}) ရုံးတက် မှတ်တမ်းတင်ပြီး`
        : `Marked Office for ${targetName} (${quickDate})`
    );
    setTimeout(() => setQuickSavedMsg(null), 2500);
  };

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
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      case 'Leave':
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
      case 'Unmarked':
        return 'bg-white text-slate-400 border-slate-200';
    }
  };

  const getStatusShortLabel = (status: ComputedDayStatus) => {
    switch (status) {
      case 'Office':
        return language === 'my' ? 'ရုံးတက် (Office)' : 'Office';
      case 'Leave':
        return language === 'my' ? 'ခွင့် (Leave)' : 'Leave';
      case 'Unmarked':
        return '-';
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
              ? 'Team Member များ နေ့စဉ်ရုံးတက်ပါက Office ကိုသာ ရွေးချယ်ရမည်ဖြစ်ပြီး Super Admin မှ ခွင့် Approve ပြုပါက Leave အဖြစ် အလိုအလျောက် ပေါ်လာပါမည်'
              : 'Team members select Office daily; Leave automatically appears once Super Admin approves the leave request'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            {language === 'my' ? 'ရုံးတက် (Office)' : 'Office'}
          </span>
          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">
            {language === 'my' ? 'ခွင့် (Leave — Super Admin Approved)' : 'Leave'}
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

      {/* Quick Mark Office Bar for Everyone (non-Viewer) */}
      {!isViewer && (
        <form
          onSubmit={handleQuickMarkOffice}
          className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2.5 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'my' ? 'ရုံးတက် (Office) ထည့်ရန်:' : 'Quick Add Office:'}</span>
            </span>
            <select
              value={quickMemberId}
              onChange={(e) => setQuickMemberId(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === currentUser.id ? (language === 'my' ? '(သင်)' : '(You)') : ''}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 tabular-nums"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'my' ? 'Office ထည့်မည်' : 'Mark Office'}</span>
            </button>
          </div>
          {quickSavedMsg && (
            <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
              ✓ {quickSavedMsg}
            </span>
          )}
        </form>
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
              const wkLeave = weekRows.filter((r) => r.status === 'Leave').length;
              const canMarkOffice = !isViewer;

              const approvedLeavesInWeek = Array.from(
                new Map(
                  weekRows
                    .filter((r) => r.status === 'Leave' && r.leave)
                    .map((r) => [r.leave!.id, r.leave!])
                ).values()
              );

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
                    {approvedLeavesInWeek.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {approvedLeavesInWeek.map((lv) => (
                          <span
                            key={lv.id}
                            className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 tabular-nums"
                          >
                            {getShortLeaveTypeLabel(lv.type, language)} · {lv.duration}d ({lv.start.slice(5)}~{lv.end.slice(5)})
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {weekRows.map((row) => {
                    const cellCls = getCellStyle(row.status);
                    const isApprovedLeaveLockedForMember =
                      row.status === 'Leave' && Boolean(row.leave) && !isAdmin;
                    const titleTip = [
                      row.date,
                      row.status === 'Unmarked'
                        ? language === 'my'
                          ? 'Office ရွေးရန်'
                          : 'Select Office'
                        : getStatusShortLabel(row.status),
                      row.leave
                        ? `${row.leave.type} (${row.leave.duration}d: ${row.leave.start} ~ ${row.leave.end})`
                        : '',
                      row.trainingSessions.length > 0
                        ? `Training: ${row.trainingSessions.map((tr) => tr.name).join(', ')}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    const selectValue =
                      row.overrideStatus || (row.status === 'Leave' ? 'Leave' : 'AUTO');

                    return (
                      <td key={row.date} className="p-1.5 text-center align-top" title={titleTip}>
                        {isApprovedLeaveLockedForMember ? (
                          <span
                            className={`inline-block w-full text-[11px] px-1.5 py-1.5 rounded-lg border ${cellCls}`}
                          >
                            {getStatusShortLabel('Leave')}
                          </span>
                        ) : canMarkOffice ? (
                          <select
                            value={selectValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!isAdmin && val !== 'Office') return;
                              onSetAttendanceOverride(
                                member.id,
                                row.date,
                                val === 'AUTO' ? null : (val as AttendanceOverrideStatus)
                              );
                            }}
                            className={`w-full text-[11px] font-semibold px-1.5 py-1.5 rounded-lg border text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${cellCls}`}
                          >
                            {isAdmin ? (
                              <option value="AUTO">
                                {row.leave ? getStatusShortLabel('Leave') : '-'}
                              </option>
                            ) : (
                              <option value="AUTO" disabled>
                                -
                              </option>
                            )}
                            <option value="Office">Office</option>
                            {isAdmin && <option value="Leave">Leave</option>}
                          </select>
                        ) : (
                          <span
                            className={`inline-block w-full text-[11px] px-1.5 py-1.5 rounded-lg border ${cellCls}`}
                          >
                            {getStatusShortLabel(row.status)}
                          </span>
                        )}

                        {row.leave && row.status === 'Leave' && (
                          <div className="mt-1 px-1 py-0.5 rounded text-[9px] font-bold leading-tight tabular-nums bg-teal-50 text-teal-900 border border-teal-200">
                            <div className="truncate">
                              {getShortLeaveTypeLabel(row.leave.type, language)} · {row.leave.duration}d
                            </div>
                            <div className="text-[8px] opacity-85">
                              {row.leave.start.slice(5)}~{row.leave.end.slice(5)}
                            </div>
                          </div>
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
