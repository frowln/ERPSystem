import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ShieldAlert,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { bimApi } from '@/api/bim';
import type { ClashResult } from '@/modules/bim/types';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';

const clashTypeColorMap: Record<string, 'red' | 'orange' | 'yellow'> = {
  hard: 'red',
  soft: 'orange',
  clearance: 'yellow',
};

const severityColorMap: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'gray',
};

const statusColorMap: Record<string, 'red' | 'blue' | 'green' | 'gray'> = {
  new: 'red',
  active: 'blue',
  resolved: 'green',
  ignored: 'gray',
};

const ClashDetectionResultsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClash, setSelectedClash] = useState<ClashResult | null>(null);

  const { data: clashData, isLoading } = useQuery({
    queryKey: ['clash-results'],
    queryFn: () => bimApi.getClashResults(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bimApi.updateClashStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clash-results'] });
      toast.success(t('bim.clashResultStatusUpdated'));
      setSelectedClash(null);
    },
  });

  const clashes = clashData?.content ?? [];

  const filtered = useMemo(() => {
    let result = clashes;
    if (typeFilter) result = result.filter((c) => c.clashType === typeFilter);
    if (severityFilter) result = result.filter((c) => c.severity === severityFilter);
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.clashNumber.toLowerCase().includes(lower) ||
          c.elementA.name.toLowerCase().includes(lower) ||
          c.elementB.name.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [clashes, typeFilter, severityFilter, statusFilter, search]);

  const totalCount = clashes.length;
  const newCount = clashes.filter((c) => c.status === 'new').length;
  const activeCount = clashes.filter((c) => c.status === 'active').length;
  const resolvedCount = clashes.filter((c) => c.status === 'resolved').length;

  const getClashTypeLabels = (): Record<string, string> => ({
    hard: t('bim.clashResultTypeHard'),
    soft: t('bim.clashResultTypeSoft'),
    clearance: t('bim.clashResultTypeClearance'),
  });

  const getSeverityLabels = (): Record<string, string> => ({
    critical: t('bim.clashResultSevCritical'),
    high: t('bim.clashResultSevHigh'),
    medium: t('bim.clashResultSevMedium'),
    low: t('bim.clashResultSevLow'),
  });

  const getStatusLabels = (): Record<string, string> => ({
    new: t('bim.clashResultStatusNew'),
    active: t('bim.clashResultStatusActive'),
    resolved: t('bim.clashResultStatusResolved'),
    ignored: t('bim.clashResultStatusIgnored'),
  });

  const columns = useMemo<ColumnDef<ClashResult, unknown>[]>(() => {
    const typeLabels = getClashTypeLabels();
    const sevLabels = getSeverityLabels();
    const stLabels = getStatusLabels();
    return [
      {
        accessorKey: 'clashNumber',
        header: t('bim.clashResultColNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'elementA',
        header: t('bim.clashResultColElementA'),
        size: 180,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
              {row.original.elementA.name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {row.original.elementA.type}
            </p>
          </div>
        ),
      },
      {
        id: 'elementB',
        header: t('bim.clashResultColElementB'),
        size: 180,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
              {row.original.elementB.name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {row.original.elementB.type}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'clashType',
        header: t('bim.clashResultColType'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={clashTypeColorMap}
            label={typeLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'severity',
        header: t('bim.clashResultColSeverity'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={severityColorMap}
            label={sevLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('bim.clashResultColStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={stLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'detectedDate',
        header: t('bim.clashResultColDetected'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<Eye size={14} />}
            onClick={() => setSelectedClash(row.original)}
          />
        ),
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.clashResultTitle')}
        subtitle={t('bim.clashResultSubtitle', { count: String(totalCount) })}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.clashResultBreadcrumb') },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('bim.clashResultMetricTotal')}
          value={totalCount}
        />
        <MetricCard
          icon={<ShieldAlert size={18} />}
          label={t('bim.clashResultMetricNew')}
          value={newCount}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('bim.clashResultMetricActive')}
          value={activeCount}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('bim.clashResultMetricResolved')}
          value={resolvedCount}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('bim.clashResultSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('bim.clashResultFilterAllTypes') },
            ...Object.entries(getClashTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: t('bim.clashResultFilterAllSeverities') },
            ...Object.entries(getSeverityLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: t('bim.clashResultFilterAllStatuses') },
            ...Object.entries(getStatusLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable<ClashResult>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        onRowClick={(row) => setSelectedClash(row)}
        emptyTitle={t('bim.clashResultEmptyTitle')}
        emptyDescription={t('bim.clashResultEmptyDescription')}
      />

      {/* Detail Modal */}
      <Modal
        open={!!selectedClash}
        onClose={() => setSelectedClash(null)}
        title={t('bim.clashResultDetailTitle', {
          number: selectedClash?.clashNumber ?? '',
        })}
        size="lg"
        footer={
          selectedClash &&
          selectedClash.status !== 'resolved' &&
          selectedClash.status !== 'ignored' ? (
            <>
              <Button
                variant="success"
                iconLeft={<CheckCircle size={16} />}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: selectedClash.id,
                    status: 'resolved',
                  })
                }
                loading={updateStatusMutation.isPending}
              >
                {t('bim.clashResultMarkResolved')}
              </Button>
              <Button
                variant="secondary"
                iconLeft={<EyeOff size={16} />}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: selectedClash.id,
                    status: 'ignored',
                  })
                }
                loading={updateStatusMutation.isPending}
              >
                {t('bim.clashResultMarkIgnored')}
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedClash && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('bim.clashResultColElementA')}
                </h4>
                <p className="text-sm text-neutral-900 dark:text-neutral-100">
                  {selectedClash.elementA.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('bim.clashResultDetailType')}: {selectedClash.elementA.type}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  ID: {selectedClash.elementA.id}
                </p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('bim.clashResultColElementB')}
                </h4>
                <p className="text-sm text-neutral-900 dark:text-neutral-100">
                  {selectedClash.elementB.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('bim.clashResultDetailType')}: {selectedClash.elementB.type}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  ID: {selectedClash.elementB.id}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('bim.clashResultColType')}
                </p>
                <StatusBadge
                  status={selectedClash.clashType}
                  colorMap={clashTypeColorMap}
                  label={getClashTypeLabels()[selectedClash.clashType]}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('bim.clashResultColSeverity')}
                </p>
                <StatusBadge
                  status={selectedClash.severity}
                  colorMap={severityColorMap}
                  label={getSeverityLabels()[selectedClash.severity]}
                />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('bim.clashResultColStatus')}
                </p>
                <StatusBadge
                  status={selectedClash.status}
                  colorMap={statusColorMap}
                  label={getStatusLabels()[selectedClash.status]}
                />
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {t('bim.clashResultDetailLocation')}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                X: {selectedClash.location.x.toFixed(2)}, Y:{' '}
                {selectedClash.location.y.toFixed(2)}, Z:{' '}
                {selectedClash.location.z.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('bim.clashResultDetailDetectedDate')}:{' '}
                {formatDate(selectedClash.detectedDate)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClashDetectionResultsPage;
