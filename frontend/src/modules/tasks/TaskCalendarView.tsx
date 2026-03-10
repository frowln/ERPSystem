import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ProjectTask, TaskStatus, TaskPriority } from '@/types';

interface TaskCalendarViewProps {
  tasks: ProjectTask[];
  onTaskClick: (taskId: string) => void;
  onDateClick?: (date: string) => void;
}

const STATUS_BORDER_COLOR: Record<TaskStatus, string> = {
  BACKLOG: 'border-l-neutral-400',
  TODO: 'border-l-blue-500',
  IN_PROGRESS: 'border-l-amber-500',
  IN_REVIEW: 'border-l-purple-500',
  DONE: 'border-l-green-500',
  CANCELLED: 'border-l-red-500',
};

const PRIORITY_DOT_COLOR: Record<TaskPriority, string | null> = {
  LOW: null,
  NORMAL: null,
  HIGH: 'bg-amber-500',
  URGENT: 'bg-red-500',
  CRITICAL: 'bg-red-600',
};

const MAX_VISIBLE_TASKS = 3;

/** Returns all dates a task should appear on (start + end, deduplicated). */
function getTaskDates(task: ProjectTask): string[] {
  const dates: string[] = [];
  if (task.plannedStartDate) dates.push(task.plannedStartDate);
  if (task.plannedEndDate && task.plannedEndDate !== task.plannedStartDate) dates.push(task.plannedEndDate);
  return dates;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0=Mon ... 6=Sun for the first day of the month */
function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ru-RU';
  const formatted = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const WEEKDAY_KEYS = [
  'calendar.dayMon',
  'calendar.dayTue',
  'calendar.dayWed',
  'calendar.dayThu',
  'calendar.dayFri',
  'calendar.daySat',
  'calendar.daySun',
] as const;

function TaskPill({
  task,
  onClick,
}: {
  task: ProjectTask;
  onClick: () => void;
}) {
  const dotColor = PRIORITY_DOT_COLOR[task.priority];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex w-full items-center gap-1 rounded-r border-l-2 px-1.5 py-0.5 text-left text-xs',
        'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700',
        'transition-colors cursor-pointer truncate',
        STATUS_BORDER_COLOR[task.status],
      )}
      title={`${task.code} — ${task.title}`}
    >
      {dotColor && (
        <span
          className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', dotColor)}
          aria-hidden="true"
        />
      )}
      <span className="truncate text-neutral-800 dark:text-neutral-200">
        {task.title}
      </span>
    </button>
  );
}

function TaskCalendarView({ tasks, onTaskClick, onDateClick }: TaskCalendarViewProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, ProjectTask[]>();
    for (const task of tasks) {
      const dates = getTaskDates(task);
      for (const dateStr of dates) {
        const existing = map.get(dateStr);
        if (existing) {
          existing.push(task);
        } else {
          map.set(dateStr, [task]);
        }
      }
    }
    return map;
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    const cells: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      dateKey: string;
    }> = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = prevMonth + 1;
      const y = prevYear;
      cells.push({
        day: d,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateKey: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const m = currentMonth + 1;
      cells.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        dateKey: `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Next month leading days to fill remaining cells (up to 42 = 6 rows)
    const remaining = 42 - cells.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let d = 1; d <= remaining; d++) {
      const m = nextMonth + 1;
      cells.push({
        day: d,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateKey: `${nextYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Trim to 35 if 5 rows suffice
    if (cells.length > 35 && !cells[35]?.isCurrentMonth) {
      const lastCurrentIdx = cells.findLastIndex((c) => c.isCurrentMonth);
      if (lastCurrentIdx < 35) {
        cells.length = 35;
      }
    }

    return cells;
  }, [currentYear, currentMonth]);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }

  const rows = Math.ceil(calendarDays.length / 7);

  return (
    <div className="flex flex-col gap-3">
      {/* Header: month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevMonth}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'text-neutral-600 dark:text-neutral-400',
            )}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="min-w-[180px] text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {formatMonthYear(currentYear, currentMonth)}
          </h3>
          <button
            type="button"
            onClick={goToNextMonth}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'text-neutral-600 dark:text-neutral-400',
            )}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={goToToday}
          className={cn(
            'rounded-lg border px-3 py-1 text-sm font-medium transition-colors',
            'border-neutral-300 text-neutral-700 hover:bg-neutral-50',
            'dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800',
          )}
        >
          {t('calendar.today')}
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
          {WEEKDAY_KEYS.map((key, idx) => (
            <div
              key={key}
              className={cn(
                'py-2 text-center text-xs font-medium uppercase tracking-wide',
                'text-neutral-500 dark:text-neutral-400',
                idx >= 5 && 'text-neutral-400 dark:text-neutral-500',
              )}
            >
              {t(key)}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {Array.from({ length: rows }, (_, rowIdx) => (
          <div
            key={rowIdx}
            className={cn(
              'grid grid-cols-7',
              rowIdx < rows - 1 && 'border-b border-neutral-200 dark:border-neutral-700',
            )}
          >
            {calendarDays.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
              const isToday = cell.dateKey === todayKey;
              const dayTasks = tasksByDate.get(cell.dateKey) ?? [];
              const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
              const overflowCount = dayTasks.length - MAX_VISIBLE_TASKS;

              return (
                <div
                  key={cell.dateKey}
                  className={cn(
                    'relative min-h-[100px] p-1.5 group/cell',
                    'bg-white dark:bg-neutral-900',
                    colIdx < 6 && 'border-r border-neutral-200 dark:border-neutral-700',
                    !cell.isCurrentMonth && 'bg-neutral-50/50 dark:bg-neutral-900/50',
                    onDateClick && 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors',
                  )}
                  onClick={() => onDateClick?.(cell.dateKey)}
                >
                  {/* Day number + add button */}
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                        isToday
                          ? 'bg-blue-600 text-white'
                          : cell.isCurrentMonth
                            ? 'text-neutral-800 dark:text-neutral-200'
                            : 'text-neutral-400 dark:text-neutral-600',
                      )}
                    >
                      {cell.day}
                    </div>
                    {onDateClick && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateClick(cell.dateKey);
                        }}
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded',
                          'text-neutral-300 hover:text-blue-600 hover:bg-blue-100',
                          'dark:text-neutral-600 dark:hover:text-blue-400 dark:hover:bg-blue-900/30',
                          'opacity-0 group-hover/cell:opacity-100 transition-opacity',
                        )}
                        title={t('taskBoard.createTask')}
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>

                  {/* Task pills — visible on md+ */}
                  <div className="hidden flex-col gap-0.5 md:flex">
                    {visibleTasks.map((task) => (
                      <TaskPill
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(task.id)}
                      />
                    ))}
                    {overflowCount > 0 && (
                      <span className="px-1.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                        {(t('taskCalendar.moreItems', { count: overflowCount }) as string) ||
                          `+${overflowCount}`}
                      </span>
                    )}
                  </div>

                  {/* Task dots — visible on small screens */}
                  {dayTasks.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 md:hidden">
                      {dayTasks.slice(0, 5).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task.id);
                          }}
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            task.status === 'DONE'
                              ? 'bg-green-500'
                              : task.status === 'IN_PROGRESS'
                                ? 'bg-amber-500'
                                : task.status === 'IN_REVIEW'
                                  ? 'bg-purple-500'
                                  : task.status === 'TODO'
                                    ? 'bg-blue-500'
                                    : task.status === 'CANCELLED'
                                      ? 'bg-red-500'
                                      : 'bg-neutral-400',
                          )}
                          aria-label={task.title}
                        />
                      ))}
                      {dayTasks.length > 5 && (
                        <span className="text-[8px] leading-none text-neutral-400">
                          +{dayTasks.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskCalendarView;
