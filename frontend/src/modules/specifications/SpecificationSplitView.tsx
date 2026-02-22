import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { specificationsApi } from '@/api/specifications';
import { formatMoney, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { SpecItem } from './types';
import { SupplyStatusIndicator } from './SupplyStatusIndicator';

const SpecificationSplitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { data: spec } = useQuery({
    queryKey: ['specification', id],
    queryFn: () => specificationsApi.getSpecification(id!),
    enabled: !!id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['spec-items', id],
    queryFn: () => specificationsApi.getSpecItems(id!),
    enabled: !!id,
  });

  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(lower) || i.productCode?.toLowerCase().includes(lower));
    }
    if (filterStatus !== 'ALL') {
      result = result.filter(i => (i.supplyStatus ?? 'NOT_COVERED') === filterStatus);
    }
    return result;
  }, [items, search, filterStatus]);

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null;

  // Group items by section (using itemType as grouping)
  const groupedItems = useMemo(() => {
    const groups: Record<string, SpecItem[]> = {};
    for (const item of filteredItems) {
      const key = item.itemType;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filteredItems]);

  const supplyCounts = useMemo(() => {
    const fc = items.filter(i => i.supplyStatus === 'FULLY_COVERED').length;
    const pc = items.filter(i => i.supplyStatus === 'PARTIALLY_COVERED').length;
    const nc = items.filter(i => !i.supplyStatus || i.supplyStatus === 'NOT_COVERED').length;
    return { fc, pc, nc, total: items.length };
  }, [items]);

  const typeLabels: Record<string, string> = {
    MATERIAL: t('specifications.splitView.typeMaterial'),
    EQUIPMENT: t('specifications.splitView.typeEquipment'),
    WORK: t('specifications.splitView.typeWork'),
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={spec?.name ?? t('specifications.splitView.title')}
        subtitle={t('specifications.splitView.subtitle')}
        backTo="/specifications"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('nav.specifications'), href: '/specifications' },
          { label: spec?.name ?? '' },
        ]}
      />

      {/* Supply status summary bar */}
      <div className="flex items-center gap-4 mb-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success-500" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.splitView.covered')}: {supplyCounts.fc}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning-500" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.splitView.partial')}: {supplyCounts.pc}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger-500" />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.splitView.notCovered')}: {supplyCounts.nc}</span>
        </div>
        <div className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {t('specifications.splitView.totalItems')}: {supplyCounts.total}
        </div>
      </div>

      {/* Split view container */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 320px)' }}>
        {/* Left panel: Item list */}
        <div className="w-2/5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden">
          {/* Search & filter */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('specifications.splitView.searchPlaceholder')}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-1">
              {['ALL', 'FULLY_COVERED', 'PARTIALLY_COVERED', 'NOT_COVERED'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md transition-colors',
                    filterStatus === s
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  )}
                >
                  {s === 'ALL' ? t('common.all') : s === 'FULLY_COVERED' ? t('specifications.splitView.covered') : s === 'PARTIALLY_COVERED' ? t('specifications.splitView.partial') : t('specifications.splitView.notCovered')}
                </button>
              ))}
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(groupedItems).map(([type, groupItems]) => (
              <div key={type}>
                <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {typeLabels[type] ?? type} ({groupItems.length})
                </div>
                {groupItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2 transition-colors',
                      selectedItemId === item.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                    )}
                  >
                    <SupplyStatusIndicator status={item.supplyStatus ?? 'NOT_COVERED'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatNumber(item.quantity)} {item.unitOfMeasure}
                        {item.bestPrice != null && <> &middot; {formatMoney(item.bestPrice)}</>}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-neutral-400 shrink-0" />
                  </button>
                ))}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                {t('specifications.splitView.noItems')}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Detail for selected item */}
        <div className="w-3/5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-y-auto">
          {selectedItem ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{selectedItem.name}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {selectedItem.productCode && <span className="font-mono">{selectedItem.productCode} &middot; </span>}
                    {typeLabels[selectedItem.itemType]}
                  </p>
                </div>
                <SupplyStatusIndicator status={selectedItem.supplyStatus ?? 'NOT_COVERED'} size="md" />
              </div>

              {/* Item details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.splitView.quantity')}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatNumber(selectedItem.quantity)} {selectedItem.unitOfMeasure}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.splitView.coveredQty')}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatNumber(selectedItem.coveredQuantity ?? 0)} {selectedItem.unitOfMeasure}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.splitView.bestPrice')}</p>
                  <p className="text-sm font-semibold tabular-nums">{selectedItem.bestPrice != null ? formatMoney(selectedItem.bestPrice) : '—'}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.splitView.bestVendor')}</p>
                  <p className="text-sm font-semibold truncate">{selectedItem.bestVendorName ?? '—'}</p>
                </div>
              </div>

              {/* Coverage progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('specifications.splitView.coverageProgress')}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {selectedItem.quantity > 0 ? ((selectedItem.coveredQuantity ?? 0) / selectedItem.quantity * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (selectedItem.coveredQuantity ?? 0) >= selectedItem.quantity ? 'bg-success-500' :
                        (selectedItem.coveredQuantity ?? 0) > 0 ? 'bg-warning-500' : 'bg-neutral-300 dark:bg-neutral-600',
                    )}
                    style={{ width: `${Math.min((selectedItem.quantity > 0 ? ((selectedItem.coveredQuantity ?? 0) / selectedItem.quantity) * 100 : 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Planned amount */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.splitView.plannedAmount')}</p>
                <p className="text-xl font-bold tabular-nums">{formatMoney(selectedItem.plannedAmount)}</p>
              </div>

              {/* Notes */}
              {selectedItem.notes && (
                <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('common.notes')}</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedItem.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
              <Package size={48} className="mb-3 opacity-30" />
              <p className="text-sm">{t('specifications.splitView.selectItem')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecificationSplitView;
