import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { revenueRecognitionApi } from '@/api/revenueRecognition';
import { formatDate, formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { RevenueContract, RevenueContractStatus, RecognitionMethod } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  ACTIVE: 'green',
  COMPLETED: 'blue',
  SUSPENDED: 'yellow',
  TERMINATED: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('revenueRecognition.statusActive'),
  COMPLETED: t('revenueRecognition.statusCompleted'),
  SUSPENDED: t('revenueRecognition.statusSuspended'),
  TERMINATED: t('revenueRecognition.statusTerminated'),
});

const getMethodLabels = (): Record<string, string> => ({
  PERCENTAGE_OF_COMPLETION: t('revenueRecognition.methodPercentage'),
  COMPLETED_CONTRACT: t('revenueRecognition.methodCompleted'),
  INPUT_METHOD: t('revenueRecognition.methodInput'),
  OUTPUT_METHOD: t('revenueRecognition.methodOutput'),
});

const getStandardLabels = (): Record<string, string> => ({
  IFRS_15: t('revenueRecognition.standardIFRS15'),
  ASC_606: 'ASC 606',
  RAS: t('revenueRecognition.standardRAS'),
});

type TabId = 'all' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';


const RevenueContractListPage: React.FC = () => {
  const navigate = useNavigate();
  const statusLabels = getStatusLabels();
  const methodLabels = getMethodLabels();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-contracts'],
    queryFn: () => revenueRecognitionApi.getContracts(),
  });

  const contracts = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = contracts;
    if (activeTab === 'ACTIVE') result = result.filter((c) => c.status === 'ACTIVE');
    else if (activeTab === 'COMPLETED') result = result.filter((c) => c.status === 'COMPLETED');
    else if (activeTab === 'SUSPENDED') result = result.filter((c) => c.status === 'SUSPENDED' || c.status === 'TERMINATED');

    if (methodFilter) result = result.filter((c) => c.method === methodFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.contractName.toLowerCase().includes(lower) ||
          c.contractNumber.toLowerCase().includes(lower) ||
          c.clientName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [contracts, activeTab, methodFilter, search]);

  const counts = useMemo(() => ({
    all: contracts.length,
    active: contracts.filter((c) => c.status === 'ACTIVE').length,
    completed: contracts.filter((c) => c.status === 'COMPLETED').length,
    suspended: contracts.filter((c) => c.status === 'SUSPENDED' || c.status === 'TERMINATED').length,
  }), [contracts]);

  const totals = useMemo(() => {
    const totalRevenue = contracts.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalRecognized = contracts.reduce((sum, c) => sum + c.recognizedRevenue, 0);
    const avgMargin = contracts.length > 0
      ? contracts.reduce((sum, c) => sum + c.grossMargin, 0) / contracts.length
      : 0;
    return { totalRevenue, totalRecognized, avgMargin };
  }, [contracts]);

  const columns = useMemo<ColumnDef<RevenueContract, unknown>[]>(
    () => [
      {
        accessorKey: 'contractNumber',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'contractName',
        header: t('revenueRecognition.colContract'),
        size: 240,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[220px]">{row.original.contractName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.clientName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('common.status'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'method',
        header: t('revenueRecognition.colMethod'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-600">{methodLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'totalRevenue',
        header: t('revenueRecognition.totalRevenue'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{formatMoneyCompact(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'recognizedRevenue',
        header: t('revenueRecognition.recognized'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-green-600">{formatMoneyCompact(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'percentComplete',
        header: t('revenueRecognition.percentComplete'),
        size: 130,
        cell: ({ getValue }) => {
          const pct = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs tabular-nums w-10 text-right">{formatPercent(pct)}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'grossMargin',
        header: t('revenueRecognition.margin'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatPercent(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (c: RevenueContract) => navigate(`/revenue/contracts/${c.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('revenueRecognition.contractsTitle')}
        subtitle={t('revenueRecognition.contractsSubtitle', { count: String(contracts.length) })}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('revenueRecognition.title'), href: '/revenue' },
          { label: t('revenueRecognition.contracts') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/revenue/contracts/new')}>
            {t('revenueRecognition.newContract')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'ACTIVE', label: t('revenueRecognition.tabActive'), count: counts.active },
          { id: 'COMPLETED', label: t('revenueRecognition.tabCompleted'), count: counts.completed },
          { id: 'SUSPENDED', label: t('revenueRecognition.tabSuspended'), count: counts.suspended },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('revenueRecognition.totalContracts')} value={counts.all} />
        <MetricCard icon={<DollarSign size={18} />} label={t('revenueRecognition.totalRevenue')} value={formatMoneyCompact(totals.totalRevenue)} />
        <MetricCard icon={<TrendingUp size={18} />} label={t('revenueRecognition.recognized')} value={formatMoneyCompact(totals.totalRecognized)} />
        <MetricCard icon={<BarChart3 size={18} />} label={t('revenueRecognition.avgMargin')} value={formatPercent(totals.avgMargin)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('revenueRecognition.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('revenueRecognition.allMethods') },
            ...Object.entries(methodLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<RevenueContract>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('revenueRecognition.emptyTitle')}
        emptyDescription={t('revenueRecognition.contractsEmptyDescription')}
      />
    </div>
  );
};

export default RevenueContractListPage;
