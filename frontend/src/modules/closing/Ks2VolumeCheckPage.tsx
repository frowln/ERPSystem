import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle,
  AlertTriangle,
  XOctagon,
  Search,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { closingApi } from '@/api/closing';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Ks2VolumeCheck, VolumeCheckStatus } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusConfig: Record<VolumeCheckStatus, { color: string; icon: React.ReactNode; label: string }> = {
  within_limit: {
    color: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    icon: <CheckCircle size={14} className="text-green-600 dark:text-green-400" />,
    label: 'closing.volumeCheck.statusWithinLimit',
  },
  warning: {
    color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    icon: <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-400" />,
    label: 'closing.volumeCheck.statusWarning',
  },
  exceeds: {
    color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    icon: <XOctagon size={14} className="text-red-600 dark:text-red-400" />,
    label: 'closing.volumeCheck.statusExceeds',
  },
};

const progressBarColor = (status: VolumeCheckStatus) => {
  switch (status) {
    case 'within_limit':
      return 'bg-green-500 dark:bg-green-400';
    case 'warning':
      return 'bg-yellow-500 dark:bg-yellow-400';
    case 'exceeds':
      return 'bg-red-500 dark:bg-red-400';
  }
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const Ks2VolumeCheckPage: React.FC = () => {
  const [actId, setActId] = useState('');
  const [search, setSearch] = useState('');

  const { data: ks2List } = useQuery({
    queryKey: ['ks2-documents-select'],
    queryFn: () => closingApi.getKs2Documents({ size: 200 }),
  });

  const actOptions = (ks2List?.content ?? []).map((doc) => ({
    value: doc.id,
    label: `${doc.number} - ${doc.name}`,
  }));

  const { data: volumeChecks, isLoading } = useQuery<Ks2VolumeCheck[]>({
    queryKey: ['ks2-volume-check', actId],
    queryFn: () => closingApi.checkKs2Volumes(actId),
    enabled: !!actId,
  });

  const items = volumeChecks ?? [];

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((item) => item.workItem.toLowerCase().includes(lower));
  }, [items, search]);

  const metrics = useMemo(() => {
    const total = items.length;
    const withinLimit = items.filter((i) => i.status === 'within_limit').length;
    const warnings = items.filter((i) => i.status === 'warning').length;
    const violations = items.filter((i) => i.status === 'exceeds').length;
    return { total, withinLimit, warnings, violations };
  }, [items]);

  const columns = useMemo<ColumnDef<Ks2VolumeCheck, unknown>[]>(
    () => [
      {
        accessorKey: 'workItem',
        header: t('closing.volumeCheck.colWorkItem'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('closing.volumeCheck.colUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'estimateQty',
        header: t('closing.volumeCheck.colEstimateQty'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'totalSubmitted',
        header: t('closing.volumeCheck.colTotalSubmitted'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'thisActQty',
        header: t('closing.volumeCheck.colThisActQty'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-medium">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'remaining',
        header: t('closing.volumeCheck.colRemaining'),
        size: 120,
        cell: ({ row }) => {
          const val = row.original.remaining;
          return (
            <span
              className={cn(
                'tabular-nums text-right block font-medium',
                val < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300',
              )}
            >
              {formatNumber(val)}
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: t('closing.volumeCheck.colProgress'),
        size: 160,
        cell: ({ row }) => {
          const { estimateQty, totalSubmitted, thisActQty, status } = row.original;
          const usedPercent = estimateQty > 0
            ? Math.min(((totalSubmitted + thisActQty) / estimateQty) * 100, 100)
            : 0;

          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', progressBarColor(status))}
                  style={{ width: `${Math.min(usedPercent, 100)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400 w-10 text-right">
                {usedPercent.toFixed(0)}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('closing.volumeCheck.colStatus'),
        size: 150,
        cell: ({ getValue }) => {
          const status = getValue<VolumeCheckStatus>();
          const config = statusConfig[status];
          return (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                config.color,
              )}
            >
              {config.icon}
              {t(config.label)}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closing.volumeCheck.title')}
        subtitle={t('closing.volumeCheck.subtitle')}
        breadcrumbs={[
          { label: t('closing.ks2.breadcrumbHome'), href: '/' },
          { label: t('closing.ks2.breadcrumbKs2'), href: '/ks2' },
          { label: t('closing.volumeCheck.breadcrumb') },
        ]}
      />

      {/* Metrics */}
      {actId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<ClipboardCheck size={18} />}
            label={t('closing.volumeCheck.metricTotal')}
            value={metrics.total}
          />
          <MetricCard
            icon={<CheckCircle size={18} />}
            label={t('closing.volumeCheck.metricWithinLimit')}
            value={metrics.withinLimit}
          />
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label={t('closing.volumeCheck.metricWarnings')}
            value={metrics.warnings}
          />
          <MetricCard
            icon={<XOctagon size={18} />}
            label={t('closing.volumeCheck.metricViolations')}
            value={metrics.violations}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-full max-w-sm">
          <Select
            options={actOptions}
            value={actId}
            onChange={(e) => setActId(e.target.value)}
            placeholder={t('closing.volumeCheck.selectAct')}
          />
        </div>
        {actId && (
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('closing.volumeCheck.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Table or empty state */}
      {actId ? (
        <DataTable<Ks2VolumeCheck>
          data={filteredItems}
          columns={columns}
          loading={isLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('closing.volumeCheck.emptyTitle')}
          emptyDescription={t('closing.volumeCheck.emptyDescription')}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('closing.volumeCheck.selectActHint')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Ks2VolumeCheckPage;
