import React from 'react';
import { flexRender, type Row, type Table } from '@tanstack/react-table';
import { cn } from '@/lib/cn';
import { EmptyState } from '../EmptyState';

interface DataTableCardViewProps<T> {
  table: Table<T>;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
          <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
          <div className="flex gap-4">
            <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-24" />
            <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataTableCardView<T>({
  table,
  loading = false,
  onRowClick,
  emptyTitle,
  emptyDescription,
}: DataTableCardViewProps<T>) {
  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns().filter((c) => c.id !== '__select');

  if (loading) {
    return <SkeletonCards count={5} />;
  }

  if (rows.length === 0) {
    return <EmptyState variant="no-data" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-2 p-3">
      {rows.map((row) => (
        <MobileCard
          key={row.id}
          row={row}
          columns={visibleColumns}
          onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          isSelected={row.getIsSelected()}
        />
      ))}
    </div>
  );
}

interface MobileCardProps<T> {
  row: Row<T>;
  columns: ReturnType<Table<T>['getVisibleLeafColumns']>;
  onClick?: () => void;
  isSelected: boolean;
}

function MobileCard<T>({ row, columns, onClick, isSelected }: MobileCardProps<T>) {
  const cells = row.getVisibleCells().filter((c) => c.column.id !== '__select');

  // First column as the card title, rest as details
  const [primary, ...secondary] = cells;

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-lg border p-4 transition-colors active:bg-neutral-50 dark:active:bg-neutral-800',
        onClick && 'cursor-pointer',
        isSelected ? 'border-primary-300 bg-primary-50/30 dark:bg-primary-900/20' : 'border-neutral-200 dark:border-neutral-700',
      )}
    >
      {/* Primary field — card title */}
      {primary && (
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {flexRender(primary.column.columnDef.cell, primary.getContext())}
        </div>
      )}

      {/* Secondary fields — label-value pairs in responsive grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-1.5">
        {secondary.map((cell) => {
          const header = cell.column.columnDef.header;
          const label = typeof header === 'string' ? header : cell.column.id;
          return (
            <div key={cell.id} className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">{label}</span>
              <span className="text-xs text-neutral-700 dark:text-neutral-300 text-right truncate min-w-0">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
