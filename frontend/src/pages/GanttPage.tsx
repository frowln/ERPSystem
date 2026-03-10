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
  AlertTriangle,
  Search,
  FolderKanban,
  User,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { useTaskBoardStore, type ViewMode } from '@/stores/taskBoardStore';
import { useProjectOptions, useUserOptions } from '@/hooks/useSelectOptions';
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

const GanttPage: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useTaskBoardStore();
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filters (local state for Gantt)
  const [filterProject, setFilterProject] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { options: projectOptionsRaw } = useProjectOptions();
  const { options: userOptionsRaw } = useUserOptions();

  const viewModeIcons: Record<ViewMode, { icon: React.ReactNode; label: string }> = useMemo(() => ({
    board: { icon: <LayoutGrid size={16} />, label: t('taskBoard.viewBoard') },
    list: { icon: <List size={16} />, label: t('taskBoard.viewList') },
    gantt: { icon: <BarChart3 size={16} />, label: t('taskBoard.viewGantt') },
    calendar: { icon: <CalendarDays size={16} />, label: t('taskBoard.viewCalendar') },
    my: { icon: <List size={16} />, label: t('taskBoard.viewMy') },
  }), []);

  const { data: ganttData, isLoading, isError } = useQuery({
    queryKey: ['gantt', filterProject],
    queryFn: () => tasksApi.getGanttData(filterProject || undefined),
  });

  const rawTasks = ganttData ?? [];

  // Apply client-side filters
  const tasks = useMemo(() => {
    let result = rawTasks;
    if (filterAssignee) {
      result = result.filter((task) => task.assigneeName === filterAssignee);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((task) =>
        task.title.toLowerCase().includes(lower) ||
        task.code.toLowerCase().includes(lower) ||
        task.assigneeName?.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [rawTasks, filterAssignee, searchQuery]);

  // Calculate date range
  const { rangeStart, columnWidth, columns } = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), now.getMonth(), 1);
    let maxDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);

    for (const task of tasks) {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }

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

  const today = new Date();
  const todayOffset = daysBetween(rangeStart, today);
  const pixelsPerDay = zoom === 'day' ? 30 : zoom === 'week' ? (80 / 7) : (120 / 30);
  const todayLeft = todayOffset * pixelsPerDay;

  // Unique assignees for filter
  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const task of rawTasks) {
      if (task.assigneeName) names.add(task.assigneeName);
    }
    return [...names].sort();
  }, [rawTasks]);

  return (
    <div className={cn(!embedded && 'animate-fade-in')}>
      {!embedded && (
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
      )}

      {/* ─── Toolbar when embedded: zoom + filters ─── */}
      {embedded && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            <button
              onClick={zoomOut}
              disabled={zoom === 'month'}
              className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t('gantt.zoomOut')}
            >
              <ZoomOut size={15} />
            </button>
            <span className="px-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 min-w-[50px] text-center">
              {zoom === 'day' ? t('gantt.zoomDay') : zoom === 'week' ? t('gantt.zoomWeek') : t('gantt.zoomMonth')}
            </span>
            <button
              onClick={zoomIn}
              disabled={zoom === 'day'}
              className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t('gantt.zoomIn')}
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Search */}
          <div className="relative w-48">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder={t('taskBoard.searchTasks')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:focus:ring-primary-700 transition-colors"
            />
          </div>

          {/* Project filter */}
          <div className="flex items-center gap-1.5">
            <FolderKanban size={13} className="text-neutral-400" />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:focus:ring-primary-700 transition-colors"
            >
              <option value="">{t('taskBoard.allProjects')}</option>
              {projectOptionsRaw.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-1.5">
            <User size={13} className="text-neutral-400" />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-primary-300 dark:focus:ring-primary-700 transition-colors"
            >
              <option value="">{t('taskBoard.allAssignees')}</option>
              {assigneeOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Tasks count */}
          <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">
            {t('gantt.subtitle', { count: String(tasks.length) })}
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-16 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-neutral-500">{t('gantt.loading')}</p>
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-16 text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-400 mb-4" />
          <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {t('gantt.errorTitle')}
          </p>
          <p className="text-sm text-neutral-400">
            {t('gantt.errorDescription')}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && tasks.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-16 text-center">
          <BarChart3 size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {t('gantt.emptyTitle')}
          </p>
          <p className="text-sm text-neutral-400">
            {t('gantt.emptyDescription')}
          </p>
        </div>
      )}

      {/* Gantt chart */}
      {!isLoading && !isError && tasks.length > 0 && (
        <>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="flex">
              {/* Task list (left side) */}
              <div className="w-[300px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700">
                {/* Header */}
                <div className="h-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-3">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('gantt.taskColumn')}
                  </span>
                </div>
                {/* Task rows */}
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 px-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                    style={{ height: rowHeight }}
                  >
                    {task.isMilestone && (
                      <Diamond size={12} className="text-purple-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs truncate',
                          task.isMilestone ? 'font-semibold text-purple-700 dark:text-purple-400' : 'text-neutral-700 dark:text-neutral-300',
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
                  <div className="h-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex">
                    {columns.map((col, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center text-[10px] font-medium text-neutral-500 dark:text-neutral-400 border-r border-neutral-100 dark:border-neutral-800 flex-shrink-0"
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
                          className="border-r border-neutral-50 dark:border-neutral-800/50 flex-shrink-0"
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

                    {/* Dependency arrows */}
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
          <div className="flex items-center gap-6 mt-4 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
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
        </>
      )}
    </div>
  );
};

export default GanttPage;
