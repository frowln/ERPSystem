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

const deadlineStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  upcoming: 'blue',
  due_today: 'orange',
  overdue: 'red',
  submitted: 'cyan',
  accepted: 'green',
  rejected: 'red',
};

const deadlineStatusLabels: Record<string, string> = {
  upcoming: 'Предстоит',
  due_today: 'Сегодня',
  overdue: 'Просрочен',
  submitted: 'Отправлен',
  accepted: 'Принят',
  rejected: 'Отклонён',
};

const frequencyColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  daily: 'cyan',
  weekly: 'blue',
  monthly: 'green',
  quarterly: 'purple',
  annually: 'orange',
  one_time: 'gray',
};

const frequencyLabels: Record<string, string> = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  quarterly: 'Ежеквартально',
  annually: 'Ежегодно',
  one_time: 'Разово',
};

const channelLabels: Record<string, string> = {
  portal: 'Портал',
  email: 'Email',
  paper: 'Бумажный',
  edo: 'ЭДО',
  api: 'API',
};

type TabId = 'all' | 'UPCOMING' | 'OVERDUE' | 'SUBMITTED' | 'ACCEPTED';

const frequencyFilterOptions = [
  { value: '', label: 'Все периодичности' },
  { value: 'DAILY', label: 'Ежедневно' },
  { value: 'WEEKLY', label: 'Еженедельно' },
  { value: 'MONTHLY', label: 'Ежемесячно' },
  { value: 'QUARTERLY', label: 'Ежеквартально' },
  { value: 'ANNUALLY', label: 'Ежегодно' },
  { value: 'ONE_TIME', label: 'Разово' },
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
        header: 'Отчёт',
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
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={deadlineStatusColorMap}
            label={deadlineStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'frequency',
        header: 'Периодичность',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={frequencyColorMap}
            label={frequencyLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Срок сдачи',
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
        header: 'Ответственный',
        size: 150,
        cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'submissionChannel',
        header: 'Канал',
        size: 100,
        cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400 text-xs">{channelLabels[getValue<string>()] ?? getValue<string>()}</span>,
      },
      {
        accessorKey: 'penalty',
        header: 'Штраф',
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
        header: 'Следующий срок',
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
        title="Календарь отчётности"
        subtitle={`${deadlines.length} отчётных сроков`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Регуляторика', href: '/regulatory' },
          { label: 'Календарь отчётности' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>Добавить срок</Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'UPCOMING', label: 'Предстоящие', count: tabCounts.upcoming },
          { id: 'OVERDUE', label: 'Просроченные', count: tabCounts.overdue },
          { id: 'SUBMITTED', label: 'Отправленные', count: tabCounts.submitted },
          { id: 'ACCEPTED', label: 'Принятые', count: tabCounts.accepted },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<CalendarDays size={18} />} label="Всего сроков" value={metrics.total} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Просрочено"
          value={metrics.overdue}
          trend={{ direction: metrics.overdue > 0 ? 'down' : 'neutral', value: metrics.overdue > 0 ? 'Срочно!' : 'Все в срок' }}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Сегодня"
          value={metrics.dueToday}
          trend={{ direction: metrics.dueToday > 0 ? 'down' : 'neutral', value: metrics.dueToday > 0 ? 'Внимание' : 'Нет' }}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label="Возможные штрафы"
          value={formatMoney(metrics.totalPenalty)}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по отчёту, органу, ответственному..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={frequencyFilterOptions} value={frequencyFilter} onChange={(e) => setFrequencyFilter(e.target.value)} className="w-48" />
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
        emptyTitle="Нет отчётных сроков"
        emptyDescription="Добавьте сроки сдачи отчётности для контроля"
      />
    </div>
  );
};

export default ReportingCalendarPage;
