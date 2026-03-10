import React from 'react';
import { ChevronDown, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { ProjectTask } from '@/types';
import { TaskCard } from './TaskCard';
import type { KanbanColumn as KanbanColumnType } from '@/stores/taskBoardStore';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: ProjectTask[];
  onToggleCollapse: (columnId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onTaskClick: (taskId: string) => void;
  onCreateTask?: (columnId: string) => void;
  onToggleFavorite?: (taskId: string) => void;
  favoriteIds?: Set<string>;
  dragOverColumn: string | null;
}

/* ─── Fallback accent colors by status ─── */
const statusAccentMap: Record<string, { border: string; dot: string }> = {
  BACKLOG: { border: 'border-t-neutral-400', dot: 'bg-neutral-400' },
  TODO: { border: 'border-t-blue-500', dot: 'bg-blue-500' },
  IN_PROGRESS: { border: 'border-t-amber-500', dot: 'bg-amber-500' },
  IN_REVIEW: { border: 'border-t-purple-500', dot: 'bg-purple-500' },
  DONE: { border: 'border-t-green-500', dot: 'bg-green-500' },
  CANCELLED: { border: 'border-t-neutral-300 dark:border-t-neutral-600', dot: 'bg-neutral-300 dark:bg-neutral-600' },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = React.memo(({
  column,
  tasks,
  onToggleCollapse,
  onDragStart,
  onDragOver,
  onDrop,
  onTaskClick,
  onCreateTask,
  onToggleFavorite,
  favoriteIds,
  dragOverColumn,
}) => {
  const isMobile = useIsMobile();
  const hasCustomColor = !!column.color;
  const fallbackAccent = statusAccentMap[column.statusFilter[0] ?? column.id] ?? statusAccentMap.BACKLOG;
  const isOverWip = column.wipLimit !== undefined && tasks.length > column.wipLimit;
  const isDragTarget = dragOverColumn === column.id;

  return (
    <div
      className={cn(
        'flex flex-col flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200',
        'border border-neutral-200/60 dark:border-neutral-700/60',
        !hasCustomColor && `border-t-[3px] ${fallbackAccent.border}`,
        isMobile ? 'min-w-[85vw] w-[85vw]' : 'min-w-[300px] w-[300px]',
        isDragTarget
          ? 'bg-primary-50/40 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 shadow-lg'
          : 'bg-white/60 dark:bg-neutral-900/60',
        column.collapsed && !isMobile && 'min-w-[48px] w-[48px]',
        column.collapsed && isMobile && 'min-w-[85vw] w-[85vw]',
      )}
      style={hasCustomColor ? { borderTopWidth: 3, borderTopColor: column.color, borderTopStyle: 'solid' } : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* ─── Header ─── */}
      <div
        className={cn(
          'flex items-center gap-2.5 cursor-pointer select-none bg-white dark:bg-neutral-900',
          isMobile ? 'px-3.5 py-3 min-h-[44px]' : 'px-3.5 py-3',
        )}
        onClick={() => !isMobile && onToggleCollapse(column.id)}
      >
        {!isMobile && (
          column.collapsed
            ? <ChevronRight size={14} className="text-neutral-400 flex-shrink-0" />
            : <ChevronDown size={14} className="text-neutral-400 flex-shrink-0" />
        )}

        {(!column.collapsed || isMobile) && (
          <>
            <span
              className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', !hasCustomColor && fallbackAccent.dot)}
              style={hasCustomColor ? { backgroundColor: column.color } : undefined}
            />
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex-1 truncate">
              {column.title}
            </span>
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold rounded-full',
                isOverWip
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
              )}
            >
              {tasks.length}
            </span>
            {isOverWip && (
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            )}
          </>
        )}
      </div>

      {/* ─── Кнопка "Добавить задачу" под хедером ─── */}
      {(!column.collapsed || isMobile) && onCreateTask && (
        <div className="px-3 pb-2 bg-white dark:bg-neutral-900">
          <button
            onClick={(e) => { e.stopPropagation(); onCreateTask(column.id); }}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors',
              isMobile && 'py-1 min-h-[36px]',
            )}
          >
            <Plus size={14} />
            {t('taskBoard.addTask')}
          </button>
        </div>
      )}

      {/* WIP limit warning */}
      {(!column.collapsed || isMobile) && isOverWip && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg text-[11px] text-red-600 dark:text-red-400 font-medium">
          {t('taskBoard.wipLimit', { limit: String(column.wipLimit), over: String(tasks.length - column.wipLimit!) })}
        </div>
      )}

      {/* ─── Cards area ─── */}
      {(!column.collapsed || isMobile) && (
        <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 space-y-2 min-h-[80px]">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('taskBoard.noTasks')}</p>
              <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1">
                {t('taskBoard.dragHint')}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onClick={onTaskClick}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favoriteIds?.has(task.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Collapsed body (desktop) */}
      {column.collapsed && !isMobile && (
        <div className="flex-1 flex items-center justify-center py-4">
          <span
            className="text-xs font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            {column.title} ({tasks.length})
          </span>
        </div>
      )}
    </div>
  );
});
KanbanColumn.displayName = 'KanbanColumn';
