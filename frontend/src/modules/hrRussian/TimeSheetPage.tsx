import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatNumber } from '@/lib/format';
import { hrRussianApi } from '@/api/hrRussian';
import { t } from '@/i18n';
import type { TimeSheetEntry } from './types';

const timeSheetStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  draft: 'gray',
  submitted: 'yellow',
  approved: 'green',
  rejected: 'red',
};

const getTimeSheetStatusLabels = (): Record<string, string> => ({
  draft: t('hrRussian.timesheet.statusDraft'),
  submitted: t('hrRussian.timesheet.statusSubmitted'),
  approved: t('hrRussian.timesheet.statusApproved'),
  rejected: t('hrRussian.timesheet.statusRejected'),
});

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'APPROVED';

const getMonthOptions = () => [
  { value: '', label: t('hrRussian.timesheet.allPeriods') },
  { value: '2026-02', label: `${t('hrRussian.timesheet.months.february')} 2026` },
  { value: '2026-01', label: `${t('hrRussian.timesheet.months.january')} 2026` },
  { value: '2025-12', label: `${t('hrRussian.timesheet.months.december')} 2025` },
];

const getDepartmentOptions = () => [
  { value: '', label: t('hrRussian.timesheet.allDepartments') },
  { value: 'Строительный отдел', label: t('hrRussian.timesheet.deptConstruction') },
  { value: 'ПТО', label: t('hrRussian.timesheet.deptPto') },
  { value: 'Бухгалтерия', label: t('hrRussian.timesheet.deptAccounting') },
  { value: 'Контроль качества', label: t('hrRussian.timesheet.deptQuality') },
  { value: 'Проектный отдел', label: t('hrRussian.timesheet.deptDesign') },
];

const getMonthNames = (): string[] => [
  '',
  t('hrRussian.timesheet.months.january'),
  t('hrRussian.timesheet.months.february'),
  t('hrRussian.timesheet.months.march'),
  t('hrRussian.timesheet.months.april'),
  t('hrRussian.timesheet.months.may'),
  t('hrRussian.timesheet.months.june'),
  t('hrRussian.timesheet.months.july'),
  t('hrRussian.timesheet.months.august'),
  t('hrRussian.timesheet.months.september'),
  t('hrRussian.timesheet.months.october'),
  t('hrRussian.timesheet.months.november'),
  t('hrRussian.timesheet.months.december'),
];


const TimeSheetPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['hr-russian-timesheets'],
    queryFn: () => hrRussianApi.getTimeSheets({ size: 1000 }),
    select: (resp) =>
      (resp.content ?? []).map((ts): TimeSheetEntry => ({
        id: ts.id,
        employeeId: ts.employeeId,
        employeeName: ts.employeeName,
        department: ts.department,
        month: ts.month,
        status: ts.status as TimeSheetEntry['status'],
        workDays: ts.workDays,
        vacationDays: ts.vacationDays,
        sickDays: ts.sickDays,
        businessTripDays: 0,
        absenceDays: ts.absentDays,
        totalHours: ts.workHours,
        overtimeHours: ts.overtimeHours,
      })),
  });

  const timesheets = data ?? [];

  const filtered = useMemo(() => {
    let result = timesheets;

    if (activeTab === 'DRAFT') {
      result = result.filter((t) => t.status === 'DRAFT');
    } else if (activeTab === 'SUBMITTED') {
      result = result.filter((t) => t.status === 'SUBMITTED');
    } else if (activeTab === 'APPROVED') {
      result = result.filter((t) => t.status === 'APPROVED');
    }

    if (monthFilter) result = result.filter((t) => t.month === monthFilter);
    if (departmentFilter) result = result.filter((t) => t.department === departmentFilter);

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) => t.employeeName.toLowerCase().includes(lower) || t.department.toLowerCase().includes(lower),
      );
    }

    return result;
  }, [timesheets, activeTab, monthFilter, departmentFilter, search]);

  const tabCounts = useMemo(() => ({
    all: timesheets.length,
    draft: timesheets.filter((t) => t.status === 'DRAFT').length,
    submitted: timesheets.filter((t) => t.status === 'SUBMITTED').length,
    approved: timesheets.filter((t) => t.status === 'APPROVED').length,
  }), [timesheets]);

  const metrics = useMemo(() => {
    const totalHours = timesheets.reduce((s, t) => s + t.totalHours, 0);
    const totalOvertime = timesheets.reduce((s, t) => s + t.overtimeHours, 0);
    const totalSickDays = timesheets.reduce((s, t) => s + t.sickDays, 0);
    const pendingApproval = timesheets.filter((t) => t.status === 'SUBMITTED').length;
    return { totalHours, totalOvertime, totalSickDays, pendingApproval };
  }, [timesheets]);

  const columns = useMemo<ColumnDef<TimeSheetEntry, unknown>[]>(() => {
    const statusLabels = getTimeSheetStatusLabels();
    const monthNames = getMonthNames();
    return [
      {
        accessorKey: 'employeeName',
        header: t('hrRussian.timesheet.colEmployee'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.employeeName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.department}</p>
          </div>
        ),
      },
      {
        accessorKey: 'month',
        header: t('hrRussian.timesheet.colPeriod'),
        size: 120,
        cell: ({ getValue }) => {
          const month = getValue<string>();
          const [year, m] = month.split('-');
          return <span className="text-neutral-700 dark:text-neutral-300">{monthNames[parseInt(m)]} {year}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: t('hrRussian.timesheet.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={timeSheetStatusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'workDays',
        header: t('hrRussian.timesheet.colWorkDays'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block font-medium">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'totalHours',
        header: t('hrRussian.timesheet.colTotalHours'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block font-medium">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'overtimeHours',
        header: t('hrRussian.timesheet.colOvertime'),
        size: 110,
        cell: ({ getValue }) => {
          const hours = getValue<number>();
          return (
            <span className={`tabular-nums text-center block font-medium ${hours > 0 ? 'text-warning-600' : 'text-neutral-400'}`}>
              {hours > 0 ? `+${hours}` : '0'}
            </span>
          );
        },
      },
      {
        accessorKey: 'vacationDays',
        header: t('hrRussian.timesheet.colVacation'),
        size: 80,
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return <span className={`tabular-nums text-center block ${days > 0 ? 'text-primary-600 font-medium' : 'text-neutral-400'}`}>{days}</span>;
        },
      },
      {
        accessorKey: 'sickDays',
        header: t('hrRussian.timesheet.colSickLeave'),
        size: 70,
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return <span className={`tabular-nums text-center block ${days > 0 ? 'text-danger-600 font-medium' : 'text-neutral-400'}`}>{days}</span>;
        },
      },
      {
        accessorKey: 'businessTripDays',
        header: t('hrRussian.timesheet.colBusinessTrip'),
        size: 90,
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return <span className={`tabular-nums text-center block ${days > 0 ? 'text-cyan-600 font-medium' : 'text-neutral-400'}`}>{days}</span>;
        },
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hrRussian.timesheet.title')}
        subtitle={t('hrRussian.timesheet.subtitleRecords', { count: String(timesheets.length) })}
        breadcrumbs={[
          { label: t('hrRussian.timesheet.breadcrumbHome'), href: '/' },
          { label: t('hrRussian.timesheet.breadcrumbHr') },
          { label: t('hrRussian.timesheet.breadcrumbTimesheet') },
        ]}
        actions={<Button>{t('hrRussian.timesheet.generateTimesheet')}</Button>}
        tabs={[
          { id: 'all', label: t('hrRussian.timesheet.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('hrRussian.timesheet.tabDrafts'), count: tabCounts.draft },
          { id: 'SUBMITTED', label: t('hrRussian.timesheet.tabSubmitted'), count: tabCounts.submitted },
          { id: 'APPROVED', label: t('hrRussian.timesheet.tabApproved'), count: tabCounts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Clock size={18} />} label={t('hrRussian.timesheet.metricTotalHours')} value={formatNumber(metrics.totalHours)} />
        <MetricCard
          icon={<AlertCircle size={18} />}
          label={t('hrRussian.timesheet.metricOvertime')}
          value={`${metrics.totalOvertime} ${t('hrRussian.timesheet.hoursSuffix')}`}
          trend={{ direction: metrics.totalOvertime > 0 ? 'down' : 'neutral', value: metrics.totalOvertime > 0 ? t('hrRussian.timesheet.trendOvertime') : t('hrRussian.timesheet.trendNone') }}
        />
        <MetricCard icon={<Calendar size={18} />} label={t('hrRussian.timesheet.metricSickDays')} value={metrics.totalSickDays} />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('hrRussian.timesheet.metricPending')}
          value={metrics.pendingApproval}
          trend={{ direction: metrics.pendingApproval > 0 ? 'up' : 'neutral', value: metrics.pendingApproval > 0 ? t('hrRussian.timesheet.trendAwaiting') : t('hrRussian.timesheet.trendNone') }}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('hrRussian.timesheet.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getMonthOptions()}
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={getDepartmentOptions()}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-52"
        />
      </div>

      {/* Table */}
      <DataTable<TimeSheetEntry>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('hrRussian.timesheet.emptyTitle')}
        emptyDescription={t('hrRussian.timesheet.emptyDescription')}
      />
    </div>
  );
};

export default TimeSheetPage;
