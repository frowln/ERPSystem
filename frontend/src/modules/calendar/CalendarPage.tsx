import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  ClipboardList,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { EmptyState } from '@/design-system/components/EmptyState';
import { calendarApi, type CalendarEvent, type CalendarEventType } from '@/api/calendar';
import { tasksApi } from '@/api/tasks';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

type CalendarViewMode = 'month' | 'week';

const getMonths = () => [
  t('calendar.monthJan'), t('calendar.monthFeb'), t('calendar.monthMar'),
  t('calendar.monthApr'), t('calendar.monthMay'), t('calendar.monthJun'),
  t('calendar.monthJul'), t('calendar.monthAug'), t('calendar.monthSep'),
  t('calendar.monthOct'), t('calendar.monthNov'), t('calendar.monthDec'),
];

const getDays = () => [
  t('calendar.dayMon'), t('calendar.dayTue'), t('calendar.dayWed'),
  t('calendar.dayThu'), t('calendar.dayFri'), t('calendar.daySat'), t('calendar.daySun'),
];

const getFullDays = () => [
  t('calendar.fullDayMon'), t('calendar.fullDayTue'), t('calendar.fullDayWed'),
  t('calendar.fullDayThu'), t('calendar.fullDayFri'), t('calendar.fullDaySat'), t('calendar.fullDaySun'),
];

const typeColorMap: Record<string, 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'gray'> = {
  MEETING: 'blue',
  DEADLINE: 'red',
  INSPECTION: 'orange',
  DELIVERY: 'green',
  MILESTONE: 'purple',
  HOLIDAY: 'gray',
  OTHER: 'gray',
};

const TYPE_BG_CLASSES: Record<string, string> = {
  MEETING: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60',
  DEADLINE: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60',
  INSPECTION: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60',
  DELIVERY: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60',
  MILESTONE: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60',
  HOLIDAY: 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600',
  OTHER: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
};

const TYPE_DOT_CLASSES: Record<string, string> = {
  MEETING: 'bg-blue-500',
  DEADLINE: 'bg-red-500',
  INSPECTION: 'bg-orange-500',
  DELIVERY: 'bg-green-500',
  MILESTONE: 'bg-purple-500',
  HOLIDAY: 'bg-neutral-400',
  OTHER: 'bg-neutral-400',
};

const getTypeLabels = (): Record<string, string> => ({
  MEETING: t('calendar.typeMeeting'),
  DEADLINE: t('calendar.typeDeadline'),
  INSPECTION: t('calendar.typeInspection'),
  DELIVERY: t('calendar.typeDelivery'),
  MILESTONE: t('calendar.typeMilestone'),
  HOLIDAY: t('calendar.typeHoliday'),
  OTHER: t('calendar.typeOther'),
});

const ALL_EVENT_TYPES: CalendarEventType[] = ['MEETING', 'DEADLINE', 'INSPECTION', 'DELIVERY', 'MILESTONE', 'HOLIDAY', 'OTHER'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(dateIso: string, date: Date): boolean {
  return dateIso.slice(0, 10) === toDateKey(date);
}

function getEventTimeLabel(event: CalendarEvent): string {
  if (event.isAllDay) return t('calendar.allDay');
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`;
  if (event.startTime) return event.startTime;
  return '\u2014';
}

/** Get Monday of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ru-RU';
  const startStr = weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  const endStr = weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  return `${startStr} \u2014 ${endStr}`;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 — 20:00

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showTaskDeadlines, setShowTaskDeadlines] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [activeTypeFilter, setActiveTypeFilter] = useState<CalendarEventType | null>(null);

  const {
    data: eventData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarApi.getEvents({ page: 0, size: 500 }),
  });

  const { data: myTasksData } = useQuery({
    queryKey: ['my-tasks-calendar'],
    queryFn: () => tasksApi.getMyTasks(),
  });

  const calendarEvents = eventData?.content ?? [];

  const taskDeadlineEvents = useMemo<CalendarEvent[]>(() => {
    if (!showTaskDeadlines || !myTasksData) return [];

    const allTasks = [...myTasksData.assigned];
    if (myTasksData.delegatedByMe) allTasks.push(...myTasksData.delegatedByMe);

    const seen = new Set<string>();
    const unique = allTasks.filter((task) => {
      if (seen.has(task.id)) return false;
      seen.add(task.id);
      return true;
    });

    const now = new Date().toISOString();
    const virtualEvents: CalendarEvent[] = [];

    for (const task of unique) {
      if (task.status === 'DONE' || task.status === 'CANCELLED') continue;

      if (task.plannedEndDate) {
        virtualEvents.push({
          id: `task-deadline-${task.id}`,
          title: `${task.code}: ${task.title}`,
          description: task.projectName
            ? `${t('calendar.taskFromProject')}: ${task.projectName}`
            : undefined,
          eventType: 'DEADLINE',
          status: 'SCHEDULED',
          startDate: task.plannedEndDate,
          endDate: task.plannedEndDate,
          isAllDay: true,
          organizerName: task.assigneeName ?? '',
          isOnline: false,
          recurrenceRule: 'NONE',
          taskId: task.id,
          projectId: task.projectId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return virtualEvents;
  }, [myTasksData, showTaskDeadlines]);

  const allEvents = useMemo(
    () => [...calendarEvents, ...taskDeadlineEvents],
    [calendarEvents, taskDeadlineEvents],
  );

  /** Apply event type filter */
  const events = useMemo(
    () => activeTypeFilter ? allEvents.filter((e) => e.eventType === activeTypeFilter) : allEvents,
    [allEvents, activeTypeFilter],
  );

  /** Summary counters for filter chips */
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allEvents) {
      counts[e.eventType] = (counts[e.eventType] ?? 0) + 1;
    }
    return counts;
  }, [allEvents]);

  function handleEventClick(event: CalendarEvent) {
    if (event.taskId && event.id.startsWith('task-deadline-')) {
      navigate(`/tasks?selected=${event.taskId}`);
    } else {
      setSelectedEvent(event);
    }
  }

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Month view grid ──
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: { day: number; current: boolean; date: Date }[] = [];
    const prevMonthDays = getDaysInMonth(year, month - 1);

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, current: true, date: new Date(year, month, d) });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, current: false, date: new Date(year, month + 1, d) });
    }
    return days;
  }, [year, month]);

  // ── Week view days ──
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // ── Navigation ──
  const navigateMonth = useCallback((dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  }, [year, month]);

  const navigateWeek = useCallback((dir: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  }, []);

  function goToToday() {
    setCurrentDate(new Date());
  }

  // ── Upcoming events ──
  const upcomingEvents = useMemo(() => {
    const todayIso = toDateKey(today);
    return [...events]
      .filter((event) => event.startDate >= todayIso)
      .sort((a, b) => {
        const byDate = a.startDate.localeCompare(b.startDate);
        if (byDate !== 0) return byDate;
        return (a.startTime ?? '').localeCompare(b.startTime ?? '');
      })
      .slice(0, 10);
  }, [events, today]);

  const upcomingColumns = useMemo<ColumnDef<CalendarEvent, unknown>[]>(() => {
    const typeLbls = getTypeLabels();
    return [
      {
        accessorKey: 'startDate',
        header: t('calendar.colDate'),
        size: 100,
        cell: ({ row }) => <span className="tabular-nums">{formatDate(row.original.startDate)}</span>,
      },
      {
        accessorKey: 'title',
        header: t('calendar.colEvent'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.title}</p>
            {row.original.organizerName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.organizerName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'eventType',
        header: t('calendar.colType'),
        size: 120,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.eventType}
            colorMap={typeColorMap}
            label={typeLbls[row.original.eventType] ?? row.original.eventType}
          />
        ),
      },
      {
        accessorKey: 'startTime',
        header: t('calendar.colTime'),
        size: 120,
        cell: ({ row }) => (
          <span className="text-neutral-600 dark:text-neutral-400 tabular-nums">{getEventTimeLabel(row.original)}</span>
        ),
      },
    ];
  }, []);

  // ── Header label ──
  const headerLabel = viewMode === 'month'
    ? `${getMonths()[month]} ${year}`
    : formatWeekRange(weekStart);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
        breadcrumbs={[
          { label: t('calendar.breadcrumbHome'), href: '/' },
          { label: t('calendar.breadcrumbCalendar') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTaskDeadlines((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                showTaskDeadlines
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800',
              )}
            >
              <ClipboardList size={14} />
              {t('calendar.showTaskDeadlines')}
            </button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/calendar/events/new')}>
              {t('calendar.newEvent')}
            </Button>
          </div>
        }
      />

      {isError ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <EmptyState
            variant="ERROR"
            actionLabel={t('calendar.retry')}
            onAction={() => refetch()}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter chips + view mode toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={14} className="text-neutral-400" />
              <button
                type="button"
                onClick={() => setActiveTypeFilter(null)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  !activeTypeFilter
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
                )}
              >
                {t('calendar.filterAll')} ({allEvents.length})
              </button>
              {ALL_EVENT_TYPES.map((type) => {
                const count = typeCounts[type] ?? 0;
                if (count === 0) return null;
                const labels = getTypeLabels();
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveTypeFilter(activeTypeFilter === type ? null : type)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      activeTypeFilter === type
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
                    )}
                  >
                    <span className={cn('inline-block h-2 w-2 rounded-full', TYPE_DOT_CLASSES[type])} />
                    {labels[type]} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'month'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                )}
              >
                <LayoutGrid size={13} />
                {t('calendar.viewMonth')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'week'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                )}
              >
                <List size={13} />
                {t('calendar.viewWeek')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {/* Calendar navigation header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                      aria-label={t('calendar.prevMonth')}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 min-w-[240px] text-center">
                      {headerLabel}
                    </h2>
                    <button
                      onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                      aria-label={t('calendar.nextMonth')}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={goToToday}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      'border-neutral-300 text-neutral-700 hover:bg-neutral-50',
                      'dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800',
                    )}
                  >
                    {t('calendar.today')}
                  </button>
                </div>

                {/* MONTH VIEW */}
                {viewMode === 'month' && (
                  <>
                    <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      {getDays().map((day, idx) => (
                        <div key={day} className={cn(
                          'px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider',
                          idx >= 5 ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-500 dark:text-neutral-400',
                        )}>
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7">
                      {calendarDays.map((cell, idx) => {
                        const dayEvents = events.filter((event) => isSameDay(event.startDate, cell.date));
                        const isToday = cell.date.toDateString() === today.toDateString();
                        const colIdx = idx % 7;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              'min-h-[100px] p-1.5 transition-colors',
                              'border-b border-neutral-100 dark:border-neutral-800',
                              colIdx < 6 && 'border-r border-neutral-100 dark:border-neutral-800',
                              !cell.current && 'bg-neutral-50/60 dark:bg-neutral-800/30',
                              isToday && 'bg-blue-50/50 dark:bg-blue-950/20',
                            )}
                          >
                            <span
                              className={cn(
                                'inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-0.5',
                                isToday
                                  ? 'bg-blue-600 text-white'
                                  : cell.current
                                    ? 'text-neutral-700 dark:text-neutral-300'
                                    : 'text-neutral-400 dark:text-neutral-600',
                              )}
                            >
                              {cell.day}
                            </span>
                            <div className="space-y-0.5">
                              {dayEvents.slice(0, 3).map((event) => (
                                <button
                                  key={event.id}
                                  onClick={() => handleEventClick(event)}
                                  className={cn(
                                    'w-full text-left px-1.5 py-0.5 text-[11px] font-medium rounded truncate transition-colors cursor-pointer',
                                    TYPE_BG_CLASSES[event.eventType] ?? TYPE_BG_CLASSES.OTHER,
                                  )}
                                >
                                  {!event.isAllDay && event.startTime && <span className="mr-1 opacity-75">{event.startTime}</span>}
                                  {event.title}
                                </button>
                              ))}
                              {dayEvents.length > 3 && (
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 pl-1">
                                  +{dayEvents.length - 3} {t('calendar.more')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* WEEK VIEW */}
                {viewMode === 'week' && (
                  <div className="overflow-x-auto">
                    {/* Week day headers */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="border-r border-neutral-200 dark:border-neutral-700" />
                      {weekDays.map((day, idx) => {
                        const isToday = day.toDateString() === today.toDateString();
                        const fullDays = getFullDays();
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'px-2 py-3 text-center',
                              idx < 6 && 'border-r border-neutral-200 dark:border-neutral-700',
                              isToday && 'bg-blue-50/50 dark:bg-blue-950/20',
                            )}
                          >
                            <div className={cn(
                              'text-[10px] font-semibold uppercase tracking-wider mb-1',
                              idx >= 5 ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-500 dark:text-neutral-400',
                            )}>
                              {fullDays[idx]}
                            </div>
                            <div className={cn(
                              'text-lg font-bold',
                              isToday ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-800 dark:text-neutral-200',
                            )}>
                              {day.getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* All-day events row */}
                    {(() => {
                      const hasAllDay = weekDays.some((day) =>
                        events.some((e) => isSameDay(e.startDate, day) && e.isAllDay),
                      );
                      if (!hasAllDay) return null;

                      return (
                        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-200 dark:border-neutral-700">
                          <div className="border-r border-neutral-200 dark:border-neutral-700 px-1 py-2 text-[10px] text-neutral-400 text-right">
                            {t('calendar.allDay')}
                          </div>
                          {weekDays.map((day, idx) => {
                            const dayAllDayEvents = events.filter((e) => isSameDay(e.startDate, day) && e.isAllDay);
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  'p-1 space-y-0.5 min-h-[32px]',
                                  idx < 6 && 'border-r border-neutral-200 dark:border-neutral-700',
                                )}
                              >
                                {dayAllDayEvents.map((event) => (
                                  <button
                                    key={event.id}
                                    onClick={() => handleEventClick(event)}
                                    className={cn(
                                      'w-full text-left px-1.5 py-0.5 text-[11px] font-medium rounded truncate transition-colors cursor-pointer',
                                      TYPE_BG_CLASSES[event.eventType] ?? TYPE_BG_CLASSES.OTHER,
                                    )}
                                  >
                                    {event.title}
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Hourly grid */}
                    <div className="max-h-[600px] overflow-y-auto">
                      {HOURS.map((hour) => (
                        <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-100 dark:border-neutral-800">
                          <div className="border-r border-neutral-200 dark:border-neutral-700 px-1 py-2 text-right text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                            {String(hour).padStart(2, '0')}:00
                          </div>
                          {weekDays.map((day, idx) => {
                            const hourStr = String(hour).padStart(2, '0');
                            const hourEvents = events.filter((e) => {
                              if (!isSameDay(e.startDate, day) || e.isAllDay) return false;
                              const startHour = e.startTime?.slice(0, 2);
                              return startHour === hourStr;
                            });
                            const isToday = day.toDateString() === today.toDateString();

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  'min-h-[44px] p-0.5',
                                  idx < 6 && 'border-r border-neutral-100 dark:border-neutral-800',
                                  isToday && 'bg-blue-50/30 dark:bg-blue-950/10',
                                )}
                              >
                                {hourEvents.map((event) => (
                                  <button
                                    key={event.id}
                                    onClick={() => handleEventClick(event)}
                                    className={cn(
                                      'w-full text-left px-1.5 py-1 text-[11px] font-medium rounded truncate transition-colors cursor-pointer mb-0.5',
                                      TYPE_BG_CLASSES[event.eventType] ?? TYPE_BG_CLASSES.OTHER,
                                    )}
                                  >
                                    <span className="opacity-75 mr-1">{event.startTime}</span>
                                    {event.title}
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming events sidebar */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                {t('calendar.upcomingEvents')}
              </h3>
              <DataTable<CalendarEvent>
                data={upcomingEvents}
                columns={upcomingColumns}
                loading={isLoading}
                onRowClick={(event) => handleEventClick(event)}
                pageSize={10}
                emptyTitle={t('calendar.emptyTitle')}
                emptyDescription={t('calendar.emptyDescription')}
              />

              {/* Legend */}
              <div className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  {t('calendar.legend')}
                </h4>
                <div className="space-y-2">
                  {ALL_EVENT_TYPES.map((type) => {
                    const labels = getTypeLabels();
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', TYPE_DOT_CLASSES[type])} />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">{labels[type]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event detail modal */}
      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge
                status={selectedEvent.eventType}
                colorMap={typeColorMap}
                label={getTypeLabels()[selectedEvent.eventType] ?? selectedEvent.eventType}
              />
              {selectedEvent.organizerName && (
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{selectedEvent.organizerName}</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <CalendarIcon size={14} className="text-neutral-400" />
                <span>{formatDate(selectedEvent.startDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Clock size={14} className="text-neutral-400" />
                <span>{getEventTimeLabel(selectedEvent)}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <MapPin size={14} className="text-neutral-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.isOnline && selectedEvent.meetingUrl && (
                <a
                  href={selectedEvent.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <Users size={14} />
                  {t('calendar.joinMeeting')}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            {selectedEvent.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                {selectedEvent.description}
              </p>
            )}
            {selectedEvent.projectId && (
              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <CalendarIcon size={12} />
                <span>{t('calendar.taskFromProject')}: {selectedEvent.projectId}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;
