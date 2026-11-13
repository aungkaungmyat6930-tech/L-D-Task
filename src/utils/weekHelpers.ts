import { Language } from './translations';

export type WeekNumber = 1 | 2 | 3 | 4 | 5;
export type WeekdayCode = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const WEEKDAY_CODES: WeekdayCode[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const JS_DAY_TO_CODE: WeekdayCode[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthKey(dateStr?: string): string {
  if (!dateStr || dateStr.length < 7) {
    return formatYMD(new Date()).slice(0, 7);
  }
  return dateStr.slice(0, 7);
}

export function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
}

export function getDayOfWeekCode(dateStr?: string): WeekdayCode {
  if (!dateStr || dateStr.length < 10) return 'Wed';
  const dt = parseLocalDate(dateStr);
  return JS_DAY_TO_CODE[dt.getDay()] || 'Wed';
}

export function getWeekOfMonth(dateStr?: string): WeekNumber {
  if (!dateStr || dateStr.length < 10) return 1;
  const day = parseInt(dateStr.slice(8, 10), 10);
  if (isNaN(day) || day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

export function getWeeksInMonth(monthKey: string): WeekNumber[] {
  const days = getDaysInMonth(monthKey);
  return days > 28 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
}

export function getWeekOrdinal(week: WeekNumber): string {
  switch (week) {
    case 1:
      return '1st Week';
    case 2:
      return '2nd Week';
    case 3:
      return '3rd Week';
    case 4:
      return '4th Week';
    case 5:
      return '5th Week';
  }
}

export function getWeekDayRange(monthKey: string, week: WeekNumber): { startDay: number; endDay: number } {
  const totalDays = getDaysInMonth(monthKey);
  const startDay = (week - 1) * 7 + 1;
  const endDay = Math.min(week * 7, totalDays);
  return { startDay, endDay };
}

export function getWeekLabel(monthKey: string, week: WeekNumber, language: Language): string {
  const ordinal = getWeekOrdinal(week);
  const { startDay, endDay } = getWeekDayRange(monthKey, week);
  const [y, m] = monthKey.split('-').map(Number);
  const shortMonth =
    y && m
      ? new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
      : '';

  if (language === 'my') {
    return `${ordinal} (${startDay}–${endDay} ရက်)`;
  }
  return `${ordinal} (${shortMonth} ${startDay}–${endDay})`;
}

export function getDefaultDateForMonthWeek(
  monthKey: string,
  week: WeekNumber | 'all',
  preferredWeekday?: WeekdayCode
): string {
  const resolvedWeek: WeekNumber = week === 'all' ? 1 : week;
  if (preferredWeekday) {
    return getDateForWeekAndWeekday(monthKey, resolvedWeek, preferredWeekday);
  }
  const { startDay } = getWeekDayRange(monthKey, resolvedWeek);
  const dayStr = String(startDay).padStart(2, '0');
  return `${monthKey}-${dayStr}`;
}

export function getDateForWeekAndWeekday(
  monthKey: string,
  week: WeekNumber,
  weekday: WeekdayCode
): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return formatYMD(new Date());
  const { startDay, endDay } = getWeekDayRange(monthKey, week);

  for (let d = startDay; d <= endDay; d++) {
    const dt = new Date(y, m - 1, d);
    if (JS_DAY_TO_CODE[dt.getDay()] === weekday) {
      return formatYMD(dt);
    }
  }

  // Fallback for 5th Week when a specific weekday falls outside days 29..31:
  // pick the last occurrence of that weekday in the month so the weekday selection is respected
  const totalDays = getDaysInMonth(monthKey);
  for (let d = totalDays; d >= 1; d--) {
    const dt = new Date(y, m - 1, d);
    if (JS_DAY_TO_CODE[dt.getDay()] === weekday) {
      return formatYMD(dt);
    }
  }

  return `${monthKey}-${String(startDay).padStart(2, '0')}`;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return formatYMD(new Date()).slice(0, 7);
  const date = new Date(y, m - 1 + delta, 1);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
}

export function formatMonthLabel(monthKey: string, language: Language): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const date = new Date(y, m - 1, 1);
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (language === 'my') {
    return `${monthName} လ`;
  }
  return monthName;
}
