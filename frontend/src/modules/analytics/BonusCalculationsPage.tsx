import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, DollarSign, Users, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { kpiBonusesApi } from '@/api/kpiBonuses';
import { formatMoney, formatDate } from '@/lib/format';
import type { BonusCalculation, BonusStatus } from './types';
import type { PaginatedResponse } from '@/types';
import { t } from '@/i18n';

const bonusStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  calculated: 'blue',
  approved: 'green',
  paid: 'purple',
  cancelled: 'red',
};

const getBonusStatusLabels = (): Record<string, string> => ({
  draft: t('analytics.bonusCalculations.statusDraft'),
  calculated: t('analytics.bonusCalculations.statusCalculated'),
  approved: t('analytics.bonusCalculations.statusApproved'),
  paid: t('analytics.bonusCalculations.statusPaid'),
  cancelled: t('analytics.bonusCalculations.statusCancelled'),
});

type TabId = 'all' | 'CALCULATED' | 'APPROVED' | 'PAID';

const getStatusFilterOptions = () => [
  { value: '', label: t('analytics.bonusCalculations.allStatuses') },
  { value: 'DRAFT', label: t('analytics.bonusCalculations.statusDraft') },
  { value: 'CALCULATED', label: t('analytics.bonusCalculations.statusCalculated') },
  { value: 'APPROVED', label: t('analytics.bonusCalculations.statusApproved') },
  { value: 'PAID', label: t('analytics.bonusCalculations.statusPaid') },
  { value: 'CANCELLED', label: t('analytics.bonusCalculations.statusCancelled') },
];


const BonusCalculationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const bonusStatusLabels = getBonusStatusLabels();

  const { data, isLoading } = useQuery<PaginatedResponse<BonusCalculation>>({
    queryKey: ['bonus-calculations'],
    queryFn: () => kpiBonusesApi.getBonusCalculations(),
  });

  const bonuses = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = bonuses;
    if (activeTab !== 'all') result = result.filter((b) => b.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (b) => b.number.toLowerCase().includes(lower) || b.employeeName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [bonuses, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: bonuses.length,
    calculated: bonuses.filter((b) => b.status === 'CALCULATED').length,
    approved: bonuses.filter((b) => b.status === 'APPROVED').length,
    paid: bonuses.filter((b) => b.status === 'PAID').length,
  }), [bonuses]);

  const metrics = useMemo(() => {
    const totalAmount = bonuses.reduce((s, b) => s + b.bonusAmount, 0);
    const paidAmount = bonuses.filter((b) => b.status === 'PAID').reduce((s, b) => s + b.bonusAmount, 0);
    const avgAchievement = bonuses.length > 0 ? bonuses.reduce((s, b) => s + b.totalAchievement, 0) / bonuses.length : 0;
    return { total: bonuses.length, totalAmount, paidAmount, avgAchievement };
  }, [bonuses]);

  const columns = useMemo<ColumnDef<BonusCalculation, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 140,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'employeeName',
        header: t('analytics.bonusCalculations.colEmployee'),
        size: 180,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.employeeName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.employeePosition}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('analytics.bonusCalculations.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={bonusStatusColorMap}
            label={bonusStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'period',
        header: t('analytics.bonusCalculations.colPeriod'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'totalAchievement',
        header: t('analytics.bonusCalculations.colAchievement'),
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          const color = val >= 100 ? 'text-success-600' : val >= 80 ? 'text-warning-600' : 'text-danger-600';
          return <span className={`tabular-nums font-semibold ${color}`}>{val.toFixed(1)}%</span>;
        },
      },
      {
        accessorKey: 'baseSalary',
        header: t('analytics.bonusCalculations.colSalary'),
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'bonusPercent',
        header: t('analytics.bonusCalculations.colBonusPct'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<number>()}%</span>,
      },
      {
        accessorKey: 'bonusAmount',
        header: t('analytics.bonusCalculations.colBonusAmount'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'kpiCount',
        header: 'KPI',
        size: 60,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()}</span>,
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.bonusCalculations.title')}
        subtitle={`${bonuses.length} ${t('analytics.bonusCalculations.calculationsCount')}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('analytics.dashboard.title'), href: '/analytics' },
          { label: t('analytics.bonusCalculations.title') },
        ]}
        tabs={[
          { id: 'all', label: t('analytics.bonusCalculations.tabAll'), count: tabCounts.all },
          { id: 'CALCULATED', label: t('analytics.bonusCalculations.tabCalculated'), count: tabCounts.calculated },
          { id: 'APPROVED', label: t('analytics.bonusCalculations.tabApproved'), count: tabCounts.approved },
          { id: 'PAID', label: t('analytics.bonusCalculations.tabPaid'), count: tabCounts.paid },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('analytics.bonusCalculations.totalCalculations')} value={metrics.total} />
        <MetricCard icon={<DollarSign size={18} />} label={t('analytics.bonusCalculations.totalAmount')} value={formatMoney(metrics.totalAmount)} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('analytics.bonusCalculations.paidAmount')} value={formatMoney(metrics.paidAmount)} />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('analytics.bonusCalculations.avgAchievement')}
          value={`${metrics.avgAchievement.toFixed(1)}%`}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('analytics.bonusCalculations.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<BonusCalculation>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('analytics.bonusCalculations.emptyTitle')}
        emptyDescription={t('analytics.bonusCalculations.emptyDescription')}
      />
    </div>
  );
};

export default BonusCalculationsPage;
