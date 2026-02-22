import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import type { BudgetItem, BudgetItemType } from '@/types';
import InlineEditCell from './InlineEditCell';
import CvrBar from './CvrBar';
import { ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface FmItemsTableProps {
  budgetId: string;
  items: BudgetItem[];
  branch: 'ALL' | 'WORKS' | 'MATERIALS';
}

const fmtAmt = (v?: number | null) =>
  v != null ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v) : '—';

const marginColorClass = (pct?: number | null): string => {
  if (pct == null) return '';
  if (pct < 0) return 'text-red-600 dark:text-red-400 font-semibold';
  if (pct < 5) return 'text-orange-500 dark:text-orange-400';
  if (pct < 15) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
};

const DocStatusBadge = ({ status }: { status?: string | null }) => {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    PLANNED: { label: 'План', cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300' },
    TENDERED: { label: 'Тендер', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    CONTRACTED: { label: 'Договор', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    ACT_SIGNED: { label: 'Акт', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    INVOICED: { label: 'Счёт', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    PAID: { label: 'Оплач', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  };
  const info = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-600' };
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${info.cls}`}>{info.label}</span>;
};

export default function FmItemsTable({ budgetId, items, branch }: FmItemsTableProps) {
  const queryClient = useQueryClient();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    if (branch === 'ALL') return items;
    return items.filter(
      (item) => item.section || item.itemType === branch,
    );
  }, [items, branch]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleItems = useMemo(() => {
    const result: BudgetItem[] = [];
    for (const item of filteredItems) {
      if (item.parentId && collapsedSections.has(item.parentId)) continue;
      result.push(item);
    }
    return result;
  }, [filteredItems, collapsedSections]);

  const patchMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<BudgetItem> }) =>
      financeApi.updateBudgetItem(budgetId, itemId, data),
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['budget-items', budgetId] });
      const prev = queryClient.getQueryData<BudgetItem[]>(['budget-items', budgetId]);
      if (prev) {
        queryClient.setQueryData(
          ['budget-items', budgetId],
          prev.map((it) => (it.id === itemId ? { ...it, ...data } : it)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['budget-items', budgetId], context.prev);
      }
      toast.error('Ошибка сохранения');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
    },
  });

  const handleInlineEdit = (itemId: string, field: string, value: number) => {
    patchMutation.mutate({ itemId, data: { [field]: value } });
  };

  // Totals
  const totals = useMemo(() => {
    const nonSection = items.filter((i) => !i.section);
    const sum = (fn: (i: BudgetItem) => number) => nonSection.reduce((acc, i) => acc + fn(i), 0);
    return {
      costTotal: sum((i) => (i.costPrice ?? 0) * (i.quantity ?? 1)),
      estimateTotal: sum((i) => (i.estimatePrice ?? 0) * (i.quantity ?? 1)),
      customerTotal: sum((i) => (i.customerPrice ?? 0) * (i.quantity ?? 1)),
      marginTotal: sum((i) => i.marginAmount ?? 0),
      planned: sum((i) => i.plannedAmount ?? 0),
      contracted: sum((i) => i.contractedAmount ?? 0),
      actSigned: sum((i) => i.actSignedAmount ?? 0),
      paid: sum((i) => i.paidAmount ?? 0),
    };
  }, [items]);

  const marginPct = totals.customerTotal > 0
    ? (totals.marginTotal / totals.customerTotal) * 100
    : 0;

  const thCls = 'px-2 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap';
  const tdCls = 'px-2 py-1.5 text-sm border-b border-neutral-100 dark:border-neutral-800';

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm min-w-[1200px]">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className={`${thCls} text-left w-[280px]`}>{t('fm.colName')}</th>
            <th className={`${thCls} text-center w-[50px]`}>{t('fm.colUnit')}</th>
            <th className={`${thCls} text-right w-[70px]`}>{t('fm.colQty')}</th>
            <th className={`${thCls} text-right w-[100px]`}>{t('fm.colCostPrice')}</th>
            <th className={`${thCls} text-right w-[110px]`}>{t('fm.colCostTotal')}</th>
            <th className={`${thCls} text-right w-[110px]`}>{t('fm.colEstimate')}</th>
            <th className={`${thCls} text-right w-[100px]`}>{t('fm.colCustomerPrice')}</th>
            <th className={`${thCls} text-right w-[110px]`}>{t('fm.colCustomerTotal')}</th>
            <th className={`${thCls} text-right w-[90px]`}>{t('fm.colMargin')}</th>
            <th className={`${thCls} text-right w-[60px]`}>{t('fm.colMarginPct')}</th>
            <th className={`${thCls} text-center w-[60px]`}>{t('fm.colDocStatus')}</th>
            <th className={`${thCls} w-[130px]`}>{t('fm.colCvr')}</th>
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((item) => {
            if (item.section) {
              const isCollapsed = collapsedSections.has(item.id);
              return (
                <tr
                  key={item.id}
                  className="bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                  onClick={() => toggleSection(item.id)}
                >
                  <td className={`${tdCls} font-semibold text-neutral-800 dark:text-neutral-200`} colSpan={12}>
                    <div className="flex items-center gap-1.5">
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {item.name}
                    </div>
                  </td>
                </tr>
              );
            }

            const costTotal = (item.costPrice ?? 0) * (item.quantity ?? 1);
            const estimateTotal = (item.estimatePrice ?? 0) * (item.quantity ?? 1);
            const customerTotal = (item.customerPrice ?? 0) * (item.quantity ?? 1);
            const showWarning =
              item.customerPrice != null &&
              item.estimatePrice != null &&
              item.customerPrice > item.estimatePrice;

            return (
              <tr key={item.id} className="hover:bg-blue-50/40 dark:hover:bg-neutral-800/30">
                <td className={`${tdCls} text-neutral-800 dark:text-neutral-200 truncate max-w-[280px]`}>
                  <span className={item.parentId ? 'pl-4' : ''}>{item.name}</span>
                </td>
                <td className={`${tdCls} text-center text-neutral-500 dark:text-neutral-400`}>{item.unit || '—'}</td>
                <td className={`${tdCls} text-right`}>
                  <InlineEditCell
                    value={item.quantity}
                    onSave={(v) => handleInlineEdit(item.id, 'quantity', v)}
                  />
                </td>
                <td className={`${tdCls} text-right`}>
                  <InlineEditCell
                    value={item.costPrice}
                    onSave={(v) => handleInlineEdit(item.id, 'costPrice', v)}
                  />
                </td>
                <td className={`${tdCls} text-right tabular-nums text-neutral-600 dark:text-neutral-400`}>
                  {fmtAmt(costTotal)}
                </td>
                <td className={`${tdCls} text-right tabular-nums text-neutral-600 dark:text-neutral-400`}>
                  {fmtAmt(estimateTotal)}
                </td>
                <td className={`${tdCls} text-right`}>
                  <span className={showWarning ? 'ring-1 ring-red-400 rounded' : ''}>
                    <InlineEditCell
                      value={item.customerPrice}
                      onSave={(v) => handleInlineEdit(item.id, 'customerPrice', v)}
                    />
                  </span>
                  {showWarning && (
                    <span className="block text-[10px] text-red-500 mt-0.5" title={t('fm.customerPriceWarning')}>
                      !
                    </span>
                  )}
                </td>
                <td className={`${tdCls} text-right tabular-nums text-neutral-700 dark:text-neutral-300 font-medium`}>
                  {fmtAmt(customerTotal)}
                </td>
                <td className={`${tdCls} text-right tabular-nums ${marginColorClass(item.marginPercent)}`}>
                  {fmtAmt(item.marginAmount)}
                </td>
                <td className={`${tdCls} text-right tabular-nums ${marginColorClass(item.marginPercent)}`}>
                  {item.marginPercent != null ? `${item.marginPercent.toFixed(1)}%` : '—'}
                </td>
                <td className={`${tdCls} text-center`}>
                  <DocStatusBadge status={item.docStatus} />
                </td>
                <td className={tdCls}>
                  <CvrBar
                    planned={item.plannedAmount ?? 0}
                    contracted={item.contractedAmount ?? 0}
                    actSigned={item.actSignedAmount ?? 0}
                    paid={item.paidAmount ?? 0}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Sticky footer */}
        <tfoot className="sticky bottom-0 bg-neutral-100 dark:bg-neutral-800 font-semibold">
          <tr>
            <td className={`${tdCls} text-neutral-900 dark:text-neutral-100`}>{t('fm.totalFooter')}</td>
            <td className={tdCls} />
            <td className={tdCls} />
            <td className={tdCls} />
            <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.costTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.estimateTotal)}</td>
            <td className={tdCls} />
            <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.customerTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums ${marginColorClass(marginPct)}`}>{fmtAmt(totals.marginTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums ${marginColorClass(marginPct)}`}>{marginPct.toFixed(1)}%</td>
            <td className={tdCls} />
            <td className={tdCls}>
              <CvrBar
                planned={totals.planned}
                contracted={totals.contracted}
                actSigned={totals.actSigned}
                paid={totals.paid}
              />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
