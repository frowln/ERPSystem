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
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { EmptyState } from '@/design-system/components/EmptyState';
import { calendarApi, type CalendarEvent } from '@/api/calendar';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

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

const typeColorMap: Record<string, 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'gray'> = {
  MEETING: 'blue',
  DEADLINE: 'red',
  INSPECTION: 'orange',
  DELIVERY: 'green',
  MILESTONE: 'purple',
  HOLIDAY: 'gray',
  OTHER: 'gray',
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(dateIso: string, date: Date): boolean {
  const normalized = dateIso.slice(0, 10);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return normalized === `${year}-${month}-${day}`;
}

function getEventTimeLabel(event: CalendarEvent): string {
  if (event.isAllDay) return t('calendar.allDay');
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`;
  if (event.startTime) return event.startTime;
  return '—';
}

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const {
    data: eventData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarApi.getEvents({ page: 0, size: 500 }),
  });

  const events = eventData?.content ?? [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = useMemo(() => {
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
  }, [year, month, daysInMonth, firstDay]);

  const navigateMonth = useCallback((dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  }, [year, month]);

  const today = new Date();

  const upcomingEvents = useMemo(() => {
    const todayIso = today.toISOString().slice(0, 10);
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
        <span className="text-neutral-600 tabular-nums">{getEventTimeLabel(row.original)}</span>
      ),
    },
  ]; }, []);

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
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/calendar/events/new')}>
            {t('calendar.newEvent')}
          </Button>
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    aria-label={t('calendar.prevMonth')}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 min-w-[200px] text-center">
                    {getMonths()[month]} {year}
                  </h2>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    aria-label={t('calendar.nextMonth')}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-neutral-100">
                {getDays().map((day) => (
                  <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((cell, idx) => {
                  const dayEvents = events.filter((event) => isSameDay(event.startDate, cell.date));
                  const isToday = cell.date.toDateString() === today.toDateString();

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'min-h-[92px] border-b border-r border-neutral-100 p-1.5 transition-colors',
                        !cell.current && 'bg-neutral-50 dark:bg-neutral-800/60',
                        isToday && 'bg-primary-50/40',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-0.5',
                          isToday ? 'bg-primary-600 text-white' : cell.current ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400',
                        )}
                      >
                        {cell.day}
                      </span>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={cn(
                              'w-full text-left px-1.5 py-0.5 text-[11px] font-medium rounded truncate transition-colors',
                              event.eventType === 'MEETING' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
                              event.eventType === 'DEADLINE' && 'bg-red-100 text-red-800 hover:bg-red-200',
                              event.eventType === 'INSPECTION' && 'bg-orange-100 text-orange-800 hover:bg-orange-200',
                              event.eventType === 'DELIVERY' && 'bg-green-100 text-green-800 hover:bg-green-200',
                              event.eventType === 'MILESTONE' && 'bg-purple-100 text-purple-800 hover:bg-purple-200',
                              event.eventType === 'HOLIDAY' && 'bg-neutral-200 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300',
                              event.eventType === 'OTHER' && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200',
                            )}
                          >
                            {!event.isAllDay && event.startTime && <span className="mr-1">{event.startTime}</span>}
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 pl-1">+{dayEvents.length - 3} {t('calendar.more')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('calendar.upcomingEvents')}</h3>
            <DataTable<CalendarEvent>
              data={upcomingEvents}
              columns={upcomingColumns}
              loading={isLoading}
              onRowClick={(event) => setSelectedEvent(event)}
              pageSize={10}
              emptyTitle={t('calendar.emptyTitle')}
              emptyDescription={t('calendar.emptyDescription')}
            />
          </div>
        </div>
      )}

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
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{selectedEvent.organizerName}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <CalendarIcon size={14} className="text-neutral-400" />
                <span>{formatDate(selectedEvent.startDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Clock size={14} className="text-neutral-400" />
                <span>{getEventTimeLabel(selectedEvent)}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <MapPin size={14} className="text-neutral-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.isOnline && selectedEvent.meetingUrl && (
                <a
                  href={selectedEvent.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-800"
                >
                  <Users size={14} />
                  {t('calendar.joinMeeting')}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            {selectedEvent.description && (
              <p className="text-sm text-neutral-600 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                {selectedEvent.description}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;
