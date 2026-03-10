import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Calculator, Search, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { MetricCard } from '@/design-system/components/MetricCard';
import { pricingApi, type PriceRate, type PriceCalculationResult, type PriceIndex } from '@/api/pricing';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

type TabId = 'calculator' | 'indices';

const PricingCalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('calculator');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('pricing.calculator.title')}
        subtitle={t('pricing.calculator.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('pricing.databases.breadcrumb'), href: '/estimates/pricing/databases' },
          { label: t('pricing.calculator.breadcrumb') },
        ]}
        tabs={[
          { id: 'calculator', label: t('pricing.calculator.tabCalculator') },
          { id: 'indices', label: t('pricing.calculator.tabIndices') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {activeTab === 'calculator' ? <CalculatorSection /> : <IndicesSection />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Calculator Section
// ---------------------------------------------------------------------------

const CalculatorSection: React.FC = () => {
  const [rateSearch, setRateSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRate, setSelectedRate] = useState<PriceRate | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [region, setRegion] = useState('');
  const [result, setResult] = useState<PriceCalculationResult | null>(null);
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search rates
  const { data: ratesData, isLoading: loadingRates } = useQuery({
    queryKey: ['pricing-rates-calc', debouncedSearch],
    queryFn: () =>
      pricingApi.searchRates({ search: debouncedSearch || undefined, size: 10 }),
    enabled: debouncedSearch.length >= 2,
  });

  const rates = ratesData?.content ?? [];

  const handleSearchChange = useCallback((value: string) => {
    setRateSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  }, []);

  const calcMutation = useMutation({
    mutationFn: () => {
      if (!selectedRate) throw new Error('No rate selected');
      return pricingApi.calculatePrice(selectedRate.id, parseFloat(quantity) || 1, region || undefined);
    },
    onSuccess: setResult,
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleCalculate = useCallback(() => {
    if (!selectedRate) return;
    calcMutation.mutate();
  }, [selectedRate, quantity, region, calcMutation]);

  return (
    <div className="space-y-6">
      {/* Rate search */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('pricing.calculator.selectRate')}
        </h3>

        <div className="relative max-w-lg mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('pricing.calculator.searchRatePlaceholder')}
            value={rateSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Rate search results */}
        {debouncedSearch.length >= 2 && rates.length > 0 && !selectedRate && (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {rates.map((rate) => (
              <button
                key={rate.id}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-b-0 transition-colors"
                onClick={() => {
                  setSelectedRate(rate);
                  setRateSearch(rate.code);
                }}
              >
                <span className="font-mono text-sm font-medium text-primary-700 dark:text-primary-400">{rate.code}</span>
                <span className="mx-2 text-neutral-400">—</span>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{rate.name}</span>
                <span className="ml-2 text-xs text-neutral-500">({rate.unit})</span>
                <span className="ml-auto float-right font-medium tabular-nums">{formatMoney(rate.totalCost)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected rate card */}
        {selectedRate && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-primary-700 dark:text-primary-400">{selectedRate.code}</p>
                <p className="text-neutral-900 dark:text-neutral-100 mt-1">{selectedRate.name}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('pricing.rates.colUnit')}: {selectedRate.unit} | {t('pricing.calculator.basePriceLabel')}: {formatMoney(selectedRate.totalCost)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRate(null);
                  setResult(null);
                  setRateSearch('');
                  setDebouncedSearch('');
                }}
              >
                {t('pricing.calculator.changeRate')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Calculation inputs */}
      {selectedRate && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('pricing.calculator.parameters')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={t('pricing.calculator.fieldQuantity')}>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </FormField>

            <FormField label={t('pricing.calculator.fieldRegion')}>
              <Input
                placeholder={t('pricing.calculator.fieldRegionPlaceholder')}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </FormField>

            <div className="flex items-end">
              <Button
                iconLeft={<Calculator size={16} />}
                onClick={handleCalculate}
                loading={calcMutation.isPending}
                className="w-full"
              >
                {t('pricing.calculator.btnCalculate')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculation result */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              label={t('pricing.calculator.baseTotalLabel')}
              value={formatMoney(result.baseTotal)}
              icon={<Calculator size={20} />}
            />
            <MetricCard
              label={t('pricing.calculator.indexLabel')}
              value={result.indexValue.toFixed(4)}
              icon={<ArrowRight size={20} />}
            />
            <MetricCard
              label={t('pricing.calculator.currentPriceLabel')}
              value={formatMoney(result.currentPricePerUnit)}
              icon={<Calculator size={20} />}
            />
            <MetricCard
              label={t('pricing.calculator.currentTotalLabel')}
              value={formatMoney(result.currentTotal)}
              icon={<Calculator size={20} />}
            />
          </div>

          {/* Cost breakdown */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('pricing.calculator.costBreakdown')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 px-3 font-medium text-neutral-500 dark:text-neutral-400">{t('pricing.calculator.costComponent')}</th>
                    <th className="text-right py-2 px-3 font-medium text-neutral-500 dark:text-neutral-400">{t('pricing.calculator.costPerUnit')}</th>
                    <th className="text-right py-2 px-3 font-medium text-neutral-500 dark:text-neutral-400">{t('pricing.calculator.costTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  <CostRow label={t('pricing.rates.colLabor')} perUnit={result.laborCost} quantity={result.quantity} />
                  <CostRow label={t('pricing.rates.colMaterial')} perUnit={result.materialCost} quantity={result.quantity} />
                  <CostRow label={t('pricing.rates.colEquipment')} perUnit={result.equipmentCost} quantity={result.quantity} />
                  <CostRow label={t('pricing.rates.colOverhead')} perUnit={result.overheadCost} quantity={result.quantity} />
                  <tr className="border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                    <td className="py-2 px-3 text-neutral-900 dark:text-neutral-100">{t('pricing.calculator.costTotalRow')}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatMoney(result.currentPricePerUnit)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatMoney(result.currentTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {result.indexQuarter && (
              <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                {t('pricing.calculator.indexNote', {
                  quarter: result.indexQuarter,
                  region: result.region ?? '—',
                  index: result.indexValue.toFixed(4),
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CostRow: React.FC<{ label: string; perUnit: number; quantity: number }> = ({ label, perUnit, quantity }) => (
  <tr className="border-b border-neutral-100 dark:border-neutral-700">
    <td className="py-2 px-3 text-neutral-700 dark:text-neutral-300">{label}</td>
    <td className="py-2 px-3 text-right tabular-nums">{formatMoney(perUnit)}</td>
    <td className="py-2 px-3 text-right tabular-nums">{formatMoney(perUnit * quantity)}</td>
  </tr>
);

// ---------------------------------------------------------------------------
// Indices Section
// ---------------------------------------------------------------------------

const IndicesSection: React.FC = () => {
  const [regionFilter, setRegionFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');

  const { data: indicesData, isLoading } = useQuery({
    queryKey: ['pricing-indices', regionFilter, workTypeFilter],
    queryFn: () =>
      pricingApi.getIndices({
        region: regionFilter || undefined,
        workType: workTypeFilter || undefined,
        size: 100,
      }),
  });

  const indices = indicesData?.content ?? [];

  const columns = useMemo<ColumnDef<PriceIndex, unknown>[]>(
    () => [
      {
        accessorKey: 'region',
        header: t('pricing.indices.colRegion'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'workType',
        header: t('pricing.indices.colWorkType'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'baseQuarter',
        header: t('pricing.indices.colBaseQuarter'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'targetQuarter',
        header: t('pricing.indices.colTargetQuarter'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'indexValue',
        header: t('pricing.indices.colIndexValue'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-semibold text-primary-700 dark:text-primary-400">
            {getValue<number>()?.toFixed(4)}
          </span>
        ),
      },
      {
        accessorKey: 'source',
        header: t('pricing.indices.colSource'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>() || '—'}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('pricing.indices.searchRegionPlaceholder')}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder={t('pricing.indices.searchWorkTypePlaceholder')}
            value={workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value)}
          />
        </div>
      </div>

      <DataTable<PriceIndex>
        data={indices}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('pricing.indices.emptyTitle')}
        emptyDescription={t('pricing.indices.emptyDescription')}
      />
    </div>
  );
};

export default PricingCalculatorPage;
