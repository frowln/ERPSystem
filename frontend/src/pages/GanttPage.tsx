import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid,
  List,
  BarChart3,
  CalendarDays,
  ZoomIn,
  ZoomOut,
  Diamond,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { useTaskBoardStore, type ViewMode } from '@/stores/taskBoardStore';
import { tasksApi, type GanttTask } from '@/api/tasks';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

type ZoomLevel = 'day' | 'week' | 'month';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

function formatHeaderDate(date: Date, zoom: ZoomLevel): string {
  const month = t(`gantt.monthsShort.${monthKeys[date.getMonth()]}`);
  if (zoom === 'day') return `${date.getDate()}`;
  if (zoom === 'week') return `${date.getDate()} ${month}`;
  return `${month} ${date.getFullYear()}`;
}

const GanttPage: React.FC = () => {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useTaskBoardStore();
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const scrollRef = useRef<HTMLDivElement>(null);

  const viewModeIcons: Record<ViewMode, { icon: React.ReactNode; label: string }> = useMemo(() => ({
    board: { icon: <LayoutGrid size={16} />, label: t('taskBoard.viewBoard') },
    list: { icon: <List size={16} />, label: t('taskBoard.viewList') },
    gantt: { icon: <BarChart3 size={16} />, label: t('taskBoard.viewGantt') },
    calendar: { icon: <CalendarDays size={16} />, label: t('taskBoard.viewCalendar') },
  }), []);

  const { data: ganttData } = useQuery({
    queryKey: ['gantt'],
    queryFn: () => tasksApi.getGanttData(),
  });

  const tasks = ganttData ?? [];

  // Calculate date range
  const { rangeStart, columnWidth, columns } = useMemo(() => {
    let minDate = new Date('2026-01-01');
    let maxDate = new Date('2026-04-01');

    for (const t of tasks) {
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }

    // Add padding
    const padStart = addDays(minDate, -7);
    const padEnd = addDays(maxDate, 14);
    const totalDays = daysBetween(padStart, padEnd);

    let colWidth: number;
    let cols: { date: Date; label: string }[] = [];

    if (zoom === 'day') {
      colWidth = 30;
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(padStart, i);
        cols.push({ date: d, label: formatHeaderDate(d, zoom) });
      }
    } else if (zoom === 'week') {
      colWidth = 80;
      for (let i = 0; i < totalDays; i += 7) {
        const d = addDays(padStart, i);
        cols.push({ date: d, label: formatHeaderDate(d, zoom) });
      }
    } else {
      colWidth = 120;
      const monthSet = new Set<string>();
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(padStart, i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthSet.has(key)) {
          monthSet.add(key);
          cols.push({ date: new Date(d.getFullYear(), d.getMonth(), 1), label: formatHeaderDate(d, zoom) });
        }
      }
    }

    return { rangeStart: padStart, rangeEnd: padEnd, totalDays, columnWidth: colWidth, columns: cols };
  }, [tasks, zoom]);

  // Calculate position for a task bar
  const getBarStyle = useCallback(
    (task: GanttTask) => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      const startOffset = daysBetween(rangeStart, start);
      const duration = Math.max(daysBetween(start, end), 1);

      const pixelsPerDay = zoom === 'day' ? 30 : zoom === 'week' ? (80 / 7) : (120 / 30);
      const left = startOffset * pixelsPerDay;
      const width = duration * pixelsPerDay;

      return { left: Math.max(left, 0), width: Math.max(width, 8) };
    },
    [rangeStart, zoom],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      if (mode === 'board') navigate('/tasks');
      else if (mode === 'list') navigate('/tasks/list');
    },
    [setViewMode, navigate],
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => (z === 'month' ? 'week' : z === 'week' ? 'day' : 'day'));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => (z === 'day' ? 'week' : z === 'week' ? 'month' : 'month'));
  }, []);

  const totalWidth = columns.length * columnWidth;
  const rowHeight = 40;

  // Today line
  const today = new Date();
  const todayOffset = daysBetween(rangeStart, today);
  const pixelsPerDay = zoom === 'day' ? 30 : zoom === 'week' ? (80 / 7) : (120 / 30);
  const todayLeft = todayOffset * pixelsPerDay;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('gantt.title')}
        subtitle={t('gantt.subtitle', { count: String(tasks.length) })}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('taskBoard.title'), href: '/tasks' },
          { label: t('taskBoard.viewGantt') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* View mode switch */}
            <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
              {(Object.keys(viewModeIcons) as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === mode
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {viewModeIcons[mode].icon}
                  <span className="hidden xl:inline">{viewModeIcons[mode].label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
              <button
                onClick={zoomOut}
                disabled={zoom === 'month'}
                className="p-1.5 text-neutral-500 hover:text-neutral-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={t('gantt.zoomOut')}
              >
                <ZoomOut size={15} />
              </button>
              <span className="px-2 text-xs font-medium text-neutral-600 min-w-[50px] text-center">
                {zoom === 'day' ? t('gantt.zoomDay') : zoom === 'week' ? t('gantt.zoomWeek') : t('gantt.zoomMonth')}
              </span>
              <button
                onClick={zoomIn}
                disabled={zoom === 'day'}
                className="p-1.5 text-neutral-500 hover:text-neutral-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={t('gantt.zoomIn')}
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>
        }
      />

      {/* Gantt chart */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex">
          {/* Task list (left side) */}
          <div className="w-[300px] flex-shrink-0 border-r border-neutral-200">
            {/* Header */}
            <div className="h-10 bg-neutral-50 border-b border-neutral-200 flex items-center px-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('gantt.taskColumn')}
              </span>
            </div>
            {/* Task rows */}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 px-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                style={{ height: rowHeight }}
              >
                {task.isMilestone && (
                  <Diamond size={12} className="text-purple-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs truncate',
                      task.isMilestone ? 'font-semibold text-purple-700' : 'text-neutral-700',
                    )}
                  >
                    {task.title}
                  </p>
                </div>
                {task.assigneeName && (
                  <AssigneeAvatar name={task.assigneeName} size="xs" />
                )}
              </div>
            ))}
          </div>

          {/* Timeline (right side) */}
          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ minWidth: totalWidth }}>
              {/* Timeline header */}
              <div className="h-10 bg-neutral-50 border-b border-neutral-200 flex">
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center text-[10px] font-medium text-neutral-500 border-r border-neutral-100 flex-shrink-0"
                    style={{ width: columnWidth }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Task bars */}
              <div className="relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {columns.map((_, i) => (
                    <div
                      key={i}
                      className="border-r border-neutral-50 flex-shrink-0"
                      style={{ width: columnWidth, height: tasks.length * rowHeight }}
                    />
                  ))}
                </div>

                {/* Today line */}
                {todayLeft > 0 && todayLeft < totalWidth && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400 z-10 pointer-events-none"
                    style={{ left: todayLeft, height: tasks.length * rowHeight }}
                  >
                    <div className="absolute -top-0 -translate-x-1/2 bg-red-500 text-white text-[8px] px-1 rounded-b font-bold">
                      {t('gantt.today')}
                    </div>
                  </div>
                )}

                {/* Task bars */}
                {tasks.map((task) => {
                  const { left, width } = getBarStyle(task);

                  if (task.isMilestone) {
                    return (
                      <div
                        key={task.id}
                        className="relative flex items-center"
                        style={{ height: rowHeight }}
                      >
                        <div
                          className="absolute flex items-center justify-center"
                          style={{ left: left - 8 }}
                        >
                          <div className="w-4 h-4 bg-purple-500 rotate-45 rounded-sm shadow-sm" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={task.id}
                      className="relative flex items-center"
                      style={{ height: rowHeight }}
                    >
                      <div
                        className="absolute h-6 rounded group cursor-pointer hover:shadow-md transition-shadow"
                        style={{
                          left,
                          width: Math.max(width, 20),
                          backgroundColor: task.color ?? '#3b82f6',
                          opacity: 0.85,
                        }}
                        title={`${task.title} (${task.progress}%)`}
                      >
                        {/* Progress fill */}
                        <div
                          className="h-full rounded opacity-30 bg-white"
                          style={{ width: `${100 - task.progress}%`, marginLeft: `${task.progress}%` }}
                        />
                        {/* Label */}
                        {width > 60 && (
                          <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate">
                            {task.progress > 0 && `${task.progress}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Dependency arrows (simplified) */}
                <svg
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ width: totalWidth, height: tasks.length * rowHeight }}
                >
                  {tasks.map((task) =>
                    task.dependencies.map((depId) => {
                      const depIndex = tasks.findIndex((t) => t.id === depId);
                      if (depIndex === -1) return null;
                      const depTask = tasks[depIndex];
                      if (!depTask) return null;
                      const fromBar = getBarStyle(depTask);
                      const toBar = getBarStyle(task);
                      const taskIndex = tasks.indexOf(task);

                      const fromX = fromBar.left + fromBar.width;
                      const fromY = depIndex * rowHeight + rowHeight / 2;
                      const toX = toBar.left;
                      const toY = taskIndex * rowHeight + rowHeight / 2;
                      const midX = (fromX + toX) / 2;

                      return (
                        <g key={`${depId}-${task.id}`}>
                          <path
                            d={`M${fromX},${fromY} C${midX},${fromY} ${midX},${toY} ${toX},${toY}`}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                          />
                          {/* Arrow head */}
                          <polygon
                            points={`${toX},${toY} ${toX - 5},${toY - 3} ${toX - 5},${toY + 3}`}
                            fill="#94a3b8"
                          />
                        </g>
                      );
                    }),
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500 opacity-85" /> {t('gantt.legendInProgress')}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500 opacity-85" /> {t('gantt.legendCompleted')}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500 opacity-85" /> {t('gantt.legendWarning')}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500 opacity-85" /> {t('gantt.legendCritical')}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-purple-500 rotate-45 rounded-sm" /> {t('gantt.legendMilestone')}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-px h-3 bg-red-400" /> {t('gantt.legendToday')}
        </div>
      </div>
    </div>
  );
};

export default GanttPage;
