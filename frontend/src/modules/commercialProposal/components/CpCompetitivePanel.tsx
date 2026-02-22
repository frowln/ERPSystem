import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { financeApi } from '@/api/finance';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { CommercialProposalItem, CompetitiveListEntry } from '@/types';

interface CpCompetitivePanelProps {
  proposalId: string;
  item: CommercialProposalItem;
  competitiveListId?: string;
}

const CpCompetitivePanel: React.FC<CpCompetitivePanelProps> = ({
  proposalId,
  item,
  competitiveListId,
}) => {
  const queryClient = useQueryClient();
  const clId = competitiveListId ?? item.competitiveListId;

  const { data: entries } = useQuery({
    queryKey: ['competitive-list-entries', clId],
    queryFn: () => financeApi.getCompetitiveListEntries(clId!),
    enabled: !!clId,
  });

  const selectMutation = useMutation({
    mutationFn: (clEntryId: string) =>
      financeApi.selectClEntryForCpItem(proposalId, item.id, clEntryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', proposalId] });
      toast.success(t('commercialProposal.toasts.clEntrySelected'));
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  if (!clId) {
    return (
      <div className="text-xs text-neutral-400 dark:text-neutral-500 italic p-2">
        {t('commercialProposal.cl.noClLinked')}
      </div>
    );
  }

  const relevantEntries = (entries ?? []).filter(
    (e) => !item.specItemId || e.specItemId === item.specItemId,
  );

  if (relevantEntries.length === 0) {
    return (
      <div className="text-xs text-neutral-400 dark:text-neutral-500 italic p-2">
        {t('commercialProposal.cl.noEntries')}
      </div>
    );
  }

  const prices = relevantEntries.map((e) => e.unitPrice).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div className="space-y-1">
      {relevantEntries.map((entry) => {
        const isSelected = item.competitiveListEntryId === entry.id;
        const isLowest = prices.length > 1 && entry.unitPrice === minPrice;
        const isHighest = prices.length > 1 && entry.unitPrice === maxPrice;

        return (
          <div
            key={entry.id}
            className={cn(
              'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors',
              isSelected
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/80',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {isSelected && <CheckCircle2 size={12} className="text-primary-500 flex-shrink-0" />}
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  isLowest ? 'bg-success-500' : isHighest ? 'bg-danger-500' : 'bg-neutral-300',
                )} />
                <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {entry.vendorName || entry.supplierName || '---'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn(
                'font-semibold tabular-nums',
                isLowest ? 'text-success-600 dark:text-success-400' : 'text-neutral-700 dark:text-neutral-300',
              )}>
                {formatMoney(entry.unitPrice)}
              </span>
              {!isSelected && (
                <Button
                  variant="secondary"
                  size="xs"
                  loading={selectMutation.isPending}
                  onClick={() => selectMutation.mutate(entry.id)}
                >
                  {t('common.select')}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CpCompetitivePanel;
