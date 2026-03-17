import React from 'react';
import { AlertTriangle, Ban, Download, FileSignature } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import { Button } from '@/design-system/components/Button';
import type { MatrixData, MatrixRowData } from '../lib/matrixBuilder';
import type { VendorInfo } from '../lib/matrixBuilder';

interface ProcurementSummaryViewProps {
  matrix: MatrixData;
  filteredRows: MatrixRowData[];
  onExportExcel: () => void;
  onCreateCp: () => void;
}

export const ProcurementSummaryView: React.FC<ProcurementSummaryViewProps> = ({
  matrix,
  filteredRows,
  onExportExcel,
  onCreateCp,
}) => {
  // Group winner rows by vendor
  const vendorGroups = new Map<string, { vendor: VendorInfo; rows: { row: MatrixRowData; entry: any }[] }>();
  const unassigned: MatrixRowData[] = [];
  const rejected: MatrixRowData[] = [];

  for (const row of filteredRows) {
    if (row.winnerVendorKey) {
      const cell = row.cells.get(row.winnerVendorKey);
      if (!vendorGroups.has(row.winnerVendorKey)) {
        const vi = matrix.vendors.find(v => v.name === row.winnerVendorKey);
        vendorGroups.set(row.winnerVendorKey, {
          vendor: vi!,
          rows: [],
        });
      }
      vendorGroups.get(row.winnerVendorKey)!.rows.push({ row, entry: cell?.entry });
    } else {
      const hasRejectedAll = row.coverageDots.length > 0 && !row.coverageDots.some(d => d.covered);
      if (hasRejectedAll && row.proposalCount > 0) {
        rejected.push(row);
      } else {
        unassigned.push(row);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {t('competitiveList.matrix.summaryTitle')}
        </h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" iconLeft={<Download size={14} />} onClick={onExportExcel}>
            Excel
          </Button>
          <Button variant="primary" size="sm" iconLeft={<FileSignature size={14} />} onClick={onCreateCp}>
            {t('competitiveList.matrix.createCp')}
          </Button>
        </div>
      </div>

      {Array.from(vendorGroups.entries()).map(([vendorKey, { vendor, rows }]) => {
        const total = rows.reduce((sum, { entry }) => sum + (entry?.unitPrice ?? 0) * (entry?.quantity ?? 0), 0);
        return (
          <div key={vendorKey} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div className={cn('px-4 py-2.5 flex items-center justify-between', vendor.color.lightBg, vendor.color.darkBg)}>
              <div className="flex items-center gap-2">
                <span className={cn('w-3 h-3 rounded-full', vendor.color.dot)} />
                <span className={cn('text-sm font-semibold', vendor.color.headerText)}>{vendor.name}</span>
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {t('competitiveList.matrix.total')}: {formatMoney(total)}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="px-3 py-1.5 text-left text-xs text-neutral-500 font-medium">
                    {t('competitiveList.matrix.colPosition')}
                  </th>
                  <th className="px-3 py-1.5 text-center text-xs text-neutral-500 font-medium w-16">
                    {t('competitiveList.matrix.colQty')}
                  </th>
                  <th className="px-3 py-1.5 text-right text-xs text-neutral-500 font-medium w-28">
                    {t('competitiveList.entry.price')}
                  </th>
                  <th className="px-3 py-1.5 text-right text-xs text-neutral-500 font-medium w-28">
                    {t('competitiveList.entry.total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ row, entry }) => (
                  <tr key={row.item.id} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="px-3 py-1.5 text-neutral-800 dark:text-neutral-200">{row.item.name}</td>
                    <td className="px-3 py-1.5 text-center text-neutral-600 dark:text-neutral-400">
                      {row.item.quantity} {row.item.unitOfMeasure}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(entry?.unitPrice ?? 0)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                      {formatMoney((entry?.unitPrice ?? 0) * (entry?.quantity ?? row.item.quantity))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {unassigned.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
            <AlertTriangle size={14} />
            {t('competitiveList.matrix.unassigned', { count: unassigned.length })}
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="border border-red-200 dark:border-red-700 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-medium">
            <Ban size={14} />
            {t('competitiveList.matrix.rejected', { count: rejected.length })}
          </div>
        </div>
      )}
    </div>
  );
};
