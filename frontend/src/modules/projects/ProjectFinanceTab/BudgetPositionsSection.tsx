import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoneyWhole } from '@/lib/format';
import { t } from '@/i18n';
import type { BudgetItemDocStatus, FinanceExpenseItem } from '@/types';
import type { BudgetTreeNode } from './types';
import { DOC_STATUS_CFG, MARK_COLORS, TABLE_HEADER_CLS, TABLE_HEADER_RIGHT_CLS } from './types';

interface BudgetPositionsSectionProps {
  projectId: string | undefined;
  projectName: string | undefined;
  budgetPositionsCount: number;
  budgetRows: Array<{ node: BudgetTreeNode; depth: number }>;
  budgetTotals: { planned: number; contracted: number; actSigned: number; paid: number };
  expandedBudgetRows: Set<string>;
  toggleBudgetRow: (id: string) => void;
  isLoading: boolean;
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
}) => {
  const navigate = useNavigate();

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
                <th className={TABLE_HEADER_CLS} style={{ width: '30%' }}>{t('projects.finance.colSectionPosition')}</th>
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
              {budgetRows.map(({ node, depth }) => {
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
                      {item.contractId && item.contractNumber ? (
                        <button
                          className="text-primary-600 hover:text-primary-700 hover:underline font-medium text-xs"
                          onClick={() => navigate(`/contracts/${item.contractId}`)}
                        >
                          {item.contractNumber}
                        </button>
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
              {budgetRows.length > 0 && (
                <tr className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    {t('projects.finance.budgetTotal')}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                    {formatMoneyWhole(budgetTotals.planned)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-primary-700">
                    {budgetTotals.contracted ? formatMoneyWhole(budgetTotals.contracted) : <span className="text-neutral-300">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-orange-600">
                    {budgetTotals.actSigned ? formatMoneyWhole(budgetTotals.actSigned) : <span className="text-neutral-300">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-success-700">
                    {budgetTotals.paid ? formatMoneyWhole(budgetTotals.paid) : <span className="text-neutral-300">&mdash;</span>}
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
