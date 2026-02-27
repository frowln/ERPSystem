import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import type { BudgetItem, BudgetItemType } from '@/types';
import InlineEditCell from './InlineEditCell';
import CvrBar from './CvrBar';
import { ChevronDown, ChevronRight, ChevronsUpDown, ChevronsDownUp, Trash2, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

interface FmItemsTableProps {
  budgetId: string;
  items: BudgetItem[];
  branch: 'ALL' | 'WORKS' | 'MATERIALS' | 'EQUIPMENT';
  validationMode?: 'soft' | 'hard';
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

const docStatusCls: Record<string, string> = {
  PLANNED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
  TENDERED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CONTRACTED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ACT_SIGNED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  INVOICED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const docStatusI18n: Record<string, string> = {
  PLANNED: 'finance.docStatusPlanned',
  TENDERED: 'finance.docStatusTendered',
  CONTRACTED: 'finance.docStatusContracted',
  ACT_SIGNED: 'finance.docStatusActSigned',
  INVOICED: 'finance.docStatusInvoiced',
  PAID: 'finance.docStatusPaid',
};

const DocStatusBadge = ({ status }: { status?: string | null }) => {
  if (!status) return null;
  const cls = docStatusCls[status] || 'bg-neutral-100 text-neutral-600';
  const label = docStatusI18n[status] ? t(docStatusI18n[status]) : status;
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
};

export default function FmItemsTable({ budgetId, items, branch, validationMode = 'soft' }: FmItemsTableProps) {
  const queryClient = useQueryClient();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Section IDs for expand/collapse all
  const sectionIds = useMemo(() => items.filter((i) => i.section).map((i) => i.id), [items]);
  const allCollapsed = sectionIds.length > 0 && sectionIds.every((id) => collapsedSections.has(id));

  const toggleAllSections = () => {
    if (allCollapsed) {
      setCollapsedSections(new Set());
    } else {
      setCollapsedSections(new Set(sectionIds));
    }
  };

  // Build proper tree order: section → its children → next section → its children...
  // This fixes ordering when all items have sequence=0 (returned in undefined DB order)
  const treeOrderedItems = useMemo(() => {
    const childrenByParent = new Map<string, BudgetItem[]>();
    const sections: BudgetItem[] = [];
    const orphans: BudgetItem[] = [];

    for (const item of items) {
      if (item.section) {
        sections.push(item);
      } else if (item.parentId) {
        if (!childrenByParent.has(item.parentId)) childrenByParent.set(item.parentId, []);
        childrenByParent.get(item.parentId)!.push(item);
      } else {
        orphans.push(item);
      }
    }

    const result: BudgetItem[] = [];
    for (const section of sections) {
      result.push(section);
      result.push(...(childrenByParent.get(section.id) ?? []));
    }
    result.push(...orphans);
    return result;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (branch === 'ALL') return treeOrderedItems;
    return treeOrderedItems.filter(
      (item) => item.section || item.itemType === branch,
    );
  }, [treeOrderedItems, branch]);

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

  // Section subtotals
  const sectionTotals = useMemo(() => {
    const map = new Map<string, { costTotal: number; estimateTotal: number; customerTotal: number; ndvTotal: number; marginTotal: number; overheadTotal: number; profitTotal: number; contingencyTotal: number }>();
    for (const item of items) {
      if (item.parentId && !item.section) {
        const prev = map.get(item.parentId) || { costTotal: 0, estimateTotal: 0, customerTotal: 0, ndvTotal: 0, marginTotal: 0, overheadTotal: 0, profitTotal: 0, contingencyTotal: 0 };
        const ct = (item.customerPrice ?? 0) * (item.quantity ?? 1);
        const costLine = (item.costPrice ?? 0) * (item.quantity ?? 1);
        const oh = costLine * ((item.overheadRate ?? 0) / 100);
        const sp = costLine * ((item.profitRate ?? 0) / 100);
        const cg = (costLine + oh) * ((item.contingencyRate ?? 0) / 100);
        prev.costTotal += costLine;
        prev.estimateTotal += (item.estimatePrice ?? 0) * (item.quantity ?? 1);
        prev.customerTotal += ct;
        prev.ndvTotal += ct * 0.22;
        prev.marginTotal += item.marginAmount ?? 0;
        prev.overheadTotal += oh;
        prev.profitTotal += sp;
        prev.contingencyTotal += cg;
        map.set(item.parentId, prev);
      }
    }
    return map;
  }, [items]);

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
      toast.error(t('finance.fm.toasts.saveError'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => financeApi.deleteBudgetItem(budgetId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
      toast.success(t('finance.fm.toasts.itemDeleted'));
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const linkToWbsMutation = useMutation({
    mutationFn: ({ itemId, wbsNodeId }: { itemId: string; wbsNodeId: string }) =>
      financeApi.linkBudgetItemToWbs(budgetId, itemId, wbsNodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', budgetId] });
      toast.success('Привязано к графику и распределено по времени (Cash Flow)');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Ошибка привязки к графику'),
  });

  const handleLinkToWbs = (itemId: string) => {
    const wbsId = window.prompt('Введите ID задачи из графика (WBS Node ID):');
    if (wbsId) {
      linkToWbsMutation.mutate({ itemId, wbsNodeId: wbsId });
    }
  };

  const handleInlineEdit = (itemId: string, field: string, value: number) => {
    // Hard validation mode: block save if customerPrice > estimatePrice
    if (validationMode === 'hard' && field === 'customerPrice') {
      const item = items.find((i) => i.id === itemId);
      if (item && item.estimatePrice != null && value > item.estimatePrice) {
        toast.error(t('finance.fm.validationHardError'));
        return;
      }
    }
    patchMutation.mutate({ itemId, data: { [field]: value } });
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm(t('finance.fm.confirmDeleteItem'))) {
      deleteMutation.mutate(itemId);
    }
  };

  // Totals
  const totals = useMemo(() => {
    const nonSection = items.filter((i) => !i.section);
    const sum = (fn: (i: BudgetItem) => number) => nonSection.reduce((acc, i) => acc + fn(i), 0);
    const costTotal = sum((i) => (i.costPrice ?? 0) * (i.quantity ?? 1));
    const customerTotal = sum((i) => (i.customerPrice ?? 0) * (i.quantity ?? 1));
    let overheadTotal = 0, profitTotal = 0, contingencyTotal = 0;
    for (const i of nonSection) {
      const cl = (i.costPrice ?? 0) * (i.quantity ?? 1);
      const oh = cl * ((i.overheadRate ?? 0) / 100);
      overheadTotal += oh;
      profitTotal += cl * ((i.profitRate ?? 0) / 100);
      contingencyTotal += (cl + oh) * ((i.contingencyRate ?? 0) / 100);
    }
    return {
      costTotal,
      estimateTotal: sum((i) => (i.estimatePrice ?? 0) * (i.quantity ?? 1)),
      customerTotal,
      ndvTotal: customerTotal * 0.22,
      marginTotal: sum((i) => i.marginAmount ?? 0),
      overheadTotal,
      profitTotal,
      contingencyTotal,
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
      {/* Expand/Collapse All toggle */}
      {sectionIds.length > 0 && (
        <div className="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <button
            onClick={toggleAllSections}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          >
            {allCollapsed
              ? <><ChevronsUpDown className="w-3.5 h-3.5" /> {t('finance.fm.expandAll')}</>
              : <><ChevronsDownUp className="w-3.5 h-3.5" /> {t('finance.fm.collapseAll')}</>
            }
          </button>
        </div>
      )}

      <table className="w-full text-sm min-w-[1600px]">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className={`${thCls} text-left w-[240px]`}>{t('finance.fm.colName')}</th>
            <th className={`${thCls} text-center w-[50px]`}>{t('finance.fm.colUnit')}</th>
            <th className={`${thCls} text-right w-[60px]`}>{t('finance.fm.colQty')}</th>
            <th className={`${thCls} text-right w-[90px]`}>{t('finance.fm.colCostPrice')}</th>
            <th className={`${thCls} text-right w-[100px]`}>{t('finance.fm.colCostTotal')}</th>
            <th className={`${thCls} text-right w-[100px]`}>{t('finance.fm.colEstimate')}</th>
            <th className={`${thCls} text-right w-[55px]`} title={t('finance.fm.colOverheadHint')}>{t('finance.fm.colOverhead')}</th>
            <th className={`${thCls} text-right w-[55px]`} title={t('finance.fm.colProfitHint')}>{t('finance.fm.colProfit')}</th>
            <th className={`${thCls} text-right w-[55px]`} title={t('finance.fm.colContingencyHint')}>{t('finance.fm.colContingency')}</th>
            <th className={`${thCls} text-right w-[90px]`}>{t('finance.fm.colCustomerPrice')}</th>
            <th className={`${thCls} text-right w-[100px]`}>{t('finance.fm.colCustomerTotal')}</th>
            <th className={`${thCls} text-right w-[80px]`} title={t('finance.fm.colNdvHint')}>{t('finance.fm.colNdv')}</th>
            <th className={`${thCls} text-right w-[80px]`}>{t('finance.fm.colMargin')}</th>
            <th className={`${thCls} text-right w-[55px]`}>{t('finance.fm.colMarginPct')}</th>
            <th className={`${thCls} text-center w-[60px]`}>{t('finance.fm.colDocStatus')}</th>
            <th className={`${thCls} w-[120px]`}>{t('finance.fm.colCvr')}</th>
            <th className={`${thCls} w-[40px]`} />
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((item) => {
            if (item.section) {
              const isCollapsed = collapsedSections.has(item.id);
              const sub = sectionTotals.get(item.id);
              return (
                <tr
                  key={item.id}
                  className="bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                  onClick={() => toggleSection(item.id)}
                >
                  <td className={`${tdCls} font-semibold text-neutral-800 dark:text-neutral-200`} colSpan={4}>
                    <div className="flex items-center gap-1.5">
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {item.name}
                    </div>
                  </td>
                  <td className={`${tdCls} text-right tabular-nums font-semibold text-neutral-700 dark:text-neutral-300`}>
                    {sub ? fmtAmt(sub.costTotal) : ''}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums font-semibold text-neutral-700 dark:text-neutral-300`}>
                    {sub ? fmtAmt(sub.estimateTotal) : ''}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums font-semibold text-orange-600 dark:text-orange-400`}>
                    {sub ? fmtAmt(sub.overheadTotal) : ''}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums font-semibold text-teal-600 dark:text-teal-400`}>
                    {sub ? fmtAmt(sub.profitTotal) : ''}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400`}>
                    {sub ? fmtAmt(sub.contingencyTotal) : ''}
                  </td>
                  <td className={tdCls} />
                  <td className={`${tdCls} text-right tabular-nums font-semibold text-neutral-700 dark:text-neutral-300`}>
                    {sub ? fmtAmt(sub.customerTotal) : ''}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums font-semibold text-violet-600 dark:text-violet-400`}>
                    {sub ? fmtAmt(sub.ndvTotal) : ''}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums font-semibold ${sub ? marginColorClass(sub.customerTotal > 0 ? (sub.marginTotal / sub.customerTotal) * 100 : 0) : ''}`}>
                    {sub ? fmtAmt(sub.marginTotal) : ''}
                  </td>
                  <td className={tdCls} />
                  <td className={tdCls} />
                  <td className={tdCls} />
                  <td className={tdCls} />
                </tr>
              );
            }

            const costTotal = (item.costPrice ?? 0) * (item.quantity ?? 1);
            const estimateTotal = (item.estimatePrice ?? 0) * (item.quantity ?? 1);
            const overheadAmt = costTotal * ((item.overheadRate ?? 0) / 100);
            const profitAmt = costTotal * ((item.profitRate ?? 0) / 100);
            const contingencyAmt = (costTotal + overheadAmt) * ((item.contingencyRate ?? 0) / 100);
            const customerTotal = (item.customerPrice ?? 0) * (item.quantity ?? 1);
            const showWarning =
              item.customerPrice != null &&
              item.estimatePrice != null &&
              item.customerPrice > item.estimatePrice;
            const isHardWarning = showWarning && validationMode === 'hard';

            return (
              <tr key={item.id} className="group hover:bg-blue-50/40 dark:hover:bg-neutral-800/30">
                <td className={`${tdCls} text-neutral-800 dark:text-neutral-200 truncate max-w-[260px]`}>
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
                  <InlineEditCell
                    value={item.overheadRate}
                    onSave={(v) => handleInlineEdit(item.id, 'overheadRate', v)}
                  />
                  <span className="block text-[10px] text-orange-500 dark:text-orange-400 tabular-nums">{fmtAmt(overheadAmt)}</span>
                </td>
                <td className={`${tdCls} text-right`}>
                  <InlineEditCell
                    value={item.profitRate}
                    onSave={(v) => handleInlineEdit(item.id, 'profitRate', v)}
                  />
                  <span className="block text-[10px] text-teal-500 dark:text-teal-400 tabular-nums">{fmtAmt(profitAmt)}</span>
                </td>
                <td className={`${tdCls} text-right`}>
                  <InlineEditCell
                    value={item.contingencyRate}
                    onSave={(v) => handleInlineEdit(item.id, 'contingencyRate', v)}
                  />
                  <span className="block text-[10px] text-amber-500 dark:text-amber-400 tabular-nums">{fmtAmt(contingencyAmt)}</span>
                </td>
                <td className={`${tdCls} text-right`}>
                  <span className={isHardWarning ? 'ring-2 ring-red-500 rounded' : showWarning ? 'ring-1 ring-red-400 rounded' : ''}>
                    <InlineEditCell
                      value={item.customerPrice}
                      onSave={(v) => handleInlineEdit(item.id, 'customerPrice', v)}
                    />
                  </span>
                  {showWarning && (
                    <span className="block text-[10px] text-red-500 mt-0.5" title={t('finance.fm.customerPriceWarning')}>
                      !
                    </span>
                  )}
                </td>
                <td className={`${tdCls} text-right tabular-nums text-neutral-700 dark:text-neutral-300 font-medium`}>
                  {fmtAmt(customerTotal)}
                </td>
                <td className={`${tdCls} text-right tabular-nums text-violet-600 dark:text-violet-400`}>
                  {fmtAmt(customerTotal * 0.22)}
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
                <td className={`${tdCls} text-center`}>
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLinkToWbs(item.id); }}
                      className="p-1 text-neutral-400 hover:text-blue-600 rounded transition-colors"
                      title="Привязать к задаче графика (WBS) для Cash Flow"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                      title={t('finance.fm.deleteItem')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Sticky footer */}
        <tfoot className="sticky bottom-0 bg-neutral-100 dark:bg-neutral-800 font-semibold">
          <tr>
            <td className={`${tdCls} text-neutral-900 dark:text-neutral-100`}>{t('finance.fm.totalFooter')}</td>
            <td className={tdCls} />
            <td className={tdCls} />
            <td className={tdCls} />
            <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.costTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.estimateTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums text-orange-600 dark:text-orange-400`}>{fmtAmt(totals.overheadTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums text-teal-600 dark:text-teal-400`}>{fmtAmt(totals.profitTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums text-amber-600 dark:text-amber-400`}>{fmtAmt(totals.contingencyTotal)}</td>
            <td className={tdCls} />
            <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.customerTotal)}</td>
            <td className={`${tdCls} text-right tabular-nums text-violet-600 dark:text-violet-400 font-bold`}>{fmtAmt(totals.ndvTotal)}</td>
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
            <td className={tdCls} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
