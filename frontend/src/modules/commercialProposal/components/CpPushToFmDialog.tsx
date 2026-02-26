import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { financeApi } from '@/api/finance';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { CommercialProposal, CommercialProposalItem } from '@/types';

interface CpPushToFmDialogProps {
  open: boolean;
  onClose: () => void;
  proposal: CommercialProposal;
  confirmedItems: CommercialProposalItem[];
}

const CpPushToFmDialog: React.FC<CpPushToFmDialogProps> = ({
  open,
  onClose,
  proposal,
  confirmedItems,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const pushMutation = useMutation({
    mutationFn: () => financeApi.pushCpToFm(proposal.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL', proposal.id] });
      toast.success(t('commercialProposal.toasts.pushedToFm'));
      onClose();
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const totalCost = confirmedItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const materialCount = confirmedItems.filter((i) => i.itemType === 'MATERIAL').length;
  const workCount = confirmedItems.filter((i) => i.itemType === 'WORK').length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('commercialProposal.pushToFm.title')}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<ArrowUpRight size={14} />}
            loading={pushMutation.isPending}
            onClick={() => pushMutation.mutate()}
          >
            {t('commercialProposal.pushToFm.confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('commercialProposal.pushToFm.description', { count: String(confirmedItems.length) })}
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('commercialProposal.pushToFm.materials')}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{materialCount}</p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('commercialProposal.pushToFm.works')}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{workCount}</p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('commercialProposal.pushToFm.totalCost')}</p>
            <p className="text-lg font-bold text-primary-600">{formatMoney(totalCost)}</p>
          </div>
        </div>

        {confirmedItems.length > 0 && (
          <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-neutral-500 dark:text-neutral-400">{t('common.name')}</th>
                  <th className="text-right px-3 py-2 text-neutral-500 dark:text-neutral-400">{t('competitiveList.entry.price')}</th>
                  <th className="text-left px-3 py-2 text-neutral-500 dark:text-neutral-400">{t('commercialProposal.colPriceSource')}</th>
                </tr>
              </thead>
              <tbody>
                {confirmedItems.slice(0, 20).map((item) => {
                  const source = item.estimateItemId
                    ? {
                        label: t('commercialProposal.priceFromEstimate'),
                        className: 'bg-blue-50 text-blue-700',
                        onClick: () => navigate(item.estimateId ? `/estimates/${item.estimateId}` : '/estimates'),
                      }
                    : item.competitiveListEntryId || item.competitiveListId
                      ? {
                          label: t('commercialProposal.priceFromCompetitiveList'),
                          className: 'bg-purple-50 text-purple-700',
                          onClick: () => {
                            if (item.competitiveListId && proposal.specificationId) {
                              navigate(`/specifications/${proposal.specificationId}/competitive-list/${item.competitiveListId}`);
                            } else if (proposal.specificationId) {
                              navigate(`/specifications/${proposal.specificationId}`);
                            } else {
                              navigate('/specifications');
                            }
                          },
                        }
                      : item.selectedInvoiceLineId
                        ? {
                            label: t('commercialProposal.priceFromInvoice'),
                            className: 'bg-green-50 text-green-700',
                            onClick: () => navigate(item.invoiceId ? `/invoices/${item.invoiceId}` : '/invoices'),
                          }
                        : {
                            label: t('commercialProposal.priceManual'),
                            className: 'bg-neutral-100 text-neutral-600',
                            onClick: undefined,
                          };

                  return (
                    <tr key={item.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-3 py-1.5 text-neutral-800 dark:text-neutral-200">{item.budgetItemName ?? item.budgetItemId}</td>
                      <td className="px-3 py-1.5 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">{formatMoney(item.costPrice)}</td>
                      <td className="px-3 py-1.5">
                        <button
                          type="button"
                          onClick={source.onClick}
                          disabled={!source.onClick}
                          className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${source.className} ${source.onClick ? 'hover:opacity-80' : 'cursor-default'}`}
                        >
                          {source.label}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {confirmedItems.length > 20 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-1.5 text-center text-neutral-400 italic">
                      ...{t('common.andMore', { count: String(confirmedItems.length - 20) })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CpPushToFmDialog;
