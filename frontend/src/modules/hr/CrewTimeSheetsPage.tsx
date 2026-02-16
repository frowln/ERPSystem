import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Clock, Users, FileCheck, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  timesheetStatusColorMap,
  timesheetStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { crewTimeApi } from '@/api/crewTime';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { CrewTimeSheet } from './types';

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

const CrewTimeSheetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crew-timesheets'],
    queryFn: () => crewTimeApi.getTimeSheets(),
  });

  const sheets = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = sheets;
    if (activeTab !== 'all') result = result.filter((s) => s.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (s) => s.number.toLowerCase().includes(lower) || s.crewName.toLowerCase().includes(lower) || s.projectName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [sheets, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: sheets.length,
    draft: sheets.filter((s) => s.status === 'DRAFT').length,
    submitted: sheets.filter((s) => s.status === 'SUBMITTED').length,
    approved: sheets.filter((s) => s.status === 'APPROVED').length,
    rejected: sheets.filter((s) => s.status === 'REJECTED').length,
  }), [sheets]);

  const metrics = useMemo(() => {
    const totalHours = sheets.reduce((s, t) => s + t.totalHours, 0);
    const totalOvertime = sheets.reduce((s, t) => s + t.totalOvertimeHours, 0);
    const totalWorkerDays = sheets.reduce((s, t) => s + t.totalWorkerDays, 0);
    return { total: sheets.length, totalHours, totalOvertime, totalWorkerDays };
  }, [sheets]);

  const columns = useMemo<ColumnDef<CrewTimeSheet, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 140,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'crewName',
        header: t('hr.crewTimeSheets.columnCrew'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.crewName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('hr.crewTimeSheets.foremanPrefix')} {row.original.foremanName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('hr.crewTimeSheets.columnProject'),
        size: 180,
        cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'status',
        header: t('hr.crewTimeSheets.columnStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={timesheetStatusColorMap}
            label={timesheetStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'period',
        header: t('hr.crewTimeSheets.columnPeriod'),
        size: 180,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatDate(row.original.periodStart)} - {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
      {
        accessorKey: 'totalHours',
        header: t('hr.crewTimeSheets.columnHours'),
        size: 80,
        cell: ({ getValue }) => <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'totalOvertimeHours',
        header: t('hr.crewTimeSheets.columnOvertime'),
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums ${val > 0 ? 'text-warning-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>{val} {t('hr.crewTimeSheets.hoursSuffix')}</span>;
        },
      },
      {
        accessorKey: 'totalWorkerDays',
        header: t('hr.crewTimeSheets.columnWorkerDays'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'entryCount',
        header: t('hr.crewTimeSheets.columnEntries'),
        size: 80,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()}</span>,
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.crewTimeSheets.title')}
        subtitle={`${sheets.length} ${t('hr.crewTimeSheets.subtitle')}`}
        breadcrumbs={[
          { label: t('hr.crewTimeSheets.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/hr' },
          { label: t('hr.crewTimeSheets.breadcrumbTimeSheets') },
        ]}
        tabs={[
          { id: 'all', label: t('hr.crewTimeSheets.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('hr.crewTimeSheets.tabDrafts'), count: tabCounts.draft },
          { id: 'SUBMITTED', label: t('hr.crewTimeSheets.tabSubmitted'), count: tabCounts.submitted },
          { id: 'APPROVED', label: t('hr.crewTimeSheets.tabApproved'), count: tabCounts.approved },
          { id: 'REJECTED', label: t('hr.crewTimeSheets.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('hr.crewTimeSheets.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('hr.crewTimeSheets.metricTotalHours')} value={`${metrics.totalHours} ${t('hr.crewTimeSheets.hoursSuffix')}`} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('hr.crewTimeSheets.metricOvertime')}
          value={`${metrics.totalOvertime} ${t('hr.crewTimeSheets.hoursSuffix')}`}
          trend={{ direction: metrics.totalOvertime > 50 ? 'down' : 'neutral', value: `${metrics.totalOvertime} ${t('hr.crewTimeSheets.hoursSuffix')}` }}
        />
        <MetricCard icon={<FileCheck size={18} />} label={t('hr.crewTimeSheets.metricWorkerDays')} value={metrics.totalWorkerDays} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('hr.crewTimeSheets.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<CrewTimeSheet>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('hr.crewTimeSheets.emptyTitle')}
        emptyDescription={t('hr.crewTimeSheets.emptyDescription')}
      />
    </div>
  );
};

export default CrewTimeSheetsPage;
