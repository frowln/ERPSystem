import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, CalendarDays, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { reportingCalendarApi } from '@/api/reportingCalendar';
import { formatDate, formatMoney } from '@/lib/format';
import type { ReportingDeadline, DeadlineStatus, ReportingFrequency } from './types';
import type { PaginatedResponse } from '@/types';
import { t } from '@/i18n';

const deadlineStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  upcoming: 'blue',
  due_today: 'orange',
  overdue: 'red',
  submitted: 'cyan',
  accepted: 'green',
  rejected: 'red',
};

const getDeadlineStatusLabels = (): Record<string, string> => ({
  upcoming: t('regulatory.deadlineStatusUpcoming'),
  due_today: t('regulatory.deadlineStatusDueToday'),
  overdue: t('regulatory.deadlineStatusOverdue'),
  submitted: t('regulatory.deadlineStatusSubmitted'),
  accepted: t('regulatory.deadlineStatusAccepted'),
  rejected: t('regulatory.deadlineStatusRejected'),
});

const frequencyColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  daily: 'cyan',
  weekly: 'blue',
  monthly: 'green',
  quarterly: 'purple',
  annually: 'orange',
  one_time: 'gray',
};

const getFrequencyLabels = (): Record<string, string> => ({
  daily: t('regulatory.freqDaily'),
  weekly: t('regulatory.freqWeekly'),
  monthly: t('regulatory.freqMonthly'),
  quarterly: t('regulatory.freqQuarterly'),
  annually: t('regulatory.freqAnnually'),
  one_time: t('regulatory.freqOneTime'),
});

const getChannelLabels = (): Record<string, string> => ({
  portal: t('regulatory.channelPortal'),
  email: t('regulatory.channelEmail'),
  paper: t('regulatory.channelPaper'),
  edo: t('regulatory.channelEdo'),
  api: t('regulatory.channelApi'),
});

type TabId = 'all' | 'UPCOMING' | 'OVERDUE' | 'SUBMITTED' | 'ACCEPTED';

const getFrequencyFilterOptions = () => [
  { value: '', label: t('regulatory.freqFilterAll') },
  { value: 'DAILY', label: t('regulatory.freqDaily') },
  { value: 'WEEKLY', label: t('regulatory.freqWeekly') },
  { value: 'MONTHLY', label: t('regulatory.freqMonthly') },
  { value: 'QUARTERLY', label: t('regulatory.freqQuarterly') },
  { value: 'ANNUALLY', label: t('regulatory.freqAnnually') },
  { value: 'ONE_TIME', label: t('regulatory.freqOneTime') },
];


const ReportingCalendarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<ReportingDeadline>>({
    queryKey: ['reporting-deadlines'],
    queryFn: () => reportingCalendarApi.getDeadlines(),
  });

  const deadlines = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = deadlines;
    if (activeTab !== 'all') result = result.filter((d) => d.status === activeTab);
    if (frequencyFilter) result = result.filter((d) => d.frequency === frequencyFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          d.regulatoryBody.toLowerCase().includes(lower) ||
          d.responsibleName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [deadlines, activeTab, frequencyFilter, search]);

  const tabCounts = useMemo(() => ({
    all: deadlines.length,
    upcoming: deadlines.filter((d) => d.status === 'UPCOMING' || d.status === 'DUE_TODAY').length,
    overdue: deadlines.filter((d) => d.status === 'OVERDUE').length,
    submitted: deadlines.filter((d) => d.status === 'SUBMITTED').length,
    accepted: deadlines.filter((d) => d.status === 'ACCEPTED').length,
  }), [deadlines]);

  const metrics = useMemo(() => {
    const overdue = deadlines.filter((d) => d.status === 'OVERDUE').length;
    const dueToday = deadlines.filter((d) => d.status === 'DUE_TODAY').length;
    const totalPenalty = deadlines.filter((d) => d.status === 'OVERDUE' && d.penalty).reduce((s, d) => s + (d.penalty ?? 0), 0);
    return { total: deadlines.length, overdue, dueToday, totalPenalty };
  }, [deadlines]);

  const columns = useMemo<ColumnDef<ReportingDeadline, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('regulatory.colReport'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.reportType} | {row.original.regulatoryBody}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('regulatory.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={deadlineStatusColorMap}
            label={getDeadlineStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'frequency',
        header: t('regulatory.colFrequency'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={frequencyColorMap}
            label={getFrequencyLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('regulatory.colDueDate'),
        size: 120,
        cell: ({ row }) => {
          const val = row.original.dueDate;
          const isOverdue = row.original.status === 'OVERDUE';
          const isDueToday = row.original.status === 'DUE_TODAY';
          return (
            <span className={`tabular-nums ${isOverdue ? 'text-danger-600 font-semibold' : isDueToday ? 'text-warning-600 font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {formatDate(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'responsibleName',
        header: t('regulatory.colResponsible'),
        size: 150,
        cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'submissionChannel',
        header: t('regulatory.colChannel'),
        size: 100,
        cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400 text-xs">{getChannelLabels()[getValue<string>()] ?? getValue<string>()}</span>,
      },
      {
        accessorKey: 'penalty',
        header: t('regulatory.colFine'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return val ? (
            <span className="tabular-nums text-danger-600 text-xs">{formatMoney(val)}</span>
          ) : (
            <span className="text-neutral-400">---</span>
          );
        },
      },
      {
        accessorKey: 'nextDueDate',
        header: t('regulatory.colNextDueDate'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{formatDate(val)}</span> : <span className="text-neutral-400">---</span>;
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.calendarTitle')}
        subtitle={t('regulatory.calendarSubtitle', { count: String(deadlines.length) })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },
          { label: t('regulatory.breadcrumbCalendar') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>{t('regulatory.btnAddDeadline')}</Button>
        }
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          { id: 'UPCOMING', label: t('regulatory.tabUpcoming'), count: tabCounts.upcoming },
          { id: 'OVERDUE', label: t('regulatory.tabOverdue'), count: tabCounts.overdue },
          { id: 'SUBMITTED', label: t('regulatory.tabSubmitted'), count: tabCounts.submitted },
          { id: 'ACCEPTED', label: t('regulatory.tabAccepted'), count: tabCounts.accepted },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<CalendarDays size={18} />} label={t('regulatory.metricTotalDeadlines')} value={metrics.total} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('regulatory.metricOverdue')}
          value={metrics.overdue}
          trend={{ direction: metrics.overdue > 0 ? 'down' : 'neutral', value: metrics.overdue > 0 ? t('regulatory.trendUrgent') : t('regulatory.trendAllOnTime') }}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('regulatory.metricToday')}
          value={metrics.dueToday}
          trend={{ direction: metrics.dueToday > 0 ? 'down' : 'neutral', value: metrics.dueToday > 0 ? t('regulatory.trendAttention') : t('regulatory.trendNone') }}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('regulatory.metricPotentialFines')}
          value={formatMoney(metrics.totalPenalty)}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('regulatory.searchReportPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getFrequencyFilterOptions()} value={frequencyFilter} onChange={(e) => setFrequencyFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<ReportingDeadline>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('regulatory.emptyDeadlines')}
        emptyDescription={t('regulatory.emptyDeadlinesDesc')}
      />
    </div>
  );
};

export default ReportingCalendarPage;
