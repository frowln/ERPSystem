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
import { t } from '@/i18n';
import type { PortalProject } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'orange'> = {
  DRAFT: 'gray',
  PLANNING: 'blue',
  IN_PROGRESS: 'yellow',
  ON_HOLD: 'orange',
  COMPLETED: 'green',
};

const getStatusLabels = (): Record<string, string> => ({
  DRAFT: t('portal.projects.statusDraft'),
  PLANNING: t('portal.projects.statusPlanning'),
  IN_PROGRESS: t('portal.projects.statusInProgress'),
  ON_HOLD: t('portal.projects.statusOnHold'),
  COMPLETED: t('portal.projects.statusCompleted'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('portal.projects.statusAll') },
  { value: 'IN_PROGRESS', label: t('portal.projects.statusInProgress') },
  { value: 'PLANNING', label: t('portal.projects.statusPlanning') },
  { value: 'ON_HOLD', label: t('portal.projects.statusOnHold') },
  { value: 'COMPLETED', label: t('portal.projects.statusCompleted') },
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

  const columns = useMemo<ColumnDef<PortalProject, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    return [
    {
      accessorKey: 'code', header: t('portal.projects.colCode'), size: 100,
      cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'name', header: t('portal.projects.colName'), size: 250,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.customerName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status', header: t('portal.projects.colStatus'), size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()] ?? getValue<string>()} />,
    },
    {
      accessorKey: 'progress', header: t('portal.projects.colProgress'), size: 150,
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
      accessorKey: 'managerName', header: t('portal.projects.colManager'), size: 150,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'documentCount', header: t('portal.projects.colDocuments'), size: 100,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'plannedEndDate', header: t('portal.projects.colDeadline'), size: 110,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'budget', header: t('portal.projects.colBudget'), size: 130,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoneyCompact(getValue<number>())}</span>,
    },
  ];
  }, []);

  const handleRowClick = useCallback(
    (project: PortalProject) => navigate(`/projects/${project.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.projects.title')}
        subtitle={t('portal.projects.subtitle', { count: String(projects.length) })}
        breadcrumbs={[
          { label: t('portal.projects.breadcrumbHome'), href: '/' },
          { label: t('portal.projects.breadcrumbPortal'), href: '/portal' },
          { label: t('portal.projects.breadcrumbProjects') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FolderOpen size={18} />} label={t('portal.projects.metricTotal')} value={metrics.total} />
        <MetricCard icon={<FolderOpen size={18} />} label={t('portal.projects.metricActive')} value={metrics.active} />
        <MetricCard icon={<FileText size={18} />} label={t('portal.projects.metricDocs')} value={metrics.totalDocs} />
        <MetricCard icon={<AlertCircle size={18} />} label={t('portal.projects.metricOpenIssues')} value={metrics.openIssues} trend={metrics.openIssues > 0 ? { direction: 'down', value: t('portal.projects.trendNeedAttention') } : undefined} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('portal.projects.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getStatusFilterOptions()} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48" />
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
        emptyTitle={t('portal.projects.emptyTitle')}
        emptyDescription={t('portal.projects.emptyDescription')}
      />
    </div>
  );
};

export default PortalProjectListPage;
