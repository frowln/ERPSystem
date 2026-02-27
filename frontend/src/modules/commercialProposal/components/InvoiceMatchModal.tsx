import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { financeApi } from '@/api/finance';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { formatMoney } from '@/lib/format';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CommercialProposalItem, InvoiceLine } from '@/types';

interface InvoiceMatchModalProps {
  open: boolean;
  onClose: () => void;
  proposalId: string;
  item: CommercialProposalItem;
  onSelected: () => void;
}

const InvoiceMatchModal: React.FC<InvoiceMatchModalProps> = ({
  open,
  onClose,
  proposalId,
  item,
  onSelected,
}) => {
  const queryClient = useQueryClient();
  const [overrideLineId, setOverrideLineId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const { data: matchingLines = [], isLoading } = useQuery({
    queryKey: ['MATCHING_INVOICE_LINES', item.budgetItemId, item.id],
    queryFn: () => financeApi.findMatchingInvoiceLines(item.budgetItemId, undefined, item.id),
    enabled: open,
  });

  const sortedLines = useMemo(
    () => [...matchingLines].sort((a, b) => (a.unitPrice ?? 0) - (b.unitPrice ?? 0)),
    [matchingLines],
  );

  const selectMutation = useMutation({
    mutationFn: (invoiceLineId: string) =>
      financeApi.selectInvoiceForCpItem(proposalId, item.id, invoiceLineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
      toast.success(t('commercialProposal.toastInvoiceLinked'));
      onSelected();
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('commercialProposal.invoiceMatchTitle')}
      description={t('commercialProposal.invoiceMatchDescription', {
        name: item.budgetItemName || item.budgetItemId,
      })}
      size="xl"
    >
      <div className="space-y-3">
        {/* Current item info */}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {item.budgetItemName || item.budgetItemId}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {item.quantity} {item.budgetItemUnit || t('common.pcs')} &middot;{' '}
              {t('commercialProposal.currentCost')}: {formatMoney(item.costPrice)}
            </p>
          </div>
        </div>

        {/* Matching lines table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              />
            ))}
          </div>
        ) : sortedLines.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {t('commercialProposal.noMatchingInvoices')}
          </div>
        ) : (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {t('commercialProposal.invoiceLineName')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {t('commercialProposal.invoiceLineQty')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {t('commercialProposal.invoiceLineUnitPrice')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 w-16">
                    {t('commercialProposal.poStatus')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 w-16">
                    {t('commercialProposal.grStatus')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 w-16">
                    {t('commercialProposal.variance')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {t('commercialProposal.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLines.map((line, idx) => {
                  const isBest = idx === 0;
                  const isOccupiedByOtherCpItem = line.isSelectedForCp && line.cpItemId !== item.id;
                  const variance = line.variancePercent ?? (
                    line.poUnitPrice && line.unitPrice
                      ? ((line.unitPrice - line.poUnitPrice) / line.poUnitPrice) * 100
                      : null
                  );
                  const highVariance = variance != null && Math.abs(variance) > 10;
                  const needsOverride = highVariance && overrideLineId !== line.id;
                  return (
                    <React.Fragment key={line.id}>
                      <tr
                        className={cn(
                          'border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                          isBest && 'bg-success-50/50 dark:bg-success-900/10',
                          !isBest && 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-900 dark:text-neutral-100">{line.name}</span>
                            {isBest && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded">
                                {t('commercialProposal.bestPrice')}
                              </span>
                            )}
                          </div>
                          {line.notes && (
                            <p className="text-xs text-neutral-400 mt-0.5">{line.notes}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                          {line.quantity} {line.unit || ''}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          <span
                            className={cn(
                              'font-medium',
                              isBest
                                ? 'text-success-600 dark:text-success-400'
                                : 'text-neutral-900 dark:text-neutral-100',
                            )}
                          >
                            {formatMoney(line.unitPrice)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {line.poNumber ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {line.grReceived ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-auto" />
                          )}
                        </td>
                        <td className={cn(
                          'px-3 py-2.5 text-right tabular-nums text-xs font-medium',
                          highVariance ? 'text-red-600 dark:text-red-400' : 'text-neutral-500',
                        )}>
                          {variance != null ? (
                            <span className="flex items-center justify-end gap-1">
                              {highVariance && <AlertTriangle className="w-3 h-3" />}
                              {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {highVariance && overrideLineId !== line.id ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => { setOverrideLineId(line.id); setOverrideReason(''); }}
                              disabled={isOccupiedByOtherCpItem}
                            >
                              {isOccupiedByOtherCpItem
                                ? t('commercialProposal.alreadySelected')
                                : t('common.select')}
                            </Button>
                          ) : (
                            <Button
                              variant={isBest ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => selectMutation.mutate(line.id)}
                              disabled={selectMutation.isPending || isOccupiedByOtherCpItem}
                            >
                              {isOccupiedByOtherCpItem
                                ? t('commercialProposal.alreadySelected')
                                : t('common.select')}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {/* Override reason row */}
                      {overrideLineId === line.id && (
                        <tr className="bg-red-50/50 dark:bg-red-900/10">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                  {t('commercialProposal.varianceWarning')}
                                </p>
                                <textarea
                                  value={overrideReason}
                                  onChange={(e) => setOverrideReason(e.target.value)}
                                  placeholder={t('commercialProposal.overrideReasonPlaceholder')}
                                  className="w-full h-16 px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                      selectMutation.mutate(line.id);
                                      setOverrideLineId(null);
                                    }}
                                    disabled={!overrideReason.trim() || selectMutation.isPending}
                                  >
                                    {t('common.select')}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setOverrideLineId(null)}
                                  >
                                    {t('common.cancel')}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceMatchModal;
