import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Clock,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { bimApi } from '@/api/bim';
import type { ConstructionProgress4D } from '@/modules/bim/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

const progressStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  delayed: 'red',
};

const ConstructionProgressPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['construction-progress', dateFilter],
    queryFn: () =>
      bimApi.getConstructionProgress(undefined, dateFilter || undefined),
  });

  const getStatusLabels = (): Record<string, string> => ({
    not_started: t('bim.progressStatusNotStarted'),
    in_progress: t('bim.progressStatusInProgress'),
    completed: t('bim.progressStatusCompleted'),
    delayed: t('bim.progressStatusDelayed'),
  });

  const filtered = useMemo(() => {
    let result = progressData;
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.elementName.toLowerCase().includes(lower) ||
          p.elementType.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [progressData, statusFilter, search]);

  const totalElements = progressData.length;
  const completedCount = progressData.filter((p) => p.status === 'completed').length;
  const inProgressCount = progressData.filter((p) => p.status === 'in_progress').length;
  const delayedCount = progressData.filter((p) => p.status === 'delayed').length;

  const columns = useMemo<ColumnDef<ConstructionProgress4D, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    return [
      {
        accessorKey: 'elementName',
        header: t('bim.progressColElement'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
              {row.original.elementName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {row.original.elementType}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'plannedPercent',
        header: t('bim.progressColPlanned'),
        size: 160,
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-400 dark:bg-primary-500 rounded-full transition-all"
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums w-10 text-right">
                {value}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'actualPercent',
        header: t('bim.progressColActual'),
        size: 160,
        cell: ({ row }) => {
          const actual = row.original.actualPercent;
          const planned = row.original.plannedPercent;
          const isDelayed = actual < planned;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isDelayed
                      ? 'bg-danger-500 dark:bg-danger-400'
                      : 'bg-success-500 dark:bg-success-400',
                  )}
                  style={{ width: `${Math.min(actual, 100)}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs tabular-nums w-10 text-right',
                  isDelayed
                    ? 'text-danger-600 dark:text-danger-400 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400',
                )}
              >
                {actual}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('bim.progressColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={progressStatusColorMap}
            label={statusLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'plannedStartDate',
        header: t('bim.progressColPlannedStart'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'plannedEndDate',
        header: t('bim.progressColPlannedEnd'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: 'deviation',
        header: t('bim.progressColDeviation'),
        size: 90,
        cell: ({ row }) => {
          const delta = row.original.actualPercent - row.original.plannedPercent;
          if (delta === 0)
            return (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                0%
              </span>
            );
          return (
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                delta > 0
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-danger-600 dark:text-danger-400',
              )}
            >
              {delta > 0 ? '+' : ''}
              {delta}%
            </span>
          );
        },
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.progressTitle')}
        subtitle={t('bim.progressSubtitle', { count: String(totalElements) })}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.progressBreadcrumb') },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('bim.progressMetricTotal')}
          value={totalElements}
          loading={isLoading}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label={t('bim.progressMetricCompleted')}
          value={completedCount}
          loading={isLoading}
        />
        <MetricCard
          icon={<PlayCircle size={18} />}
          label={t('bim.progressMetricInProgress')}
          value={inProgressCount}
          loading={isLoading}
        />
        <MetricCard
          icon={<AlertCircle size={18} />}
          label={t('bim.progressMetricDelayed')}
          value={delayedCount}
          loading={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('bim.progressSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('bim.progressFilterAllStatuses') },
            ...Object.entries(getStatusLabels()).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-neutral-400" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      <DataTable<ConstructionProgress4D>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('bim.progressEmptyTitle')}
        emptyDescription={t('bim.progressEmptyDescription')}
      />
    </div>
  );
};

export default ConstructionProgressPage;
