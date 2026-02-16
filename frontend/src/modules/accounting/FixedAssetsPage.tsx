import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Building, Layers } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select } from '@/design-system/components/FormField';
import { accountingApi, type FixedAsset, type FixedAssetStatus } from '@/api/accounting';
import { formatMoney, formatDate, formatPercent } from '@/lib/format';
import { t } from '@/i18n';

type TabId = 'all' | FixedAssetStatus;

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  DISPOSED: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  DRAFT: t('accounting.faStatusDraft'),
  ACTIVE: t('accounting.faStatusActive'),
  DISPOSED: t('accounting.faStatusDisposed'),
});

const getDepreciationLabels = (): Record<string, string> => ({
  LINEAR: t('accounting.faDeprLinear'),
  REDUCING_BALANCE: t('accounting.faDeprReducingBalance'),
  SUM_OF_YEARS: t('accounting.faDeprSumOfYears'),
});

const FixedAssetsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [depreciationFilter, setDepreciationFilter] = useState('');

  const statusLabels = getStatusLabels();
  const depreciationLabels = getDepreciationLabels();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['fixed-assets'],
    queryFn: () => accountingApi.getFixedAssets({ page: 0, size: 300, sort: 'createdAt,desc' }),
  });

  const assets = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = assets;

    if (activeTab !== 'all') {
      result = result.filter((asset) => asset.status === activeTab);
    }

    if (depreciationFilter) {
      result = result.filter((asset) => asset.depreciationMethod === depreciationFilter);
    }

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(normalizedSearch) ||
          asset.inventoryNumber.toLowerCase().includes(normalizedSearch) ||
          asset.code.toLowerCase().includes(normalizedSearch),
      );
    }

    return result;
  }, [assets, activeTab, depreciationFilter, search]);

  const totalOriginal = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.purchaseAmount, 0),
    [assets],
  );

  const totalResidual = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
    [assets],
  );

  const totalDepreciation = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0),
    [assets],
  );

  const totalMonthlyDepreciation = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.monthlyDepreciation, 0),
    [assets],
  );

  const columns = useMemo<ColumnDef<FixedAsset, unknown>[]>(
    () => [
      {
        accessorKey: 'inventoryNumber',
        header: t('accounting.faColInventoryNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('accounting.faColName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('accounting.faColCode', { code: row.original.code })}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('accounting.faColStatus'),
        size: 140,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={statusColorMap}
            label={row.original.statusDisplayName ?? statusLabels[row.original.status]}
          />
        ),
      },
      {
        accessorKey: 'purchaseDate',
        header: t('accounting.faColPurchaseDate'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'purchaseAmount',
        header: t('accounting.faColOriginalCost'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'currentValue',
        header: t('accounting.faColCurrentValue'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-medium">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'monthlyDepreciation',
        header: t('accounting.faColMonthlyDepr'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-600">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        id: 'wearPercent',
        header: t('accounting.faColWear'),
        size: 110,
        cell: ({ row }) => {
          const original = row.original.purchaseAmount;
          if (original <= 0) return <span>—</span>;
          const percent = (row.original.accumulatedDepreciation / original) * 100;
          return <span className="tabular-nums text-sm">{formatPercent(percent)}</span>;
        },
      },
    ],
    [statusLabels],
  );

  if (isError && assets.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('accounting.faTitle')}
          subtitle={t('accounting.faSubtitleRegistry')}
          breadcrumbs={[
            { label: t('accounting.breadcrumbHome'), href: '/' },
            { label: t('accounting.breadcrumbAccounting'), href: '/accounting' },
            { label: t('accounting.breadcrumbFixedAssets') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('accounting.faErrorTitle')}
          description={t('accounting.checkConnectionTryAgain')}
          actionLabel={t('accounting.retry')}
          onAction={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('accounting.faTitle')}
        subtitle={t('accounting.faSubtitleCount', { count: assets.length })}
        breadcrumbs={[
          { label: t('accounting.breadcrumbHome'), href: '/' },
          { label: t('accounting.breadcrumbAccounting'), href: '/accounting' },
          { label: t('accounting.breadcrumbFixedAssets') },
        ]}
        tabs={[
          { id: 'all', label: t('accounting.faTabAll'), count: assets.length },
          { id: 'DRAFT', label: t('accounting.faTabDraft'), count: assets.filter((asset) => asset.status === 'DRAFT').length },
          { id: 'ACTIVE', label: t('accounting.faTabActive'), count: assets.filter((asset) => asset.status === 'ACTIVE').length },
          { id: 'DISPOSED', label: t('accounting.faTabDisposed'), count: assets.filter((asset) => asset.status === 'DISPOSED').length },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Building size={18} />}
          label={t('accounting.faMetricOriginalCost')}
          value={formatMoney(totalOriginal)}
        />
        <MetricCard
          icon={<Layers size={18} />}
          label={t('accounting.faMetricCurrentValue')}
          value={formatMoney(totalResidual)}
        />
        <MetricCard
          icon={<Building size={18} />}
          label={t('accounting.faMetricAccumulatedDepr')}
          value={formatMoney(totalDepreciation)}
        />
        <MetricCard
          icon={<Building size={18} />}
          label={t('accounting.faMetricMonthlyDepr')}
          value={formatMoney(totalMonthlyDepreciation)}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('accounting.faSearchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          options={[
            { value: '', label: t('accounting.faAllMethods') },
            ...Object.entries(depreciationLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={depreciationFilter}
          onChange={(event) => setDepreciationFilter(event.target.value)}
          className="w-64"
        />
      </div>

      <DataTable<FixedAsset>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('accounting.faEmptyTitle')}
        emptyDescription={t('accounting.faEmptyDescription')}
      />
    </div>
  );
};

export default FixedAssetsPage;
