import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { financeApi } from '@/api/finance';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { FileSearch, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CommercialProposalItem } from '@/types';
import InvoiceMatchModal from './InvoiceMatchModal';

const cpItemStatusColorMap: Record<string, string> = {
  UNPROCESSED: 'gray',
  INVOICES_COLLECTED: 'blue',
  COMPETITIVE_LIST_FILLED: 'purple',
  PRICE_SELECTED: 'yellow',
  ON_APPROVAL: 'cyan',
  APPROVED: 'blue',
  IN_FINANCIAL_MODEL: 'green',
  PENDING: 'gray',
  INVOICE_SELECTED: 'yellow',
  APPROVED_SUPPLY: 'blue',
  APPROVED_PROJECT: 'cyan',
  CONFIRMED: 'green',
};

const cpItemStatusLabels: Record<string, string> = {
  UNPROCESSED: t('commercialProposal.itemUnprocessed'),
  INVOICES_COLLECTED: t('commercialProposal.itemInvoicesCollected'),
  COMPETITIVE_LIST_FILLED: t('commercialProposal.itemCompetitiveListFilled'),
  PRICE_SELECTED: t('commercialProposal.itemPriceSelected'),
  ON_APPROVAL: t('commercialProposal.itemOnApproval'),
  APPROVED: t('commercialProposal.itemApproved'),
  IN_FINANCIAL_MODEL: t('commercialProposal.itemInFinancialModel'),
  PENDING: t('commercialProposal.itemPending'),
  INVOICE_SELECTED: t('commercialProposal.itemInvoiceSelected'),
  APPROVED_SUPPLY: t('commercialProposal.itemApprovedSupply'),
  APPROVED_PROJECT: t('commercialProposal.itemApprovedProject'),
  CONFIRMED: t('commercialProposal.itemConfirmed'),
};

interface CpMaterialsTabProps {
  proposalId: string;
  items: CommercialProposalItem[];
}

const CpMaterialsTab: React.FC<CpMaterialsTabProps> = ({ proposalId, items }) => {
  const queryClient = useQueryClient();
  const [invoiceModalItem, setInvoiceModalItem] = useState<CommercialProposalItem | null>(null);

  const groupedByDiscipline = useMemo(() => {
    const groups = new Map<string, CommercialProposalItem[]>();

    for (const item of items) {
      const key = item.disciplineMark || t('commercialProposal.ungrouped');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    return Array.from(groups.entries());
  }, [items]);

  const approveMutation = useMutation({
    mutationFn: (itemId: string) => financeApi.approveCpItem(proposalId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
      toast.success(t('commercialProposal.toastItemApproved'));
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (itemId: string) =>
      financeApi.rejectCpItem(proposalId, itemId, t('commercialProposal.rejectedByUser')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
      toast.success(t('commercialProposal.toastItemRejected'));
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  const handleInvoiceSelected = () => {
    queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
    setInvoiceModalItem(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        {t('commercialProposal.noMaterials')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedByDiscipline.map(([discipline, disciplineItems]) => (
        <div
          key={discipline}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700"
        >
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-t-xl border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              <span className="text-primary-600 dark:text-primary-400 mr-2">{discipline}</span>
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {disciplineItems.length} {t('common.positions')}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                  <th className="px-4 py-2 font-medium">{t('common.name')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colQty')}</th>
                  <th className="px-3 py-2 font-medium">{t('commercialProposal.colUnit')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colCostPrice')}</th>
                  <th className="px-3 py-2 font-medium">{t('commercialProposal.colStatus')}</th>
                  <th className="px-3 py-2 font-medium">{t('commercialProposal.colInvoice')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {disciplineItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <td className="px-4 py-2 text-neutral-900 dark:text-neutral-100">
                      {item.budgetItemName || item.budgetItemId}
                    </td>
                    <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                      {item.budgetItemUnit || '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {(item.costPrice || 0).toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        status={item.status}
                        colorMap={cpItemStatusColorMap}
                        label={cpItemStatusLabels[item.status] ?? item.status}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {item.selectedInvoiceLineId ? (
                        <span className="text-xs text-success-600 font-medium">
                          {t('commercialProposal.invoiceLinked')}
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeft={<FileSearch size={13} />}
                          onClick={() => setInvoiceModalItem(item)}
                        >
                          {t('commercialProposal.selectInvoice')}
                        </Button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status !== 'CONFIRMED' && item.status !== 'IN_FINANCIAL_MODEL' && (
                          <>
                            {(() => {
                              const canApprove = !!item.selectedInvoiceLineId;
                              const approveTitle = canApprove
                                ? t('commercialProposal.approve')
                                : t('commercialProposal.selectInvoice');
                              return (
                                <button
                                  onClick={() => approveMutation.mutate(item.id)}
                                  disabled={approveMutation.isPending || !canApprove}
                                  title={approveTitle}
                                  className={cn(
                                    'p-1 rounded transition-colors',
                                    canApprove
                                      ? 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                                      : 'text-neutral-300 cursor-not-allowed',
                                  )}
                                >
                                  <CheckCircle size={16} />
                                </button>
                              );
                            })()}
                            <button
                              onClick={() => rejectMutation.mutate(item.id)}
                              disabled={rejectMutation.isPending}
                              title={t('commercialProposal.reject')}
                              className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Invoice Match Modal */}
      {invoiceModalItem && (
        <InvoiceMatchModal
          open={!!invoiceModalItem}
          onClose={() => setInvoiceModalItem(null)}
          proposalId={proposalId}
          item={invoiceModalItem}
          onSelected={handleInvoiceSelected}
        />
      )}
    </div>
  );
};

export default CpMaterialsTab;
