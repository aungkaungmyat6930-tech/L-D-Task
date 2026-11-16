import { TrainingLog, TrainerHourEntry } from '../types';

export const TRAINING_TOPIC_SUGGESTIONS: string[] = [
  'Universal Life',
  'PA (Personal Accident)',
  'Whole Life',
  'Endowment',
  'Term Life',
  'Bancassurance',
  'Agency Onboarding',
  'Underwriting & Claims',
  'FRD Compliance',
  'Digital LMS',
];

export function decomposeBreakHours(breakHrs: number): { hours: number; minutes: number } {
  const safe = Math.max(0, Number(breakHrs) || 0);
  const totalMinutes = Math.round(safe * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export function composeBreakHours(hours: number, minutes: number): number {
  const h = Math.max(0, Number(hours) || 0);
  const m = Math.max(0, Math.min(59, Number(minutes) || 0));
  return Number((h + m / 60).toFixed(2));
}

export function formatBreakDuration(breakHrs: number): string {
  const { hours, minutes } = decomposeBreakHours(breakHrs);
  if (hours === 0 && minutes === 0) return '0m';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function getTrainerEntriesForLog(log: TrainingLog): TrainerHourEntry[] {
  if (log.trainerHours && log.trainerHours.length > 0) {
    return log.trainerHours;
  }

  const entries: TrainerHourEntry[] = [];
  const baseHours = Number(log.calculatedHours) || 0;

  if (log.trainerName) {
    entries.push({
      name: log.trainerName,
      role: 'Lead Trainer',
      hours: baseHours,
    });
  }

  const coNames =
    log.coTrainerNames && log.coTrainerNames.length > 0
      ? log.coTrainerNames
      : (log.attendeeNames || []).filter((n) => n !== log.trainerName);

  coNames.forEach((name, idx) => {
    if (!entries.some((e) => e.name === name)) {
      entries.push({
        userId: log.coTrainerIds?.[idx],
        name,
        role: 'Co-Trainer',
        hours: baseHours,
      });
    }
  });

  return entries;
}

export function getMemberHoursForTrainingLog(
  log: TrainingLog,
  member: { id?: string; name: string }
): number {
  if (log.trainerHours && log.trainerHours.length > 0) {
    const matches = log.trainerHours.filter(
      (entry) =>
        (member.id && entry.userId === member.id) || entry.name === member.name
    );
    if (matches.length > 0) {
      return Number(
        matches.reduce((sum, item) => sum + (Number(item.hours) || 0), 0).toFixed(2)
      );
    }
    return 0;
  }

  const participates =
    (member.id && log.attendeeIds?.includes(member.id)) ||
    log.attendeeNames?.includes(member.name) ||
    (member.id && log.coTrainerIds?.includes(member.id)) ||
    log.coTrainerNames?.includes(member.name) ||
    log.trainerName === member.name;

  return participates ? Number(log.calculatedHours) || 0 : 0;
}

export function formatTotalTrainerHours(log: TrainingLog): number {
  if (log.trainerHours && log.trainerHours.length > 0) {
    return Number(
      log.trainerHours.reduce((sum, item) => sum + (Number(item.hours) || 0), 0).toFixed(1)
    );
  }
  return Number(log.calculatedHours || 0);
}
