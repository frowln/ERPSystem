import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { ClipboardCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { AsBuiltWbsProgress } from './types';
import type { PaginatedResponse } from '@/types';

const qualityGateColorMap: Record<string, 'gray' | 'green' | 'red' | 'yellow'> = {
  passed: 'green',
  notPassed: 'red',
  noReqs: 'gray',
};

const AsBuiltTrackerPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projects = (projectsData as PaginatedResponse<{ id: string; name: string }> | undefined)?.content ?? [];

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['as-built-progress', selectedProjectId],
    queryFn: () => closeoutApi.getAsBuiltProgress(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const progress = progressData ?? [];

  const metrics = useMemo(() => {
    const total = progress.length;
    const withReqs = progress.filter((p) => p.totalRequired > 0);
    const allAccepted = withReqs.filter((p) => p.qualityGatePassed).length;
    const inProgress = withReqs.filter((p) => p.submitted > 0 && !p.qualityGatePassed).length;
    const avgCompletion = withReqs.length > 0
      ? Math.round(withReqs.reduce((sum, p) => sum + p.completionPercent, 0) / withReqs.length)
      : 0;
    return { total, withReqs: withReqs.length, allAccepted, inProgress, avgCompletion };
  }, [progress]);

  const columns = useMemo<ColumnDef<AsBuiltWbsProgress, unknown>[]>(
    () => [
      {
        accessorKey: 'wbsCode',
        header: t('closeout.asBuiltColWbs'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 mr-2">{row.original.wbsCode}</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.wbsName}</span>
          </div>
        ),
      },
      {
        accessorKey: 'totalRequired',
        header: t('closeout.asBuiltColRequired'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'submitted',
        header: t('closeout.asBuiltColSubmitted'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'accepted',
        header: t('closeout.asBuiltColAccepted'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-green-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'completionPercent',
        header: t('closeout.asBuiltColCompletion'),
        size: 180,
        cell: ({ row }) => {
          const pct = row.original.completionPercent;
          const color = pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600';
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <span className="tabular-nums text-xs font-medium w-10 text-right">{pct}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'qualityGatePassed',
        header: t('closeout.asBuiltColQualityGate'),
        size: 140,
        cell: ({ row }) => {
          const { totalRequired, qualityGatePassed } = row.original;
          if (totalRequired === 0) {
            return <StatusBadge status="noReqs" colorMap={qualityGateColorMap} label={t('closeout.asBuiltQualityNoReqs')} />;
          }
          return qualityGatePassed
            ? <StatusBadge status="passed" colorMap={qualityGateColorMap} label={t('closeout.asBuiltQualityPassed')} />
            : <StatusBadge status="notPassed" colorMap={qualityGateColorMap} label={t('closeout.asBuiltQualityNotPassed')} />;
        },
      },
    ],
    [],
  );

  const projectOptions = useMemo(() => [
    { value: '', label: t('closeout.asBuiltSelectProject') },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ], [projects]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.asBuiltTitle')}
        subtitle={t('closeout.asBuiltSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.asBuiltTitle') },
        ]}
        actions={
          <Select
            options={projectOptions}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-64"
          />
        }
      />

      {selectedProjectId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<ClipboardCheck size={18} />}
              label={t('closeout.asBuiltColRequired')}
              value={metrics.withReqs}
              subtitle={t('closeout.asBuiltOfWbsElements', { total: String(metrics.total) })}
            />
            <MetricCard
              icon={<CheckCircle2 size={18} />}
              label={t('closeout.asBuiltQualityPassed')}
              value={metrics.allAccepted}
              trend={metrics.withReqs > 0 ? { value: `${Math.round(metrics.allAccepted / metrics.withReqs * 100)}%`, direction: 'up' as const } : undefined}
            />
            <MetricCard
              icon={<Clock size={18} />}
              label={t('closeout.asBuiltColSubmitted')}
              value={metrics.inProgress}
            />
            <MetricCard
              icon={<XCircle size={18} />}
              label={t('closeout.asBuiltColCompletion')}
              value={`${metrics.avgCompletion}%`}
            />
          </div>

          <DataTable<AsBuiltWbsProgress>
            data={progress}
            columns={columns}
            loading={isLoading}
            pageSize={50}
            emptyTitle={t('closeout.asBuiltNoData')}
            emptyDescription={t('closeout.asBuiltNoDataDesc')}
          />
        </>
      )}

      {!selectedProjectId && (
        <div className="flex items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
          {t('closeout.asBuiltSelectProject')}
        </div>
      )}
    </div>
  );
};

export default AsBuiltTrackerPage;
