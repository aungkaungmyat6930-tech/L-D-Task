import { RoleTier } from '../types';

export function isSuperAdmin(roleTier?: RoleTier): boolean {
  return roleTier === 'SUPER_ADMIN';
}

export function isAdminOrSuper(roleTier?: RoleTier): boolean {
  return roleTier === 'SUPER_ADMIN' || roleTier === 'ADMIN';
}

export function canApproveLeave(roleTier?: RoleTier): boolean {
  return roleTier === 'SUPER_ADMIN';
}

export function canApproveTaskCompletion(roleTier?: RoleTier): boolean {
  return roleTier === 'SUPER_ADMIN' || roleTier === 'ADMIN';
}
