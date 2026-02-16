import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  X,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { crewTimeApi } from '@/api/crewTime';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ShiftType = 'day' | 'night' | 'overtime';

interface CrewTimeEntry {
  id: string;
  date: string;
  crewName: string;
  crewSize: number;
  shift: ShiftType;
  hours: number;
  foremanName: string;
  projectName: string;
  taskDescription?: string;
}

const MONTHS = [
  t('hr.crewTimeCalendar.monthJan'), t('hr.crewTimeCalendar.monthFeb'), t('hr.crewTimeCalendar.monthMar'),
  t('hr.crewTimeCalendar.monthApr'), t('hr.crewTimeCalendar.monthMay'), t('hr.crewTimeCalendar.monthJun'),
  t('hr.crewTimeCalendar.monthJul'), t('hr.crewTimeCalendar.monthAug'), t('hr.crewTimeCalendar.monthSep'),
  t('hr.crewTimeCalendar.monthOct'), t('hr.crewTimeCalendar.monthNov'), t('hr.crewTimeCalendar.monthDec'),
];

const DAYS = [
  t('hr.crewTimeCalendar.dayMon'), t('hr.crewTimeCalendar.dayTue'), t('hr.crewTimeCalendar.dayWed'),
  t('hr.crewTimeCalendar.dayThu'), t('hr.crewTimeCalendar.dayFri'), t('hr.crewTimeCalendar.daySat'),
  t('hr.crewTimeCalendar.daySun'),
];

const shiftLabels: Record<ShiftType, string> = {
  day: t('hr.crewTimeCalendar.shiftDay'),
  night: t('hr.crewTimeCalendar.shiftNight'),
  overtime: t('hr.crewTimeCalendar.shiftOvertime'),
};

const shiftColors: Record<ShiftType, string> = {
  day: 'bg-blue-100 text-blue-800',
  night: 'bg-purple-100 text-purple-800',
  overtime: 'bg-red-100 text-red-800',
};

const shiftDotColors: Record<ShiftType, string> = {
  day: 'bg-blue-500',
  night: 'bg-purple-500',
  overtime: 'bg-red-500',
};

// Adapter: map API CrewTimeEntry to calendar view format
function mapApiEntriesToCalendarEntries(apiEntries: { id: string; crewName: string; workersCount: number; workDate: string; hoursWorked: number; overtimeHours: number; workDescription: string; location?: string }[]): CrewTimeEntry[] {
  return apiEntries.map((e) => ({
    id: e.id,
    date: e.workDate,
    crewName: e.crewName,
    crewSize: e.workersCount,
    shift: (e.overtimeHours > 0 ? 'overtime' : 'day') as ShiftType,
    hours: e.hoursWorked + e.overtimeHours,
    foremanName: '',
    projectName: e.location ?? '',
    taskDescription: e.workDescription,
  }));
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(dateStr: string, date: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CrewTimeCalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data: apiEntries } = useQuery({
    queryKey: ['crew-time-entries-calendar'],
    queryFn: () => crewTimeApi.getTimeEntries({ size: 1000 }),
  });

  const crewTimeEntries = useMemo(
    () => mapApiEntriesToCalendarEntries(apiEntries?.content ?? []),
    [apiEntries],
  );

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
    setSelectedDay(null);
  }, [year, month]);

  const today = new Date();

  const selectedDayEntries = useMemo(() => {
    if (!selectedDay) return [];
    return crewTimeEntries.filter((e) => isSameDay(e.date, selectedDay));
  }, [selectedDay]);

  // Month summary
  const monthSummary = useMemo(() => {
    const monthEntries = crewTimeEntries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const totalHours = monthEntries.reduce((sum, e) => sum + e.hours * e.crewSize, 0);
    const dayHours = monthEntries.filter((e) => e.shift === 'day').reduce((sum, e) => sum + e.hours * e.crewSize, 0);
    const nightHours = monthEntries.filter((e) => e.shift === 'night').reduce((sum, e) => sum + e.hours * e.crewSize, 0);
    const overtimeHours = monthEntries.filter((e) => e.shift === 'overtime').reduce((sum, e) => sum + e.hours * e.crewSize, 0);
    return { totalHours, dayHours, nightHours, overtimeHours };
  }, [year, month]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.crewTimeCalendar.title')}
        subtitle={t('hr.crewTimeCalendar.subtitle')}
        breadcrumbs={[
          { label: t('hr.crewTimeCalendar.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/employees' },
          { label: t('hr.crewTimeCalendar.breadcrumbCalendar') },
        ]}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{monthSummary.totalHours.toLocaleString('ru-RU')}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('hr.crewTimeCalendar.summaryTotalManHours')}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 border-blue-200 px-4 py-3">
          <p className="text-2xl font-bold text-blue-700">{monthSummary.dayHours.toLocaleString('ru-RU')}</p>
          <p className="text-xs font-medium text-blue-600 mt-0.5">{t('hr.crewTimeCalendar.summaryDayShift')}</p>
        </div>
        <div className="rounded-lg border bg-purple-50 border-purple-200 px-4 py-3">
          <p className="text-2xl font-bold text-purple-700">{monthSummary.nightHours.toLocaleString('ru-RU')}</p>
          <p className="text-xs font-medium text-purple-600 mt-0.5">{t('hr.crewTimeCalendar.summaryNightShift')}</p>
        </div>
        <div className="rounded-lg border bg-red-50 border-red-200 px-4 py-3">
          <p className="text-2xl font-bold text-red-700">{monthSummary.overtimeHours.toLocaleString('ru-RU')}</p>
          <p className="text-xs font-medium text-red-600 mt-0.5">{t('hr.crewTimeCalendar.summaryOvertimeShift')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <button onClick={() => navigateMonth(-1)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 min-w-[180px] text-center">
                  {MONTHS[month]} {year}
                </h2>
                <button onClick={() => navigateMonth(1)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {t('hr.crewTimeCalendar.shiftDay')}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> {t('hr.crewTimeCalendar.shiftNight')}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {t('hr.crewTimeCalendar.shiftOvertime')}</span>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-neutral-100">
              {DAYS.map((day) => (
                <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((cell, idx) => {
                const dayEntries = crewTimeEntries.filter((e) => isSameDay(e.date, cell.date));
                const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
                const totalCrew = new Set(dayEntries.map((e) => e.crewName)).size;
                const shifts = new Set(dayEntries.map((e) => e.shift));
                const isToday = cell.date.toDateString() === today.toDateString();
                const isSelected = selectedDay && cell.date.toDateString() === selectedDay.toDateString();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(cell.date)}
                    className={cn(
                      'min-h-[100px] border-b border-r border-neutral-100 p-1.5 transition-colors text-left',
                      !cell.current && 'bg-neutral-50 dark:bg-neutral-800/60',
                      isToday && 'bg-primary-50/40',
                      isSelected && 'ring-2 ring-inset ring-primary-500',
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
                    {dayEntries.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="text-neutral-400" />
                          <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">{totalHours} {t('hr.crewTimeCalendar.hoursSuffix')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={10} className="text-neutral-400" />
                          <span className="text-[10px] text-neutral-600">{totalCrew} {totalCrew === 1 ? t('hr.crewTimeCalendar.crewSingular') : totalCrew < 5 ? t('hr.crewTimeCalendar.crewFew') : t('hr.crewTimeCalendar.crewMany')}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from(shifts).map((s) => (
                            <span key={s} className={cn('w-2 h-2 rounded-full', shiftDotColors[s])} />
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day detail sidebar */}
        <div>
          {selectedDay ? (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {pad(selectedDay.getDate())}.{pad(selectedDay.getMonth() + 1)}.{selectedDay.getFullYear()}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 rounded transition-colors">
                  <X size={16} />
                </button>
              </div>
              {selectedDayEntries.length === 0 ? (
                <div className="p-6 text-center">
                  <Users size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('hr.crewTimeCalendar.noEntriesForDate')}</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {selectedDayEntries.map((entry) => (
                    <div key={entry.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{entry.crewName}</span>
                        <span className={cn('px-2 py-0.5 text-[11px] font-medium rounded-full', shiftColors[entry.shift])}>
                          {shiftLabels[entry.shift]}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-neutral-400" />
                          <span>{entry.hours} {t('hr.crewTimeCalendar.hoursLabel')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-neutral-400" />
                          <span>{entry.crewSize} {t('hr.crewTimeCalendar.personsSuffix')} | {t('hr.crewTimeCalendar.foremanPrefix')} {entry.foremanName}</span>
                        </div>
                        {entry.taskDescription && (
                          <p className="text-neutral-500 dark:text-neutral-400 mt-1">{entry.taskDescription}</p>
                        )}
                        <p className="text-primary-600 text-[11px]">{entry.projectName}</p>
                      </div>
                    </div>
                  ))}
                  {/* Day summary */}
                  <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">{t('hr.crewTimeCalendar.dayTotal')}:</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {selectedDayEntries.reduce((s, e) => s + e.hours, 0)} {t('hr.crewTimeCalendar.hoursSuffix')} /
                        {' '}{selectedDayEntries.reduce((s, e) => s + e.hours * e.crewSize, 0)} {t('hr.crewTimeCalendar.manHours')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <Users size={32} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('hr.crewTimeCalendar.selectDayPrompt')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrewTimeCalendarPage;
