import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, FolderOpen, FileText, AlertCircle, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { Button } from '@/design-system/components/Button';
import { portalApi } from '@/api/portal';
import { formatDate, formatPercent, formatMoneyCompact } from '@/lib/format';
import type { PortalProject } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'orange'> = {
  DRAFT: 'gray',
  PLANNING: 'blue',
  IN_PROGRESS: 'yellow',
  ON_HOLD: 'orange',
  COMPLETED: 'green',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PLANNING: 'Планирование',
  IN_PROGRESS: 'В работе',
  ON_HOLD: 'Приостановлен',
  COMPLETED: 'Завершён',
};

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'PLANNING', label: 'Планирование' },
  { value: 'ON_HOLD', label: 'Приостановлен' },
  { value: 'COMPLETED', label: 'Завершён' },
];

const PortalProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['portal-projects'],
    queryFn: () => portalApi.getProjects(),
  });

  const projects = projectData?.content ?? [];

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (statusFilter) filtered = filtered.filter((p) => p.status === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(lower) || p.code.toLowerCase().includes(lower) || p.managerName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [projects, statusFilter, search]);

  const metrics = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === 'IN_PROGRESS').length,
    totalDocs: projects.reduce((s, p) => s + p.documentCount, 0),
    openIssues: projects.reduce((s, p) => s + p.openIssueCount, 0),
  }), [projects]);

  const columns = useMemo<ColumnDef<PortalProject, unknown>[]>(() => [
    {
      accessorKey: 'code', header: 'Код', size: 100,
      cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'name', header: 'Название проекта', size: 250,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.customerName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status', header: 'Статус', size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()] ?? getValue<string>()} />,
    },
    {
      accessorKey: 'progress', header: 'Прогресс', size: 150,
      cell: ({ getValue }) => {
        const val = getValue<number>();
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(val, 100)}%` }} />
            </div>
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{formatPercent(val)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'managerName', header: 'Руководитель', size: 150,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'documentCount', header: 'Документы', size: 100,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'plannedEndDate', header: 'Срок', size: 110,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'budget', header: 'Бюджет', size: 130,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoneyCompact(getValue<number>())}</span>,
    },
  ], []);

  const handleRowClick = useCallback(
    (project: PortalProject) => navigate(`/projects/${project.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Проекты портала"
        subtitle={`${projects.length} проектов доступно`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Портал', href: '/portal' },
          { label: 'Проекты' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FolderOpen size={18} />} label="Всего проектов" value={metrics.total} />
        <MetricCard icon={<FolderOpen size={18} />} label="Активные" value={metrics.active} />
        <MetricCard icon={<FileText size={18} />} label="Документов" value={metrics.totalDocs} />
        <MetricCard icon={<AlertCircle size={18} />} label="Открытые замечания" value={metrics.openIssues} trend={metrics.openIssues > 0 ? { direction: 'down', value: 'Требуют внимания' } : undefined} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по названию, коду..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={statusFilterOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<PortalProject>
        data={filteredProjects}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет доступных проектов"
        emptyDescription="Проекты появятся после предоставления доступа"
      />
    </div>
  );
};

export default PortalProjectListPage;
