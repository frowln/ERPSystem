import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import type { SnapshotComparison, SnapshotItemDelta } from '@/types';
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
    ADDED: { label: t('fm.snapshot.changeAdded'), cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    REMOVED: { label: t('fm.snapshot.changeRemoved'), cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    CHANGED: { label: t('fm.snapshot.changeChanged'), cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  };
  const info = map[type] || { label: type, cls: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
};

export default function SnapshotCompareTable({ budgetId, snapshotId, onBack }: SnapshotCompareTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['snapshot-compare', budgetId, snapshotId],
    queryFn: () => financeApi.compareSnapshot(budgetId, snapshotId),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500">...</div>;
  }

  if (!data) return null;

  const thCls = 'px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 text-left bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700';
  const tdCls = 'px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <button onClick={onBack} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {t('fm.snapshot.compareTitle', { name: data.snapshotName })}
          </h3>
          <p className="text-xs text-neutral-500">
            {new Date(data.snapshotDate).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('fm.kpiCostPrice')}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(data.currentTotalCost)}</p>
          <p className={`text-xs ${deltaColor(data.deltaCost)}`}>{fmtDelta(data.deltaCost)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('fm.kpiCustomerPrice')}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(data.currentTotalCustomer)}</p>
          <p className={`text-xs ${deltaColor(data.deltaCustomer)}`}>{fmtDelta(data.deltaCustomer)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('fm.kpiMargin')}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(data.currentTotalMargin)}</p>
          <p className={`text-xs ${deltaColor(data.deltaMargin)}`}>{fmtDelta(data.deltaMargin)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr>
              <th className={thCls}>{t('fm.snapshot.colItem')}</th>
              <th className={thCls}>{t('fm.snapshot.colChange')}</th>
              <th className={`${thCls} text-right`}>{t('fm.colCostPrice')} ({t('fm.snapshot.colSnapshot')})</th>
              <th className={`${thCls} text-right`}>{t('fm.colCostPrice')} ({t('fm.snapshot.colCurrent')})</th>
              <th className={`${thCls} text-right`}>{t('fm.snapshot.colDelta')}</th>
              <th className={`${thCls} text-right`}>{t('fm.colMargin')} ({t('fm.snapshot.colSnapshot')})</th>
              <th className={`${thCls} text-right`}>{t('fm.colMargin')} ({t('fm.snapshot.colCurrent')})</th>
              <th className={`${thCls} text-right`}>{t('fm.snapshot.colDelta')}</th>
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
                  Нет изменений
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
