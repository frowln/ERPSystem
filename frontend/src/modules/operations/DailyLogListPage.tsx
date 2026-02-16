import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ClipboardList, Users, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  dailyLogStatusColorMap,
  dailyLogStatusLabels,
  weatherColorMap,
  weatherLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { operationsApi } from '@/api/operations';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { DailyLog } from './types';

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

const getStatusFilterOptions = () => [
  { value: '', label: t('operations.dailyLogList.allStatuses') },
  { value: 'DRAFT', label: t('operations.dailyLogList.draft') },
  { value: 'SUBMITTED', label: t('operations.dailyLogList.submitted') },
  { value: 'APPROVED', label: t('operations.dailyLogList.approved') },
  { value: 'REJECTED', label: t('operations.dailyLogList.rejected') },
];

const DailyLogListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: logData, isLoading } = useQuery({
    queryKey: ['daily-logs'],
    queryFn: () => operationsApi.getDailyLogs(),
  });

  const logs = logData?.content ?? [];

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (activeTab !== 'all') filtered = filtered.filter((l) => l.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.number.toLowerCase().includes(lower) ||
          (l.projectName ?? '').toLowerCase().includes(lower) ||
          l.workDescription.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [logs, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: logs.length,
    draft: logs.filter((l) => l.status === 'DRAFT').length,
    submitted: logs.filter((l) => l.status === 'SUBMITTED').length,
    approved: logs.filter((l) => l.status === 'APPROVED').length,
    rejected: logs.filter((l) => l.status === 'REJECTED').length,
  }), [logs]);

  const metrics = useMemo(() => {
    const todayLogs = logs.filter((l) => l.logDate === new Date().toISOString().split('T')[0]);
    const totalWorkers = todayLogs.reduce((s, l) => s + l.workersOnSite, 0);
    const totalEquipment = todayLogs.reduce((s, l) => s + l.equipmentOnSite, 0);
    return {
      total: logs.length,
      todayCount: todayLogs.length,
      totalWorkers,
      totalEquipment,
    };
  }, [logs]);

  const columns = useMemo<ColumnDef<DailyLog, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'logDate',
        header: t('operations.dailyLogList.columnDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('operations.dailyLogList.columnProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('operations.dailyLogList.columnStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={dailyLogStatusColorMap}
            label={dailyLogStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'weather',
        header: t('operations.dailyLogList.columnWeather'),
        size: 110,
        cell: ({ row }) => (
          <div>
            <StatusBadge
              status={row.original.weather}
              colorMap={weatherColorMap}
              label={weatherLabels[row.original.weather]}
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
              {row.original.temperatureMin}...{row.original.temperatureMax > 0 ? '+' : ''}{row.original.temperatureMax}°C
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'workersOnSite',
        header: t('operations.dailyLogList.columnWorkers'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<number>()} {t('operations.dailyLogList.personAbbr')}</span>
        ),
      },
      {
        accessorKey: 'supervisorName',
        header: t('operations.dailyLogList.columnSupervisor'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/operations/daily-logs/${row.original.id}`);
            }}
          >
            {t('operations.dailyLogList.open')}
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (log: DailyLog) => navigate(`/operations/daily-logs/${log.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('operations.dailyLogList.title')}
        subtitle={t('operations.dailyLogList.subtitle', { count: logs.length })}
        breadcrumbs={[
          { label: t('operations.dailyLogList.breadcrumbHome'), href: '/' },
          { label: t('operations.dailyLogList.breadcrumbOperations'), href: '/operations' },
          { label: t('operations.dailyLogList.breadcrumbDailyLogs') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/operations/daily-logs/new')}>
            {t('operations.dailyLogList.newEntry')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('operations.dailyLogList.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('operations.dailyLogList.tabDrafts'), count: tabCounts.draft },
          { id: 'SUBMITTED', label: t('operations.dailyLogList.tabSubmitted'), count: tabCounts.submitted },
          { id: 'APPROVED', label: t('operations.dailyLogList.tabApproved'), count: tabCounts.approved },
          { id: 'REJECTED', label: t('operations.dailyLogList.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardList size={18} />} label={t('operations.dailyLogList.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('operations.dailyLogList.metricToday')} value={metrics.todayCount} />
        <MetricCard icon={<Users size={18} />} label={t('operations.dailyLogList.metricWorkersToday')} value={metrics.totalWorkers} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('operations.dailyLogList.metricEquipmentToday')} value={`${metrics.totalEquipment} ${t('operations.dailyLogList.unitAbbr')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('operations.dailyLogList.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<DailyLog>
        data={filteredLogs}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('operations.dailyLogList.emptyTitle')}
        emptyDescription={t('operations.dailyLogList.emptyDescription')}
      />
    </div>
  );
};

export default DailyLogListPage;
