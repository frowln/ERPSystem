import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { estimatesApi } from '@/api/estimates';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { Estimate, EstimateItem } from '@/types';

interface EstimatePickerProps {
  open: boolean;
  onClose: () => void;
  projectId: string | undefined;
  onSelect: (price: number, estimateId: string, estimateName: string, itemName: string) => void;
}

const EstimatePickerModal: React.FC<EstimatePickerProps> = ({ open, onClose, projectId, onSelect }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);

  const { data: estimatesPage, isLoading } = useQuery({
    queryKey: ['estimates-for-budget', projectId],
    queryFn: () => estimatesApi.getEstimates({ projectId, size: 100, page: 0 }),
    enabled: open && !!projectId,
  });

  const estimates: Estimate[] = estimatesPage?.content ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return estimates;
    const q = search.toLowerCase();
    return estimates.filter((estimate) =>
      estimate.name?.toLowerCase().includes(q)
      || estimate.id.toLowerCase().includes(q));
  }, [estimates, search]);

  const handleExpand = async (estimate: Estimate) => {
    if (expandedId === estimate.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(estimate.id);
    setLoadingItems(true);
    try {
      const items = await estimatesApi.getEstimateItems(estimate.id);
      setEstimateItems(items ?? []);
    } catch {
      setEstimateItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectItem = (estimate: Estimate, item: EstimateItem) => {
    if (!item.unitPrice) {
      toast.error(t('finance.errorNoPriceInEstimate'));
      return;
    }
    onSelect(item.unitPrice, estimate.id, estimate.name, item.name);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('finance.pickPriceFromEstimate')} size="xl">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('finance.searchEstimate')}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">
            {search ? t('finance.estimatesNotFound') : t('finance.noEstimatesForProject')}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
            {filtered.map((estimate) => (
              <div key={estimate.id}>
                <button
                  onClick={() => handleExpand(estimate)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left group"
                >
                  {expandedId === estimate.id ? <ChevronDown size={14} className="shrink-0 text-neutral-400" /> : <ChevronRight size={14} className="shrink-0 text-neutral-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{estimate.name}</p>
                    <p className="text-xs text-neutral-400">{estimate.status} · {formatMoney(estimate.totalAmount ?? 0)}</p>
                  </div>
                </button>

                {expandedId === estimate.id && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-700">
                    {loadingItems ? (
                      <div className="px-4 py-3 text-xs text-neutral-400">{t('finance.loadingPositions')}</div>
                    ) : estimateItems.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-neutral-400">{t('finance.noPositions')}</div>
                    ) : (
                      estimateItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-6 py-2.5 border-b border-neutral-100 dark:border-neutral-700 last:border-0 hover:bg-white dark:hover:bg-neutral-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{item.name}</p>
                            <p className="text-xs text-neutral-400">{item.quantity} {item.unitOfMeasure}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                              {item.unitPrice ? formatMoney(item.unitPrice) : <span className="text-neutral-300">—</span>}
                            </p>
                            <p className="text-xs text-neutral-400">{t('finance.perUnit')}</p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSelectItem(estimate, item)}
                            disabled={!item.unitPrice}
                          >
                            {t('common.select')}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.close')}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default EstimatePickerModal;
