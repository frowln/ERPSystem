import React from 'react';
import { Calendar, MessageSquare, MoreHorizontal, User, Flag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { PriorityBadge } from './PriorityBadge';
import { AssigneeAvatar } from './AssigneeAvatar';
import { formatDate } from '@/lib/format';
import type { ProjectTask, TaskPriority } from '@/types';

interface TaskCardProps {
  task: ProjectTask;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onClick: (taskId: string) => void;
  onAssign?: (taskId: string) => void;
  onChangePriority?: (taskId: string, priority: TaskPriority) => void;
  isDragging?: boolean;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  onDragStart,
  onClick,
  isDragging = false,
  className,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const isOverdue =
    task.plannedEndDate &&
    new Date(task.plannedEndDate) < new Date() &&
    task.status !== 'DONE';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task.id)}
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 cursor-pointer',
        'hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all duration-150',
        'group select-none',
        isDragging && 'opacity-40 rotate-2 shadow-lg',
        className,
      )}
    >
      {/* Header: code + menu */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{task.code}</span>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-0.5 text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-30"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button className="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                <User size={12} /> {t('common.assign')}
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                <Flag size={12} /> {t('projects.priority')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 leading-snug mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="mb-2">
          <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                task.progress === 100 ? 'bg-green-500' : 'bg-primary-500',
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">{task.progress}%</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} showLabel={false} size="sm" />
          {task.plannedEndDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px]',
                isOverdue ? 'text-red-600 font-medium' : 'text-neutral-400',
              )}
            >
              <Calendar size={10} />
              {formatDate(task.plannedEndDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.subtaskCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-neutral-400">
              <MessageSquare size={10} />
              {task.subtaskCount}
            </span>
          )}
          {task.assigneeName && (
            <AssigneeAvatar name={task.assigneeName} size="xs" />
          )}
        </div>
      </div>
    </div>
  );
});
TaskCard.displayName = 'TaskCard';
