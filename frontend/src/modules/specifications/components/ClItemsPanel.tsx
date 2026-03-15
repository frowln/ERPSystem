import React from 'react';
import { AlertTriangle, CheckCircle, Package, Trophy } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { SupplyStatusIndicator } from '../SupplyStatusIndicator';
import type { ItemSummary } from './ClTypes';
import { MIN_PROPOSALS } from './ClTypes';

interface ClItemsPanelProps {
  itemSummaries: ItemSummary[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  minProposalsRequired: number;
}

export const ClItemsPanel: React.FC<ClItemsPanelProps> = ({
  itemSummaries,
  selectedItemId,
  onSelectItem,
  minProposalsRequired,
}) => (
  <div className="w-full lg:w-[380px] flex-shrink-0">
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('competitiveList.detail.position')}
        </h2>
      </div>
      <div className="max-h-[calc(100vh-360px)] overflow-y-auto">
        {itemSummaries.length === 0 ? (
          <div className="p-6 text-center">
            <Package size={32} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('competitiveList.emptyItemsTitle')}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {t('competitiveList.emptyItemsDescription')}
            </p>
          </div>
        ) : (
          itemSummaries.map(({ item, proposalCount, bestPrice, hasWinner }) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                selectedItemId === item.id && 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="tabular-nums">
                      {new Intl.NumberFormat('ru-RU').format(item.quantity)} {item.unitOfMeasure}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-600">|</span>
                    <span className="tabular-nums">{formatMoney(item.plannedAmount)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {hasWinner && (
                    <Trophy size={14} className="text-warning-500" />
                  )}
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full',
                    proposalCount >= MIN_PROPOSALS
                      ? 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                      : proposalCount > 0
                        ? 'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                  )}
                  title={
                    proposalCount >= MIN_PROPOSALS
                      ? t('specifications.clProposalsSufficient')
                      : t('specifications.clProposalsRequired')
                  }
                  aria-label={
                    proposalCount >= MIN_PROPOSALS
                      ? t('specifications.clProposalsSufficient')
                      : t('specifications.clProposalsRequired')
                  }
                  >
                    {proposalCount >= MIN_PROPOSALS ? (
                      <CheckCircle size={12} className="text-success-600 dark:text-success-400" />
                    ) : (
                      <AlertTriangle size={12} className="text-danger-500 dark:text-danger-400" />
                    )}
                    {proposalCount}/{MIN_PROPOSALS}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <SupplyStatusIndicator
                  proposalCount={proposalCount}
                  hasWinner={hasWinner}
                  minRequired={minProposalsRequired}
                />
                {bestPrice > 0 && (
                  <span className="text-xs text-success-600 dark:text-success-400 font-medium">
                    {formatMoney(bestPrice)}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);
