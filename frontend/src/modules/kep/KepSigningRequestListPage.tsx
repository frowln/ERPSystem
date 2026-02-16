import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, FilePen, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { kepApi } from '@/api/kep';
import { formatDate } from '@/lib/format';
import type { KepSigningRequest } from './types';
import { t } from '@/i18n';

const signingStatusColorMap: Record<string, 'yellow' | 'green' | 'red' | 'gray' | 'orange'> = {
  pending: 'yellow',
  signed: 'green',
  rejected: 'red',
  expired: 'orange',
  cancelled: 'gray',
};

const getSigningStatusLabels = (): Record<string, string> => ({
  pending: t('kepModule.statusPending'),
  signed: t('kepModule.statusSigned'),
  rejected: t('kepModule.statusRejected'),
  expired: t('kepModule.statusExpired'),
  cancelled: t('kepModule.statusCancelled'),
});

const signingPriorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const getSigningPriorityLabels = (): Record<string, string> => ({
  low: t('kepModule.priorityLow'),
  medium: t('kepModule.priorityMedium'),
  high: t('kepModule.priorityHigh'),
  critical: t('kepModule.priorityCritical'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('kepModule.filterAllStatuses') },
  { value: 'PENDING', label: t('kepModule.filterPending') },
  { value: 'SIGNED', label: t('kepModule.filterSigned') },
  { value: 'REJECTED', label: t('kepModule.filterRejected') },
  { value: 'EXPIRED', label: t('kepModule.filterExpired') },
  { value: 'CANCELLED', label: t('kepModule.filterCancelled') },
];

const getPriorityFilterOptions = () => [
  { value: '', label: t('kepModule.filterAllPriorities') },
  { value: 'LOW', label: t('kepModule.priorityLow') },
  { value: 'MEDIUM', label: t('kepModule.priorityMedium') },
  { value: 'HIGH', label: t('kepModule.priorityHigh') },
  { value: 'CRITICAL', label: t('kepModule.priorityCritical') },
];

type TabId = 'all' | 'PENDING' | 'SIGNED' | 'REJECTED';


const KepSigningRequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['kep-signing-requests'],
    queryFn: () => kepApi.getSigningRequests(),
  });

  const signMutation = useMutation({
    mutationFn: ({ id, certificateId }: { id: string; certificateId: string }) => kepApi.signRequest(id, certificateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => kepApi.rejectRequest(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kep-signing-requests'] }),
  });

  const requests = requestsData?.content ?? [];

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (activeTab === 'PENDING') {
      filtered = filtered.filter((r) => r.status === 'PENDING');
    } else if (activeTab === 'SIGNED') {
      filtered = filtered.filter((r) => r.status === 'SIGNED');
    } else if (activeTab === 'REJECTED') {
      filtered = filtered.filter((r) => r.status === 'REJECTED' || r.status === 'EXPIRED');
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.documentName.toLowerCase().includes(lower) ||
          r.signerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [requests, activeTab, statusFilter, priorityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    signed: requests.filter((r) => r.status === 'SIGNED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED' || r.status === 'EXPIRED').length,
  }), [requests]);

  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const signed = requests.filter((r) => r.status === 'SIGNED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;
    const expired = requests.filter((r) => r.status === 'EXPIRED').length;
    return { total: requests.length, pending, signed, rejected, expired };
  }, [requests]);

  const columns = useMemo<ColumnDef<KepSigningRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'documentName',
        header: t('kepModule.colDocument'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.documentName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('kepModule.colStatus'),
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={signingStatusColorMap}
            label={getSigningStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('kepModule.colPriority'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={signingPriorityColorMap}
            label={getSigningPriorityLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'signerName',
        header: t('kepModule.colSigner'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('kepModule.colDueDate'),
        size: 120,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue = dueDate && new Date(dueDate) < new Date() && row.original.status === 'PENDING';
          return (
            <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(dueDate)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 160,
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') {
            return (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/kep/signing-requests/${row.original.id}`);
                }}
              >
                {t('kepModule.openButton')}
              </Button>
            );
          }
          return (
            <div className="flex gap-1">
              <Button
                variant="primary"
                size="xs"
                iconLeft={<CheckCircle size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  signMutation.mutate({ id: row.original.id, certificateId: 'default' });
                }}
              >
                {t('kepModule.signButton')}
              </Button>
              <Button
                variant="danger"
                size="xs"
                iconLeft={<XCircle size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  rejectMutation.mutate({ id: row.original.id, reason: t('kepModule.statusRejected') });
                }}
              >
                {t('kepModule.rejectButton')}
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate, signMutation, rejectMutation],
  );

  const handleRowClick = useCallback(
    (req: KepSigningRequest) => navigate(`/kep/signing-requests/${req.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('kepModule.title')}
        subtitle={t('kepModule.subtitle', { count: String(requests.length) })}
        breadcrumbs={[
          { label: t('kepModule.breadcrumbHome'), href: '/' },
          { label: t('kepModule.breadcrumbKep') },
          { label: t('kepModule.breadcrumbSigningRequests') },
        ]}
        tabs={[
          { id: 'all', label: t('kepModule.tabAll'), count: tabCounts.all },
          { id: 'PENDING', label: t('kepModule.tabPending'), count: tabCounts.pending },
          { id: 'SIGNED', label: t('kepModule.tabSigned'), count: tabCounts.signed },
          { id: 'REJECTED', label: t('kepModule.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FilePen size={18} />}
          label={t('kepModule.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('kepModule.metricPending')}
          value={metrics.pending}
          trend={metrics.pending > 0 ? { direction: 'up', value: t('kepModule.trendPcs', { count: String(metrics.pending) }) } : undefined}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('kepModule.metricSigned')}
          value={metrics.signed}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('kepModule.metricRejectedExpired')}
          value={metrics.rejected + metrics.expired}
          trend={metrics.rejected + metrics.expired > 0 ? { direction: 'down', value: t('kepModule.trendNeedAttention') } : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('kepModule.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-52"
        />
        <Select
          options={getPriorityFilterOptions()}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<KepSigningRequest>
        data={filteredRequests}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('kepModule.emptyTitle')}
        emptyDescription={t('kepModule.emptyDescription')}
      />
    </div>
  );
};

export default KepSigningRequestListPage;
