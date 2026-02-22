import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { procurementApi } from '@/api/procurement';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { PurchaseRequest, PurchaseRequestItem } from '@/types';

interface TenderPickerProps {
  open: boolean;
  onClose: () => void;
  projectId: string | undefined;
  onSelect: (price: number, prId: string, prName: string, itemName: string) => void;
}

const TenderPickerModal: React.FC<TenderPickerProps> = ({ open, onClose, projectId, onSelect }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [prItems, setPrItems] = useState<PurchaseRequestItem[]>([]);

  const { data: prs, isLoading } = useQuery({
    queryKey: ['purchase-requests-for-budget', projectId],
    queryFn: () => procurementApi.getPurchaseRequests({ projectId, size: 100 }),
    enabled: open && !!projectId,
  });

  const filtered = useMemo(() => {
    const list = prs?.content ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((pr) => pr.name?.toLowerCase().includes(q) || pr.id.includes(q));
  }, [prs, search]);

  const handleExpand = async (pr: PurchaseRequest) => {
    if (expandedId === pr.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(pr.id);
    if (pr.items && pr.items.length > 0) {
      setPrItems(pr.items);
      return;
    }
    setLoadingItems(true);
    try {
      const full = await procurementApi.getPurchaseRequest(pr.id);
      setPrItems(full.items ?? []);
    } catch {
      setPrItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectItem = (pr: PurchaseRequest, item: PurchaseRequestItem) => {
    if (!item.unitPrice) {
      toast.error(t('finance.errorNoPriceForItem'));
      return;
    }
    onSelect(item.unitPrice, pr.id, pr.name, item.name);
    onClose();
  };

  const PR_STATUS_LABEL: Record<string, string> = {
    APPROVED: t('finance.prStatusApproved'),
    ORDERED: t('finance.prStatusOrdered'),
    DELIVERED: t('finance.prStatusDelivered'),
    IN_PROGRESS: t('finance.prStatusInProgress'),
    SUBMITTED: t('finance.prStatusSubmitted'),
    DRAFT: t('finance.prStatusDraft'),
  };

  return (
    <Modal open={open} onClose={onClose} title={t('finance.pickPriceFromTender')} size="xl">
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('finance.searchTender')}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">
            {search ? t('finance.tendersNotFound') : t('finance.noTendersForProject')}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
            {filtered.map((pr) => (
              <div key={pr.id}>
                {/* PR header row */}
                <button
                  onClick={() => handleExpand(pr)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left group"
                >
                  {expandedId === pr.id ? <ChevronDown size={14} className="shrink-0 text-neutral-400" /> : <ChevronRight size={14} className="shrink-0 text-neutral-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{pr.name}</p>
                    <p className="text-xs text-neutral-400">{pr.requestDate} · {pr.itemCount ?? 0} {t('finance.positions')} · {formatMoney(pr.totalAmount ?? 0)}</p>
                  </div>
                  <span className={cn(
                    'shrink-0 px-2 py-0.5 rounded text-xs font-medium',
                    pr.status === 'APPROVED' || pr.status === 'ORDERED' ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-600',
                  )}>
                    {PR_STATUS_LABEL[pr.status] ?? pr.status}
                  </span>
                </button>

                {/* PR items */}
                {expandedId === pr.id && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-700">
                    {loadingItems ? (
                      <div className="px-4 py-3 text-xs text-neutral-400">{t('finance.loadingPositions')}</div>
                    ) : prItems.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-neutral-400">{t('finance.noPositionsWithPrice')}</div>
                    ) : (
                      prItems.map((item) => (
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
                            onClick={() => handleSelectItem(pr, item)}
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

export default TenderPickerModal;
