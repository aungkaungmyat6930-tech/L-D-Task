import React from 'react';
import { Language, TRANSLATIONS } from '../utils/translations';
import { CheckSquare, AlertTriangle, CalendarDays, Clock } from 'lucide-react';

interface MetricsOverviewProps {
  activeTasksCount: number;
  overdueTasksCount: number;
  pendingLeavesCount: number;
  totalTrainingHours: number;
  onSelectMetric: (
    tab: 'tasks' | 'leave' | 'training',
    filter?: 'active' | 'overdue' | 'pending'
  ) => void;
  language: Language;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  activeTasksCount,
  overdueTasksCount,
  pendingLeavesCount,
  totalTrainingHours,
  onSelectMetric,
  language,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Tasks */}
      <div
        onClick={() => onSelectMetric('tasks', 'active')}
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
      >
        <div>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            {t.metricActiveTasks}
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
            {activeTasksCount}
          </h3>
          <span className="text-[10px] text-blue-600 font-semibold group-hover:underline">
            {t.metricActiveTasksSub} →
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
          <CheckSquare className="w-5 h-5" />
        </div>
      </div>

      {/* Overdue Tasks */}
      <div
        onClick={() => onSelectMetric('tasks', 'overdue')}
        className={`p-4 rounded-xl border shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group ${
          overdueTasksCount > 0
            ? 'bg-red-50/40 border-red-200 ring-1 ring-red-400/20'
            : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <p className="text-[11px] text-red-700 font-bold uppercase tracking-wider flex items-center gap-1">
            {t.metricOverdue}
            {overdueTasksCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            )}
          </p>
          <h3 className="text-2xl font-black text-red-600 mt-0.5 tabular-nums">
            {overdueTasksCount}
          </h3>
          <span className="text-[10px] text-red-500 font-semibold group-hover:underline">
            {t.metricOverdueSub} →
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Pending Leaves */}
      <div
        onClick={() => onSelectMetric('leave', 'pending')}
        className={`p-4 rounded-xl border shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group ${
          pendingLeavesCount > 0
            ? 'bg-purple-50/40 border-purple-200 ring-1 ring-purple-400/20'
            : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <p className="text-[11px] text-purple-700 font-bold uppercase tracking-wider">
            {t.metricPendingLeaves}
          </p>
          <h3 className="text-2xl font-black text-purple-700 mt-0.5 tabular-nums">
            {pendingLeavesCount}
          </h3>
          <span className="text-[10px] text-purple-600 font-semibold group-hover:underline">
            {t.metricPendingLeavesSub} →
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shrink-0">
          <CalendarDays className="w-5 h-5" />
        </div>
      </div>

      {/* Total Training Hours */}
      <div
        onClick={() => onSelectMetric('training')}
        className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
      >
        <div>
          <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
            {t.metricTotalHours}
          </p>
          <h3 className="text-2xl font-black text-emerald-700 mt-0.5 tabular-nums">
            {totalTrainingHours.toFixed(1)} <span className="text-base font-semibold">hrs</span>
          </h3>
          <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline">
            {t.metricTotalHoursSub} →
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
