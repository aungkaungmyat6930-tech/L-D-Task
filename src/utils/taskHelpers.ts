import { TaskItem } from '../types';
import { Language } from './translations';

export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  return dt.toISOString().split('T')[0];
}

export function getTaskDaysRemaining(due: string, todayStr: string): number {
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = due.split('-').map(Number);
  const todayUtc = Date.UTC(ty, (tm || 1) - 1, td || 1);
  const dueUtc = Date.UTC(dy, (dm || 1) - 1, dd || 1);
  return Math.round((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export function isTaskOverdue(task: TaskItem, todayStr: string): boolean {
  if (task.status === 'Completed' || task.status === 'Cancelled') return false;
  return task.status === 'Overdue' || task.due < todayStr;
}

export function isTaskNearDeadline(
  task: TaskItem,
  todayStr: string,
  windowDays = 3
): boolean {
  if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Overdue') {
    return false;
  }
  const diff = getTaskDaysRemaining(task.due, todayStr);
  return diff >= 0 && diff <= windowDays;
}

export function formatDeadlineNotiLabel(
  task: TaskItem,
  todayStr: string,
  language: Language
): string | null {
  if (!isTaskNearDeadline(task, todayStr)) return null;
  const diff = getTaskDaysRemaining(task.due, todayStr);
  if (diff === 0) {
    return language === 'my' ? 'ယနေ့ Deadline' : 'Due Today';
  }
  if (diff === 1) {
    return language === 'my' ? 'မနက်ဖြန် Deadline' : 'Due Tomorrow';
  }
  return language === 'my' ? `${diff} ရက်သာကျန်` : `${diff}d left`;
}

export interface DeadlineStatusInfo {
  kind: 'completed' | 'cancelled' | 'overdue' | 'due-today' | 'due-soon' | 'on-track';
  label: string;
  cls: string;
}

export function getTaskDeadlineStatus(
  task: TaskItem,
  todayStr: string,
  language: Language
): DeadlineStatusInfo {
  if (task.status === 'Completed') {
    return {
      kind: 'completed',
      label: language === 'my' ? 'ပြီးစီးပြီး (Done)' : 'Completed',
      cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }
  if (task.status === 'Cancelled') {
    return {
      kind: 'cancelled',
      label: language === 'my' ? 'ပယ်ဖျက်ပြီး' : 'Cancelled',
      cls: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const diff = getTaskDaysRemaining(task.due, todayStr);
  if (isTaskOverdue(task, todayStr)) {
    const overdueDays = Math.abs(diff);
    return {
      kind: 'overdue',
      label:
        overdueDays > 0
          ? language === 'my'
            ? `ရက်ကျော် (${overdueDays} ရက်)`
            : `Overdue (${overdueDays}d)`
          : language === 'my'
          ? 'ရက်ကျော် (Overdue)'
          : 'Overdue',
      cls: 'bg-red-100 text-red-800 border-red-300',
    };
  }

  if (diff === 0) {
    return {
      kind: 'due-today',
      label: language === 'my' ? 'ယနေ့ Deadline' : 'Due Today',
      cls: 'bg-orange-100 text-orange-900 border-orange-300',
    };
  }

  if (diff > 0 && diff <= 3) {
    return {
      kind: 'due-soon',
      label:
        language === 'my'
          ? `Deadline နီး (${diff} ရက်ကျန်)`
          : `Due Soon (${diff}d left)`,
      cls: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }

  return {
    kind: 'on-track',
    label:
      language === 'my'
        ? `သတ်မှတ်ရက်အတွင်း (${diff} ရက်ကျန်)`
        : `On Track (${diff}d left)`,
    cls: 'bg-sky-50 text-sky-800 border-sky-200',
  };
}
