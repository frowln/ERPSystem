import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, Camera, CloudOff, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { mobileApi } from '@/api/mobile';
import { formatDate } from '@/lib/format';
import type { FieldReport } from './types';
import { useMobileSubmissionQueue } from './useMobileSubmissionQueue';

const reportStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  submitted: 'blue',
  reviewed: 'yellow',
  approved: 'green',
};

const reportStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Отправлен',
  reviewed: 'На проверке',
  approved: 'Утверждён',
};

const syncStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  synced: 'green',
  pending: 'yellow',
  error: 'red',
  offline: 'gray',
};

const syncStatusLabels: Record<string, string> = {
  synced: 'Синхронизирован',
  pending: 'Ожидает',
  error: 'Ошибка',
  offline: 'Офлайн',
};

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'APPROVED';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'SUBMITTED', label: 'Отправлен' },
  { value: 'REVIEWED', label: 'На проверке' },
  { value: 'APPROVED', label: 'Утверждён' },
];

const FieldReportListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const localQueue = useMobileSubmissionQueue();

  const localQueueStats = useMemo(() => ({
    total: localQueue.length,
    pending: localQueue.filter((item) => item.status === 'QUEUED').length,
    issues: localQueue.filter((item) => item.status === 'FAILED' || item.status === 'CONFLICT').length,
    pendingPhotos: localQueue.reduce((sum, item) => sum + item.photos.length, 0),
  }), [localQueue]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['mobile-field-reports'],
    queryFn: () => mobileApi.getFieldReports(),
  });

  const reports = useMemo(() => {
    const content = reportData?.content ?? [];
    if (content.length > 0) return content;
    return [];
  }, [reportData]);

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (activeTab === 'DRAFT') {
      filtered = filtered.filter((r) => r.status === 'DRAFT');
    } else if (activeTab === 'SUBMITTED') {
      filtered = filtered.filter((r) => [ 'SUBMITTED', 'REVIEWED'].includes(r.status));
    } else if (activeTab === 'APPROVED') {
      filtered = filtered.filter((r) => r.status === 'APPROVED');
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.title.toLowerCase().includes(lower) ||
          r.authorName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [reports, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: reports.length,
    draft: reports.filter((r) => r.status === 'DRAFT').length,
    submitted: reports.filter((r) => [ 'SUBMITTED', 'REVIEWED'].includes(r.status)).length,
    approved: reports.filter((r) => r.status === 'APPROVED').length,
  }), [reports]);

  const metrics = useMemo(() => ({
    total: reports.length,
    todayCount: reports.filter((r) => r.reportDate === new Date().toISOString().split('T')[0]).length,
    syncErrors: reports.filter((r) => r.syncStatus === 'ERROR').length + localQueueStats.issues,
    photoCount: reports.reduce((sum, r) => sum + r.photos.length, 0) + localQueueStats.pendingPhotos,
  }), [localQueueStats.issues, localQueueStats.pendingPhotos, reports]);

  const columns = useMemo<ColumnDef<FieldReport, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Название',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName} &middot; {row.original.location}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={reportStatusColorMap}
            label={reportStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'authorName',
        header: 'Автор',
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'reportDate',
        header: 'Дата отчёта',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'workersOnSite',
        header: 'Рабочих',
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<number>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'syncStatus',
        header: 'Синхронизация',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={syncStatusColorMap}
            label={syncStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (report: FieldReport) => navigate(`/mobile/reports/${report.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Полевые отчёты"
        subtitle={`${reports.length} отчётов с площадок`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Мобильное приложение' },
          { label: 'Отчёты' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/mobile/reports/new')}>
            Новый отчёт
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'DRAFT', label: 'Черновики', count: tabCounts.draft },
          { id: 'SUBMITTED', label: 'На проверке', count: tabCounts.submitted },
          { id: 'APPROVED', label: 'Утверждённые', count: tabCounts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label="Всего отчётов" value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label="Сегодня" value={metrics.todayCount} />
        <MetricCard icon={<Camera size={18} />} label="Фотографий" value={metrics.photoCount} />
        <MetricCard
          icon={<CloudOff size={18} />}
          label="Ошибки синхронизации"
          value={metrics.syncErrors}
          trend={{ direction: metrics.syncErrors > 0 ? 'down' : 'neutral', value: metrics.syncErrors > 0 ? 'Требуется синхронизация' : 'Все синхронизированы' }}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, названию, автору..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {localQueueStats.total > 0 && (
        <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-warning-800">
            Локальная очередь: {localQueueStats.total} отчёт(ов), {localQueueStats.pendingPhotos} фото.
            {localQueueStats.issues > 0 && ` Проблемных элементов: ${localQueueStats.issues}.`}
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate('/mobile/dashboard')}>
            Центр синхронизации
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable<FieldReport>
        data={filteredReports}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет полевых отчётов"
        emptyDescription="Создайте первый отчёт с площадки"
      />
    </div>
  );
};

export default FieldReportListPage;
