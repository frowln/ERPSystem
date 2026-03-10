import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  leaveRequestStatusColorMap,
  leaveRequestStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { leaveApi } from '@/api/leave';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { LeaveRequest } from './types';
import type { PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REFUSED';

const getStatusFilterOptions = () => [
  { value: '', label: t('leave.requests.allStatuses') },
  { value: 'DRAFT', label: t('leave.requests.statusDraft') },
  { value: 'SUBMITTED', label: t('leave.requests.statusSubmitted') },
  { value: 'APPROVED', label: t('leave.requests.statusApproved') },
  { value: 'REFUSED', label: t('leave.requests.statusRefused') },
  { value: 'CANCELLED', label: t('leave.requests.statusCancelled') },
];


const LeaveRequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: requestData, isLoading } = useQuery<PaginatedResponse<LeaveRequest>>({
    queryKey: ['leave-requests'],
    queryFn: () => leaveApi.getLeaveRequests(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => leaveApi.approveLeaveRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const refuseMutation = useMutation({
    mutationFn: (id: string) => leaveApi.refuseLeaveRequest(id, t('leave.requests.refuseReason')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const requests = requestData?.content ?? [];

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (activeTab !== 'all') {
      filtered = filtered.filter((r) => r.status === activeTab);
    }
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.employeeName.toLowerCase().includes(lower) ||
          r.leaveTypeName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [requests, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    draft: requests.filter((r) => r.status === 'DRAFT').length,
    submitted: requests.filter((r) => r.status === 'SUBMITTED').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    refused: requests.filter((r) => r.status === 'REFUSED').length,
  }), [requests]);

  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'SUBMITTED').length;
    const approved = requests.filter((r) => r.status === 'APPROVED').length;
    const totalDays = requests.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.durationDays, 0);
    return { total: requests.length, pending, approved, totalDays };
  }, [requests]);

  const columns = useMemo<ColumnDef<LeaveRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('leave.requests.colNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'employeeName',
        header: t('leave.requests.colEmployee'),
        size: 230,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[210px]">{row.original.employeeName}</p>
            {row.original.departmentName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.departmentName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'leaveTypeName',
        header: t('leave.requests.colLeaveType'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-800 dark:text-neutral-200">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('leave.requests.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={leaveRequestStatusColorMap}
            label={leaveRequestStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'dateFrom',
        header: t('leave.requests.colPeriod'),
        size: 180,
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
            {formatDate(row.original.dateFrom)} - {formatDate(row.original.dateTo)}
          </span>
        ),
      },
      {
        accessorKey: 'durationDays',
        header: t('leave.requests.colDays'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-neutral-700 dark:text-neutral-300">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'approverName',
        header: t('leave.requests.colApprover'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        id: 'actions',
        header: t('leave.requests.colActions'),
        size: 180,
        cell: ({ row }) => {
          if (row.original.status !== 'SUBMITTED') return null;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  approveMutation.mutate(row.original.id);
                }}
                className="text-success-600 hover:text-success-700"
              >
                <CheckCircle size={14} className="mr-1" />
                {t('leave.requests.actionApprove')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  refuseMutation.mutate(row.original.id);
                }}
                className="text-danger-600 hover:text-danger-700"
              >
                <XCircle size={14} className="mr-1" />
                {t('leave.requests.actionRefuse')}
              </Button>
            </div>
          );
        },
      },
    ],
    [approveMutation, refuseMutation],
  );

  const handleRowClick = useCallback(
    (request: LeaveRequest) => navigate(`/leave/requests/${request.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('leave.requests.title')}
        subtitle={t('leave.requests.subtitleRequests', { count: String(requests.length) })}
        breadcrumbs={[
          { label: t('leave.requests.breadcrumbHome'), href: '/' },
          { label: t('leave.requests.breadcrumbLeave') },
          { label: t('leave.requests.breadcrumbRequests') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/leave/requests/new')}>
            {t('leave.requests.newRequest')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('leave.requests.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('leave.requests.tabDrafts'), count: tabCounts.draft },
          { id: 'SUBMITTED', label: t('leave.requests.tabSubmitted'), count: tabCounts.submitted },
          { id: 'APPROVED', label: t('leave.requests.tabApproved'), count: tabCounts.approved },
          { id: 'REFUSED', label: t('leave.requests.tabRefused'), count: tabCounts.refused },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Calendar size={18} />} label={t('leave.requests.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('leave.requests.metricPending')} value={metrics.pending} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('leave.requests.metricApproved')} value={metrics.approved} />
        <MetricCard icon={<Calendar size={18} />} label={t('leave.requests.metricTotalDays')} value={metrics.totalDays} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('leave.requests.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<LeaveRequest>
        data={filteredRequests}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('leave.requests.emptyTitle')}
        emptyDescription={t('leave.requests.emptyDescription')}
      />
    </div>
  );
};

export default LeaveRequestListPage;
