import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { safetyApi } from '@/api/safety';
import { t } from '@/i18n';

const SafetyIncidentsWidget: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['safety', 'incidents', 'dashboard'],
    queryFn: () => safetyApi.getIncidents({ page: 0, size: 10000 }),
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const all = data?.content ?? [];
    const now = new Date();
    const thisMonth = all.filter((i) => {
      const d = new Date(i.incidentDate ?? '');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = all.filter((i) => {
      const d = new Date(i.incidentDate ?? '');
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    });

    const count = thisMonth.length;
    const prevCount = lastMonth.length;
    const trend = prevCount > 0 ? Math.round(((count - prevCount) / prevCount) * 100) : 0;

    const near = thisMonth.filter((i) => i.severity === 'MINOR').length;
    const minor = thisMonth.filter((i) => i.severity === 'MODERATE').length;
    const major = thisMonth.filter((i) => i.severity === 'SERIOUS' || i.severity === 'CRITICAL' || i.severity === 'FATAL').length;

    return { count, trend, near, minor, major };
  }, [data]);

  const TrendIcon = stats.trend <= 0 ? TrendingDown : TrendingUp;
  const trendColor = stats.trend <= 0 ? 'text-success-600' : 'text-danger-600';

  return (
    <div>
      <div className="flex items-end gap-3 mb-4">
        <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
          {stats.count}
        </div>
        {stats.trend !== 0 && (
          <div className={`flex items-center gap-1 mb-1 ${trendColor}`}>
            <TrendIcon size={14} />
            <span className="text-xs font-medium tabular-nums">{stats.trend}%</span>
          </div>
        )}
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{t('dashboard.wid.safetyThisMonth')}</p>

      <div className="space-y-2">
        {[
          { label: t('dashboard.wid.safetyNear'), count: stats.near, color: 'bg-warning-500' },
          { label: t('dashboard.wid.safetyMinor'), count: stats.minor, color: 'bg-amber-400' },
          { label: t('dashboard.wid.safetyMajor'), count: stats.major, color: 'bg-danger-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafetyIncidentsWidget;
