import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Table } from '@tanstack/react-table';

interface DataTablePaginationProps<T> {
  table: Table<T>;
}

export function DataTablePagination<T>({ table }: DataTablePaginationProps<T>) {
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {t('table.showing', {
          from: table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1,
          to: Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          ),
          total: table.getFilteredRowModel().rows.length,
        })}
      </p>

      <div className="flex items-center gap-1">
        <button onClick={() => table.setPageIndex(0)} aria-label={t('table.firstPage')} disabled={!table.getCanPreviousPage()} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors">
          <ChevronsLeft size={15} />
        </button>
        <button onClick={() => table.previousPage()} aria-label={t('table.previousPage')} disabled={!table.getCanPreviousPage()} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors">
          <ChevronLeft size={15} />
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
          let pageNum: number;
          if (totalPages <= 7) {
            pageNum = i;
          } else if (currentPage < 3) {
            pageNum = i;
          } else if (currentPage > totalPages - 4) {
            pageNum = totalPages - 7 + i;
          } else {
            pageNum = currentPage - 3 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => table.setPageIndex(pageNum)}
              className={cn(
                'min-w-[28px] h-7 px-1 text-xs font-medium rounded transition-colors min-h-[44px] sm:min-h-0',
                pageNum === currentPage
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              {pageNum + 1}
            </button>
          );
        })}

        <button onClick={() => table.nextPage()} aria-label={t('table.nextPage')} disabled={!table.getCanNextPage()} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors">
          <ChevronRight size={15} />
        </button>
        <button onClick={() => table.setPageIndex(totalPages - 1)} aria-label={t('table.lastPage')} disabled={!table.getCanNextPage()} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors">
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
