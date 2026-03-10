import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  MoreVertical,
  Circle,
  CircleDot,
  CircleCheck,
  CircleX,
  CircleMinus,
  Star,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { AssigneeAvatar } from './AssigneeAvatar';
import type { ProjectTask, TaskPriority, TaskStatus } from '@/types';

interface TaskCardProps {
  task: ProjectTask;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onClick: (taskId: string) => void;
  onToggleFavorite?: (taskId: string) => void;
  onChangeStatus?: (taskId: string, status: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  isFavorite?: boolean;
  isDragging?: boolean;
  className?: string;
}

/* ─── Status indicator ─── */
const statusIndicator: Record<TaskStatus, { icon: React.ElementType; color: string }> = {
  BACKLOG: { icon: Circle, color: 'text-neutral-300 dark:text-neutral-600' },
  TODO: { icon: Circle, color: 'text-blue-400 dark:text-blue-500' },
  IN_PROGRESS: { icon: CircleDot, color: 'text-amber-500 dark:text-amber-400' },
  IN_REVIEW: { icon: CircleDot, color: 'text-purple-500 dark:text-purple-400' },
  DONE: { icon: CircleCheck, color: 'text-green-500 dark:text-green-400' },
  CANCELLED: { icon: CircleX, color: 'text-neutral-300 dark:text-neutral-600' },
};

/* ─── Priority pill ─── */
const priorityPill: Record<TaskPriority, { bg: string; text: string; label: () => string } | null> = {
  LOW: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-500 dark:text-neutral-400', label: () => t('taskBoard.priorityLow') },
  NORMAL: null,
  HIGH: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: () => t('taskBoard.priorityHigh') },
  URGENT: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: () => t('taskBoard.priorityUrgent') },
  CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: () => t('taskBoard.priorityCritical') },
};

const STATUS_MENU_ITEMS: { status: TaskStatus; label: () => string; color: string }[] = [
  { status: 'BACKLOG', label: () => t('taskBoard.columnBacklog'), color: 'text-neutral-400' },
  { status: 'TODO', label: () => t('taskBoard.columnTodo'), color: 'text-blue-500' },
  { status: 'IN_PROGRESS', label: () => t('taskBoard.columnInProgress'), color: 'text-amber-500' },
  { status: 'IN_REVIEW', label: () => t('taskBoard.columnInReview'), color: 'text-purple-500' },
  { status: 'DONE', label: () => t('taskBoard.columnDone'), color: 'text-green-500' },
];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ru-RU';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function isOverdue(task: ProjectTask): boolean {
  return !!(
    task.plannedEndDate &&
    new Date(task.plannedEndDate) < new Date() &&
    task.status !== 'DONE' &&
    task.status !== 'CANCELLED'
  );
}

export const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  onDragStart,
  onClick,
  onToggleFavorite,
  onChangeStatus,
  onDelete,
  isFavorite = false,
  isDragging = false,
  className,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusSubOpen, setStatusSubOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const overdue = isOverdue(task);
  const si = statusIndicator[task.status] ?? statusIndicator.TODO;
  const StatusIcon = si.icon;
  const pp = priorityPill[task.priority];
  const hasProgress = task.progress > 0;
  const progressColor = task.progress === 100
    ? 'bg-green-500'
    : overdue
      ? 'bg-red-400'
      : 'bg-blue-500';

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setStatusSubOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task.id)}
      className={cn(
        'relative bg-white dark:bg-neutral-900 rounded-xl cursor-pointer',
        'border border-neutral-200/80 dark:border-neutral-700/80',
        'hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-600',
        'transition-all duration-150 ease-out',
        'group select-none',
        isDragging && 'opacity-40 rotate-1 scale-[1.02] shadow-xl',
        className,
      )}
    >
      <div className="px-3.5 py-3">
        {/* Row 1: Status icon + Title + Favorite + Menu */}
        <div className="flex gap-2">
          <StatusIcon size={16} className={cn('flex-shrink-0 mt-0.5', si.color)} />
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-[13px] font-semibold leading-snug line-clamp-2',
              task.status === 'DONE'
                ? 'text-neutral-400 dark:text-neutral-500 line-through'
                : task.status === 'CANCELLED'
                  ? 'text-neutral-400 dark:text-neutral-600 line-through'
                  : 'text-neutral-800 dark:text-neutral-100',
            )}>
              {task.title}
            </p>
          </div>

          {/* Favorite star */}
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(task.id); }}
              className={cn(
                'flex-shrink-0 p-0.5 rounded transition-all',
                isFavorite
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-neutral-200 dark:text-neutral-700 hover:text-amber-300 dark:hover:text-amber-500 opacity-0 group-hover:opacity-100',
              )}
              title={isFavorite ? t('taskCard.removeFavorite') : t('taskCard.addFavorite')}
            >
              <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}

          {/* Context menu */}
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setStatusSubOpen(false); }}
              className={cn(
                'p-0.5 rounded transition-all',
                menuOpen
                  ? 'text-neutral-500 dark:text-neutral-400'
                  : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 opacity-0 group-hover:opacity-100',
              )}
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 py-1 w-48 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {onToggleFavorite && (
                  <button
                    onClick={() => { onToggleFavorite(task.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Star size={14} className={isFavorite ? 'text-amber-400' : ''} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? t('taskCard.removeFavorite') : t('taskCard.addFavorite')}
                  </button>
                )}

                {/* Change status */}
                <div className="relative">
                  <button
                    onClick={() => setStatusSubOpen(!statusSubOpen)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <ArrowRight size={14} />
                    {t('taskCard.changeStatus')}
                  </button>

                  {statusSubOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl py-1 w-44 animate-fade-in">
                      {STATUS_MENU_ITEMS.filter((item) => item.status !== task.status).map((item) => (
                        <button
                          key={item.status}
                          onClick={() => {
                            onChangeStatus?.(task.id, item.status);
                            setMenuOpen(false);
                            setStatusSubOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Circle size={10} className={item.color} fill="currentColor" />
                          {item.label()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {onDelete && (
                  <>
                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                    <button
                      onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                      {t('common.delete')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Badges (priority, date, project) */}
        {(pp || task.plannedEndDate || task.projectName) && (
          <div className="flex items-center flex-wrap gap-1.5 mt-2.5 ml-6">
            {pp && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                pp.bg, pp.text,
              )}>
                {pp.label()}
              </span>
            )}

            {task.plannedEndDate && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                overdue
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
              )}>
                <Calendar size={10} />
                {formatShortDate(task.plannedEndDate)}
              </span>
            )}

            {task.projectName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 truncate max-w-[130px]">
                {task.projectName}
              </span>
            )}
          </div>
        )}

        {/* Row 3: Progress bar + subtasks + assignee */}
        {(hasProgress || task.subtaskCount > 0 || task.assigneeName) && (
          <div className="mt-3 ml-6">
            {/* Progress bar */}
            {hasProgress && (
              <div className="mb-2">
                <div className="w-full h-[4px] bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Subtasks + Assignee row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task.subtaskCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                    <CheckSquare size={11} />
                    {task.subtaskCount}
                  </span>
                )}
              </div>
              {task.assigneeName && (
                <AssigneeAvatar name={task.assigneeName} size="xs" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
TaskCard.displayName = 'TaskCard';
