import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import { VendorPriceCell } from './VendorPriceCell';
import type { MatrixData, MatrixRowData, SectionGroup } from '../lib/matrixBuilder';
import type { VendorInfo } from '../lib/matrixBuilder';

interface SupplierMatrixViewProps {
  matrix: MatrixData;
  filteredRows: MatrixRowData[];
  onSelectWinner: (entryId: string) => void;
  onRejectEntry: (entryId: string, type: string) => void;
  onUnrejectEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onAddProposal: (specItemId: string, vendorName?: string) => void;
  disabled: boolean;
}

type FlatItem =
  | { type: 'section'; section: SectionGroup; index: number }
  | { type: 'row'; row: MatrixRowData };

export const SupplierMatrixView: React.FC<SupplierMatrixViewProps> = ({
  matrix,
  filteredRows,
  onSelectWinner,
  onRejectEntry,
  onUnrejectEntry,
  onDeleteEntry,
  onAddProposal,
  disabled,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const toggleSection = useCallback((name: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // Build flat list for virtualizer
  const flatItems = useMemo<FlatItem[]>(() => {
    const sectionMap = new Map<string, MatrixRowData[]>();
    for (const row of filteredRows) {
      const key = row.item.sectionName ?? '';
      if (!sectionMap.has(key)) sectionMap.set(key, []);
      sectionMap.get(key)!.push(row);
    }

    const items: FlatItem[] = [];
    let sectionIdx = 0;
    for (const [name, rows] of sectionMap) {
      const section: SectionGroup = {
        sectionName: name,
        rows,
        collapsed: collapsedSections.has(name),
      };
      items.push({ type: 'section', section, index: sectionIdx++ });
      if (!collapsedSections.has(name)) {
        for (const row of rows) {
          items.push({ type: 'row', row });
        }
      }
    }
    return items;
  }, [filteredRows, collapsedSections]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => flatItems[i].type === 'section' ? 36 : 56,
    overscan: 15,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const { vendors, vendorKeys } = matrix;
  const totalColSpan = 3 + vendors.length;

  // Spacer heights for proper table layout
  const topSpace = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const bottomSpace = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  return (
    <div
      ref={parentRef}
      className="overflow-auto border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
      style={{ maxHeight: 'calc(100vh - 320px)' }}
    >
      <table className="w-full border-collapse min-w-[900px]">
        {/* Sticky header */}
        <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800">
          <tr>
            <th className="sticky left-0 z-30 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 border-b border-r border-neutral-200 dark:border-neutral-700 min-w-[250px]">
              {t('competitiveList.matrix.colPosition')}
            </th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-300 border-b border-r border-neutral-200 dark:border-neutral-700 w-20">
              {t('competitiveList.matrix.colQty')}
            </th>
            {vendors.map((v, i) => (
              <VendorHeader key={vendorKeys[i]} vendor={v} />
            ))}
            <th className="sticky right-0 z-30 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-300 border-b border-l border-neutral-200 dark:border-neutral-700 min-w-[130px]">
              {t('competitiveList.matrix.colSelected')}
            </th>
          </tr>
        </thead>

        <tbody>
          {/* Top spacer */}
          {topSpace > 0 && (
            <tr><td colSpan={totalColSpan} style={{ height: topSpace }} /></tr>
          )}

          {/* Virtualized rows */}
          {virtualItems.map((virtualRow) => {
            const item = flatItems[virtualRow.index];

            if (item.type === 'section') {
              return (
                <tr
                  key={`section-${item.section.sectionName}-${item.index}`}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="bg-neutral-100 dark:bg-neutral-800/50"
                >
                  <td
                    colSpan={totalColSpan}
                    className="px-3 py-1.5 cursor-pointer"
                    onClick={() => toggleSection(item.section.sectionName)}
                  >
                    <div className="flex items-center gap-2">
                      {collapsedSections.has(item.section.sectionName)
                        ? <ChevronRight size={14} className="text-neutral-500" />
                        : <ChevronDown size={14} className="text-neutral-500" />}
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase">
                        {item.section.sectionName || t('competitiveList.matrix.noSection')}
                      </span>
                      <span className="text-xs text-neutral-500">
                        ({item.section.rows.length})
                      </span>
                    </div>
                  </td>
                </tr>
              );
            }

            const { row } = item;
            return (
              <tr
                key={row.item.id}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
              >
                {/* Position cell (sticky left) */}
                <td className="sticky left-0 z-10 bg-white dark:bg-neutral-900 px-3 py-1 border-r border-neutral-200 dark:border-neutral-700">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      {/* Coverage dots */}
                      <div className="flex gap-0.5 mr-1">
                        {row.coverageDots.map((d) => (
                          <span
                            key={d.vendorKey}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              d.covered
                                ? matrix.vendors.find(v => v.name === d.vendorKey)?.color.dot ?? 'bg-neutral-300'
                                : 'bg-neutral-200 dark:bg-neutral-600',
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]" title={row.item.name}>
                        {row.item.name}
                      </span>
                    </div>
                    {row.item.productCode && (
                      <span className="text-[10px] text-neutral-400">{row.item.productCode}</span>
                    )}
                  </div>
                </td>

                {/* Quantity */}
                <td className="px-2 py-1 text-center text-xs text-neutral-600 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                  {row.item.quantity} {row.item.unitOfMeasure}
                </td>

                {/* Vendor price cells */}
                {vendorKeys.map((vk) => (
                  <VendorPriceCell
                    key={vk}
                    cell={row.cells.get(vk)}
                    vendorColor={matrix.vendors.find(v => v.name === vk)!.color}
                    itemQuantity={row.item.quantity}
                    onSelect={() => {
                      const c = row.cells.get(vk);
                      if (c) onSelectWinner(c.entry.id);
                    }}
                    onReject={(type) => {
                      const c = row.cells.get(vk);
                      if (c) onRejectEntry(c.entry.id, type);
                    }}
                    onUnreject={() => {
                      const c = row.cells.get(vk);
                      if (c) onUnrejectEntry(c.entry.id);
                    }}
                    onAddProposal={() => onAddProposal(row.item.id, vk)}
                    onDelete={() => {
                      const c = row.cells.get(vk);
                      if (c) onDeleteEntry(c.entry.id);
                    }}
                    disabled={disabled}
                  />
                ))}

                {/* Winner cell (sticky right) */}
                <td className="sticky right-0 z-10 bg-white dark:bg-neutral-900 px-2 py-1 text-center border-l border-neutral-200 dark:border-neutral-700">
                  {row.winnerVendorKey ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <Trophy size={12} className="text-amber-500" />
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
                          {formatMoney(row.cells.get(row.winnerVendorKey)?.entry.unitPrice ?? 0).replace(' ₽', '')}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 truncate max-w-[110px]" title={row.winnerVendorKey}>
                        {row.winnerVendorKey}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Bottom spacer */}
          {bottomSpace > 0 && (
            <tr><td colSpan={totalColSpan} style={{ height: bottomSpace }} /></tr>
          )}
        </tbody>

        {/* Footer */}
        <tfoot className="sticky bottom-0 z-20 bg-neutral-50 dark:bg-neutral-800 border-t-2 border-neutral-300 dark:border-neutral-600">
          <tr>
            <td className="sticky left-0 z-30 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 border-r border-neutral-200 dark:border-neutral-700">
              {t('competitiveList.matrix.totals')}
            </td>
            <td className="border-r border-neutral-200 dark:border-neutral-700" />
            {vendors.map((v, i) => (
              <td key={vendorKeys[i]} className="px-2 py-2 text-right border-r border-neutral-200 dark:border-neutral-700">
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                  {formatMoney(v.grandTotal).replace(' ₽', '')}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {matrix.kpi.totalPositions > 0
                    ? `${Math.round((v.totalCoverage / matrix.kpi.totalPositions) * 100)}%`
                    : '0%'}
                </div>
              </td>
            ))}
            <td className="sticky right-0 z-30 bg-neutral-50 dark:bg-neutral-800 px-2 py-2 text-center border-l border-neutral-200 dark:border-neutral-700">
              {matrix.kpi.totalSelected > 0 && (
                <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">
                  {formatMoney(matrix.kpi.totalSelected).replace(' ₽', '')}
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Vendor header cell
// ---------------------------------------------------------------------------

const VendorHeader: React.FC<{ vendor: VendorInfo }> = ({ vendor }) => (
  <th className={cn(
    'px-2 py-2 text-center border-b border-r border-neutral-200 dark:border-neutral-700 min-w-[130px]',
    vendor.color.lightBg, vendor.color.darkBg,
  )}>
    <div className="flex items-center justify-center gap-1.5">
      <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', vendor.color.dot)} />
      <span className={cn('text-xs font-semibold truncate max-w-[100px]', vendor.color.headerText)} title={vendor.name}>
        {vendor.name}
      </span>
    </div>
  </th>
);
