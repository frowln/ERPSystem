import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { FolderKanban, FileText, CheckSquare, DollarSign, Shield } from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  project: <FolderKanban size={14} className="text-primary-500" />,
  document: <FileText size={14} className="text-blue-500" />,
  task: <CheckSquare size={14} className="text-success-500" />,
  finance: <DollarSign size={14} className="text-warning-500" />,
  safety: <Shield size={14} className="text-danger-500" />,
};

interface ActivityItem {
  id: string;
  type: string;
  text: string;
  time: string;
}

const RecentActivityWidget: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  // Build activity from recent projects as proxy
  const activities: ActivityItem[] = React.useMemo(() => {
    const projects = dashboard?.recentProjects ?? [];
    return projects.slice(0, 5).map((p, i) => ({
      id: p.id,
      type: i % 2 === 0 ? 'project' : 'task',
      text: `${p.name} — ${p.status === 'IN_PROGRESS' ? t('dashboard.wid.actUpdated') : t('dashboard.wid.actCreated')}`,
      time: p.updatedAt || p.createdAt,
    }));
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-4 text-center">{t('dashboard.noRecentActivity')}</p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-2.5">
          <div className="mt-0.5 flex-shrink-0">
            {ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.project}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{a.text}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {a.time ? format(new Date(a.time), 'd MMM, HH:mm', { locale: ruLocale }) : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityWidget;
