import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Wrench, Clock, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  maintenanceRequestStatusColorMap,
  maintenanceRequestStatusLabels,
  maintenancePriorityColorMap,
  maintenancePriorityLabels,
  maintenanceTypeColorMap,
  maintenanceTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { maintenanceApi } from '@/api/maintenance';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { MaintenanceRequest } from './types';

type TabId = 'all' | 'NEW' | 'IN_PROGRESS' | 'REPAIRED';

const getStatusFilterOptions = () => [
  { value: '', label: t('maintenance.filterAllStatuses') },
  { value: 'NEW', label: t('maintenance.requestStatusNew') },
  { value: 'IN_PROGRESS', label: t('maintenance.requestStatusInProgress') },
  { value: 'REPAIRED', label: t('maintenance.requestStatusRepaired') },
  { value: 'SCRAP', label: t('maintenance.requestStatusScrap') },
  { value: 'CANCELLED', label: t('maintenance.requestStatusCancelled') },
];

const getTypeFilterOptions = () => [
  { value: '', label: t('maintenance.filterAllTypes') },
  { value: 'CORRECTIVE', label: t('maintenance.filterCorrective') },
  { value: 'PREVENTIVE', label: t('maintenance.filterPreventive') },
  { value: 'PREDICTIVE', label: t('maintenance.filterPredictive') },
];

const MaintenanceRequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: requestData, isLoading } = useQuery({
    queryKey: ['maintenance-requests'],
    queryFn: () => maintenanceApi.getRequests(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      maintenanceApi.updateRequestStatus(id, status as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await maintenanceApi.deleteRequest(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast.success(t('maintenance.bulkDeleteSuccess'));
    },
    onError: () => {
      toast.error(t('maintenance.bulkDeleteError'));
    },
  });

  const requests = requestData?.content ?? [];

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (activeTab !== 'all') {
      filtered = filtered.filter((r) => r.status === activeTab);
    }
    if (typeFilter) {
      filtered = filtered.filter((r) => r.maintenanceType === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.name.toLowerCase().includes(lower) ||
          r.equipmentName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [requests, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    new: requests.filter((r) => r.status === 'NEW').length,
    in_progress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
    repaired: requests.filter((r) => r.status === 'REPAIRED').length,
  }), [requests]);

  const metrics = useMemo(() => {
    const totalCost = requests.reduce((s, r) => s + (r.cost ?? 0), 0);
    const urgentCount = requests.filter((r) => r.priority === 'URGENT' || r.priority === 'HIGH').length;
    const completedCount = requests.filter((r) => r.status === 'REPAIRED').length;
    return { total: requests.length, totalCost, urgentCount, completedCount };
  }, [requests]);

  const columns = useMemo<ColumnDef<MaintenanceRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('maintenance.colNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('maintenance.colRequest'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.equipmentName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('maintenance.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={maintenanceRequestStatusColorMap}
            label={maintenanceRequestStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('maintenance.colPriority'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={maintenancePriorityColorMap}
            label={maintenancePriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'maintenanceType',
        header: t('maintenance.colType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={maintenanceTypeColorMap}
            label={maintenanceTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'COST',
        header: t('maintenance.colCost'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
              {val ? formatMoneyCompact(val) : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignedToName',
        header: t('maintenance.colAssignee'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        id: 'statusAction',
        header: t('maintenance.colAction'),
        size: 150,
        cell: ({ row }) => {
          const r = row.original;
          if (r.status === 'NEW') {
            return (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: r.id, status: 'IN_PROGRESS' }); }}>
                {t('maintenance.actionStartWork')}
              </Button>
            );
          }
          if (r.status === 'IN_PROGRESS') {
            return (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: r.id, status: 'REPAIRED' }); }}>
                {t('maintenance.actionComplete')}
              </Button>
            );
          }
          return null;
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('maintenance.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [statusMutation],
  );

  const handleRowClick = useCallback(
    (request: MaintenanceRequest) => navigate(`/maintenance/requests/${request.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('maintenance.requestsTitle')}
        subtitle={t('maintenance.requestsCount', { count: requests.length })}
        breadcrumbs={[
          { label: t('maintenance.breadcrumbHome'), href: '/' },
          { label: t('maintenance.breadcrumbMaintenance') },
          { label: t('maintenance.breadcrumbRequests') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/maintenance/requests/new')}>
            {t('maintenance.newRequest')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('maintenance.tabAll'), count: tabCounts.all },
          { id: 'NEW', label: t('maintenance.tabNew'), count: tabCounts.new },
          { id: 'IN_PROGRESS', label: t('maintenance.tabInProgress'), count: tabCounts.in_progress },
          { id: 'REPAIRED', label: t('maintenance.tabCompleted'), count: tabCounts.repaired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Wrench size={18} />} label={t('maintenance.metricTotalRequests')} value={metrics.total} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('maintenance.metricUrgent')} value={metrics.urgentCount} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('maintenance.metricCompleted')} value={metrics.completedCount} />
        <MetricCard icon={<Clock size={18} />} label={t('maintenance.metricTotalCosts')} value={formatMoneyCompact(metrics.totalCost)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('maintenance.searchRequestPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<MaintenanceRequest>
        data={filteredRequests ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: t('maintenance.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('maintenance.bulkDeleteConfirmTitle', { count: ids.length }),
                description: t('maintenance.bulkDeleteConfirmDescription'),
                confirmLabel: t('maintenance.bulkDeleteConfirmLabel'),
                cancelLabel: t('maintenance.bulkDeleteCancelLabel'),
              });
              if (!isConfirmed) return;
              deleteRequestMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('maintenance.emptyRequestsTitle')}
        emptyDescription={t('maintenance.emptyRequestsDescription')}
      />
    </div>
  );
};

export default MaintenanceRequestListPage;
