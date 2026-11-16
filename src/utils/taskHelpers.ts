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
