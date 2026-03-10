import React, { useMemo, useState } from 'react';
import {
  Type,
  MoveRight,
  Square,
  Circle,
  Cloud,
  Pencil,
  Stamp,
  CheckCircle2,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { DrawingMarkup } from '@/api/markups';

type StatusFilter = 'ALL' | 'ACTIVE' | 'RESOLVED';

const typeIcons: Record<string, React.ElementType> = {
  TEXT: Type,
  ARROW: MoveRight,
  RECTANGLE: Square,
  CIRCLE: Circle,
  CLOUD: Cloud,
  FREEHAND: Pencil,
  STAMP: Stamp,
};

interface AnnotationPanelProps {
  markups: DrawingMarkup[];
  selectedMarkupId: string | null;
  onSelectMarkup: (id: string) => void;
  onResolveMarkup: (id: string) => void;
  onDeleteMarkup: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  markups,
  selectedMarkupId,
  onSelectMarkup,
  onResolveMarkup,
  onDeleteMarkup,
  collapsed,
  onToggleCollapsed,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredMarkups = useMemo(() => {
    if (statusFilter === 'ALL') return markups;
    return markups.filter((m) => m.status === statusFilter);
  }, [markups, statusFilter]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex items-center justify-center w-8 h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        title={t('drawings.markup.annotations')}
      >
        <ChevronRight size={16} className="text-neutral-500 rotate-180" />
      </button>
    );
  }

  return (
    <div className="w-72 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('drawings.markup.annotations')}
        </h3>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
        {(['ALL', 'ACTIVE', 'RESOLVED'] as StatusFilter[]).map((filter) => {
          const labelKey =
            filter === 'ALL'
              ? 'drawings.markup.filterAll'
              : filter === 'ACTIVE'
                ? 'drawings.markup.filterActive'
                : 'drawings.markup.filterResolved';
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'px-2 py-0.5 text-xs rounded-full transition-colors',
                statusFilter === filter
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMarkups.length === 0 && (
          <div className="p-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {t('drawings.markup.noAnnotations')}
          </div>
        )}

        {filteredMarkups.map((markup) => {
          const Icon = typeIcons[markup.markupType] ?? Square;
          const isSelected = markup.id === selectedMarkupId;
          const isResolved = markup.status === 'RESOLVED';
          const date = new Date(markup.createdAt).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          });

          return (
            <div
              key={markup.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectMarkup(markup.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectMarkup(markup.id);
              }}
              className={cn(
                'flex items-start gap-2 px-3 py-2 cursor-pointer border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
              )}
            >
              <div
                className="mt-0.5 p-1 rounded"
                style={{ color: markup.color }}
              >
                <Icon size={14} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                    {markup.authorName ?? t('drawings.markup.author')}
                  </span>
                  {isResolved && (
                    <span className="text-[10px] px-1 py-px rounded bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                      {t('drawings.markup.resolved')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {markup.markupType === 'TEXT' && markup.textContent
                    ? markup.textContent.slice(0, 40) + (markup.textContent.length > 40 ? '...' : '')
                    : markup.markupType}
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{date}</p>
              </div>

              <div className="flex flex-col gap-1 mt-0.5">
                {!isResolved && (
                  <button
                    type="button"
                    title={t('drawings.markup.resolve')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolveMarkup(markup.id);
                    }}
                    className="text-neutral-400 hover:text-success-600 dark:hover:text-success-400 transition-colors"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                )}
                <button
                  type="button"
                  title={t('common.delete')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMarkup(markup.id);
                  }}
                  className="text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnotationPanel;
