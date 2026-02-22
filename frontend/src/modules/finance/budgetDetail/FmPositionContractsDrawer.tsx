import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, AlertTriangle } from 'lucide-react';
import { financeApi } from '@/api/finance';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import ContractCoverageBar from '@/modules/contracts/ContractCoverageBar';

interface FmPositionContractsDrawerProps {
  open: boolean;
  onClose: () => void;
  budgetItemId: string;
  budgetItemName: string;
}

const FmPositionContractsDrawer: React.FC<FmPositionContractsDrawerProps> = ({
  open,
  onClose,
  budgetItemId,
  budgetItemName,
}) => {
  const { data: coverage } = useQuery({
    queryKey: ['budget-item-coverage-detail', budgetItemId],
    queryFn: () => financeApi.getBudgetItemCoverageDetail(budgetItemId),
    enabled: open && !!budgetItemId,
  });

  if (!open) return null;

  const overAllocated = coverage && coverage.coveragePercent > 100;
  const underAllocated = coverage && coverage.coveragePercent < 100 && coverage.coveragePercent > 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 z-50 shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {t('contracts.fmCoverage.title')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{budgetItemName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Coverage summary */}
        {coverage && (
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.fmCoverage.totalQty')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {coverage.totalQuantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.fmCoverage.allocatedQty')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {coverage.allocatedQuantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.fmCoverage.totalAmount')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatMoney(coverage.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.fmCoverage.allocatedAmount')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatMoney(coverage.allocatedAmount)}
                </p>
              </div>
            </div>
            <ContractCoverageBar percent={coverage.coveragePercent} />

            {overAllocated && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                <AlertTriangle size={14} className="text-danger-500 flex-shrink-0" />
                <span className="text-xs text-danger-700 dark:text-danger-300">
                  {t('contracts.fmCoverage.warningOverAllocated')}
                </span>
              </div>
            )}
            {underAllocated && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                <AlertTriangle size={14} className="text-warning-500 flex-shrink-0" />
                <span className="text-xs text-warning-700 dark:text-warning-300">
                  {t('contracts.fmCoverage.warningUnderAllocated')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Contract allocations */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            {t('contracts.fmCoverage.linkedContracts')}
          </h4>

          {(!coverage || coverage.covered === 0) && (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('contracts.fmCoverage.noContracts')}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {coverage?.allocations?.map((alloc: {
              contractId: string;
              contractNumber?: string;
              contractName?: string;
              partnerName?: string;
              allocatedQuantity: number;
              allocatedAmount: number;
            }) => (
              <div
                key={alloc.contractId}
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {alloc.contractNumber ?? '---'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {alloc.contractName}
                    </p>
                    {alloc.partnerName && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                        {alloc.partnerName}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatMoney(alloc.allocatedAmount)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {t('contracts.fmCoverage.qty')}: {alloc.allocatedQuantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FmPositionContractsDrawer;
