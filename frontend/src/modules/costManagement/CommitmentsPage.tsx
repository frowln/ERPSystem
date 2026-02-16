import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Handshake, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  commitmentStatusColorMap,
  commitmentStatusLabels,
  commitmentTypeColorMap,
  commitmentTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { costManagementApi } from '@/api/costManagement';
import { formatDate, formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Commitment } from './types';

type TabId = 'all' | 'COMMITTED' | 'PENDING' | 'DRAFT' | 'CLOSED';

const getTypeFilterOptions = () => [
  { value: '', label: t('costManagement.commitments.allTypes') },
  { value: 'SUBCONTRACT', label: t('costManagement.commitments.typeSubcontract') },
  { value: 'PURCHASE_ORDER', label: t('costManagement.commitments.typePurchaseOrder') },
  { value: 'SERVICE_AGREEMENT', label: t('costManagement.commitments.typeServiceAgreement') },
  { value: 'RENTAL', label: t('costManagement.commitments.typeRental') },
];

const CommitmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: commitmentData, isLoading } = useQuery({
    queryKey: ['commitments'],
    queryFn: () => costManagementApi.getCommitments(),
  });

  const commitments = commitmentData?.content ?? [];

  const filtered = useMemo(() => {
    let result = commitments;
    if (activeTab !== 'all') {
      result = result.filter((c) => c.status === activeTab);
    }
    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.number.toLowerCase().includes(lower) ||
          c.title.toLowerCase().includes(lower) ||
          c.vendorName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [commitments, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: commitments.length,
    committed: commitments.filter((c) => c.status === 'COMMITTED').length,
    pending: commitments.filter((c) => c.status === 'PENDING' || c.status === 'APPROVED').length,
    draft: commitments.filter((c) => c.status === 'DRAFT').length,
    closed: commitments.filter((c) => c.status === 'CLOSED').length,
  }), [commitments]);

  const metrics = useMemo(() => {
    const totalOriginal = commitments.reduce((s, c) => s + c.originalAmount, 0);
    const totalRevised = commitments.reduce((s, c) => s + c.revisedAmount, 0);
    const totalInvoiced = commitments.reduce((s, c) => s + c.invoicedAmount, 0);
    const totalRemaining = commitments.reduce((s, c) => s + c.remainingAmount, 0);
    return { total: commitments.length, totalOriginal, totalRevised, totalInvoiced, totalRemaining };
  }, [commitments]);

  const columns = useMemo<ColumnDef<Commitment, unknown>[]>(
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
        accessorKey: 'title',
        header: t('costManagement.commitments.columnName'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.vendorName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('costManagement.commitments.columnStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={commitmentStatusColorMap}
            label={commitmentStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'type',
        header: t('costManagement.commitments.columnType'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={commitmentTypeColorMap}
            label={commitmentTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'revisedAmount',
        header: t('costManagement.commitments.columnAmount'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'invoicedAmount',
        header: t('costManagement.commitments.columnInvoiced'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'remainingAmount',
        header: t('costManagement.commitments.columnRemaining'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 font-medium">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        id: 'progress',
        header: t('costManagement.commitments.columnUtilization'),
        size: 120,
        cell: ({ row }) => {
          const pct = row.original.revisedAmount > 0
            ? Math.round((row.original.invoicedAmount / row.original.revisedAmount) * 100)
            : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-14 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-medium text-neutral-600 tabular-nums">{pct}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'endDate',
        header: t('costManagement.commitments.columnDeadline'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (commitment: Commitment) => navigate(`/cost-management/commitments/${commitment.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costManagement.commitments.title')}
        subtitle={t('costManagement.commitments.subtitle', { count: String(commitments.length) })}
        breadcrumbs={[
          { label: t('costManagement.commitments.breadcrumbHome'), href: '/' },
          { label: t('costManagement.commitments.breadcrumbCostManagement') },
          { label: t('costManagement.commitments.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/cost-management/commitments/new')}>
            {t('costManagement.commitments.newCommitment')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('costManagement.commitments.tabAll'), count: tabCounts.all },
          { id: 'COMMITTED', label: t('costManagement.commitments.tabCommitted'), count: tabCounts.committed },
          { id: 'PENDING', label: t('costManagement.commitments.tabPending'), count: tabCounts.pending },
          { id: 'DRAFT', label: t('costManagement.commitments.tabDraft'), count: tabCounts.draft },
          { id: 'CLOSED', label: t('costManagement.commitments.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Handshake size={18} />} label={t('costManagement.commitments.totalCommitments')} value={metrics.total} />
        <MetricCard icon={<DollarSign size={18} />} label={t('costManagement.commitments.totalAmount')} value={formatMoneyCompact(metrics.totalRevised)} />
        <MetricCard label={t('costManagement.commitments.invoiced')} value={formatMoneyCompact(metrics.totalInvoiced)} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('costManagement.commitments.remainingToUtilize')}
          value={formatMoneyCompact(metrics.totalRemaining)}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('costManagement.commitments.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<Commitment>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('costManagement.commitments.emptyTitle')}
        emptyDescription={t('costManagement.commitments.emptyDescription')}
      />
    </div>
  );
};

export default CommitmentsPage;
