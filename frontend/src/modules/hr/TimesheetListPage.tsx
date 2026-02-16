import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Clock, Calendar, TrendingUp, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  timesheetStatusColorMap,
  timesheetStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Timesheet } from '@/types';

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

const TimesheetListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: timesheetData, isLoading } = useQuery({
    queryKey: ['timesheets'],
    queryFn: () => hrApi.getTimesheets(),
  });

  const timesheets = timesheetData?.content ?? [];

  const filteredTimesheets = useMemo(() => {
    let filtered = timesheets ?? [];

    if (activeTab !== 'all') {
      filtered = filtered.filter((t) => t.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.employeeName.toLowerCase().includes(lower) ||
          t.projectName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [timesheets, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: (timesheets ?? []).length,
    draft: (timesheets ?? []).filter((t) => t.status === 'DRAFT').length,
    submitted: (timesheets ?? []).filter((t) => t.status === 'SUBMITTED').length,
    approved: (timesheets ?? []).filter((t) => t.status === 'APPROVED').length,
    rejected: (timesheets ?? []).filter((t) => t.status === 'REJECTED').length,
  }), [timesheets]);

  const totalHours = useMemo(() => (timesheets ?? []).reduce((s, t) => s + t.hoursWorked, 0), [timesheets]);
  const totalOvertime = useMemo(() => (timesheets ?? []).reduce((s, t) => s + t.overtimeHours, 0), [timesheets]);

  const columns = useMemo<ColumnDef<Timesheet, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: 'Сотрудник',
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: 'Проект',
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'workDate',
        header: 'Дата',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'hoursWorked',
        header: 'Часы',
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block font-medium">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'overtimeHours',
        header: 'Переработка',
        size: 110,
        cell: ({ getValue }) => {
          const hours = getValue<number>();
          return (
            <span className={cn(
              'tabular-nums text-center block',
              hours > 0 ? 'text-warning-600 font-medium' : 'text-neutral-400',
            )}>
              {hours > 0 ? `+${hours}` : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={timesheetStatusColorMap}
            label={timesheetStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Табель учёта рабочего времени"
        subtitle={`${(timesheets ?? []).length} записей`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Персонал' },
          { label: 'Табель' },
        ]}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'DRAFT', label: 'Черновик', count: tabCounts.draft },
          { id: 'SUBMITTED', label: 'Подан', count: tabCounts.submitted },
          { id: 'APPROVED', label: 'Утверждён', count: tabCounts.approved },
          { id: 'REJECTED', label: 'Отклонён', count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Weekly summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<Clock size={18} />} label="Всего часов" value={String(totalHours)} />
        <MetricCard icon={<TrendingUp size={18} />} label="Переработка" value={String(totalOvertime)} trend={totalOvertime > 0 ? { direction: 'up', value: `${((totalOvertime / totalHours) * 100).toFixed(1)}%` } : undefined} />
        <MetricCard icon={<Calendar size={18} />} label="Записей" value={String(timesheets.length)} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по сотруднику, проекту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Timesheet>
        data={filteredTimesheets}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет записей"
        emptyDescription="Данные табеля отсутствуют"
      />
    </div>
  );
};

export default TimesheetListPage;
