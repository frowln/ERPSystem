import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { qualityApi } from '@/api/quality';
import { t } from '@/i18n';

const QualityDefectsWidget: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['quality', 'non-conformances', 'dashboard'],
    queryFn: () => qualityApi.getNonConformances({ page: 0, size: 10000 }),
    staleTime: 60_000,
  });

  const { open, resolved, total, pct } = useMemo(() => {
    const all = data?.content ?? [];
    const o = all.filter((d) => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length;
    const r = all.filter((d) => d.status === 'RESOLVED' || d.status === 'CLOSED').length;
    const t = o + r;
    return { open: o, resolved: r, total: t, pct: t > 0 ? Math.round((r / t) * 100) : 0 };
  }, [data]);

  return (
    <div>
      <div className="flex items-end gap-3 mb-4">
        <div className="text-3xl font-bold text-danger-600 tabular-nums">{open}</div>
        <span className="text-sm text-neutral-500 dark:text-neutral-400 mb-0.5">{t('dashboard.wid.defectsOpen')}</span>
      </div>

      <div className="flex items-center gap-4">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-neutral-800" />
          <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={`${(pct / 100) * 138.2} 138.2`} strokeLinecap="round" transform="rotate(-90 28 28)" className="text-success-500" />
          <text x="28" y="32" textAnchor="middle" className="text-xs font-semibold fill-neutral-700 dark:fill-neutral-300">{pct}%</text>
        </svg>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-danger-500" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('dashboard.wid.defectsOpen')}: {open}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('dashboard.wid.defectsResolved')}: {resolved}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityDefectsWidget;
