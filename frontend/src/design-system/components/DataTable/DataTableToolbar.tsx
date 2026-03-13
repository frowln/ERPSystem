import React from 'react';
import { BookmarkPlus, Columns3, Rows3, RotateCcw, Trash2, Download, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { guardDemoModeAction } from '@/lib/demoMode';
import { Button } from '../Button';
import type { Table } from '@tanstack/react-table';

interface SavedTableView {
  id: string;
  name: string;
}

interface DataTableToolbarProps<T> {
  table: Table<T>;
  enableColumnVisibility: boolean;
  enableDensityToggle: boolean;
  enableExport: boolean;
  savedViewsEnabled: boolean;
  hasSelection: boolean;
  selectedCount: number;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'secondary';
    onClick: (rows: T[]) => void;
  }[];
  selectedRows: T[];
  clearSelection: () => void;
  showColumnPicker: boolean;
  setShowColumnPicker: (v: boolean) => void;
  cycleDensity: () => void;
  handleExportCSV: () => void;
  savedViews: SavedTableView[];
  activeViewId: string | null;
  setActiveViewId: (id: string | null) => void;
  applySavedView: (id: string) => void;
  saveCurrentView: () => void;
  deleteActiveView: () => void;
  resetView: () => void;
}

export function DataTableToolbar<T>({
  table,
  enableColumnVisibility,
  enableDensityToggle,
  enableExport,
  savedViewsEnabled,
  hasSelection,
  selectedCount,
  bulkActions,
  selectedRows,
  clearSelection,
  showColumnPicker,
  setShowColumnPicker,
  cycleDensity,
  handleExportCSV,
  savedViews,
  activeViewId,
  setActiveViewId,
  applySavedView,
  saveCurrentView,
  deleteActiveView,
  resetView,
}: DataTableToolbarProps<T>) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-25 dark:bg-neutral-800/50">
      {hasSelection && bulkActions ? (
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{t('table.selectedCount', { count: selectedCount })}</span>
          <button onClick={clearSelection} aria-label={t('table.deselectRows')} className="p-1 text-neutral-400 hover:text-neutral-600 rounded">
            <X size={14} />
          </button>
          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />
          {bulkActions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant ?? 'secondary'}
              size="xs"
              iconLeft={action.icon}
              onClick={() => {
                if (action.variant === 'danger' && guardDemoModeAction(action.label)) return;
                action.onClick(selectedRows);
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1">
        {savedViewsEnabled && (
          <div className="flex items-center gap-1.5 mr-1">
            <select
              aria-label={t('table.selectSavedView')}
              value={activeViewId ?? ''}
              onChange={(e) => {
                const nextId = e.target.value;
                if (!nextId) { setActiveViewId(null); return; }
                applySavedView(nextId);
              }}
              className="h-7 min-h-[44px] sm:min-h-0 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-xs text-neutral-600 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-300"
            >
              <option value="">{t('table.currentView')}</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>{view.name}</option>
              ))}
            </select>
            <button onClick={saveCurrentView} aria-label={t('table.saveCurrentView')} title={t('table.saveCurrentView')} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
              <BookmarkPlus size={15} />
            </button>
            <button onClick={deleteActiveView} aria-label={t('table.deleteSavedView')} title={t('table.deleteSavedView')} disabled={!activeViewId} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <Trash2 size={15} />
            </button>
            <button onClick={resetView} aria-label={t('table.resetView')} title={t('table.resetView')} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
              <RotateCcw size={15} />
            </button>
          </div>
        )}
        {enableDensityToggle && (
          <button onClick={cycleDensity} aria-label={t('table.changeDensity')} title={t('table.changeDensity')} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
            <Rows3 size={15} />
          </button>
        )}
        {enableColumnVisibility && (
          <div className="relative">
            <button onClick={() => setShowColumnPicker(!showColumnPicker)} aria-label={showColumnPicker ? t('table.hideColumnPicker') : t('table.showColumnPicker')} title={t('table.columns')} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
              <Columns3 size={15} />
            </button>
            {showColumnPicker && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 z-20 animate-slide-up">
                <p className="px-3 pb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t('table.columns')}</p>
                {table.getAllLeafColumns().filter((c) => c.id !== '__select').map((column) => (
                  <label key={column.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {enableExport && (
          <button onClick={handleExportCSV} aria-label={t('table.exportCsv')} title={t('table.exportCsv')} className="p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
            <Download size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
