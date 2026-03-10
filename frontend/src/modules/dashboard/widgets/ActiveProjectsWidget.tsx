import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '@/api/projects';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { t } from '@/i18n';

const ActiveProjectsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const projects = dashboard?.recentProjects?.slice(0, 5) ?? [];
  const count = dashboard?.activeProjects ?? 0;

  return (
    <div>
      <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 tabular-nums">
        {count}
      </div>
      <div className="space-y-2">
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
            onClick={() => navigate(`/projects/${p.id}`)}
          >
            <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{p.name}</span>
            <StatusBadge status={p.status} size="sm" />
          </div>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-neutral-400">{t('dashboard.noProjects')}</p>
        )}
      </div>
    </div>
  );
};

export default ActiveProjectsWidget;
