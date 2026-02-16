import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, CalendarCheck, GitCompare } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { formatDate, formatMoney } from '@/lib/format';
import { planningApi } from '@/api/planning';
import { t } from '@/i18n';
import type { ScheduleBaseline } from './types';

const baselineStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'purple'> = {
  DRAFT: 'gray',
  APPROVED: 'blue',
  ACTIVE: 'green',
  SUPERSEDED: 'purple',
};

const getBaselineStatusLabels = (): Record<string, string> => ({
  DRAFT: t('planning.baselines.statusDraft'),
  APPROVED: t('planning.baselines.statusApproved'),
  ACTIVE: t('planning.baselines.statusActive'),
  SUPERSEDED: t('planning.baselines.statusSuperseded'),
});


const ScheduleBaselinePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery<ScheduleBaseline[]>({
    queryKey: ['schedule-baselines'],
    queryFn: () => planningApi.getBaselines(),
  });

  const baselines = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return baselines;
    const lower = search.toLowerCase();
    return baselines.filter(
      (b) =>
        b.name.toLowerCase().includes(lower) ||
        (b.projectName ?? '').toLowerCase().includes(lower),
    );
  }, [baselines, search]);

  const activeBaseline = baselines.find((b) => b.status === 'ACTIVE');

  const columns = useMemo<ColumnDef<ScheduleBaseline, unknown>[]>(
    () => {
      const baselineStatusLabels = getBaselineStatusLabels();
      return [
        {
          accessorKey: 'name',
          header: t('planning.baselines.colName'),
          size: 240,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
            </div>
          ),
        },
        {
          accessorKey: 'status',
          header: t('planning.baselines.colStatus'),
          size: 130,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={baselineStatusColorMap}
              label={baselineStatusLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'baselineDate',
          header: t('planning.baselines.colBaselineDate'),
          size: 150,
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatDate(getValue<string>())}</span>
          ),
        },
        {
          accessorKey: 'totalActivities',
          header: t('planning.baselines.colActivities'),
          size: 90,
          cell: ({ getValue }) => (
            <span className="tabular-nums text-neutral-600">{getValue<number>()}</span>
          ),
        },
        {
          accessorKey: 'plannedStartDate',
          header: t('planning.baselines.colStart'),
          size: 120,
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatDate(getValue<string>())}</span>
          ),
        },
        {
          accessorKey: 'plannedEndDate',
          header: t('planning.baselines.colEnd'),
          size: 120,
          cell: ({ getValue }) => (
            <span className="tabular-nums">{formatDate(getValue<string>())}</span>
          ),
        },
        {
          accessorKey: 'totalBudget',
          header: t('planning.baselines.colBudget'),
          size: 180,
          cell: ({ getValue }) => (
            <span className="font-medium tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
          ),
        },
      ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.baselines.title')}
        subtitle={t('planning.baselines.subtitle')}
        breadcrumbs={[
          { label: t('planning.baselines.breadcrumbHome'), href: '/' },
          { label: t('planning.baselines.breadcrumbPlanning') },
          { label: t('planning.baselines.breadcrumbBaselines') },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<GitCompare size={16} />}>
            {t('planning.baselines.compareVersions')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<CalendarCheck size={18} />} label={t('planning.baselines.totalBaselines')} value={baselines.length} />
        <MetricCard label={t('planning.baselines.activeCount')} value={baselines.filter((b) => b.status === 'ACTIVE').length} />
        <MetricCard label={t('planning.baselines.currentPlan')} value={activeBaseline?.name ?? '---'} subtitle={activeBaseline ? formatDate(activeBaseline.baselineDate) : ''} />
        <MetricCard label={t('planning.baselines.activitiesInCurrent')} value={activeBaseline?.totalActivities ?? 0} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('planning.baselines.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<ScheduleBaseline>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('planning.baselines.emptyTitle')}
        emptyDescription={t('planning.baselines.emptyDescription')}
      />
    </div>
  );
};

export default ScheduleBaselinePage;
