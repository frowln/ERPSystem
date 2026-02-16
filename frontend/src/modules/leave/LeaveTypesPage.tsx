import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Tag, Users, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { leaveApi } from '@/api/leave';
import { t } from '@/i18n';
import type { LeaveType } from './types';

const LeaveTypesPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: leaveTypes, isLoading } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveApi.getLeaveTypes(),
  });

  const types = leaveTypes ?? [];

  const filteredTypes = useMemo(() => {
    if (!search) return types;
    const lower = search.toLowerCase();
    return types.filter(
      (tp) =>
        tp.name.toLowerCase().includes(lower) ||
        tp.code.toLowerCase().includes(lower),
    );
  }, [types, search]);

  const metrics = useMemo(() => {
    const active = types.filter((tp) => tp.isActive).length;
    const paid = types.filter((tp) => tp.isPaid).length;
    const totalEmployees = types.reduce((s, tp) => s + tp.employeeCount, 0);
    return { total: types.length, active, paid, totalEmployees };
  }, [types]);

  const columns = useMemo<ColumnDef<LeaveType, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('leave.types.colCode'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('leave.types.colName'),
        size: 250,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: row.original.color }}
            />
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'isPaid',
        header: t('leave.types.colPaid'),
        size: 100,
        cell: ({ getValue }) => (
          <span className={`text-sm font-medium ${getValue<boolean>() ? 'text-success-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {getValue<boolean>() ? t('leave.types.paidYes') : t('leave.types.paidNo')}
          </span>
        ),
      },
      {
        accessorKey: 'requiresApproval',
        header: t('leave.types.colApproval'),
        size: 120,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1">
            {getValue<boolean>() ? (
              <><CheckCircle size={14} className="text-warning-500" /><span className="text-sm text-neutral-700 dark:text-neutral-300">{t('leave.types.approvalRequired')}</span></>
            ) : (
              <><XCircle size={14} className="text-neutral-400" /><span className="text-sm text-neutral-500 dark:text-neutral-400">{t('leave.types.approvalNo')}</span></>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'maxDaysPerYear',
        header: t('leave.types.colMaxDays'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">{getValue<number>() ?? t('leave.types.noLimit')}</span>
        ),
      },
      {
        accessorKey: 'employeeCount',
        header: t('leave.types.colEmployees'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-primary-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('leave.types.colActive'),
        size: 100,
        cell: ({ getValue }) => (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getValue<boolean>() ? 'bg-success-50 text-success-700' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${getValue<boolean>() ? 'bg-success-500' : 'bg-neutral-400'}`} />
            {getValue<boolean>() ? t('leave.types.activeYes') : t('leave.types.activeNo')}
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (leaveType: LeaveType) => navigate(`/leave/types/${leaveType.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('leave.types.title')}
        subtitle={t('leave.types.subtitleTypes', { count: String(types.length) })}
        breadcrumbs={[
          { label: t('leave.types.breadcrumbHome'), href: '/' },
          { label: t('leave.types.breadcrumbLeave') },
          { label: t('leave.types.breadcrumbTypes') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/leave/types/new')}>
            {t('leave.types.newType')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Tag size={18} />} label={t('leave.types.metricTotal')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('leave.types.metricActive')} value={metrics.active} />
        <MetricCard icon={<Tag size={18} />} label={t('leave.types.metricPaid')} value={metrics.paid} />
        <MetricCard icon={<Users size={18} />} label={t('leave.types.metricEmployees')} value={metrics.totalEmployees} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('leave.types.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<LeaveType>
        data={filteredTypes}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('leave.types.emptyTitle')}
        emptyDescription={t('leave.types.emptyDescription')}
      />
    </div>
  );
};

export default LeaveTypesPage;
