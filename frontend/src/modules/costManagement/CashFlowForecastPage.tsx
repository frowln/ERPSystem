import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Play, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { Input } from '@/design-system/components/FormField';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { CashFlowScenario, CashFlowForecastBucket, VarianceSummary } from './types';
import toast from 'react-hot-toast';

interface ScenarioFormData {
  name: string;
  description: string;
  baselineDate: string;
  horizonMonths: number;
  growthRatePercent: number;
  paymentDelayDays: number;
  retentionPercent: number;
  includeVat: boolean;
}

const emptyForm: ScenarioFormData = {
  name: '',
  description: '',
  baselineDate: new Date().toISOString().slice(0, 10),
  horizonMonths: 12,
  growthRatePercent: 0,
  paymentDelayDays: 30,
  retentionPercent: 0,
  includeVat: true,
};

const CashFlowForecastPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [form, setForm] = useState<ScenarioFormData>(emptyForm);

  const { data: scenariosData, isLoading: scenariosLoading } = useQuery({
    queryKey: ['cf-scenarios'],
    queryFn: () => costManagementApi.getScenarios({ size: 50 }),
  });

  const scenarios = scenariosData?.content ?? [];

  const { data: buckets, isLoading: bucketsLoading } = useQuery({
    queryKey: ['cf-buckets', selectedScenarioId],
    queryFn: () => costManagementApi.getForecastBuckets(selectedScenarioId!),
    enabled: !!selectedScenarioId,
  });

  const { data: varianceSummary } = useQuery({
    queryKey: ['cf-variance', selectedScenarioId],
    queryFn: () => costManagementApi.getVarianceSummary(selectedScenarioId!),
    enabled: !!selectedScenarioId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CashFlowScenario>) => costManagementApi.createScenario(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cf-scenarios'] });
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CashFlowScenario> }) =>
      costManagementApi.updateScenario(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cf-scenarios'] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => costManagementApi.deleteScenario(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cf-scenarios'] });
      if (selectedScenarioId === deleteMutation.variables) setSelectedScenarioId(null);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const generateMutation = useMutation({
    mutationFn: (scenarioId: string) => costManagementApi.generateForecast(scenarioId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cf-buckets', selectedScenarioId] });
      void queryClient.invalidateQueries({ queryKey: ['cf-variance', selectedScenarioId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleEdit = useCallback((s: CashFlowScenario) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description ?? '',
      baselineDate: s.baselineDate ?? '',
      horizonMonths: s.horizonMonths,
      growthRatePercent: s.growthRatePercent,
      paymentDelayDays: s.paymentDelayDays,
      retentionPercent: s.retentionPercent,
      includeVat: s.includeVat,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const payload: Partial<CashFlowScenario> = {
      name: form.name,
      description: form.description || undefined,
      baselineDate: form.baselineDate || undefined,
      horizonMonths: form.horizonMonths,
      growthRatePercent: form.growthRatePercent,
      paymentDelayDays: form.paymentDelayDays,
      retentionPercent: form.retentionPercent,
      includeVat: form.includeVat,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingId, createMutation, updateMutation]);

  const handleDelete = useCallback((s: CashFlowScenario) => {
    if (confirm(t('costManagement.cashFlowForecastDeleteConfirm').replace('{name}', s.name))) {
      deleteMutation.mutate(s.id);
    }
  }, [deleteMutation]);

  const scenarioColumns = useMemo<ColumnDef<CashFlowScenario, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('costManagement.cashFlowForecastColName'),
        size: 220,
        cell: ({ row }) => (
          <button
            className="font-medium text-primary-600 dark:text-primary-400 hover:underline text-left"
            onClick={() => setSelectedScenarioId(row.original.id)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'horizonMonths',
        header: t('costManagement.cashFlowForecastColHorizon'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'growthRatePercent',
        header: t('costManagement.cashFlowForecastColGrowth'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}%</span>,
      },
      {
        accessorKey: 'paymentDelayDays',
        header: t('costManagement.cashFlowForecastColDelay'),
        size: 120,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'retentionPercent',
        header: t('costManagement.cashFlowForecastColRetention'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}%</span>,
      },
      {
        id: 'actions',
        header: '',
        size: 200,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Play size={12} />}
              onClick={(e) => { e.stopPropagation(); setSelectedScenarioId(row.original.id); generateMutation.mutate(row.original.id); }}
            >
              {t('costManagement.cashFlowForecastGenerate')}
            </Button>
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }}>
              {t('common.edit')}
            </Button>
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }}>
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete, generateMutation],
  );

  const bucketColumns = useMemo<ColumnDef<CashFlowForecastBucket, unknown>[]>(
    () => [
      {
        accessorKey: 'periodStart',
        header: t('costManagement.cashFlowForecastColPeriod'),
        size: 140,
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatDate(row.original.periodStart)} — {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
      {
        accessorKey: 'forecastIncome',
        header: t('costManagement.cashFlowForecastColForecastIncome'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums text-green-600">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'forecastExpense',
        header: t('costManagement.cashFlowForecastColForecastExpense'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums text-red-600">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'forecastNet',
        header: t('costManagement.cashFlowForecastColForecastNet'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums font-medium ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(val)}</span>;
        },
      },
      {
        accessorKey: 'actualIncome',
        header: t('costManagement.cashFlowForecastColActualIncome'),
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'actualExpense',
        header: t('costManagement.cashFlowForecastColActualExpense'),
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'variance',
        header: t('costManagement.cashFlowForecastColVariance'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums font-medium ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(val)}</span>;
        },
      },
      {
        accessorKey: 'cumulativeForecastNet',
        header: t('costManagement.cashFlowForecastColCumForecast'),
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
    ],
    [],
  );

  const setField = <K extends keyof ScenarioFormData>(field: K, transform?: (v: string) => ScenarioFormData[K]) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: transform ? transform(e.target.value) : e.target.value }));

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costManagement.cashFlowForecastTitle')}
        subtitle={t('costManagement.cashFlowForecastSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('costManagement.cashFlowForecastTitle') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => { setEditingId(null); setForm(emptyForm); setShowModal(true); }}>
            {t('costManagement.cashFlowForecastCreateScenario')}
          </Button>
        }
      />

      <DataTable<CashFlowScenario>
        data={scenarios}
        columns={scenarioColumns}
        loading={scenariosLoading}
        pageSize={10}
        emptyTitle={t('costManagement.cashFlowForecastEmpty')}
        emptyDescription={t('costManagement.cashFlowForecastEmptyDesc')}
      />

      {selectedScenarioId && selectedScenario && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('costManagement.cashFlowForecastBuckets')}: {selectedScenario.name}
          </h2>

          {varianceSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                icon={<TrendingUp size={18} />}
                label={t('costManagement.cashFlowForecastColForecastNet')}
                value={formatMoney(varianceSummary.totalForecastNet)}
              />
              <MetricCard
                icon={<BarChart3 size={18} />}
                label={t('costManagement.cashFlowForecastColActualIncome')}
                value={formatMoney(varianceSummary.totalActualNet)}
              />
              <MetricCard
                icon={<TrendingDown size={18} />}
                label={t('costManagement.cashFlowForecastVarianceTotal')}
                value={formatMoney(varianceSummary.totalVariance)}
                trend={varianceSummary.totalVariance !== 0 ? {
                  direction: varianceSummary.totalVariance >= 0 ? 'up' as const : 'down' as const,
                  value: formatMoney(varianceSummary.totalVariance),
                } : undefined}
              />
              <MetricCard
                icon={<BarChart3 size={18} />}
                label={t('costManagement.cashFlowForecastVarianceAvg')}
                value={formatMoney(varianceSummary.avgMonthlyVariance)}
              />
            </div>
          )}

          <DataTable<CashFlowForecastBucket>
            data={buckets ?? []}
            columns={bucketColumns}
            loading={bucketsLoading || generateMutation.isPending}
            pageSize={12}
            enableExport
          />
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? t('costManagement.cashFlowForecastFormTitleEdit') : t('costManagement.cashFlowForecastFormTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('costManagement.cashFlowForecastFieldName')} *
            </label>
            <Input value={form.name} onChange={setField('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('costManagement.cashFlowForecastFieldDesc')}
            </label>
            <Input value={form.description} onChange={setField('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('costManagement.cashFlowForecastFieldBaseline')}
              </label>
              <Input type="date" value={form.baselineDate} onChange={setField('baselineDate')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('costManagement.cashFlowForecastFieldHorizon')}
              </label>
              <Input type="number" value={String(form.horizonMonths)} onChange={setField('horizonMonths', Number)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('costManagement.cashFlowForecastFieldGrowth')}
              </label>
              <Input type="number" step="0.1" value={String(form.growthRatePercent)} onChange={setField('growthRatePercent', Number)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('costManagement.cashFlowForecastFieldDelay')}
              </label>
              <Input type="number" value={String(form.paymentDelayDays)} onChange={setField('paymentDelayDays', Number)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('costManagement.cashFlowForecastFieldRetention')}
              </label>
              <Input type="number" step="0.1" value={String(form.retentionPercent)} onChange={setField('retentionPercent', Number)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeVat"
              checked={form.includeVat}
              onChange={(e) => setForm((prev) => ({ ...prev, includeVat: e.target.checked }))}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="includeVat" className="text-sm text-neutral-700 dark:text-neutral-300">
              {t('costManagement.cashFlowForecastFieldVat')}
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingId(null); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CashFlowForecastPage;
