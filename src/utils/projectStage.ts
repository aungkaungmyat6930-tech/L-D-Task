import { StrategicProject, TaskItem } from '../types';

/**
 * Project stage and progress follow the project's tasks (cancelled tasks don't count):
 * 100% done → Completed, 75%+ → Final Review, 40%+ → On Track, otherwise In Progress.
 * Returns null when the project has no tasks (its stage is then set by hand).
 */
export function stageFromTasks(
  projectTasks: TaskItem[]
): { status: StrategicProject['status']; progress: number } | null {
  const counted = projectTasks.filter((t) => t.status !== 'Cancelled');
  if (counted.length === 0) return null;
  const done = counted.filter((t) => t.status === 'Completed').length;
  const progress = Math.round((done / counted.length) * 100);
  const status: StrategicProject['status'] =
    progress >= 100 ? 'Completed' : progress >= 75 ? 'Final Review' : progress >= 40 ? 'On Track' : 'In Progress';
  return { status, progress };
}
