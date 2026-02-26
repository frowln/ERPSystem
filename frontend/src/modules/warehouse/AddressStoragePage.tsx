import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Grid3x3,
  Package,
  LayoutGrid,
  CheckSquare,
  Square,
} from 'lucide-react';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { cn } from '@/lib/cn';
import { warehouseApi } from '@/api/warehouse';
import { formatNumber, formatDate, formatPercent } from '@/lib/format';
import type { StorageCell, StorageZone } from './types';

const AddressStoragePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCell, setSelectedCell] = useState<StorageCell | null>(null);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  const { data: layout, isLoading } = useQuery({
    queryKey: ['storage-layout'],
    queryFn: () => warehouseApi.getStorageLayout(),
  });

  const zones = layout?.zones ?? [];
  const totalCells = layout?.totalCells ?? 0;
  const occupiedCells = layout?.occupiedCells ?? 0;
  const freeCells = totalCells - occupiedCells;
  const occupancyPercent = totalCells > 0 ? (occupiedCells / totalCells) * 100 : 0;

  // Flatten cells for search
  const allCells = useMemo(() => {
    const cells: StorageCell[] = [];
    for (const zone of zones) {
      for (const row of zone.rows) {
        for (const shelf of row.shelves) {
          for (const cell of shelf.cells) {
            cells.push(cell);
          }
        }
      }
    }
    return cells;
  }, [zones]);

  const matchedCellIds = useMemo(() => {
    if (!search) return new Set<string>();
    const q = search.toLowerCase();
    return new Set(
      allCells
        .filter(
          (c) =>
            c.materialName?.toLowerCase().includes(q) ||
            c.cell.toLowerCase().includes(q),
        )
        .map((c) => c.id),
    );
  }, [allCells, search]);

  const getCellColor = (cell: StorageCell) => {
    const isHighlighted = search && matchedCellIds.has(cell.id);
    if (isHighlighted) {
      return 'bg-primary-500 text-white border-primary-600';
    }
    if (cell.occupied) {
      return 'bg-warning-100 dark:bg-warning-900/30 border-warning-300 dark:border-warning-700 text-warning-700 dark:text-warning-300';
    }
    return 'bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700 text-success-700 dark:text-success-300';
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.addressStorage.title')}
        subtitle={t('warehouse.addressStorage.subtitle')}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.addressStorage.breadcrumb') },
        ]}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Grid3x3 size={18} />}
          label={t('warehouse.addressStorage.metricTotalCells')}
          value={formatNumber(totalCells)}
        />
        <MetricCard
          icon={<Package size={18} />}
          label={t('warehouse.addressStorage.metricOccupied')}
          value={formatNumber(occupiedCells)}
        />
        <MetricCard
          icon={<Square size={18} />}
          label={t('warehouse.addressStorage.metricFree')}
          value={formatNumber(freeCells)}
        />
        <MetricCard
          icon={<LayoutGrid size={18} />}
          label={t('warehouse.addressStorage.metricOccupancy')}
          value={formatPercent(occupancyPercent)}
          trend={
            occupancyPercent > 90
              ? { direction: 'down', value: t('warehouse.addressStorage.trendAlmostFull') }
              : occupancyPercent > 70
                ? { direction: 'neutral', value: t('warehouse.addressStorage.trendNormal') }
                : { direction: 'up', value: t('warehouse.addressStorage.trendPlenty') }
          }
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.addressStorage.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && matchedCellIds.size > 0 && (
          <span className="text-sm text-primary-600 dark:text-primary-400">
            {t('warehouse.addressStorage.searchFound', { count: matchedCellIds.size })}
          </span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse text-neutral-500 dark:text-neutral-400">
            {t('common.loading')}
          </div>
        </div>
      )}

      {/* Zones */}
      {!isLoading && zones.length === 0 && (
        <div className="text-center py-16">
          <Grid3x3 size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('warehouse.addressStorage.emptyTitle')}
          </p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
            {t('warehouse.addressStorage.emptyDescription')}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {zones.map((zone) => (
          <div
            key={zone.name}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedZone((prev) => (prev === zone.name ? null : zone.name))
              }
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-primary-500" />
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('warehouse.addressStorage.zoneName', { name: zone.name })}
                </span>
              </div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {zone.rows.reduce(
                  (sum, r) => sum + r.shelves.reduce((s2, sh) => s2 + sh.cells.length, 0),
                  0,
                )}{' '}
                {t('warehouse.addressStorage.cellsCount')}
              </span>
            </button>

            {(expandedZone === zone.name || zones.length <= 3) && (
              <div className="px-4 pb-4 space-y-3">
                {zone.rows.map((row) => (
                  <div key={row.name}>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                      {t('warehouse.addressStorage.rowLabel', { name: row.name })}
                    </p>
                    {row.shelves.map((shelf) => (
                      <div key={shelf.name} className="mb-2">
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">
                          {t('warehouse.addressStorage.shelfLabel', { name: shelf.name })}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {shelf.cells.map((cell) => (
                            <button
                              key={cell.id}
                              onClick={() => setSelectedCell(cell)}
                              title={
                                cell.occupied
                                  ? `${cell.materialName} - ${cell.quantity}`
                                  : t('warehouse.addressStorage.cellEmpty')
                              }
                              className={cn(
                                'w-10 h-10 rounded-md border text-[10px] font-mono flex items-center justify-center transition-all',
                                'hover:ring-2 hover:ring-primary-400 hover:ring-offset-1 dark:hover:ring-offset-neutral-900',
                                getCellColor(cell),
                              )}
                            >
                              {cell.cell}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      {zones.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-success-50 dark:bg-success-900/20 border border-success-300 dark:border-success-700" />
            {t('warehouse.addressStorage.legendFree')}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-warning-100 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700" />
            {t('warehouse.addressStorage.legendOccupied')}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary-500 border border-primary-600" />
            {t('warehouse.addressStorage.legendHighlighted')}
          </div>
        </div>
      )}

      {/* Cell detail modal */}
      <Modal
        open={selectedCell !== null}
        onClose={() => setSelectedCell(null)}
        title={
          selectedCell
            ? t('warehouse.addressStorage.cellDetailTitle', { cell: selectedCell.cell })
            : ''
        }
        size="sm"
      >
        {selectedCell && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.addressStorage.detailZone')}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedCell.zone}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.addressStorage.detailRow')}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedCell.row}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.addressStorage.detailShelf')}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedCell.shelf}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('warehouse.addressStorage.detailCell')}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedCell.cell}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
              {selectedCell.occupied ? (
                <>
                  <div className="mb-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('warehouse.addressStorage.detailMaterial')}
                    </p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedCell.materialName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('warehouse.addressStorage.detailQuantity')}
                      </p>
                      <p className="text-sm tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                        {formatNumber(selectedCell.quantity ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('warehouse.addressStorage.detailLastMovement')}
                      </p>
                      <p className="text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
                        {formatDate(selectedCell.lastMovement)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 py-2">
                  {t('warehouse.addressStorage.cellEmpty')}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AddressStoragePage;
