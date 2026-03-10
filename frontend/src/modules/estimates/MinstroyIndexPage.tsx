import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Calculator, TrendingUp, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { FormField, Select, Input } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Estimate } from '@/types';
import type { MinstroyIndex, MinstroyApplyResult } from './types';
import toast from 'react-hot-toast';

const REGIONS = [
  { value: 'moscow', label: 'estimates.minstroy.regionMoscow' },
  { value: 'spb', label: 'estimates.minstroy.regionSpb' },
  { value: 'novosibirsk', label: 'estimates.minstroy.regionNovosibirsk' },
  { value: 'yekaterinburg', label: 'estimates.minstroy.regionYekaterinburg' },
  { value: 'kazan', label: 'estimates.minstroy.regionKazan' },
  { value: 'krasnodar', label: 'estimates.minstroy.regionKrasnodar' },
  { value: 'tyumen', label: 'estimates.minstroy.regionTyumen' },
  { value: 'vladivostok', label: 'estimates.minstroy.regionVladivostok' },
];

const QUARTERS = [
  { value: '1', label: 'I' },
  { value: '2', label: 'II' },
  { value: '3', label: 'III' },
  { value: '4', label: 'IV' },
];

const INDEX_TYPES = [
  { value: 'construction', label: 'estimates.minstroy.typeConstruction' },
  { value: 'installation', label: 'estimates.minstroy.typeInstallation' },
  { value: 'equipment', label: 'estimates.minstroy.typeEquipment' },
  { value: 'other', label: 'estimates.minstroy.typeOther' },
];

const MinstroyIndexPage: React.FC = () => {
  const [region, setRegion] = useState('moscow');
  const [quarter, setQuarter] = useState('1');
  const [year, setYear] = useState('2026');
  const [selectedEstimateId, setSelectedEstimateId] = useState('');
  const [showApplyResult, setShowApplyResult] = useState(false);
  const [applyResult, setApplyResult] = useState<MinstroyApplyResult | null>(null);

  const { data: estimatesData } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimatesApi.getEstimates(),
  });

  const estimates = estimatesData?.content ?? [];
  const estimateOptions = estimates.map((e: Estimate) => ({
    value: e.id,
    label: e.name,
  }));

  const { data: indices = [], isLoading: indicesLoading, refetch: refetchIndices } = useQuery({
    queryKey: ['minstroy-indices', region, quarter, year],
    queryFn: () => estimatesApi.getMinstroyIndices(region, Number(quarter), Number(year)),
    enabled: !!region && !!quarter && !!year,
  });

  const applyMutation = useMutation({
    mutationFn: () => estimatesApi.applyIndices(selectedEstimateId, indices),
    onSuccess: (result) => {
      setApplyResult(result);
      setShowApplyResult(true);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleApply = useCallback(() => {
    if (!selectedEstimateId || indices.length === 0) return;
    applyMutation.mutate();
  }, [selectedEstimateId, indices, applyMutation]);

  const avgIndex = useMemo(() => {
    if (indices.length === 0) return 0;
    return indices.reduce((sum, idx) => sum + idx.value, 0) / indices.length;
  }, [indices]);

  const indexColumns = useMemo<ColumnDef<MinstroyIndex, unknown>[]>(
    () => [
      {
        accessorKey: 'region',
        header: t('estimates.minstroy.colRegion'),
        size: 180,
        cell: ({ getValue }) => {
          const r = REGIONS.find((reg) => reg.value === getValue<string>());
          return (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-900 dark:text-neutral-100">
                {r ? t(r.label) : getValue<string>()}
              </span>
            </div>
          );
        },
      },
      {
        id: 'period',
        header: t('estimates.minstroy.colPeriod'),
        size: 140,
        cell: ({ row }) => (
          <span className="text-neutral-600 dark:text-neutral-400 tabular-nums">
            {row.original.quarter} {t('estimates.minstroy.quarterShort')} {row.original.year}
          </span>
        ),
      },
      {
        accessorKey: 'indexType',
        header: t('estimates.minstroy.colIndexType'),
        size: 180,
        cell: ({ getValue }) => {
          const it = INDEX_TYPES.find((idx) => idx.value === getValue<string>());
          return (
            <span className="text-neutral-700 dark:text-neutral-300">
              {it ? t(it.label) : getValue<string>()}
            </span>
          );
        },
      },
      {
        accessorKey: 'value',
        header: t('estimates.minstroy.colValue'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className={cn(
              'tabular-nums font-semibold',
              val > 1 ? 'text-danger-600' : val < 1 ? 'text-success-600' : 'text-neutral-700 dark:text-neutral-300',
            )}>
              {val.toFixed(4)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const regionOptions = REGIONS.map((r) => ({ value: r.value, label: t(r.label) }));

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - 2 + i),
    label: String(currentYear - 2 + i),
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.minstroy.title')}
        subtitle={t('estimates.minstroy.subtitle')}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.minstroy.breadcrumbHome'), href: '/' },
          { label: t('estimates.minstroy.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.minstroy.breadcrumbMinstroy') },
        ]}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('estimates.minstroy.filterSection')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label={t('estimates.minstroy.labelRegion')} required>
            <Select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              options={regionOptions}
            />
          </FormField>
          <FormField label={t('estimates.minstroy.labelQuarter')} required>
            <Select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              options={QUARTERS}
            />
          </FormField>
          <FormField label={t('estimates.minstroy.labelYear')} required>
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={yearOptions}
            />
          </FormField>
          <FormField label={t('estimates.minstroy.labelEstimate')}>
            <Select
              value={selectedEstimateId}
              onChange={(e) => setSelectedEstimateId(e.target.value)}
              options={estimateOptions}
              placeholder={t('estimates.minstroy.selectEstimate')}
            />
          </FormField>
        </div>
      </div>

      {/* Summary MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Calculator size={18} />}
          label={t('estimates.minstroy.metricIndicesCount')}
          value={String(indices.length)}
          compact
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('estimates.minstroy.metricAvgIndex')}
          value={avgIndex > 0 ? avgIndex.toFixed(4) : '—'}
          compact
        />
        <MetricCard
          icon={<MapPin size={18} />}
          label={t('estimates.minstroy.metricRegion')}
          value={t(REGIONS.find((r) => r.value === region)?.label ?? '')}
          compact
        />
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('estimates.minstroy.metricPeriod')}
          value={`${quarter} ${t('estimates.minstroy.quarterShort')} ${year}`}
          compact
        />
      </div>

      {/* Indices table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('estimates.minstroy.indicesTitle')}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw size={14} />}
              onClick={() => refetchIndices()}
            >
              {t('common.refresh')}
            </Button>
            <Button
              size="sm"
              iconLeft={<Calculator size={14} />}
              onClick={handleApply}
              loading={applyMutation.isPending}
              disabled={!selectedEstimateId || indices.length === 0}
            >
              {t('estimates.minstroy.btnApply')}
            </Button>
          </div>
        </div>
        <DataTable<MinstroyIndex>
          data={indices}
          columns={indexColumns}
          loading={indicesLoading}
          pageSize={20}
          emptyTitle={t('estimates.minstroy.emptyTitle')}
          emptyDescription={t('estimates.minstroy.emptyDescription')}
        />
      </div>

      {/* Apply result modal */}
      <Modal
        open={showApplyResult}
        onClose={() => setShowApplyResult(false)}
        title={t('estimates.minstroy.applyResultTitle')}
        size="lg"
        footer={
          <Button onClick={() => setShowApplyResult(false)}>
            {t('common.close')}
          </Button>
        }
      >
        {applyResult && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('estimates.minstroy.applyResultDesc', { count: String(applyResult.appliedIndices) })}
            </p>

            {/* Before/after comparison */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.minstroy.colItemName')}
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.minstroy.colOldPrice')}
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.minstroy.colNewPrice')}
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.minstroy.colIndexApplied')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applyResult.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{item.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                        {formatMoney(item.oldPrice)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                        {formatMoney(item.newPrice)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-primary-600 dark:text-primary-400 font-medium">
                        {item.indexApplied.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MinstroyIndexPage;
