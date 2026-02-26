import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Calculator, Save, Trash2, Link2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { estimatesApi } from '@/api/estimates';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { VolumeWorkType, VolumeCalculation } from './types';

type TabId = 'earthwork' | 'concrete' | 'masonry' | 'roofing' | 'finishing';

interface WorkTypeConfig {
  id: VolumeWorkType;
  label: string;
  fields: { key: string; label: string; unit: string }[];
  formula: string;
  resultUnit: string;
}

const WORK_TYPES: WorkTypeConfig[] = [
  {
    id: 'earthwork',
    label: 'estimates.volume.typeEarthwork',
    fields: [
      { key: 'length', label: 'estimates.volume.fieldLength', unit: 'estimates.volume.unitM' },
      { key: 'width', label: 'estimates.volume.fieldWidth', unit: 'estimates.volume.unitM' },
      { key: 'depth', label: 'estimates.volume.fieldDepth', unit: 'estimates.volume.unitM' },
      { key: 'slopeCoeff', label: 'estimates.volume.fieldSlopeCoeff', unit: '' },
    ],
    formula: 'L x W x D x K',
    resultUnit: 'estimates.volume.unitM3',
  },
  {
    id: 'concrete',
    label: 'estimates.volume.typeConcrete',
    fields: [
      { key: 'length', label: 'estimates.volume.fieldLength', unit: 'estimates.volume.unitM' },
      { key: 'width', label: 'estimates.volume.fieldWidth', unit: 'estimates.volume.unitM' },
      { key: 'height', label: 'estimates.volume.fieldHeight', unit: 'estimates.volume.unitM' },
      { key: 'count', label: 'estimates.volume.fieldCount', unit: 'estimates.volume.unitPcs' },
    ],
    formula: 'L x W x H x N',
    resultUnit: 'estimates.volume.unitM3',
  },
  {
    id: 'masonry',
    label: 'estimates.volume.typeMasonry',
    fields: [
      { key: 'length', label: 'estimates.volume.fieldLength', unit: 'estimates.volume.unitM' },
      { key: 'height', label: 'estimates.volume.fieldHeight', unit: 'estimates.volume.unitM' },
      { key: 'thickness', label: 'estimates.volume.fieldThickness', unit: 'estimates.volume.unitM' },
      { key: 'openingArea', label: 'estimates.volume.fieldOpeningArea', unit: 'estimates.volume.unitM2' },
    ],
    formula: '(L x H x T) - S_openings',
    resultUnit: 'estimates.volume.unitM3',
  },
  {
    id: 'roofing',
    label: 'estimates.volume.typeRoofing',
    fields: [
      { key: 'length', label: 'estimates.volume.fieldLength', unit: 'estimates.volume.unitM' },
      { key: 'width', label: 'estimates.volume.fieldWidth', unit: 'estimates.volume.unitM' },
      { key: 'slopeAngle', label: 'estimates.volume.fieldSlopeAngle', unit: 'estimates.volume.unitDeg' },
      { key: 'overlapCoeff', label: 'estimates.volume.fieldOverlapCoeff', unit: '' },
    ],
    formula: 'L x W / cos(angle) x K',
    resultUnit: 'estimates.volume.unitM2',
  },
  {
    id: 'finishing',
    label: 'estimates.volume.typeFinishing',
    fields: [
      { key: 'perimeterLength', label: 'estimates.volume.fieldPerimeter', unit: 'estimates.volume.unitM' },
      { key: 'height', label: 'estimates.volume.fieldHeight', unit: 'estimates.volume.unitM' },
      { key: 'openingArea', label: 'estimates.volume.fieldOpeningArea', unit: 'estimates.volume.unitM2' },
      { key: 'layers', label: 'estimates.volume.fieldLayers', unit: 'estimates.volume.unitPcs' },
    ],
    formula: '(P x H - S_openings) x layers',
    resultUnit: 'estimates.volume.unitM2',
  },
];

function calculateResult(workType: VolumeWorkType, params: Record<string, number>): number {
  switch (workType) {
    case 'earthwork':
      return (params.length ?? 0) * (params.width ?? 0) * (params.depth ?? 0) * (params.slopeCoeff || 1);
    case 'concrete':
      return (params.length ?? 0) * (params.width ?? 0) * (params.height ?? 0) * (params.count || 1);
    case 'masonry':
      return (params.length ?? 0) * (params.height ?? 0) * (params.thickness ?? 0) - (params.openingArea ?? 0) * (params.thickness ?? 0);
    case 'roofing': {
      const angleRad = ((params.slopeAngle ?? 0) * Math.PI) / 180;
      const cosAngle = Math.cos(angleRad) || 1;
      return ((params.length ?? 0) * (params.width ?? 0)) / cosAngle * (params.overlapCoeff || 1);
    }
    case 'finishing':
      return ((params.perimeterLength ?? 0) * (params.height ?? 0) - (params.openingArea ?? 0)) * (params.layers || 1);
    default:
      return 0;
  }
}

const VolumeCalculatorPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('earthwork');
  const [params, setParams] = useState<Record<string, number>>({});
  const [linkedItemId, setLinkedItemId] = useState('');

  const activeConfig = WORK_TYPES.find((wt) => wt.id === activeTab)!;
  const result = calculateResult(activeTab, params);

  const { data: savedCalculations = [], isLoading: calcLoading } = useQuery({
    queryKey: ['volume-calculations'],
    queryFn: () => estimatesApi.getSavedCalculations(),
  });

  const saveMutation = useMutation({
    mutationFn: (calc: VolumeCalculation) => estimatesApi.saveCalculation(calc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volume-calculations'] });
    },
  });

  const handleFieldChange = useCallback((key: string, value: string) => {
    const numVal = parseFloat(value) || 0;
    setParams((prev) => ({ ...prev, [key]: numVal }));
  }, []);

  const handleSave = useCallback(() => {
    const calc: VolumeCalculation = {
      id: '',
      workType: activeTab,
      params,
      result,
      unit: t(activeConfig.resultUnit),
      linkedEstimateItemId: linkedItemId || undefined,
    };
    saveMutation.mutate(calc);
  }, [activeTab, params, result, linkedItemId, activeConfig, saveMutation]);

  const handleClear = useCallback(() => {
    setParams({});
    setLinkedItemId('');
  }, []);

  const calcColumns = useMemo<ColumnDef<VolumeCalculation, unknown>[]>(
    () => [
      {
        accessorKey: 'workType',
        header: t('estimates.volume.colWorkType'),
        size: 160,
        cell: ({ getValue }) => {
          const wt = WORK_TYPES.find((w) => w.id === getValue<string>());
          return (
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {wt ? t(wt.label) : getValue<string>()}
            </span>
          );
        },
      },
      {
        accessorKey: 'result',
        header: t('estimates.volume.colResult'),
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
            {formatNumber(row.original.result)} {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: 'linkedEstimateItemId',
        header: t('estimates.volume.colLinkedItem'),
        size: 180,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          return val ? (
            <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
              <Link2 size={14} />
              <span className="text-sm">{val}</span>
            </div>
          ) : (
            <span className="text-neutral-400 text-sm">--</span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.volume.title')}
        subtitle={t('estimates.volume.subtitle')}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.volume.breadcrumbHome'), href: '/' },
          { label: t('estimates.volume.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.volume.breadcrumbCalc') },
        ]}
        tabs={WORK_TYPES.map((wt) => ({
          id: wt.id,
          label: t(wt.label),
        }))}
        activeTab={activeTab}
        onTabChange={(id) => {
          setActiveTab(id as TabId);
          setParams({});
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Calculator inputs */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <Calculator size={16} className="text-neutral-400" />
            {t(activeConfig.label)}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {activeConfig.fields.map((field) => (
              <FormField
                key={field.key}
                label={`${t(field.label)}${field.unit ? ` (${t(field.unit)})` : ''}`}
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={params[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder="0.00"
                />
              </FormField>
            ))}
          </div>

          <FormField label={t('estimates.volume.labelLinkedItem')} hint={t('estimates.volume.linkedItemHint')}>
            <Input
              value={linkedItemId}
              onChange={(e) => setLinkedItemId(e.target.value)}
              placeholder={t('estimates.volume.linkedItemPlaceholder')}
            />
          </FormField>

          <div className="flex items-center gap-3 mt-6">
            <Button variant="ghost" iconLeft={<Trash2 size={16} />} onClick={handleClear}>
              {t('estimates.volume.btnClear')}
            </Button>
            <Button
              iconLeft={<Save size={16} />}
              onClick={handleSave}
              loading={saveMutation.isPending}
              disabled={result <= 0}
            >
              {t('estimates.volume.btnSave')}
            </Button>
          </div>
        </div>

        {/* Result card */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              {t('estimates.volume.resultLabel')}
            </p>
            <p className={cn(
              'text-3xl font-bold tabular-nums',
              result > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400',
            )}>
              {result > 0 ? formatNumber(Math.round(result * 1000) / 1000) : '0'}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {t(activeConfig.resultUnit)}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              {t('estimates.volume.formulaLabel')}
            </p>
            <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300">
              {activeConfig.formula}
            </p>
          </div>

          <MetricCard
            icon={<Calculator size={18} />}
            label={t('estimates.volume.metricSaved')}
            value={String(savedCalculations.length)}
            compact
          />
        </div>
      </div>

      {/* Saved calculations */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('estimates.volume.savedTitle')}
        </h3>
        <DataTable<VolumeCalculation>
          data={savedCalculations}
          columns={calcColumns}
          loading={calcLoading}
          pageSize={10}
          emptyTitle={t('estimates.volume.emptyTitle')}
          emptyDescription={t('estimates.volume.emptyDescription')}
        />
      </div>
    </div>
  );
};

export default VolumeCalculatorPage;
