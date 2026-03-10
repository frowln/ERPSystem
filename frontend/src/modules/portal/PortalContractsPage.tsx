import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  FileCheck,
  DollarSign,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { formatDate, formatMoney, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { PortalContract, PortalContractStatus } from './types';

const statusColorMap: Record<PortalContractStatus, string> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  SUSPENDED: 'yellow',
  TERMINATED: 'red',
};

const getStatusLabels = (): Record<PortalContractStatus, string> => ({
  DRAFT: t('portal.contracts.statusDraft'),
  ACTIVE: t('portal.contracts.statusActive'),
  COMPLETED: t('portal.contracts.statusCompleted'),
  SUSPENDED: t('portal.contracts.statusSuspended'),
  TERMINATED: t('portal.contracts.statusTerminated'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('portal.contracts.statusAll') },
  { value: 'ACTIVE', label: t('portal.contracts.statusActive') },
  { value: 'COMPLETED', label: t('portal.contracts.statusCompleted') },
  { value: 'SUSPENDED', label: t('portal.contracts.statusSuspended') },
  { value: 'TERMINATED', label: t('portal.contracts.statusTerminated') },
];

const PortalContractsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: contractData, isLoading } = useQuery({
    queryKey: ['portal-contracts', statusFilter],
    queryFn: () => portalApi.getContracts({
      status: statusFilter ? statusFilter as PortalContractStatus : undefined,
    }),
  });

  const contracts = contractData?.content ?? [];

  const filteredContracts = useMemo(() => {
    if (!search) return contracts;
    const lower = search.toLowerCase();
    return contracts.filter(
      (c) =>
        c.contractNumber.toLowerCase().includes(lower) ||
        c.projectName.toLowerCase().includes(lower) ||
        c.title.toLowerCase().includes(lower),
    );
  }, [contracts, search]);

  const metrics = useMemo(() => {
    const active = contracts.filter((c) => c.status === 'ACTIVE').length;
    const totalAmount = contracts.reduce((s, c) => s + c.totalAmount, 0);
    const totalPaid = contracts.reduce((s, c) => s + c.paidAmount, 0);
    const paymentPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    return { total: contracts.length, active, totalAmount, totalPaid, paymentPercent };
  }, [contracts]);

  const columns = useMemo<ColumnDef<PortalContract, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    return [
      {
        accessorKey: 'contractNumber',
        header: t('portal.contracts.colNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-primary-600 dark:text-primary-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('portal.contracts.colProject'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">{row.original.projectName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">{row.original.title}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('portal.contracts.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<PortalContractStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('portal.contracts.colAmount'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'paidAmount',
        header: t('portal.contracts.colPaid'),
        size: 150,
        cell: ({ row }) => {
          const paid = row.original.paidAmount;
          const total = row.original.totalAmount;
          const pct = total > 0 ? (paid / total) * 100 : 0;
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(paid)}</span>
              <span className="text-xs text-neutral-400">({formatPercent(pct)})</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'startDate',
        header: t('portal.contracts.colStartDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 tabular-nums text-sm">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'endDate',
        header: t('portal.contracts.colEndDate'),
        size: 110,
        cell: ({ row }) => {
          const endDate = row.original.endDate;
          const isOverdue = new Date(endDate) < new Date() && row.original.status === 'ACTIVE';
          return (
            <span className={`tabular-nums text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {formatDate(endDate)}
            </span>
          );
        },
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.contracts.title')}
        subtitle={t('portal.contracts.subtitle', { count: String(contracts.length) })}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: t('portal.contracts.breadcrumb') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileCheck size={18} />} label={t('portal.contracts.metricTotal')} value={metrics.total} />
        <MetricCard icon={<FileCheck size={18} />} label={t('portal.contracts.metricActive')} value={metrics.active} />
        <MetricCard icon={<DollarSign size={18} />} label={t('portal.contracts.metricTotalAmount')} value={formatMoney(metrics.totalAmount)} />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('portal.contracts.metricPaymentProgress')}
          value={formatPercent(metrics.paymentPercent)}
          trend={metrics.paymentPercent > 50
            ? { direction: 'up', value: t('portal.contracts.trendOnTrack') }
            : undefined}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('portal.contracts.searchPlaceholder')}
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

      <DataTable<PortalContract>
        data={filteredContracts}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('portal.contracts.emptyTitle')}
        emptyDescription={t('portal.contracts.emptyDescription')}
      />
    </div>
  );
};

export default PortalContractsPage;
