import React, { useState } from 'react';
import { X, RotateCcw, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Button } from '@/design-system/components/Button';
import { useDashboardStore } from '@/stores/dashboardStore';
import {
  WIDGET_REGISTRY,
  WIDGET_CATEGORIES,
  type WidgetCategory,
} from './DashboardWidgetSystem';

interface WidgetLibraryProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<WidgetCategory, () => string> = {
  projects: () => t('dashboard.cat.projects'),
  finance: () => t('dashboard.cat.finance'),
  tasks: () => t('dashboard.cat.tasks'),
  quality: () => t('dashboard.cat.quality'),
  safety: () => t('dashboard.cat.safety'),
  procurement: () => t('dashboard.cat.procurement'),
  hr: () => t('dashboard.cat.hr'),
  documents: () => t('dashboard.cat.documents'),
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ open, onClose }) => {
  const { activeWidgets, addWidget, removeWidget, resetToDefault } = useDashboardStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');

  if (!open) return null;

  const filtered = WIDGET_REGISTRY.filter((w) => {
    if (selectedCategory !== 'all' && w.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        w.title().toLowerCase().includes(q) ||
        w.description().toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-3xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('dashboard.widgetLibrary')}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('dashboard.wid.libraryHint')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<RotateCcw size={14} />}
              onClick={() => {
                resetToDefault();
              }}
            >
              {t('dashboard.resetDefault')}
            </Button>
            <button
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search + categories */}
        <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700',
              )}
              onClick={() => setSelectedCategory('all')}
            >
              {t('common.all')}
            </button>
            {WIDGET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  selectedCategory === cat
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700',
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                {CATEGORY_LABELS[cat]()}
              </button>
            ))}
          </div>
        </div>

        {/* Widget grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((widget) => {
              const isActive = activeWidgets.includes(widget.id);
              const Icon = widget.icon;

              return (
                <div
                  key={widget.id}
                  className={cn(
                    'relative rounded-xl border p-4 transition-all',
                    isActive
                      ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/20'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-600 dark:text-primary-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                      )}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {widget.title()}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {widget.description()}
                      </p>
                    </div>

                    <button
                      className={cn(
                        'flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-300 hover:bg-danger-200 dark:hover:bg-danger-900/60'
                          : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/60',
                      )}
                      onClick={() => (isActive ? removeWidget(widget.id) : addWidget(widget.id))}
                    >
                      {isActive ? t('dashboard.removeWidget') : t('dashboard.addWidget')}
                    </button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-8 text-neutral-400">
                <Search size={28} className="mx-auto mb-2" />
                <p className="text-sm">{t('dashboard.wid.noWidgetsFound')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-100 dark:border-neutral-800">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('dashboard.wid.activeCount', { count: String(activeWidgets.length), total: String(WIDGET_REGISTRY.length) })}
          </span>
          <Button size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
