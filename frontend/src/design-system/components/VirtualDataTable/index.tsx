import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { EmptyState } from '../EmptyState';

type Density = 'compact' | 'normal' | 'comfortable';

interface VirtualDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  enableRowSelection?: boolean;
  onRowClick?: (row: T) => void;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'secondary';
    onClick: (rows: T[]) => void;
  }[];
  estimateSize?: number;
  maxHeight?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  tableLabel?: string;
  density?: Density;
  className?: string;
}

const densityPadding: Record<Density, string> = {
  compact: 'px-3 py-1.5 text-xs',
  normal: 'px-4 py-2.5 text-sm',
  comfortable: 'px-4 py-3.5 text-sm',
};

const densityRowHeight: Record<Density, number> = {
  compact: 32,
  normal: 44,
  comfortable: 52,
};

function SkeletonRows({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-neutral-100 dark:border-neutral-800">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3">
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function VirtualDataTable<T>({
  data,
  columns,
  loading = false,
  enableRowSelection = false,
  onRowClick,
  bulkActions,
  estimateSize,
  maxHeight = 'calc(100vh - 300px)',
  emptyTitle,
  emptyDescription,
  tableLabel = t('table.dataTable'),
  density = 'normal',
  className,
}: VirtualDataTableProps<T>) {
  const isMobile = useIsMobile();
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectionColumn: ColumnDef<T, unknown> = useMemo(
    () => ({
      id: '__select',
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label={t('table.selectAllRows')}
          className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={t('table.selectRow', { id: row.id })}
          className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
      enableSorting: false,
      enableResizing: false,
    }),
    [],
  );

  const allColumns = useMemo(() => {
    if (enableRowSelection) return [selectionColumn, ...columns];
    return columns;
  }, [enableRowSelection, columns, selectionColumn]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
    enableMultiSort: true,
  });

  const { rows } = table.getRowModel();

  const rowHeight = estimateSize ?? densityRowHeight[density];

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 20,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const handleDeselectAll = useCallback(() => setRowSelection({}), []);

  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden', className)}>
      {/* Bulk actions toolbar */}
      {hasSelection && bulkActions && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-primary-50/50 dark:bg-primary-900/20">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {t('table.selectedCount', { count: String(selectedRows.length) })}
          </span>
          <button
            onClick={handleDeselectAll}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline"
          >
            {t('table.deselectRows')}
          </button>
          <div className="flex-1" />
          {bulkActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => action.onClick(selectedRows.map((r) => r.original))}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                action.variant === 'danger'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                  : action.variant === 'primary'
                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable virtualized table */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        {isMobile ? (
          /* Mobile: simple card layout without virtualization */
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              <div className="p-8 text-center text-sm text-neutral-400">{t('common.loading')}</div>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <div
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'p-3 space-y-1',
                    onRowClick && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  )}
                >
                  {row.getVisibleCells().filter((c) => c.column.id !== '__select').map((cell) => (
                    <div key={cell.id} className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-400 text-xs min-w-[80px]">
                        {typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}
                      </span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <EmptyState variant="no-data" title={emptyTitle} description={emptyDescription} />
            )}
          </div>
        ) : (
          <table className="w-full table-auto" aria-label={tableLabel}>
            <caption className="sr-only">{tableLabel}</caption>
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  {headerGroup.headers.map((header) => {
                    const sortedState = header.column.getIsSorted();
                    const ariaSort = header.column.getCanSort()
                      ? sortedState === 'asc' ? 'ascending' : sortedState === 'desc' ? 'descending' : 'none'
                      : undefined;
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={ariaSort}
                        className={cn(
                          'text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap',
                          densityPadding[density],
                          header.column.getCanSort() && 'cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-300',
                          header.id === '__select' && 'w-10',
                        )}
                        style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-neutral-300">
                              {header.column.getIsSorted() === 'asc' ? <ArrowUp size={13} className="text-primary-500" />
                                : header.column.getIsSorted() === 'desc' ? <ArrowDown size={13} className="text-primary-500" />
                                  : <ArrowUpDown size={13} />}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={allColumns.length} rows={10} />
              ) : rows.length > 0 ? (
                <>
                  {/* Spacer for virtual rows above viewport */}
                  {virtualizer.getVirtualItems().length > 0 && virtualizer.getVirtualItems()[0].start > 0 && (
                    <tr>
                      <td
                        colSpan={allColumns.length}
                        style={{ height: virtualizer.getVirtualItems()[0].start }}
                      />
                    </tr>
                  )}
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <tr
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                        onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row.original); } } : undefined}
                        role={onRowClick ? 'button' : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        className={cn(
                          'border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                          onRowClick && 'cursor-pointer',
                          row.getIsSelected() ? 'bg-primary-50/50 dark:bg-primary-900/20' : virtualRow.index % 2 === 1 ? 'bg-neutral-25 dark:bg-neutral-800/30' : 'bg-white dark:bg-neutral-900',
                          !row.getIsSelected() && 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className={cn(
                            'text-neutral-700 dark:text-neutral-300 whitespace-nowrap',
                            densityPadding[density],
                            Boolean((cell.column.columnDef.meta as Record<string, unknown> | undefined)?.numeric) && 'tabular-nums text-right',
                          )}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* Spacer for virtual rows below viewport */}
                  {virtualizer.getVirtualItems().length > 0 && (
                    <tr>
                      <td
                        colSpan={allColumns.length}
                        style={{
                          height: virtualizer.getTotalSize() - (virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1].end),
                        }}
                      />
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={allColumns.length}>
                    <EmptyState variant="no-data" title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Row count footer */}
      {!loading && rows.length > 0 && (
        <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400">
          {t('table.showing', {
            from: '1',
            to: String(rows.length),
            total: String(data.length),
          })}
        </div>
      )}
    </div>
  );
}
