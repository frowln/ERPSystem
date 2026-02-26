import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import type { BudgetSnapshot, SnapshotComparison, SnapshotItemDelta } from '@/types';
import { ArrowLeft } from 'lucide-react';

interface SnapshotCompareTableProps {
  budgetId: string;
  snapshotId: string;
  onBack: () => void;
}

const fmt = (v?: number | null) =>
  v != null ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v) : '—';

const fmtDelta = (v?: number | null) => {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return sign + new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v);
};

const deltaColor = (v?: number | null) => {
  if (v == null || v === 0) return '';
  return v > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
};

const changeTypeBadge = (type: string, t: (k: string) => string) => {
  const map: Record<string, { label: string; cls: string }> = {
    ADDED: { label: t('finance.fm.snapshot.changeAdded'), cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    REMOVED: { label: t('finance.fm.snapshot.changeRemoved'), cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    CHANGED: { label: t('finance.fm.snapshot.changeChanged'), cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  };
  const info = map[type] || { label: type, cls: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
};

export default function SnapshotCompareTable({ budgetId, snapshotId, onBack }: SnapshotCompareTableProps) {
  const [targetSnapshotId, setTargetSnapshotId] = useState('');

  const { data: snapshots } = useQuery({
    queryKey: ['budget-snapshots', budgetId, 'compare-options'],
    queryFn: () => financeApi.getSnapshots(budgetId, { page: 0, size: 100 }),
  });

  const targetOptions = useMemo(
    () => (snapshots?.content ?? []).filter((snap: BudgetSnapshot) => snap.id !== snapshotId),
    [snapshots, snapshotId],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['snapshot-compare', budgetId, snapshotId, targetSnapshotId],
    queryFn: () => financeApi.compareSnapshot(budgetId, snapshotId, targetSnapshotId || undefined),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500 animate-pulse">{t('common.loading')}</div>;
  }

  if (!data) return null;
  const targetLabel = data.comparedWithCurrent
    ? t('finance.fm.snapshot.compareTargetCurrent')
    : (data.targetSnapshotName ?? t('finance.fm.snapshot.compareTargetCurrent'));

  const thCls = 'px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 text-left bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700';
  const tdCls = 'px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {t('finance.fm.snapshot.compareTitle', { name: data.snapshotName })}
          </h3>
          <p className="text-xs text-neutral-500">
            {new Date(data.snapshotDate).toLocaleDateString('ru-RU')}
          </p>
          <p className="text-xs text-neutral-500">
            {t('finance.fm.snapshot.compareTargetLabel')}: {targetLabel}
          </p>
        </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{t('finance.fm.snapshot.compareTargetLabel')}</span>
          <select
            value={targetSnapshotId}
            onChange={(e) => setTargetSnapshotId(e.target.value)}
            className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="">{t('finance.fm.snapshot.compareTargetCurrent')}</option>
            {targetOptions.map((snap: BudgetSnapshot) => (
              <option key={snap.id} value={snap.id}>
                {snap.snapshotName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.fm.kpiCostPrice')}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(data.currentTotalCost)}</p>
          <p className={`text-xs ${deltaColor(data.deltaCost)}`}>{fmtDelta(data.deltaCost)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.fm.kpiCustomerPrice')}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(data.currentTotalCustomer)}</p>
          <p className={`text-xs ${deltaColor(data.deltaCustomer)}`}>{fmtDelta(data.deltaCustomer)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.fm.kpiMargin')}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(data.currentTotalMargin)}</p>
          <p className={`text-xs ${deltaColor(data.deltaMargin)}`}>{fmtDelta(data.deltaMargin)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr>
              <th className={thCls}>{t('finance.fm.snapshot.colItem')}</th>
              <th className={thCls}>{t('finance.fm.snapshot.colChange')}</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.colCostPrice')} ({t('finance.fm.snapshot.colSnapshot')})</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.colCostPrice')} ({targetLabel})</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.snapshot.colDelta')}</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.colMargin')} ({t('finance.fm.snapshot.colSnapshot')})</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.colMargin')} ({targetLabel})</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.snapshot.colDelta')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: SnapshotItemDelta) => (
              <tr key={item.itemId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className={`${tdCls} font-medium max-w-[200px] truncate`}>{item.name}</td>
                <td className={tdCls}>{changeTypeBadge(item.changeType, t)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(item.snapshotCostPrice)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(item.currentCostPrice)}</td>
                <td className={`${tdCls} text-right tabular-nums ${deltaColor(item.deltaCostPrice)}`}>
                  {fmtDelta(item.deltaCostPrice)}
                </td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(item.snapshotMarginAmount)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(item.currentMarginAmount)}</td>
                <td className={`${tdCls} text-right tabular-nums ${deltaColor(item.deltaMarginAmount)}`}>
                  {fmtDelta(item.deltaMarginAmount)}
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                  {t('finance.fm.snapshot.noChanges')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
