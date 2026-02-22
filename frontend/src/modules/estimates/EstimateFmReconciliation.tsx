import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { GitCompare, AlertTriangle, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { FmReconciliationItem } from '@/types';
import { t } from '@/i18n';

const EstimateFmReconciliation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [budgetId, setBudgetId] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['fm-reconciliation', id, budgetId],
    queryFn: () => estimatesApi.getFmReconciliation(id!, budgetId),
    enabled: !!id && !!budgetId,
  });

  const reconciliationItems = items ?? [];

  const totalEstimate = reconciliationItems.reduce((s, i) => s + i.estimateTotal, 0);
  const totalFm = reconciliationItems.reduce((s, i) => s + i.fmTotal, 0);
  const totalDelta = totalFm - totalEstimate;
  const totalDeltaPercent = totalEstimate !== 0 ? (totalDelta / totalEstimate) * 100 : 0;

  const discrepancyCount = reconciliationItems.filter(i => Math.abs(i.deltaPercent) > 10).length;

  const columns = useMemo<ColumnDef<FmReconciliationItem, unknown>[]>(
    () => [
      {
        accessorKey: 'section',
        header: t('estimates.reconciliation.colSection'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'estimateTotal',
        header: t('estimates.reconciliation.colEstimate'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'fmTotal',
        header: t('estimates.reconciliation.colFm'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'delta',
        header: t('estimates.reconciliation.colDelta'),
        size: 130,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span className={cn(
              'tabular-nums text-right block font-medium',
              v > 0 ? 'text-success-600' : v < 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400',
            )}>
              {v > 0 ? '+' : ''}{formatMoney(v)}
            </span>
          );
        },
      },
      {
        accessorKey: 'deltaPercent',
        header: t('estimates.reconciliation.colDeltaPercent'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          const isWarning = Math.abs(v) > 10;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {isWarning && <AlertTriangle size={14} className="text-warning-500" />}
              <span className={cn(
                'tabular-nums font-medium',
                isWarning ? 'text-warning-600 dark:text-warning-400' :
                  v > 0 ? 'text-success-600' : v < 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400',
              )}>
                {v > 0 ? '+' : ''}{formatPercent(v)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: t('estimates.reconciliation.colStatus'),
        size: 100,
        cell: ({ row }) => {
          const pct = Math.abs(row.original.deltaPercent);
          if (pct > 10) return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30 px-2 py-0.5 rounded-full">
              <AlertTriangle size={12} /> {t('estimates.reconciliation.statusDiscrepancy')}
            </span>
          );
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30 px-2 py-0.5 rounded-full">
              <CheckCircle size={12} /> {t('estimates.reconciliation.statusOk')}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.reconciliation.title')}
        subtitle={t('estimates.reconciliation.subtitle')}
        backTo={`/estimates/${id}/normative`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('nav.estimates'), href: '/estimates' },
          { label: t('estimates.reconciliation.breadcrumbReconciliation') },
        ]}
      />

      {/* Budget selector */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {t('estimates.reconciliation.selectBudget')}
        </label>
        <input
          type="text"
          value={budgetId}
          onChange={(e) => setBudgetId(e.target.value)}
          placeholder={t('estimates.reconciliation.budgetIdPlaceholder')}
          className="w-full max-w-md px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Summary */}
      {reconciliationItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.reconciliation.totalEstimate')}</p>
            <p className="text-lg font-bold tabular-nums">{formatMoney(totalEstimate)}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.reconciliation.totalFm')}</p>
            <p className="text-lg font-bold tabular-nums">{formatMoney(totalFm)}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.reconciliation.totalDelta')}</p>
            <p className={cn(
              'text-lg font-bold tabular-nums',
              totalDelta > 0 ? 'text-success-600' : totalDelta < 0 ? 'text-danger-600' : '',
            )}>
              {totalDelta > 0 ? '+' : ''}{formatMoney(totalDelta)} ({totalDeltaPercent > 0 ? '+' : ''}{formatPercent(totalDeltaPercent)})
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.reconciliation.discrepancies')}</p>
            <p className={cn(
              'text-lg font-bold tabular-nums',
              discrepancyCount > 0 ? 'text-warning-600' : 'text-success-600',
            )}>
              {discrepancyCount} / {reconciliationItems.length}
            </p>
          </div>
        </div>
      )}

      {/* Comparison table */}
      <DataTable<FmReconciliationItem>
        data={reconciliationItems}
        columns={columns}
        enableColumnVisibility
        enableExport
        pageSize={50}
        loading={isLoading && !!budgetId}
        emptyTitle={budgetId ? t('estimates.reconciliation.emptyTitle') : t('estimates.reconciliation.selectBudgetHint')}
        emptyDescription={budgetId ? t('estimates.reconciliation.emptyDescription') : t('estimates.reconciliation.selectBudgetDescription')}
      />
    </div>
  );
};

export default EstimateFmReconciliation;
