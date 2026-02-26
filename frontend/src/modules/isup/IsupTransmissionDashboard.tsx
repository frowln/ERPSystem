import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RotateCcw,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge, type BadgeColor } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { isupApi, type IsupTransmission, type IsupTransmissionStats } from '@/api/isup';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const transmissionStatusColorMap: Record<string, BadgeColor> = {
  PENDING: 'yellow',
  SENT: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
  ERROR: 'red',
};

const transmissionTypeColorMap: Record<string, BadgeColor> = {
  SCHEDULE: 'blue',
  PROGRESS: 'green',
  MILESTONE: 'purple',
  COST: 'orange',
  PHOTO_REPORT: 'cyan',
  FINANCIAL: 'yellow',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IsupTransmissionDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Fetch transmissions
  const { data: transmissionsRaw, isLoading } = useQuery({
    queryKey: ['isup-transmissions', statusFilter],
    queryFn: async () => {
      try {
        const params: Record<string, unknown> = { page: 0, size: 100 };
        if (statusFilter) params.status = statusFilter;
        return await isupApi.getTransmissions(params as never);
      } catch {
        return { content: [], totalElements: 0, totalPages: 0, page: 0, size: 100 };
      }
    },
  });
  const transmissions = transmissionsRaw?.content ?? [];

  // Fetch transmission stats from API
  const { data: statsData } = useQuery<IsupTransmissionStats>({
    queryKey: ['isup-transmission-stats'],
    queryFn: async () => {
      try {
        return await isupApi.getTransmissionStats();
      } catch {
        return { total: 0, sent: 0, accepted: 0, rejected: 0, error: 0 };
      }
    },
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: (id: string) => isupApi.retryTransmission(id),
    onSuccess: () => {
      toast.success(t('isup.transmissions.retrySuccess'));
      queryClient.invalidateQueries({ queryKey: ['isup-transmissions'] });
      queryClient.invalidateQueries({ queryKey: ['isup-transmission-stats'] });
    },
    onError: () => {
      toast.error(t('isup.transmissions.retryError'));
    },
    onSettled: () => {
      setRetryingId(null);
    },
  });

  const handleRetry = useCallback(
    (id: string) => {
      setRetryingId(id);
      retryMutation.mutate(id);
    },
    [retryMutation],
  );

  // Computed metrics — prefer server-side stats, fall back to client-side
  const metrics = useMemo(() => {
    if (statsData && statsData.total > 0) {
      const failed = statsData.rejected + statsData.error;
      const successRate = Math.round(((statsData.accepted + statsData.sent) / statsData.total) * 100);
      return { total: statsData.total, pending: statsData.total - statsData.sent - statsData.accepted - failed, accepted: statsData.accepted, failed, successRate };
    }
    const total = transmissions.length;
    const pending = transmissions.filter((tr) => tr.status === 'PENDING').length;
    const sent = transmissions.filter((tr) => tr.status === 'SENT').length;
    const accepted = transmissions.filter((tr) => tr.status === 'ACCEPTED').length;
    const failed = transmissions.filter((tr) => tr.status === 'ERROR' || tr.status === 'REJECTED').length;
    const successRate = total > 0 ? Math.round(((accepted + sent) / total) * 100) : 0;
    return { total, pending, accepted, failed, successRate };
  }, [transmissions, statsData]);

  // Status label helper
  const getStatusLabel = useCallback((status: string): string => {
    return t(`isup.transmissions.status${status.charAt(0) + status.slice(1).toLowerCase()}`);
  }, []);

  // Type label helper
  const getTypeLabel = useCallback((type: string): string => {
    return t(`isup.transmissions.type${type.charAt(0) + type.slice(1).toLowerCase()}`);
  }, []);

  // Format payload size
  const formatSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const columns = useMemo<ColumnDef<IsupTransmission, unknown>[]>(
    () => [
      {
        accessorKey: 'sentAt',
        header: t('isup.transmissions.colDate'),
        size: 160,
        cell: ({ row }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {row.original.sentAt ? formatDateTime(row.original.sentAt) : '--'}
          </span>
        ),
      },
      {
        accessorKey: 'transmissionType',
        header: t('isup.transmissions.colType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={transmissionTypeColorMap}
            label={getTypeLabel(getValue<string>())}
            size="sm"
          />
        ),
      },
      {
        accessorKey: 'projectMappingId',
        header: t('isup.transmissions.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300 font-mono text-xs truncate">
            {getValue<string>()?.slice(0, 8) ?? '--'}...
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('isup.transmissions.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={transmissionStatusColorMap}
            label={getStatusLabel(getValue<string>())}
            size="sm"
          />
        ),
      },
      {
        accessorKey: 'payloadSize',
        header: t('isup.transmissions.colSize'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-xs tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatSize(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'retryCount',
        header: t('isup.transmissions.colRetries'),
        size: 80,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span
              className={cn(
                'tabular-nums text-xs',
                val > 0
                  ? 'text-orange-600 dark:text-orange-400 font-medium'
                  : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: 'errorMessage',
        header: t('isup.transmissions.colError'),
        size: 200,
        cell: ({ getValue }) => {
          const msg = getValue<string>();
          if (!msg) return <span className="text-neutral-400">--</span>;
          return (
            <span className="text-xs text-red-600 dark:text-red-400 truncate block max-w-[200px]" title={msg}>
              {msg}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => {
          const canRetry = row.original.status === 'ERROR' || row.original.status === 'REJECTED';
          if (!canRetry) return null;
          return (
            <Button
              variant="ghost"
              size="xs"
              iconLeft={
                retryingId === row.original.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RotateCcw size={12} />
                )
              }
              onClick={() => handleRetry(row.original.id)}
              disabled={retryingId === row.original.id}
            >
              {t('isup.transmissions.retry')}
            </Button>
          );
        },
      },
    ],
    [retryingId, handleRetry, getStatusLabel, getTypeLabel, formatSize],
  );

  const statusOptions = [
    { value: '', label: t('isup.transmissions.allStatuses') },
    { value: 'PENDING', label: t('isup.transmissions.statusPending') },
    { value: 'SENT', label: t('isup.transmissions.statusSent') },
    { value: 'ACCEPTED', label: t('isup.transmissions.statusAccepted') },
    { value: 'REJECTED', label: t('isup.transmissions.statusRejected') },
    { value: 'ERROR', label: t('isup.transmissions.statusError') },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('isup.transmissions.title')}
        subtitle={t('isup.transmissions.subtitle')}
        breadcrumbs={[
          { label: t('isup.transmissions.breadcrumbHome'), href: '/' },
          { label: t('isup.transmissions.breadcrumbSettings'), href: '/settings' },
          { label: t('isup.transmissions.breadcrumbIsup'), href: '/settings/isup' },
          { label: t('isup.transmissions.breadcrumbTransmissions') },
        ]}
        backTo="/settings/isup"
        actions={
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['isup-transmissions'] })}
          >
            {t('common.refresh')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Send size={16} />}
          label={t('isup.transmissions.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={16} />}
          label={t('isup.transmissions.metricPending')}
          value={metrics.pending}
        />
        <MetricCard
          icon={<XCircle size={16} />}
          label={t('isup.transmissions.metricFailed')}
          value={metrics.failed}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('isup.transmissions.metricSuccessRate')}
          value={`${metrics.successRate}%`}
        />
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
        <div className="flex items-center gap-4">
          <FormField label={t('isup.transmissions.filterStatus')} className="w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </FormField>
        </div>
      </div>

      {/* Table */}
      <DataTable<IsupTransmission>
        data={transmissions}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('isup.transmissions.emptyTitle')}
        emptyDescription={t('isup.transmissions.emptyDescription')}
      />
    </div>
  );
};

export default IsupTransmissionDashboard;
