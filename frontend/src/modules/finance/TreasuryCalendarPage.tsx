import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { financeApi } from '@/api/finance';
import type { TreasuryPayment } from '@/modules/finance/types';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const treasuryStatusColorMap: Record<string, string> = {
  planned: 'blue',
  approved: 'cyan',
  executed: 'green',
  overdue: 'red',
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday-based
}

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const TreasuryCalendarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['treasury-payments', currentMonth, currentYear],
    queryFn: () => financeApi.getTreasuryPayments(currentMonth + 1, currentYear),
  });

  const paymentsList = payments ?? [];

  const priorityMutation = useMutation({
    mutationFn: ({ paymentId, priority }: { paymentId: string; priority: number }) =>
      financeApi.updatePaymentPriority(paymentId, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury-payments'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, [today]);

  const handleDayClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setDayModalOpen(true);
  }, []);

  const metrics = useMemo(() => {
    const totalIncome = paymentsList
      .filter((p) => p.type === 'income')
      .reduce((s, p) => s + p.amount, 0);
    const totalExpense = paymentsList
      .filter((p) => p.type === 'expense')
      .reduce((s, p) => s + p.amount, 0);
    const balance = totalIncome - totalExpense;
    const overdue = paymentsList.filter((p) => p.status === 'overdue').length;
    return { totalIncome, totalExpense, balance, overdue };
  }, [paymentsList]);

  // Group payments by date
  const paymentsByDate = useMemo(() => {
    const map: Record<string, TreasuryPayment[]> = {};
    for (const p of paymentsList) {
      const dateKey = p.date.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(p);
    }
    return map;
  }, [paymentsList]);

  const selectedDayPayments = useMemo(() => {
    if (!selectedDate) return [];
    return paymentsByDate[selectedDate] ?? [];
  }, [selectedDate, paymentsByDate]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 0; i < remaining; i++) calendarCells.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const statusLabels: Record<string, string> = {
    planned: t('finance.treasuryCalendar.statusPlanned'),
    approved: t('finance.treasuryCalendar.statusApproved'),
    executed: t('finance.treasuryCalendar.statusExecuted'),
    overdue: t('finance.treasuryCalendar.statusOverdue'),
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.treasuryCalendar.title')}
        subtitle={t('finance.treasuryCalendar.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.treasuryCalendar.breadcrumbFinance'), href: '/invoices' },
          { label: t('finance.treasuryCalendar.breadcrumbTreasury') },
        ]}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('finance.treasuryCalendar.totalIncome')}
          value={formatMoney(metrics.totalIncome)}
        />
        <MetricCard
          icon={<TrendingDown size={18} />}
          label={t('finance.treasuryCalendar.totalExpense')}
          value={formatMoney(metrics.totalExpense)}
        />
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('finance.treasuryCalendar.balance')}
          value={formatMoney(metrics.balance)}
          trend={{
            direction: metrics.balance >= 0 ? 'up' : 'down',
            value: formatMoney(Math.abs(metrics.balance)),
          }}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('finance.treasuryCalendar.overduePayments')}
          value={String(metrics.overdue)}
        />
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<ChevronLeft size={16} />}
            onClick={handlePrevMonth}
          >
            {t('finance.treasuryCalendar.prevMonth')}
          </Button>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
              {formatMonthYear(currentYear, currentMonth)}
            </h3>
            <Button variant="outline" size="xs" onClick={handleToday}>
              {t('finance.treasuryCalendar.today')}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconRight={<ChevronRight size={16} />}
            onClick={handleNextMonth}
          >
            {t('finance.treasuryCalendar.nextMonth')}
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Weekday headers */}
          {WEEKDAYS_RU.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700"
            >
              {day}
            </div>
          ))}

          {/* Day cells */}
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[100px] border-b border-r border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20"
                />
              );
            }

            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayPayments = paymentsByDate[dateStr] ?? [];
            const dayIncome = dayPayments
              .filter((p) => p.type === 'income')
              .reduce((s, p) => s + p.amount, 0);
            const dayExpense = dayPayments
              .filter((p) => p.type === 'expense')
              .reduce((s, p) => s + p.amount, 0);
            const isToday = dateStr === todayStr;
            const hasOverdue = dayPayments.some((p) => p.status === 'overdue');

            return (
              <div
                key={dateStr}
                className={cn(
                  'min-h-[100px] border-b border-r border-neutral-100 dark:border-neutral-800 p-2 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  isToday && 'bg-primary-50/50 dark:bg-primary-900/10',
                  hasOverdue && 'bg-danger-50/30 dark:bg-danger-900/10',
                )}
                onClick={() => handleDayClick(dateStr)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isToday
                        ? 'bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                        : 'text-neutral-900 dark:text-neutral-100',
                    )}
                  >
                    {day}
                  </span>
                  {dayPayments.length > 0 && (
                    <span className="text-xs text-neutral-400">{dayPayments.length}</span>
                  )}
                </div>
                {dayIncome > 0 && (
                  <div className="text-xs font-medium text-success-600 truncate">
                    +{formatMoney(dayIncome)}
                  </div>
                )}
                {dayExpense > 0 && (
                  <div className="text-xs font-medium text-danger-600 truncate">
                    -{formatMoney(dayExpense)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      <Modal
        open={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        title={t('finance.treasuryCalendar.dayPayments', {
          date: selectedDate ? formatDate(selectedDate) : '',
        })}
        size="lg"
      >
        {selectedDayPayments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon
              size={40}
              className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3"
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('finance.treasuryCalendar.emptyDay')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayPayments
              .sort((a, b) => a.priority - b.priority)
              .map((payment) => (
                <div
                  key={payment.id}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                    payment.type === 'income'
                      ? 'border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-900/10'
                      : 'border-danger-200 dark:border-danger-800 bg-danger-50/50 dark:bg-danger-900/10',
                  )}
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-xs font-bold text-neutral-400">#{payment.priority}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {payment.counterparty}
                      </span>
                      <StatusBadge
                        status={payment.status}
                        colorMap={treasuryStatusColorMap}
                        label={statusLabels[payment.status] ?? payment.status}
                        size="sm"
                      />
                    </div>
                    {payment.invoiceNumber && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('finance.treasuryCalendar.colInvoice')}: {payment.invoiceNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        payment.type === 'income' ? 'text-success-600' : 'text-danger-600',
                      )}
                    >
                      {payment.type === 'income' ? '+' : '-'}
                      {formatMoney(payment.amount)}
                    </span>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {payment.type === 'income'
                        ? t('finance.treasuryCalendar.income')
                        : t('finance.treasuryCalendar.expense')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TreasuryCalendarPage;
