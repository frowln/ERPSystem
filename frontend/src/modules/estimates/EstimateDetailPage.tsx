import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Wallet, CreditCard, Receipt, TrendingUp, Pencil, Check, X, Printer } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  estimateStatusColorMap,
  estimateStatusLabels,
} from '@/design-system/components/StatusBadge';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Estimate, EstimateItem } from '@/types';
import { t } from '@/i18n';
import { Button } from '@/design-system/components/Button';
import { printEstimate } from '@/components/PrintTemplates/EstimatePrintTemplate';
import toast from 'react-hot-toast';

/* ─── Inline editable price cell ─── */
const EditablePriceCell: React.FC<{
  value: number;
  itemId: string;
  field: 'unitPrice' | 'unitPriceCustomer';
  onSave: (itemId: string, field: string, value: number) => void;
  isSaving: boolean;
}> = ({ value, itemId, field, onSave, isSaving }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(value > 0 ? String(value) : '');
    setEditing(true);
  };

  const commit = () => {
    const num = parseFloat(draft.replace(/\s/g, '').replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      onSave(itemId, field, num);
    }
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className="w-24 px-2 py-1 text-sm tabular-nums text-right border border-primary-400 rounded-md bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={commit}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      disabled={isSaving}
      className={cn(
        'group flex items-center gap-1.5 w-full justify-end tabular-nums',
        value === 0
          ? 'text-warning-500 hover:text-warning-600'
          : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600',
      )}
      title="Нажмите чтобы изменить цену"
    >
      <span>{formatMoney(value)}</span>
      <Pencil size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
};

const EstimateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: estimate } = useQuery({
    queryKey: ['ESTIMATE', id],
    queryFn: () => estimatesApi.getEstimate(id!),
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ['estimate-items', id],
    queryFn: () => estimatesApi.getEstimateItems(id!),
    enabled: !!id,
  });

  const e = estimate;
  const estimateItems = items ?? [];

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, field, value }: { itemId: string; field: string; value: number }) => {
      return estimatesApi.updateEstimateItem(itemId, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', id] });
      queryClient.invalidateQueries({ queryKey: ['ESTIMATE', id] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleSave = useCallback((itemId: string, field: string, value: number) => {
    updateItemMutation.mutate({ itemId, field, value });
  }, [updateItemMutation]);

  const executionPercent = (e?.totalAmount ?? 0) > 0 ? ((e?.totalSpent ?? 0) / (e?.totalAmount ?? 1)) * 100 : 0;
  const orderedPercent = (e?.totalAmount ?? 0) > 0 ? ((e?.orderedAmount ?? 0) / (e?.totalAmount ?? 1)) * 100 : 0;

  const columns = useMemo<ColumnDef<EstimateItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('estimates.detail.colItemName'),
        size: 240,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('estimates.detail.colQuantity'),
        size: 90,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {new Intl.NumberFormat('ru-RU').format(row.original.quantity)} {row.original.unitOfMeasure}
          </span>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: t('estimates.detail.colUnitPrice'),
        size: 140,
        cell: ({ row }) => (
          <EditablePriceCell
            value={row.original.unitPrice}
            itemId={row.original.id}
            field="unitPrice"
            onSave={handleSave}
            isSaving={updateItemMutation.isPending}
          />
        ),
      },
      {
        accessorKey: 'amount',
        header: t('estimates.detail.colAmountPlan'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'orderedAmount',
        header: t('estimates.detail.colOrdered'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'invoicedAmount',
        header: t('estimates.detail.colPaid'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        id: 'balance',
        header: t('estimates.detail.colBalance'),
        size: 140,
        cell: ({ row }) => {
          const balance = row.original.amount - row.original.invoicedAmount;
          return (
            <span className={cn(
              'tabular-nums text-right block font-medium',
              balance > 0 ? 'text-success-600' : balance < 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400',
            )}>
              {formatMoney(balance)}
            </span>
          );
        },
      },
      {
        id: 'execution',
        header: t('estimates.detail.colExecution'),
        size: 100,
        cell: ({ row }) => {
          const pct = row.original.amount > 0
            ? (row.original.invoicedAmount / row.original.amount) * 100
            : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-10 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pct >= 90 ? 'bg-success-500' : pct >= 50 ? 'bg-primary-500' : 'bg-warning-500',
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600 tabular-nums">{pct.toFixed(0)}%</span>
            </div>
          );
        },
      },
    ],
    [handleSave, updateItemMutation.isPending],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={e?.name ?? ''}
        subtitle={[e?.projectName, e?.specificationName].filter(Boolean).join(' / ') || undefined}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.detail.breadcrumbHome'), href: '/' },
          { label: t('estimates.detail.breadcrumbEstimates'), href: '/estimates' },
          { label: e?.name ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={e?.status ?? ''}
              colorMap={estimateStatusColorMap}
              label={estimateStatusLabels[e?.status ?? ''] ?? e?.status ?? ''}
              size="md"
            />
            {e && (
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<Printer size={14} />}
                onClick={() => {
                  printEstimate({
                    name: e.name,
                    projectName: e.projectName ?? '',
                    status: e.status,
                    statusDisplayName: estimateStatusLabels[e.status] ?? e.status,
                    totalAmount: e.totalAmount,
                    orderedAmount: e.orderedAmount,
                    invoicedAmount: e.invoicedAmount,
                    totalSpent: e.totalSpent,
                    balance: e.balance,
                    createdAt: e.createdAt,
                    notes: e.notes,
                    items: (estimateItems ?? []).map((item, idx) => ({
                      rowNumber: idx + 1,
                      name: item.name,
                      unitOfMeasure: item.unitOfMeasure,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      amount: item.amount,
                      unitPriceCustomer: item.unitPriceCustomer,
                      amountCustomer: item.amountCustomer,
                    })),
                  });
                }}
              >
                {t('export.common.print')}
              </Button>
            )}
          </div>
        }
      />

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('estimates.detail.metricPlanned')}
          value={formatMoneyCompact(e?.totalAmount ?? 0)}
        />
        <MetricCard
          icon={<Receipt size={18} />}
          label={t('estimates.detail.metricOrdered')}
          value={formatMoneyCompact(e?.orderedAmount ?? 0)}
          trend={{ direction: 'up', value: formatPercent(orderedPercent) }}
        />
        <MetricCard
          icon={<CreditCard size={18} />}
          label={t('estimates.detail.metricPaid')}
          value={formatMoneyCompact(e?.totalSpent ?? 0)}
          trend={{ direction: 'up', value: formatPercent(executionPercent) }}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('estimates.detail.metricBalance')}
          value={formatMoneyCompact(e?.balance ?? 0)}
          trend={{
            direction: (e?.balance ?? 0) > 0 ? 'up' : 'down',
            value: formatPercent(100 - executionPercent),
          }}
        />
      </div>

      {/* Budget execution progress */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('estimates.detail.budgetExecution')}</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('estimates.detail.metricOrdered')}</p>
              <p className="text-xs font-medium text-neutral-600 tabular-nums">
                {formatPercent(orderedPercent)}
              </p>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full transition-all"
                style={{ width: `${Math.min(orderedPercent, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('estimates.detail.metricPaid')}</p>
              <p className="text-xs font-medium text-neutral-600 tabular-nums">
                {formatPercent(executionPercent)}
              </p>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  executionPercent > 90 ? 'bg-success-500' : 'bg-success-400',
                )}
                style={{ width: `${Math.min(executionPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hint about inline editing */}
      {estimateItems.some(item => item.unitPrice === 0) && (
        <div className="mb-4 px-4 py-3 bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg text-sm text-warning-700 dark:text-warning-300">
          <Pencil size={14} className="inline mr-2 -mt-0.5" />
          Нажмите на цену в столбце «{t('estimates.detail.colUnitPrice')}» для редактирования. Позиции с нулевой ценой выделены.
        </div>
      )}

      {/* Items table */}
      <DataTable<EstimateItem>
        data={estimateItems}
        columns={columns}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('estimates.detail.emptyItemsTitle')}
        emptyDescription={t('estimates.detail.emptyItemsDescription')}
      />

      {/* Financial summary */}
      <div className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('estimates.detail.financialSummary')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.detail.metricPlanned')}</p>
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(e?.totalAmount ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.detail.metricOrdered')}</p>
            <p className="text-base font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(e?.orderedAmount ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.detail.metricPaid')}</p>
            <p className="text-base font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(e?.totalSpent ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {(e?.orderedAmount ?? 0) === 0 && (e?.totalSpent ?? 0) === 0
                ? t('estimates.detail.labelBudgetRemaining', { defaultValue: 'Остаток бюджета' })
                : (e?.variancePercent ?? 0) < 0
                  ? t('estimates.detail.labelOverspend', { defaultValue: 'Перерасход' })
                  : t('estimates.detail.labelVariance')}
            </p>
            <p className={cn(
              'text-base font-semibold tabular-nums',
              (e?.orderedAmount ?? 0) === 0 && (e?.totalSpent ?? 0) === 0
                ? 'text-neutral-600 dark:text-neutral-400'
                : (e?.variancePercent ?? 0) > 0 ? 'text-success-600' : (e?.variancePercent ?? 0) < 0 ? 'text-danger-600' : 'text-neutral-600',
            )}>
              {(e?.orderedAmount ?? 0) === 0 && (e?.totalSpent ?? 0) === 0
                ? formatMoney(e?.totalAmount ?? 0)
                : <>
                    {(e?.variancePercent ?? 0) > 0 ? '+' : ''}{formatPercent(Math.abs(e?.variancePercent ?? 0))}
                  </>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateDetailPage;
