import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { BudgetItem } from '@/types';
import type { PriceSourceDetails } from '@/modules/finance/budgetDetail/budgetDetailTypes';
import { PRICE_SOURCE_BADGE_CLASS } from '@/modules/finance/budgetDetail/budgetDetailTypes';

interface PriceSourceInspectModalProps {
  sourceInspectItem: BudgetItem | null;
  sourceInspectLoading: boolean;
  sourceInspectError: string | null;
  sourceInspectDetails: PriceSourceDetails | null;
  onClose: () => void;
}

const PriceSourceInspectModal: React.FC<PriceSourceInspectModalProps> = ({
  sourceInspectItem,
  sourceInspectLoading,
  sourceInspectError,
  sourceInspectDetails,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <Modal
      open={!!sourceInspectItem}
      onClose={onClose}
      title={sourceInspectItem ? `${t('finance.priceSource')}: ${sourceInspectItem.name}` : t('finance.priceSource')}
      size="xl"
    >
      <div className="space-y-4">
        {sourceInspectLoading && (
          <div className="py-8 text-center text-sm text-neutral-400">{t('finance.loadingSource')}</div>
        )}

        {!sourceInspectLoading && sourceInspectError && (
          <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {sourceInspectError}
          </div>
        )}

        {!sourceInspectLoading && sourceInspectDetails && (
          <>
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
              <div className="flex flex-wrap items-start gap-2 justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {sourceInspectDetails.documentTitle}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      PRICE_SOURCE_BADGE_CLASS[sourceInspectDetails.sourceType] ?? 'bg-neutral-100 text-neutral-600',
                    )}>
                      {sourceInspectDetails.sourceLabel}
                    </span>
                    {sourceInspectDetails.documentStatus && (
                      <span className="text-xs text-neutral-500">{t('finance.sourceStatus')}: {sourceInspectDetails.documentStatus}</span>
                    )}
                    {sourceInspectDetails.documentTotal != null && (
                      <span className="text-xs text-neutral-500">{t('finance.sourceAmount')}: {formatMoney(sourceInspectDetails.documentTotal)}</span>
                    )}
                  </div>
                </div>
                {sourceInspectDetails.documentLink && (
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<ExternalLink size={12} />}
                    onClick={() => navigate(sourceInspectDetails.documentLink!)}
                  >
                    {t('finance.openDocument')}
                  </Button>
                )}
              </div>
              {sourceInspectDetails.note && (
                <p className="mt-2 text-xs text-neutral-500">{sourceInspectDetails.note}</p>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 bg-neutral-50 dark:bg-neutral-800">
                {t('finance.sourcePositions')}
              </div>
              {sourceInspectDetails.lines.length === 0 ? (
                <div className="px-3 py-5 text-sm text-neutral-400 text-center">{t('finance.noSourceLines')}</div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-white dark:bg-neutral-900">
                        <th className="px-3 py-2 text-left text-xs text-neutral-500">{t('finance.colName')}</th>
                        <th className="px-3 py-2 text-right text-xs text-neutral-500">{t('finance.colQty')}</th>
                        <th className="px-3 py-2 text-right text-xs text-neutral-500">{t('finance.colPricePerUnit')}</th>
                        <th className="px-3 py-2 text-right text-xs text-neutral-500">{t('finance.colAmount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceInspectDetails.lines.map((line) => (
                        <tr key={line.id} className={cn(
                          'border-b border-neutral-50 dark:border-neutral-800',
                          line.matched && 'bg-primary-50/40 dark:bg-primary-900/15',
                        )}>
                          <td className="px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{line.name}</span>
                              {line.matched && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-100 text-primary-700">
                                  {t('finance.matchesBudgetItem')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-sm tabular-nums text-neutral-600">
                            {line.quantity ?? 0} {line.unit ?? ''}
                          </td>
                          <td className="px-3 py-2 text-right text-sm tabular-nums text-neutral-700">
                            {line.unitPrice ? formatMoney(line.unitPrice) : <span className="text-neutral-300">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right text-sm tabular-nums text-neutral-700">
                            {line.amount ? formatMoney(line.amount) : <span className="text-neutral-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.close')}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default PriceSourceInspectModal;
