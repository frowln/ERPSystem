import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { dispatchApi } from '@/api/dispatch';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type DispatchStatus = 'PLANNED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';

interface DispatchOrder {
  id: string;
  number: string;
  destination: string;
  cargo: string;
  weight: string;
  status: DispatchStatus;
  date: string;
  time?: string;
  vehiclePlate?: string;
  driverName?: string;
  projectName?: string;
}

const getMonths = () => [
  t('operations.dispatchCalendar.monthJan'), t('operations.dispatchCalendar.monthFeb'), t('operations.dispatchCalendar.monthMar'),
  t('operations.dispatchCalendar.monthApr'), t('operations.dispatchCalendar.monthMay'), t('operations.dispatchCalendar.monthJun'),
  t('operations.dispatchCalendar.monthJul'), t('operations.dispatchCalendar.monthAug'), t('operations.dispatchCalendar.monthSep'),
  t('operations.dispatchCalendar.monthOct'), t('operations.dispatchCalendar.monthNov'), t('operations.dispatchCalendar.monthDec'),
];

const getDays = () => [
  t('operations.dispatchCalendar.dayMon'), t('operations.dispatchCalendar.dayTue'), t('operations.dispatchCalendar.dayWed'),
  t('operations.dispatchCalendar.dayThu'), t('operations.dispatchCalendar.dayFri'), t('operations.dispatchCalendar.daySat'),
  t('operations.dispatchCalendar.daySun'),
];

const statusColorMap: Record<string, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
  planned: 'blue',
  in_transit: 'yellow',
  delivered: 'green',
  delayed: 'red',
  cancelled: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  planned: t('operations.dispatchCalendar.statusPlanned'),
  in_transit: t('operations.dispatchCalendar.statusInTransit'),
  delivered: t('operations.dispatchCalendar.statusDelivered'),
  delayed: t('operations.dispatchCalendar.statusDelayed'),
  cancelled: t('operations.dispatchCalendar.statusCancelled'),
});

const statusCellColors: Record<DispatchStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  DELIVERED: 'bg-green-100 text-green-800 hover:bg-green-200',
  DELAYED: 'bg-red-100 text-red-800 hover:bg-red-200',
  CANCELLED: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200',
};

// Adapter: map API DispatchOrder to calendar view format
function mapApiOrderToCalendarOrder(apiOrder: {
  id: string;
  number?: string;
  destination?: string;
  cargo?: string;
  status: string;
  scheduledDate?: string;
  pickupDate?: string;
  vehiclePlate?: string;
  driverName?: string;
  projectName?: string;
  [key: string]: unknown;
}): DispatchOrder {
  return {
    id: apiOrder.id,
    number: (apiOrder.number as string) ?? '',
    destination: (apiOrder.destination as string) ?? '',
    cargo: (apiOrder.cargo as string) ?? '',
    weight: '',
    status: apiOrder.status as DispatchStatus,
    date: (apiOrder.scheduledDate as string) ?? (apiOrder.pickupDate as string) ?? '',
    vehiclePlate: apiOrder.vehiclePlate,
    driverName: apiOrder.driverName,
    projectName: apiOrder.projectName,
  };
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

const DispatchCalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data: apiOrders } = useQuery({
    queryKey: ['dispatch-orders-calendar'],
    queryFn: () => dispatchApi.getOrders({ size: 1000 }),
  });

  const dispatchOrders: DispatchOrder[] = useMemo(
    () => (apiOrders?.content ?? []).map((o: any) => mapApiOrderToCalendarOrder(o)),
    [apiOrders],
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

  const selectedDayOrders = useMemo(() => {
    if (!selectedDay) return [];
    return dispatchOrders.filter((o) => isSameDay(o.date, selectedDay));
  }, [selectedDay]);

  // Summary stats
  const monthOrders = useMemo(() => {
    return dispatchOrders.filter((o) => {
      const d = new Date(o.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [year, month]);

  const statusCounts = useMemo(() => {
    const counts: Record<DispatchStatus, number> = { PLANNED: 0, IN_TRANSIT: 0, DELIVERED: 0, DELAYED: 0, CANCELLED: 0 };
    for (const o of monthOrders) counts[o.status as DispatchStatus]++;
    return counts;
  }, [monthOrders]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('operations.dispatchCalendar.title')}
        subtitle={t('operations.dispatchCalendar.subtitle')}
        breadcrumbs={[
          { label: t('operations.dispatchCalendar.breadcrumbHome'), href: '/' },
          { label: t('operations.dispatchCalendar.breadcrumbOperations'), href: '/operations/dashboard' },
          { label: t('operations.dispatchCalendar.breadcrumbCalendar') },
        ]}
      />

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([['PLANNED', t('operations.dispatchCalendar.summaryPlanned'), 'bg-blue-50 text-blue-700 border-blue-200'],
           ['IN_TRANSIT', t('operations.dispatchCalendar.summaryInTransit'), 'bg-yellow-50 text-yellow-700 border-yellow-200'],
           ['DELIVERED', t('operations.dispatchCalendar.summaryDelivered'), 'bg-green-50 text-green-700 border-green-200'],
           ['DELAYED', t('operations.dispatchCalendar.summaryDelayed'), 'bg-red-50 text-red-700 border-red-200'],
        ] as [DispatchStatus, string, string][]).map(([status, label, cls]) => (
          <div key={status} className={cn('rounded-lg border px-4 py-3', cls)}>
            <p className="text-2xl font-bold">{statusCounts[status]}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
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
                  {getMonths()[month]} {year}
                </h2>
                <button onClick={() => navigateMonth(1)} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {t('operations.dispatchCalendar.legendPlanned')}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> {t('operations.dispatchCalendar.legendInTransit')}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {t('operations.dispatchCalendar.legendDelivered')}</span>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-neutral-100">
              {getDays().map((day) => (
                <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((cell, idx) => {
                const dayOrders = dispatchOrders.filter((o) => isSameDay(o.date, cell.date));
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
                    <div className="space-y-0.5">
                      {dayOrders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className={cn(
                            'w-full text-left px-1.5 py-0.5 text-[11px] font-medium rounded truncate',
                            statusCellColors[order.status as DispatchStatus],
                          )}
                        >
                          <Truck size={10} className="inline mr-0.5 -mt-0.5" />
                          {order.cargo}
                        </div>
                      ))}
                      {dayOrders.length > 3 && (
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 pl-1">+{dayOrders.length - 3} {t('operations.dispatchCalendar.more')}</p>
                      )}
                    </div>
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
              {selectedDayOrders.length === 0 ? (
                <div className="p-6 text-center">
                  <Package size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('operations.dispatchCalendar.noDispatches')}</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {selectedDayOrders.map((order) => (
                    <div key={order.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{order.number}</span>
                        <StatusBadge
                          status={order.status}
                          colorMap={statusColorMap}
                          label={getStatusLabels()[order.status]}
                        />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">{order.cargo}</p>
                      <div className="space-y-1 text-xs text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-neutral-400" />
                          <span>{order.destination}</span>
                        </div>
                        {order.time && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-neutral-400" />
                            <span>{order.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Package size={12} className="text-neutral-400" />
                          <span>{order.weight}</span>
                        </div>
                        {order.driverName && (
                          <div className="flex items-center gap-1.5">
                            <Truck size={12} className="text-neutral-400" />
                            <span>{order.driverName} ({order.vehiclePlate})</span>
                          </div>
                        )}
                      </div>
                      {order.projectName && (
                        <p className="text-[11px] text-primary-600 mt-1.5">{order.projectName}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <Truck size={32} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('operations.dispatchCalendar.selectDayPrompt')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatchCalendarPage;
