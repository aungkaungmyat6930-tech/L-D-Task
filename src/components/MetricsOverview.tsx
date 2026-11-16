import React from 'react';
import { Language, TRANSLATIONS } from '../utils/translations';
import {
  Icon3DTasks,
  Icon3DOverdue,
  Icon3DDueSoon,
  Icon3DLeaveCalendar,
  Icon3DTrainingClock,
} from './Icons3D';

interface MetricsOverviewProps {
  activeTasksCount: number;
  overdueTasksCount: number;
  dueSoonTasksCount: number;
  pendingLeavesCount: number;
  totalTrainingHours: number;
  onSelectMetric: (
    tab: 'tasks' | 'leave' | 'training',
    filter?: 'active' | 'overdue' | 'due-soon' | 'pending'
  ) => void;
  language: Language;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  activeTasksCount,
  overdueTasksCount,
  dueSoonTasksCount,
  pendingLeavesCount,
  totalTrainingHours,
  onSelectMetric,
  language,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Active Tasks */}
      <div
        onClick={() => onSelectMetric('tasks', 'active')}
        className="kpi-3d-card bg-gradient-to-br from-white via-white to-blue-50/70 p-4 rounded-2xl border border-slate-200/90 cursor-pointer flex items-center justify-between gap-3 group"
      >
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500 font-bold tracking-wide">
            {t.metricActiveTasks}
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
            {activeTasksCount}
          </h3>
          <span className="text-[10px] text-blue-600 font-semibold group-hover:underline">
            {t.metricActiveTasksSub} →
          </span>
        </div>
        <div className="icon-3d-float shrink-0">
          <Icon3DTasks className="w-12 h-12" />
        </div>
      </div>

      {/* Overdue Tasks */}
      <div
        onClick={() => onSelectMetric('tasks', 'overdue')}
        className={`kpi-3d-card p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 group ${
          overdueTasksCount > 0
            ? 'bg-gradient-to-br from-white via-red-50/40 to-red-100/50 border-red-200'
            : 'bg-gradient-to-br from-white to-slate-50/60 border-slate-200/90'
        }`}
      >
        <div className="min-w-0">
          <p className="text-[11px] text-red-700 font-bold tracking-wide">
            {t.metricOverdue}
          </p>
          <h3 className="text-2xl font-black text-red-600 mt-0.5 tabular-nums">
            {overdueTasksCount}
          </h3>
          <span className="text-[10px] text-red-600 font-semibold group-hover:underline">
            {t.metricOverdueSub} →
          </span>
        </div>
        <div className="icon-3d-float shrink-0">
          <Icon3DOverdue className="w-12 h-12" />
        </div>
      </div>

      {/* Due Soon Tasks */}
      <div
        onClick={() => onSelectMetric('tasks', 'due-soon')}
        className={`kpi-3d-card p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 group ${
          dueSoonTasksCount > 0
            ? 'bg-gradient-to-br from-white via-amber-50/50 to-amber-100/50 border-amber-300/90'
            : 'bg-gradient-to-br from-white to-slate-50/60 border-slate-200/90'
        }`}
      >
        <div className="min-w-0">
          <p className="text-[11px] text-amber-800 font-bold tracking-wide">
            {language === 'my' ? 'Due Soon (Deadline နီး)' : 'Due Soon Tasks'}
          </p>
          <h3 className="text-2xl font-black text-amber-700 mt-0.5 tabular-nums">
            {dueSoonTasksCount}
          </h3>
          <span className="text-[10px] text-amber-700 font-semibold group-hover:underline">
            {language === 'my' ? 'Deadline နီး Task ကြည့်ရန် →' : 'Filter near-deadline tasks →'}
          </span>
        </div>
        <div className="icon-3d-float shrink-0">
          <Icon3DDueSoon className="w-12 h-12" />
        </div>
      </div>

      {/* Pending Leaves */}
      <div
        onClick={() => onSelectMetric('leave', 'pending')}
        className={`kpi-3d-card p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 group ${
          pendingLeavesCount > 0
            ? 'bg-gradient-to-br from-white via-purple-50/40 to-purple-100/50 border-purple-200'
            : 'bg-gradient-to-br from-white to-slate-50/60 border-slate-200/90'
        }`}
      >
        <div className="min-w-0">
          <p className="text-[11px] text-purple-700 font-bold tracking-wide">
            {t.metricPendingLeaves}
          </p>
          <h3 className="text-2xl font-black text-purple-700 mt-0.5 tabular-nums">
            {pendingLeavesCount}
          </h3>
          <span className="text-[10px] text-purple-600 font-semibold group-hover:underline">
            {t.metricPendingLeavesSub} →
          </span>
        </div>
        <div className="icon-3d-float shrink-0">
          <Icon3DLeaveCalendar className="w-12 h-12" />
        </div>
      </div>

      {/* Total Training Hours */}
      <div
        onClick={() => onSelectMetric('training')}
        className="kpi-3d-card bg-gradient-to-br from-white via-white to-emerald-50/60 p-4 rounded-2xl border border-emerald-200/90 cursor-pointer flex items-center justify-between gap-3 group"
      >
        <div className="min-w-0">
          <p className="text-[11px] text-emerald-800 font-bold tracking-wide">
            {t.metricTotalHours}
          </p>
          <h3 className="text-2xl font-black text-emerald-700 mt-0.5 tabular-nums">
            {totalTrainingHours.toFixed(1)} <span className="text-sm font-semibold">hrs</span>
          </h3>
          <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline">
            {t.metricTotalHoursSub} →
          </span>
        </div>
        <div className="icon-3d-float shrink-0">
          <Icon3DTrainingClock className="w-12 h-12" />
        </div>
      </div>
    </div>
  );
};
