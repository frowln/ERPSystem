import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoneyWhole } from '@/lib/format';
import { t } from '@/i18n';
import type { BudgetItemDocStatus, BudgetItemType, FinanceExpenseItem } from '@/types';
import type { BudgetTreeNode } from './types';
import { DOC_STATUS_CFG, MARK_COLORS, TABLE_HEADER_CLS, TABLE_HEADER_RIGHT_CLS } from './types';

type CategoryFilter = 'ALL' | BudgetItemType;

const CATEGORY_TABS: { id: CategoryFilter; labelKey: string }[] = [
  { id: 'ALL', labelKey: 'projects.finance.categoryAll' },
  { id: 'WORKS', labelKey: 'projects.finance.categoryWorks' },
  { id: 'MATERIALS', labelKey: 'projects.finance.categoryMaterials' },
  { id: 'EQUIPMENT', labelKey: 'projects.finance.categoryEquipment' },
  { id: 'OVERHEAD', labelKey: 'projects.finance.categoryOverhead' },
  { id: 'OTHER', labelKey: 'projects.finance.categoryOther' },
];

interface LinkedContract {
  contractId: string;
  contractNumber: string;
  partnerName?: string;
  allocatedAmount?: number;
}

interface BudgetPositionsSectionProps {
  projectId: string | undefined;
  projectName: string | undefined;
  budgetPositionsCount: number;
  budgetRows: Array<{ node: BudgetTreeNode; depth: number }>;
  budgetTotals: { planned: number; contracted: number; actSigned: number; paid: number };
  expandedBudgetRows: Set<string>;
  toggleBudgetRow: (id: string) => void;
  isLoading: boolean;
  contractsByBudgetItemId?: Map<string, LinkedContract[]>;
}

export const BudgetPositionsSection = React.memo<BudgetPositionsSectionProps>(({
  projectId,
  projectName,
  budgetPositionsCount,
  budgetRows,
  budgetTotals,
  expandedBudgetRows,
  toggleBudgetRow,
  isLoading,
  contractsByBudgetItemId,
}) => {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  // Build a set of budget item IDs that match the category filter (for pruning section rows)
  const matchingLeafIds = useMemo(() => {
    if (categoryFilter === 'ALL') return null;
    const ids = new Set<string>();
    budgetRows.forEach(({ node }) => {
      if (!node.item.section && (node.item as FinanceExpenseItem).itemType === categoryFilter) {
        ids.add(node.item.id);
      }
    });
    return ids;
  }, [budgetRows, categoryFilter]);

  // Filter rows: show all sections (they provide context), but only matching leaf rows
  const filteredRows = useMemo(() => {
    if (categoryFilter === 'ALL' || matchingLeafIds === null) return budgetRows;
    return budgetRows.filter(({ node }) => node.item.section || matchingLeafIds.has(node.item.id));
  }, [budgetRows, categoryFilter, matchingLeafIds]);

  // Recompute totals for filtered rows
  const filteredTotals = useMemo(() => {
    if (categoryFilter === 'ALL') return budgetTotals;
    let planned = 0; let contracted = 0; let actSigned = 0; let paid = 0;
    filteredRows.forEach(({ node }) => {
      if (!node.item.section) {
        const item = node.item as FinanceExpenseItem;
        planned += Number(item.plannedAmount ?? 0);
        contracted += Number(item.contractedAmount ?? 0);
        actSigned += Number(item.actSignedAmount ?? 0);
        paid += Number(item.paidAmount ?? 0);
      }
    });
    return { planned, contracted, actSigned, paid };
  }, [filteredRows, categoryFilter, budgetTotals]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('projects.finance.budgetExecution')}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {t('projects.finance.budgetTreeDescription')}
          </p>
        </div>
        <span className="text-xs text-neutral-400">{budgetPositionsCount} {t('projects.finance.positions')}</span>
      </div>

      {/* Category filter tabs */}
      <div className="px-5 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-1 overflow-x-auto">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              categoryFilter === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700',
            )}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {budgetRows.length === 0 && !isLoading && (
        <div className="px-5 py-10 text-center">
          <Wallet size={32} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-500">{t('projects.finance.noBudgetPositions')}</p>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            {t('projects.finance.openFinanceBudgets')} <strong>{t('projects.finance.financeBudgetsPath')}</strong>, {t('projects.finance.createBudget')}
            {t('projects.finance.setProjectField')} <strong>{projectName ?? t('projects.finance.thisProject')}</strong>.
            {t('projects.finance.positionsWillAppear')}
          </p>
        </div>
      )}

      {(budgetRows.length > 0 || isLoading) && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                <th className={TABLE_HEADER_CLS} style={{ width: 64 }}>{t('projects.finance.colMark')}</th>
                <th className={TABLE_HEADER_CLS} style={{ width: '28%' }}>{t('projects.finance.colSectionPosition')}</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colCostPrice')}</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colEstimate')}</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colClientPrice')}</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colPlanned')}</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colContracted')}</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colActSigned')}</th>
                <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colPaid')}</th>
                <th className={TABLE_HEADER_CLS}>{t('projects.finance.colStatus')}</th>
                <th className={TABLE_HEADER_CLS}>{t('projects.finance.colContract')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
              {isLoading && (
                <tr>
                  <td colSpan={11} className="px-5 py-6 text-center text-sm text-neutral-400">{t('common.loading')}</td>
                </tr>
              )}
              {filteredRows.map(({ node, depth }) => {
                const item = node.item as FinanceExpenseItem;
                const markCls = MARK_COLORS[item.disciplineMark ?? ''] ?? 'bg-neutral-100 text-neutral-600';
                const isSection = item.section;
                const status = (item.docStatus ?? 'PLANNED') as BudgetItemDocStatus;
                const cfg = DOC_STATUS_CFG[status] ?? DOC_STATUS_CFG.PLANNED;
                const costPrice = Number(item.costPrice ?? 0);
                const estimatePrice = Number(item.estimatePrice ?? item.costPrice ?? 0);
                const customerPrice = Number(item.salePrice ?? 0);
                const isExpanded = expandedBudgetRows.has(item.id);
                const hasChildren = node.children.length > 0;

                // Multiple contracts for this budget position
                const linkedContracts = contractsByBudgetItemId?.get(item.id) ?? [];
                // Fallback to single contract from budget item itself
                const singleContract = (!linkedContracts.length && item.contractId && item.contractNumber)
                  ? [{ contractId: item.contractId, contractNumber: item.contractNumber, partnerName: item.contractPartnerName }]
                  : linkedContracts;

                if (isSection) {
                  return (
                    <tr key={item.id} className="bg-neutral-50/80 dark:bg-neutral-800/60 border-b border-neutral-100">
                      <td className="px-4 py-2.5">
                        {item.disciplineMark
                          ? <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-bold', markCls)}>{item.disciplineMark}</span>
                          : <span className="text-neutral-300">&mdash;</span>}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        <button
                          type="button"
                          onClick={() => hasChildren && toggleBudgetRow(item.id)}
                          className="flex items-center gap-1.5 text-left"
                          style={{ paddingLeft: `${depth * 16}px` }}
                        >
                          {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5" />}
                          <span className="uppercase tracking-wide text-xs">{item.name}</span>
                          <span className="text-[11px] font-normal text-neutral-400">({node.children.length})</span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-neutral-300">&mdash;</td>
                      <td className="px-4 py-2.5 text-right text-sm text-neutral-300">&mdash;</td>
                      <td className="px-4 py-2.5 text-right text-sm text-neutral-300">&mdash;</td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums font-semibold text-neutral-700">{formatMoneyWhole(node.totals.planned)}</td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums font-semibold text-primary-700">
                        {node.totals.contracted ? formatMoneyWhole(node.totals.contracted) : <span className="text-neutral-300">&mdash;</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums font-semibold text-orange-600">
                        {node.totals.actSigned ? formatMoneyWhole(node.totals.actSigned) : <span className="text-neutral-300">&mdash;</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm tabular-nums font-semibold text-success-700">
                        {node.totals.paid ? formatMoneyWhole(node.totals.paid) : <span className="text-neutral-300">&mdash;</span>}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-neutral-300">&mdash;</td>
                      <td className="px-4 py-2.5 text-sm text-neutral-300">&mdash;</td>
                    </tr>
                  );
                }

                const contractedPct = (item.plannedAmount ?? 0) > 0
                  ? Math.min(100, ((item.contractedAmount ?? 0) / (item.plannedAmount ?? 1)) * 100)
                  : 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      {item.disciplineMark
                        ? <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-bold', markCls)}>{item.disciplineMark}</span>
                        : <span className="text-neutral-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      <div className="truncate" style={{ paddingLeft: `${depth * 16}px` }}>
                        {item.name}
                        {item.itemType && item.itemType !== 'OTHER' && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 font-normal">
                            {t(`finance.itemType${item.itemType.charAt(0) + item.itemType.slice(1).toLowerCase()}` as Parameters<typeof t>[0])}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm tabular-nums text-right text-neutral-600">
                      {costPrice > 0 ? formatMoneyWhole(costPrice) : <span className="text-neutral-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm tabular-nums text-right text-neutral-600">
                      {estimatePrice > 0 ? formatMoneyWhole(estimatePrice) : <span className="text-neutral-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm tabular-nums text-right text-neutral-700">
                      {customerPrice > 0 ? formatMoneyWhole(customerPrice) : <span className="text-neutral-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm tabular-nums text-right text-neutral-600">
                      {(item.plannedAmount ?? 0) > 0 ? formatMoneyWhole(item.plannedAmount ?? 0) : <span className="text-neutral-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {(item.contractedAmount ?? 0) > 0 ? (
                        <div>
                          <span className="text-sm tabular-nums font-medium text-primary-700">{formatMoneyWhole(item.contractedAmount ?? 0)}</span>
                          {contractedPct > 0 && (
                            <div className="mt-0.5 h-1 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-400 rounded-full" style={{ width: `${contractedPct}%` }} />
                            </div>
                          )}
                        </div>
                      ) : <span className="text-neutral-300 text-sm">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm tabular-nums text-right">
                      {(item.actSignedAmount ?? 0) > 0
                        ? <span className="text-orange-600 font-medium">{formatMoneyWhole(item.actSignedAmount ?? 0)}</span>
                        : <span className="text-neutral-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm tabular-nums text-right">
                      {(item.paidAmount ?? 0) > 0
                        ? <span className="text-success-700 font-semibold">{formatMoneyWhole(item.paidAmount ?? 0)}</span>
                        : <span className="text-neutral-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', cfg.cls)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      {singleContract.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {singleContract.map((lc) => (
                            <button
                              key={lc.contractId}
                              className="flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:underline font-medium text-xs text-left"
                              onClick={() => navigate(`/contracts/${lc.contractId}`)}
                            >
                              <ExternalLink size={10} className="shrink-0" />
                              <span>{lc.contractNumber}</span>
                            </button>
                          ))}
                          {singleContract.length > 1 && (
                            <span className="text-[10px] text-neutral-400">
                              {singleContract.length} {t('projects.finance.contractsCount')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          className="text-xs text-neutral-400 hover:text-primary-600 transition-colors"
                          onClick={() => navigate(`/contracts/new?projectId=${projectId}&budgetItemId=${item.id}`)}
                        >
                          + {t('projects.finance.contract')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length > 0 && !isLoading && (
                <tr className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    {t('projects.finance.budgetTotal')}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                    {formatMoneyWhole(filteredTotals.planned)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-primary-700">
                    {filteredTotals.contracted ? formatMoneyWhole(filteredTotals.contracted) : <span className="text-neutral-300">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-orange-600">
                    {filteredTotals.actSigned ? formatMoneyWhole(filteredTotals.actSigned) : <span className="text-neutral-300">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-success-700">
                    {filteredTotals.paid ? formatMoneyWhole(filteredTotals.paid) : <span className="text-neutral-300">&mdash;</span>}
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

BudgetPositionsSection.displayName = 'BudgetPositionsSection';
