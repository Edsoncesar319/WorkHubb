import type { Job } from '@/lib/types';

export type WorkMode = 'onsite' | 'remote' | 'hybrid';

export type WorkModeFilter = WorkMode | 'all';

export function getWorkMode(job: Pick<Job, 'remote' | 'hybrid'>): WorkMode {
  if (job.hybrid === true) return 'hybrid';
  if (job.remote) return 'remote';
  return 'onsite';
}

export function workModeLabel(mode: WorkMode): string {
  const labels: Record<WorkMode, string> = {
    onsite: 'Presencial',
    remote: 'Remoto',
    hybrid: 'Híbrido',
  };
  return labels[mode];
}

export function jobMatchesWorkModeFilter(
  job: Pick<Job, 'remote' | 'hybrid'>,
  filter: WorkModeFilter
): boolean {
  if (filter === 'all') return true;
  return getWorkMode(job) === filter;
}

export function workModeToFields(mode: WorkMode): {
  remote: boolean;
  hybrid: boolean;
} {
  return {
    remote: mode === 'remote',
    hybrid: mode === 'hybrid',
  };
}
