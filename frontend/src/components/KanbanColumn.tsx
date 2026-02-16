import React from 'react';
import { ChevronDown, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { TaskStatus, ProjectTask } from '@/types';
import { TaskCard } from './TaskCard';
import type { KanbanColumn as KanbanColumnType } from '@/stores/taskBoardStore';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: ProjectTask[];
  onToggleCollapse: (columnId: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
  onCreateTask?: (columnId: TaskStatus) => void;
  dragOverColumn: TaskStatus | null;
}

const columnColors: Record<TaskStatus, { dot: string; headerBg: string; border: string }> = {
  BACKLOG: { dot: 'bg-neutral-400', headerBg: 'bg-neutral-50 dark:bg-neutral-800', border: 'border-neutral-200 dark:border-neutral-700' },
  TODO: { dot: 'bg-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
  IN_PROGRESS: { dot: 'bg-yellow-500', headerBg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800' },
  IN_REVIEW: { dot: 'bg-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' },
  DONE: { dot: 'bg-green-500', headerBg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800' },
  CANCELLED: { dot: 'bg-neutral-300 dark:bg-neutral-600', headerBg: 'bg-neutral-50 dark:bg-neutral-800', border: 'border-neutral-200 dark:border-neutral-700' },
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
  dragOverColumn,
}) => {
  const isMobile = useIsMobile();
  const colors = columnColors[column.id] ?? columnColors.BACKLOG;
  const isOverWip = column.wipLimit !== undefined && tasks.length > column.wipLimit;
  const isDragTarget = dragOverColumn === column.id;

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border transition-all duration-200 flex-shrink-0',
        // Mobile: wider columns for easier touch, snap to edges
        isMobile ? 'min-w-[85vw] w-[85vw]' : 'min-w-[280px] w-[280px]',
        isDragTarget ? 'border-primary-400 bg-primary-50/30 dark:bg-primary-900/20 shadow-md' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50',
        column.collapsed && !isMobile && 'min-w-[48px] w-[48px]',
        // On mobile, don't allow collapse
        column.collapsed && isMobile && 'min-w-[85vw] w-[85vw]',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Header — 44px min height for touch on mobile */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-t-xl cursor-pointer select-none',
          isMobile ? 'px-3 py-3 min-h-[44px]' : 'px-3 py-2.5',
          colors.headerBg,
        )}
        onClick={() => !isMobile && onToggleCollapse(column.id)}
      >
        {!isMobile && (
          column.collapsed ? (
            <ChevronRight size={14} className="text-neutral-400 flex-shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-neutral-400 flex-shrink-0" />
          )
        )}

        {(!column.collapsed || isMobile) && (
          <>
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', colors.dot)} />
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex-1 truncate">
              {column.title}
            </span>
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full',
                isOverWip
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
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

      {/* WIP limit warning */}
      {(!column.collapsed || isMobile) && isOverWip && (
        <div className="mx-2 mt-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded text-[10px] text-red-600 dark:text-red-400 font-medium">
          {t('taskBoard.wipLimit', { limit: String(column.wipLimit), over: String(tasks.length - column.wipLimit!) })}
        </div>
      )}

      {/* Body */}
      {(!column.collapsed || isMobile) && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-neutral-400">{t('taskBoard.noTasks')}</p>
              <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-0.5">
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
              />
            ))
          )}
        </div>
      )}

      {/* Collapsed body with vertical text (desktop only) */}
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

      {/* Add task button — 44px min height for touch on mobile */}
      {(!column.collapsed || isMobile) && onCreateTask && (
        <div className="px-2 pb-2">
          <button
            onClick={() => onCreateTask(column.id)}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors',
              isMobile ? 'py-3 min-h-[44px]' : 'py-1.5',
            )}
          >
            <Plus size={isMobile ? 16 : 12} />
            {t('taskBoard.addTask')}
          </button>
        </div>
      )}
    </div>
  );
});
KanbanColumn.displayName = 'KanbanColumn';
