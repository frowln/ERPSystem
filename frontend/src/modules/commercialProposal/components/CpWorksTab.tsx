import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { financeApi } from '@/api/finance';
import { bidScoringApi } from '@/api/bidScoring';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { CheckCircle, XCircle, ExternalLink, Trophy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CommercialProposalItem } from '@/types';

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
  SUPPLY_APPROVED: 'blue',
  APPROVED_PROJECT: 'cyan',
  PROJECT_APPROVED: 'cyan',
  CONFIRMED: 'green',
};

const cpItemStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
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
    SUPPLY_APPROVED: t('commercialProposal.itemApprovedSupply'),
    APPROVED_PROJECT: t('commercialProposal.itemApprovedProject'),
    PROJECT_APPROVED: t('commercialProposal.itemApprovedProject'),
    CONFIRMED: t('commercialProposal.itemConfirmed'),
  };
  return labels[status] ?? status;
};

interface CpWorksTabProps {
  proposalId: string;
  items: CommercialProposalItem[];
  projectId?: string;
}

const CpWorksTab: React.FC<CpWorksTabProps> = ({ proposalId, items, projectId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Тендер подрядчиков
  const [tenderOpen, setTenderOpen] = useState<string | null>(null); // discipline key
  const [tenderComparisonId, setTenderComparisonId] = useState('');
  const [tenderCostPrice, setTenderCostPrice] = useState('');
  const [tenderDisciplineItems, setTenderDisciplineItems] = useState<CommercialProposalItem[]>([]);

  const { data: comparisonsPage } = useQuery({
    queryKey: ['bid-comparisons', projectId],
    queryFn: () => bidScoringApi.getComparisons({ projectId: projectId!, size: 50 } as any),
    enabled: !!projectId && tenderOpen !== null,
  });
  const comparisons = comparisonsPage?.content ?? [];

  const selectedComparison = comparisons.find((c) => c.id === tenderComparisonId);

  const applyTenderMutation = useMutation({
    mutationFn: async ({ items: targetItems, costPrice }: { items: CommercialProposalItem[]; costPrice: number }) => {
      for (const item of targetItems) {
        await financeApi.updateCommercialProposalItem(proposalId, item.id, { costPrice });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
      toast.success(t('commercialProposal.tenderApplied'));
      setTenderOpen(null);
      setTenderComparisonId('');
      setTenderCostPrice('');
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const handleTenderOpen = (discipline: string, disciplineItems: CommercialProposalItem[]) => {
    setTenderOpen(discipline);
    setTenderDisciplineItems(disciplineItems);
    setTenderComparisonId('');
    setTenderCostPrice('');
  };

  const handleTenderApply = () => {
    const price = parseFloat(tenderCostPrice.replace(',', '.'));
    if (!Number.isFinite(price) || price <= 0) {
      toast.error(t('commercialProposal.invalidManualCostPrice'));
      return;
    }
    applyTenderMutation.mutate({ items: tenderDisciplineItems, costPrice: price });
  };

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

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, costPrice }: { itemId: string; costPrice: number }) =>
      financeApi.updateCommercialProposalItem(proposalId, itemId, { costPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
      toast.success(t('commercialProposal.toastItemUpdated'));
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        {t('commercialProposal.noWorks')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Тендер подрядчиков modal */}
      {tenderOpen !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('commercialProposal.tenderModalTitle')}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('commercialProposal.tenderModalSubtitle', { discipline: tenderOpen })}
                </p>
              </div>
              <button onClick={() => setTenderOpen(null)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {comparisons.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                  {t('commercialProposal.tenderNoComparisons')}
                  <br />
                  <button
                    className="text-primary-600 hover:underline text-sm mt-1"
                    onClick={() => navigate(projectId ? `/bid-scoring?projectId=${projectId}` : '/bid-scoring')}
                  >
                    {t('commercialProposal.tenderGoToBidScoring')}
                  </button>
                </p>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('commercialProposal.tenderSelectComparison')}
                  </label>
                  <select
                    value={tenderComparisonId}
                    onChange={(e) => setTenderComparisonId(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">— {t('commercialProposal.tenderChoose')} —</option>
                    {comparisons.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.rfqNumber ? `(${c.rfqNumber})` : ''} — {c.statusDisplayName}
                      </option>
                    ))}
                  </select>
                  {selectedComparison && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <span className="font-medium">{t('commercialProposal.tenderCategory')}:</span>{' '}
                        {selectedComparison.category || '—'}
                        {selectedComparison.winnerJustification && (
                          <> · <span className="italic">{selectedComparison.winnerJustification}</span></>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* Auto-apply bid winner */}
              {selectedComparison?.winnerVendorId && (
                <div>
                  <button
                    onClick={async () => {
                      try {
                        const price = parseFloat(tenderCostPrice.replace(',', '.'));
                        if (!Number.isFinite(price) || price <= 0) {
                          toast.error(t('commercialProposal.invalidManualCostPrice'));
                          return;
                        }
                        await financeApi.applyBidToCp(proposalId, selectedComparison.id, selectedComparison.winnerVendorId!, price);
                        queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
                        toast.success(t('commercialProposal.applyBid.success'));
                        setTenderOpen(null);
                        setTenderComparisonId('');
                        setTenderCostPrice('');
                      } catch {
                        toast.error(t('errors.unexpectedError'));
                      }
                    }}
                    disabled={!tenderCostPrice}
                    className="flex items-center gap-1.5 w-full justify-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-2"
                  >
                    <Trophy size={14} />
                    {t('commercialProposal.applyBid.btn')}
                  </button>
                  <p className="text-xs text-green-600 dark:text-green-400 text-center mb-3">
                    {t('commercialProposal.applyBid.hint')}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('commercialProposal.tenderCostPriceLabel', { count: String(tenderDisciplineItems.length) })}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tenderCostPrice}
                    onChange={(e) => setTenderCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-sm text-neutral-500">₽</span>
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  {t('commercialProposal.tenderCostPriceHint')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setTenderOpen(null)}
                className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleTenderApply}
                disabled={!tenderCostPrice || applyTenderMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Trophy size={14} />
                {applyTenderMutation.isPending ? t('common.saving') : t('commercialProposal.tenderApplyBtn', { count: String(tenderDisciplineItems.length) })}
              </button>
            </div>
          </div>
        </div>
      )}

      {groupedByDiscipline.map(([discipline, disciplineItems]) => (
        <div
          key={discipline}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700"
        >
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-t-xl border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              <span className="text-primary-600 dark:text-primary-400 mr-2">{discipline}</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTenderOpen(discipline, disciplineItems)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                title={t('commercialProposal.tenderHint')}
              >
                <Trophy size={12} />
                {t('commercialProposal.tenderBtn')}
              </button>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {disciplineItems.length} {t('common.positions')}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                  <th className="px-4 py-2 font-medium">{t('common.name')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colQty')}</th>
                  <th className="px-3 py-2 font-medium">{t('commercialProposal.colUnit')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colEstimatePrice')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colTradingCoeff')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colCostPrice')}</th>
                  <th className="px-3 py-2 font-medium">{t('commercialProposal.colPriceSource')}</th>
                  <th className="px-3 py-2 font-medium">{t('commercialProposal.colStatus')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('commercialProposal.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {disciplineItems.map((item) => {
                  const estimatePrice = item.tradingCoefficient
                    ? item.costPrice / item.tradingCoefficient
                    : item.costPrice;

                  return (
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
                      <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                        {estimatePrice.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span
                          className={cn(
                            'font-medium',
                            item.tradingCoefficient > 1
                              ? 'text-success-600'
                              : item.tradingCoefficient < 1
                                ? 'text-danger-600'
                                : 'text-neutral-500 dark:text-neutral-400',
                          )}
                        >
                          {item.tradingCoefficient.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {(item.costPrice || 0).toLocaleString('ru-RU')} ₽
                        {!item.estimateItemId && (
                          <button
                            type="button"
                            className="ml-2 text-xs text-primary-600 hover:underline"
                            onClick={() => {
                              const value = window.prompt(
                                t('commercialProposal.enterManualCostPrice'),
                                String(item.costPrice ?? ''),
                              );
                              if (value == null) return;
                              const normalized = Number(value.replace(',', '.'));
                              if (!Number.isFinite(normalized) || normalized <= 0) {
                                toast.error(t('commercialProposal.invalidManualCostPrice'));
                                return;
                              }
                              updateItemMutation.mutate({ itemId: item.id, costPrice: normalized });
                            }}
                          >
                            {t('commercialProposal.setManualCostPrice')}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {item.estimateItemId ? (
                          <button
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                            onClick={() => item.estimateId
                              ? navigate(`/estimates/${item.estimateId}`)
                              : navigate(`/estimates${projectId ? `?projectId=${projectId}` : ''}`)}
                            title={t('commercialProposal.priceFromEstimate')}
                          >
                            <ExternalLink size={10} />
                            {t('commercialProposal.priceFromEstimate')}
                          </button>
                        ) : item.competitiveListEntryId || item.competitiveListId ? (
                          <button
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 transition-colors"
                            onClick={() => navigate(`/specifications${projectId ? `?projectId=${projectId}` : ''}`)}
                            title={t('commercialProposal.priceFromCompetitiveList')}
                          >
                            <ExternalLink size={10} />
                            {t('commercialProposal.priceFromCompetitiveList')}
                          </button>
                        ) : item.selectedInvoiceLineId ? (
                          <button
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors"
                            onClick={() => item.invoiceId
                              ? navigate(`/invoices/${item.invoiceId}`)
                              : navigate(`/invoices${projectId ? `?projectId=${projectId}&invoiceType=RECEIVED` : '?invoiceType=RECEIVED'}`)}
                            title={t('commercialProposal.priceFromInvoice')}
                          >
                            <ExternalLink size={10} />
                            {t('commercialProposal.priceFromInvoice')}
                          </button>
                        ) : (
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                            {t('commercialProposal.priceManual')}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={item.status}
                          colorMap={cpItemStatusColorMap}
                          label={cpItemStatusLabel(item.status)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status !== 'CONFIRMED' && item.status !== 'IN_FINANCIAL_MODEL' && (
                            <>
                              {(() => {
                                const canApprove = !!item.estimateItemId || item.costPrice > 0;
                                const approveTitle = canApprove
                                  ? t('commercialProposal.approve')
                                  : t('commercialProposal.colEstimatePrice');
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CpWorksTab;
