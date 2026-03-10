import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type Row,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { EmptyState } from '../EmptyState';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableCardView } from './DataTableCardView';

type Density = 'compact' | 'normal' | 'comfortable';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableDensityToggle?: boolean;
  enableExport?: boolean;
  onRowClick?: (row: T) => void;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'secondary';
    onClick: (rows: T[]) => void;
  }[];
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  tableLabel?: string;
  enableSavedViews?: boolean;
  savedViewsKey?: string;
  maxSavedViews?: number;
  className?: string;
}

interface SavedTableView {
  id: string;
  name: string;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  density: Density;
  createdAt: string;
}

const densityPadding: Record<Density, string> = {
  compact: 'px-3 py-1.5 text-xs',
  normal: 'px-4 py-2.5 text-sm',
  comfortable: 'px-4 py-3.5 text-sm',
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

/**
 * Memoized table row component to avoid re-rendering all rows
 * when only one row changes (e.g., selection toggle).
 */
const MemoizedRow = memo(function MemoizedRow<T>({
  row,
  idx,
  density,
  onRowClick,
}: {
  row: Row<T>;
  idx: number;
  density: Density;
  onRowClick?: (row: T) => void;
}) {
  return (
    <tr
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row.original); } } : undefined}
      role={onRowClick ? 'button' : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      className={cn(
        'border-b border-neutral-100 dark:border-neutral-800 transition-colors',
        onRowClick && 'cursor-pointer',
        row.getIsSelected() ? 'bg-primary-50/50 dark:bg-primary-900/20' : idx % 2 === 1 ? 'bg-neutral-25 dark:bg-neutral-800/30' : 'bg-white dark:bg-neutral-900',
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
}) as <T>(props: {
  row: Row<T>;
  idx: number;
  density: Density;
  onRowClick?: (row: T) => void;
}) => React.ReactElement;

export function DataTable<T>({
  data,
  columns,
  loading = false,
  enableRowSelection = false,
  enableColumnVisibility = false,
  enableDensityToggle = false,
  enableExport = false,
  onRowClick,
  bulkActions,
  pageSize = 20,
  emptyTitle,
  emptyDescription,
  tableLabel = t('table.dataTable'),
  enableSavedViews,
  savedViewsKey,
  maxSavedViews = 8,
  className,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const savedViewsEnabled = enableSavedViews ?? (enableColumnVisibility || enableDensityToggle);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [density, setDensity] = useState<Density>('normal');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedTableView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    if (!savedViewsEnabled) return null;
    if (savedViewsKey) return `datatable.views:${savedViewsKey}`;
    if (typeof window === 'undefined') return null;
    return `datatable.views:${window.location.pathname}:${tableLabel}`;
  }, [savedViewsEnabled, savedViewsKey, tableLabel]);

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
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection,
    enableMultiSort: true,
    initialState: { pagination: { pageSize } },
  });

  // Load saved views from localStorage
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) { setSavedViews([]); setActiveViewId(null); return; }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { setSavedViews([]); setActiveViewId(null); return; }
      const normalized = parsed
        .filter((item): item is SavedTableView => (
          item && typeof item.id === 'string' && typeof item.name === 'string'
          && Array.isArray(item.sorting) && typeof item.columnVisibility === 'object'
          && item.columnVisibility !== null && typeof item.density === 'string'
        ))
        .map((item) => ({ ...item, columnFilters: Array.isArray(item.columnFilters) ? item.columnFilters : [] }));
      setSavedViews(normalized);
      setActiveViewId(null);
    } catch { setSavedViews([]); setActiveViewId(null); }
  }, [storageKey]);

  // Persist saved views
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(savedViews)); } catch { /* ignore */ }
  }, [savedViews, storageKey]);

  // Clean up stale active view
  useEffect(() => {
    if (activeViewId && !savedViews.some((v) => v.id === activeViewId)) setActiveViewId(null);
  }, [savedViews, activeViewId]);

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const handleExportCSV = useCallback(() => {
    const visibleColumns = table.getVisibleLeafColumns().filter((c) => c.id !== '__select');
    const headerRow = visibleColumns.map((col) => { const h = col.columnDef.header; return typeof h === 'string' ? h : col.id; }).join(',');
    const dataRows = table.getFilteredRowModel().rows.map((row) =>
      visibleColumns.map((col) => {
        const str = String(row.getValue(col.id) ?? '');
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','),
    );
    const csv = [headerRow, ...dataRows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [table]);

  const cycleDensity = useCallback(() => {
    setDensity((d) => (d === 'compact' ? 'normal' : d === 'normal' ? 'comfortable' : 'compact'));
  }, []);

  const saveCurrentView = useCallback(() => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `view-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setSavedViews((prev) => {
      const view: SavedTableView = { id, name: t('table.savedViewName', { number: String(prev.length + 1) }), sorting, columnFilters, columnVisibility, density, createdAt: new Date().toISOString() };
      return [view, ...prev].slice(0, maxSavedViews);
    });
    setActiveViewId(id);
  }, [sorting, columnFilters, columnVisibility, density, maxSavedViews]);

  const applySavedView = useCallback((viewId: string) => {
    const view = savedViews.find((item) => item.id === viewId);
    if (!view) return;
    setSorting(view.sorting);
    setColumnFilters(view.columnFilters);
    setColumnVisibility(view.columnVisibility);
    setDensity(view.density);
    setRowSelection({});
    setActiveViewId(view.id);
  }, [savedViews]);

  const resetView = useCallback(() => {
    setSorting([]); setColumnFilters([]); setColumnVisibility({});
    setDensity('normal'); setRowSelection({}); setActiveViewId(null);
  }, []);

  const deleteActiveView = useCallback(() => {
    if (!activeViewId) return;
    setSavedViews((prev) => prev.filter((v) => v.id !== activeViewId));
    setActiveViewId(null);
  }, [activeViewId]);

  const showToolbar = enableColumnVisibility || enableDensityToggle || enableExport || hasSelection || savedViewsEnabled;

  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden', className)}>
      {showToolbar && (
        <DataTableToolbar
          table={table}
          enableColumnVisibility={enableColumnVisibility}
          enableDensityToggle={enableDensityToggle}
          enableExport={enableExport}
          savedViewsEnabled={savedViewsEnabled}
          hasSelection={hasSelection}
          selectedCount={selectedRows.length}
          bulkActions={bulkActions}
          selectedRows={selectedRows.map((r) => r.original)}
          clearSelection={() => setRowSelection({})}
          showColumnPicker={showColumnPicker}
          setShowColumnPicker={setShowColumnPicker}
          cycleDensity={cycleDensity}
          handleExportCSV={handleExportCSV}
          savedViews={savedViews}
          activeViewId={activeViewId}
          setActiveViewId={setActiveViewId}
          applySavedView={applySavedView}
          saveCurrentView={saveCurrentView}
          deleteActiveView={deleteActiveView}
          resetView={resetView}
        />
      )}

      {/* Mobile card view / Desktop table view */}
      {isMobile ? (
        <DataTableCardView
          table={table}
          loading={loading}
          onRowClick={onRowClick}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      ) : (
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full table-auto" aria-label={tableLabel}>
            <caption className="sr-only">{tableLabel}</caption>
            <thead>
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
                <SkeletonRows cols={allColumns.length} rows={5} />
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, idx) => (
                  <MemoizedRow
                    key={row.id}
                    row={row}
                    idx={idx}
                    density={density}
                    onRowClick={onRowClick}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={allColumns.length}>
                    <EmptyState variant="no-data" title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <DataTablePagination table={table} />
    </div>
  );
}
