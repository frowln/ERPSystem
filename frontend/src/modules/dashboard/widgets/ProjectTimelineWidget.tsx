import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';

const ProjectTimelineWidget: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const projects = (dashboard?.recentProjects ?? []).slice(0, 5);

  if (projects.length === 0) {
    return <p className="text-sm text-neutral-400 text-center py-4">{t('dashboard.noProjects')}</p>;
  }

  // Find date range for all projects
  const allDates = projects.flatMap((p) => [
    new Date(p.plannedStartDate || p.createdAt),
    new Date(p.plannedEndDate || p.createdAt),
  ]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalDays = Math.max(differenceInDays(maxDate, minDate), 1);

  return (
    <div className="space-y-3">
      {projects.map((p) => {
        const start = new Date(p.plannedStartDate || p.createdAt);
        const end = new Date(p.plannedEndDate || p.createdAt);
        const leftPct = (differenceInDays(start, minDate) / totalDays) * 100;
        const widthPct = Math.max((differenceInDays(end, start) / totalDays) * 100, 3);

        return (
          <div key={p.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{p.name}</span>
              <span className="text-xs text-neutral-400 tabular-nums flex-shrink-0 ml-2">
                {p.progress ?? 0}%
              </span>
            </div>
            <div className="relative h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="absolute top-0 h-full bg-primary-200 dark:bg-primary-900 rounded-full"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
              <div
                className="absolute top-0 h-full bg-primary-500 rounded-full"
                style={{ left: `${leftPct}%`, width: `${widthPct * ((p.progress ?? 0) / 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectTimelineWidget;
