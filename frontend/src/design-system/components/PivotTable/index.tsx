import React, { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AggregationType = 'sum' | 'count' | 'average';

export interface PivotTableProps<T extends object> {
  /** Source data array */
  data: T[];
  /** Field name for row grouping */
  rowField: keyof T & string;
  /** Field name for column grouping */
  columnField: keyof T & string;
  /** Field name whose values are aggregated */
  valueField: keyof T & string;
  /** Aggregation function to apply */
  aggregation: AggregationType;
  /** Optional label for the row header */
  rowLabel?: string;
  /** Optional label for the value cells (used in tooltips) */
  valueLabel?: string;
  /** Optional custom value formatter */
  formatValue?: (value: number) => string;
  /** Optional custom row order */
  rowOrder?: string[];
  /** Optional custom column order */
  columnOrder?: string[];
  /** Extra classes for the wrapper */
  className?: string;
  /** Title shown above the table */
  title?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function aggregate(values: number[], type: AggregationType): number {
  if (values.length === 0) return 0;
  switch (type) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'count':
      return values.length;
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PivotTable<T extends object>({
  data,
  rowField,
  columnField,
  valueField,
  aggregation,
  rowLabel,
  formatValue,
  rowOrder,
  columnOrder,
  className,
  title,
}: PivotTableProps<T>) {
  const fmt = formatValue ?? ((v: number) => formatNumber(Math.round(v * 100) / 100));

  const { rows, columns, grid, rowTotals, colTotals, grandTotal } = useMemo(() => {
    // Collect unique row / column keys
    const rowSet = new Set<string>();
    const colSet = new Set<string>();

    // Build value buckets: map[row][col] = number[]
    const buckets: Record<string, Record<string, number[]>> = {};

    for (const item of data) {
      const r = String(item[rowField] ?? '');
      const c = String(item[columnField] ?? '');
      const v = Number(item[valueField] ?? 0);

      rowSet.add(r);
      colSet.add(c);

      if (!buckets[r]) buckets[r] = {};
      if (!buckets[r][c]) buckets[r][c] = [];
      buckets[r][c].push(v);
    }

    const rows = rowOrder ?? Array.from(rowSet).sort();
    const columns = columnOrder ?? Array.from(colSet).sort();

    // Build aggregated grid
    const grid: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};

    for (const r of rows) {
      grid[r] = {};
      const allRowValues: number[] = [];
      for (const c of columns) {
        const vals = buckets[r]?.[c] ?? [];
        grid[r][c] = aggregate(vals, aggregation);
        allRowValues.push(...vals);
      }
      rowTotals[r] = aggregate(allRowValues, aggregation);
    }

    for (const c of columns) {
      const allColValues: number[] = [];
      for (const r of rows) {
        const vals = buckets[r]?.[c] ?? [];
        allColValues.push(...vals);
      }
      colTotals[c] = aggregate(allColValues, aggregation);
    }

    const allValues = data.map((item) => Number(item[valueField] ?? 0));
    const grandTotal = aggregate(allValues, aggregation);

    return { rows, columns, grid, rowTotals, colTotals, grandTotal };
  }, [data, rowField, columnField, valueField, aggregation, rowOrder, columnOrder]);

  if (data.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center', className)}>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('pivotTable.noData')}</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden', className)}>
      {title && (
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800">
              <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300 border-b border-r border-neutral-200 dark:border-neutral-700 sticky left-0 bg-neutral-50 dark:bg-neutral-800 z-10 min-w-[160px]">
                {rowLabel ?? rowField}
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300 border-b border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap min-w-[100px]"
                >
                  {col}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 whitespace-nowrap min-w-[100px]">
                {t('pivotTable.total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row}
                className={cn(
                  'transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-900/20',
                  idx % 2 === 1 && 'bg-neutral-50/50 dark:bg-neutral-800/50',
                )}
              >
                <td className="px-4 py-2.5 font-medium text-neutral-800 dark:text-neutral-200 border-r border-neutral-200 dark:border-neutral-700 sticky left-0 bg-inherit z-10">
                  {row}
                </td>
                {columns.map((col) => {
                  const val = grid[row]?.[col] ?? 0;
                  return (
                    <td
                      key={col}
                      className={cn(
                        'px-4 py-2.5 text-right tabular-nums border-r border-neutral-100 dark:border-neutral-800',
                        val === 0 ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-700 dark:text-neutral-300',
                      )}
                    >
                      {val === 0 ? '—' : fmt(val)}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                  {fmt(rowTotals[row] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-100 dark:bg-neutral-800 border-t-2 border-neutral-300 dark:border-neutral-600">
              <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100 border-r border-neutral-200 dark:border-neutral-700 sticky left-0 bg-neutral-100 dark:bg-neutral-800 z-10">
                {t('pivotTable.total')}
              </td>
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-4 py-3 text-right tabular-nums font-bold text-neutral-900 dark:text-neutral-100 border-r border-neutral-200 dark:border-neutral-700"
                >
                  {fmt(colTotals[col] ?? 0)}
                </td>
              ))}
              <td className="px-4 py-3 text-right tabular-nums font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30">
                {fmt(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default PivotTable;
