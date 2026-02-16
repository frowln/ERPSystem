import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  X,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface Ks6Entry {
  id: string;
  date: string;
  workType: string;
  unit: string;
  volume: number;
  section: string;
  projectName: string;
  contractor?: string;
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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

// Volume intensity level: higher volumes get deeper green
function volumeIntensity(totalVolume: number): string {
  if (totalVolume === 0) return '';
  if (totalVolume < 50) return 'bg-emerald-50';
  if (totalVolume < 150) return 'bg-emerald-100';
  if (totalVolume < 300) return 'bg-emerald-200/70';
  return 'bg-emerald-300/60';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Ks6CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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
    return ([] as any[]).filter((e) => isSameDay(e.date, selectedDay));
  }, [selectedDay]);

  // Per-day volume summary for intensity
  const dayVolumeMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of ([] as any[])) {
      map[e.date] = (map[e.date] || 0) + e.volume;
    }
    return map;
  }, []);

  // Month total
  const monthTotal = useMemo(() => {
    return ([] as any[])
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .length;
  }, [year, month]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Журнал КС-6 - Календарь"
        subtitle="Ежедневный учёт выполненных работ по форме КС-6"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'ПТО', href: '/pto/documents' },
          { label: 'Журнал КС-6' },
        ]}
      />

      {/* Legend & stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 text-xs text-neutral-600">
          <span className="font-medium">Интенсивность работ:</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-50 border border-neutral-200 dark:border-neutral-700" /> Низкая</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-100 border border-neutral-200 dark:border-neutral-700" /> Средняя</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-200/70 border border-neutral-200 dark:border-neutral-700" /> Высокая</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-300/60 border border-neutral-200 dark:border-neutral-700" /> Макс.</span>
        </div>
        <div className="text-sm text-neutral-600">
          Записей за месяц: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{monthTotal}</span>
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
                  {MONTHS_RU[month]} {year}
                </h2>
                <button onClick={() => navigateMonth(1)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-neutral-100">
              {DAYS_RU.map((day) => (
                <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((cell, idx) => {
                const dateKey = `${cell.date.getFullYear()}-${pad(cell.date.getMonth() + 1)}-${pad(cell.date.getDate())}`;
                const dayEntries = ([] as any[]).filter((e) => isSameDay(e.date, cell.date));
                const totalVol = dayVolumeMap[dateKey] || 0;
                const isToday = cell.date.toDateString() === today.toDateString();
                const isSelected = selectedDay && cell.date.toDateString() === selectedDay.toDateString();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(cell.date)}
                    className={cn(
                      'min-h-[100px] border-b border-r border-neutral-100 p-1.5 transition-colors text-left',
                      !cell.current && 'bg-neutral-50 dark:bg-neutral-800/60',
                      cell.current && dayEntries.length > 0 && volumeIntensity(totalVol),
                      isToday && !dayEntries.length && 'bg-primary-50/40',
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
                      <div className="mt-0.5">
                        <p className="text-[11px] font-semibold text-emerald-800">
                          {dayEntries.length} {dayEntries.length === 1 ? 'работа' : dayEntries.length < 5 ? 'работы' : 'работ'}
                        </p>
                        {dayEntries.slice(0, 2).map((e) => (
                          <p key={e.id} className="text-[10px] text-neutral-600 truncate">
                            {e.workType}
                          </p>
                        ))}
                        {dayEntries.length > 2 && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">+{dayEntries.length - 2} ещё</p>
                        )}
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
                  <ClipboardList size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Нет записей на эту дату</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {selectedDayEntries.map((entry) => (
                    <div key={entry.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">{entry.workType}</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-600">
                        <div>
                          <span className="text-neutral-400">Объём: </span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatNumber(entry.volume)} {entry.unit}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400">Участок: </span>
                          <span>{entry.section}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400">Проект: </span>
                          <span className="text-primary-600">{entry.projectName}</span>
                        </div>
                        {entry.contractor && (
                          <div>
                            <span className="text-neutral-400">Подрядчик: </span>
                            <span>{entry.contractor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Day summary */}
                  <div className="px-4 py-3 bg-emerald-50">
                    <p className="text-xs font-semibold text-emerald-800">
                      Итого за день: {selectedDayEntries.length} {selectedDayEntries.length === 1 ? 'работа' : selectedDayEntries.length < 5 ? 'работы' : 'работ'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <ClipboardList size={32} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Выберите день для просмотра записей КС-6</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ks6CalendarPage;
