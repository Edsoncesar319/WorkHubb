import { Badge } from '@/components/ui/badge';
import { getWorkMode, workModeLabel, type WorkMode } from '@/lib/work-mode';
import type { Job } from '@/lib/types';

const variantByMode: Record<
  WorkMode,
  'default' | 'secondary' | 'outline'
> = {
  remote: 'default',
  hybrid: 'secondary',
  onsite: 'outline',
};

const classByMode: Record<WorkMode, string> = {
  remote: 'bg-primary/20 text-primary border-primary/30',
  hybrid: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  onsite: '',
};

export function WorkModeBadge({ job }: { job: Pick<Job, 'remote' | 'hybrid'> }) {
  const mode = getWorkMode(job);
  return (
    <Badge
      variant={variantByMode[mode]}
      className={classByMode[mode] || undefined}
    >
      {workModeLabel(mode)}
    </Badge>
  );
}
