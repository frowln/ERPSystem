import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Calendar, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  leaveAllocationStatusColorMap,
  leaveAllocationStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { leaveApi } from '@/api/leave';
import { t } from '@/i18n';
import type { LeaveAllocation } from './types';

const getStatusFilterOptions = () => [
  { value: '', label: t('leave.allocations.allStatuses') },
  { value: 'DRAFT', label: t('leave.allocations.statusDraft') },
  { value: 'APPROVED', label: t('leave.allocations.statusApproved') },
  { value: 'EXPIRED', label: t('leave.allocations.statusExpired') },
];

const LeaveAllocationPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: allocationData, isLoading } = useQuery({
    queryKey: ['leave-allocations'],
    queryFn: () => leaveApi.getLeaveAllocations(),
  });

  const allocations = allocationData?.content ?? [];

  const filteredAllocations = useMemo(() => {
    let filtered = allocations;
    if (statusFilter) {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(lower) ||
          a.leaveTypeName.toLowerCase().includes(lower) ||
          (a.departmentName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [allocations, statusFilter, search]);

  const metrics = useMemo(() => {
    const totalAllocated = allocations.reduce((s, a) => s + a.allocatedDays, 0);
    const totalUsed = allocations.reduce((s, a) => s + a.usedDays, 0);
    const totalRemaining = allocations.reduce((s, a) => s + a.remainingDays, 0);
    const uniqueEmployees = new Set(allocations.map((a) => a.employeeId)).size;
    return { totalAllocated, totalUsed, totalRemaining, uniqueEmployees };
  }, [allocations]);

  const columns = useMemo<ColumnDef<LeaveAllocation, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: t('leave.allocations.colEmployee'),
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
        header: t('leave.allocations.colLeaveType'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-800 dark:text-neutral-200">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'year',
        header: t('leave.allocations.colYear'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('leave.allocations.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={leaveAllocationStatusColorMap}
            label={leaveAllocationStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'allocatedDays',
        header: t('leave.allocations.colAllocated'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-neutral-700 dark:text-neutral-300">{getValue<number>()} {t('leave.allocations.daysSuffix')}</span>
        ),
      },
      {
        accessorKey: 'usedDays',
        header: t('leave.allocations.colUsed'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-600">{getValue<number>()} {t('leave.allocations.daysSuffix')}</span>
        ),
      },
      {
        accessorKey: 'remainingDays',
        header: t('leave.allocations.colRemaining'),
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className={`tabular-nums text-sm font-medium ${val > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {val} {t('leave.allocations.daysSuffix')}
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: t('leave.allocations.colProgress'),
        size: 140,
        cell: ({ row }) => {
          const pct = row.original.allocatedDays > 0
            ? Math.round((row.original.usedDays / row.original.allocatedDays) * 100)
            : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct > 80 ? 'bg-danger-500' : pct > 50 ? 'bg-warning-500' : 'bg-success-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400 w-8">{pct}%</span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (allocation: LeaveAllocation) => navigate(`/leave/allocations/${allocation.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('leave.allocations.title')}
        subtitle={t('leave.allocations.subtitleRecords', { count: String(allocations.length) })}
        breadcrumbs={[
          { label: t('leave.allocations.breadcrumbHome'), href: '/' },
          { label: t('leave.allocations.breadcrumbLeave') },
          { label: t('leave.allocations.breadcrumbAllocations') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/leave/allocations/new')}>
            {t('leave.allocations.newAllocation')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('leave.allocations.metricEmployees')} value={metrics.uniqueEmployees} />
        <MetricCard icon={<Calendar size={18} />} label={t('leave.allocations.metricAllocated')} value={metrics.totalAllocated} />
        <MetricCard icon={<TrendingUp size={18} />} label={t('leave.allocations.metricUsed')} value={metrics.totalUsed} />
        <MetricCard icon={<BarChart3 size={18} />} label={t('leave.allocations.metricRemaining')} value={metrics.totalRemaining} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('leave.allocations.searchPlaceholder')}
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

      <DataTable<LeaveAllocation>
        data={filteredAllocations}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('leave.allocations.emptyTitle')}
        emptyDescription={t('leave.allocations.emptyDescription')}
      />
    </div>
  );
};

export default LeaveAllocationPage;
