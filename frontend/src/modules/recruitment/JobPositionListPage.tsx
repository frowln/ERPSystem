import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Briefcase, CheckCircle, Clock, Users } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  jobPositionStatusColorMap,
  jobPositionStatusLabels,
  employmentTypeColorMap,
  employmentTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { recruitmentApi } from '@/api/recruitment';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import type { JobPosition } from './types';
import type { PaginatedResponse } from '@/types';

type TabId = 'all' | 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'FILLED';

const getStatusFilterOptions = () => [
  { value: '', label: t('recruitment.positions.statusAll') },
  { value: 'DRAFT', label: t('recruitment.positions.statusDraft') },
  { value: 'OPEN', label: t('recruitment.positions.statusOpen') },
  { value: 'IN_PROGRESS', label: t('recruitment.positions.statusInProgress') },
  { value: 'FILLED', label: t('recruitment.positions.statusFilled') },
  { value: 'CANCELLED', label: t('recruitment.positions.statusCancelled') },
];


const JobPositionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: positionData, isLoading } = useQuery<PaginatedResponse<JobPosition>>({
    queryKey: ['job-positions'],
    queryFn: () => recruitmentApi.getJobPositions(),
  });

  const positions = positionData?.content ?? [];

  const filteredPositions = useMemo(() => {
    let filtered = positions;
    if (activeTab !== 'all') {
      filtered = filtered.filter((p) => p.status === activeTab);
    }
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.code.toLowerCase().includes(lower) ||
          p.title.toLowerCase().includes(lower) ||
          (p.departmentName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [positions, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: positions.length,
    draft: positions.filter((p) => p.status === 'DRAFT').length,
    open: positions.filter((p) => p.status === 'OPEN').length,
    in_progress: positions.filter((p) => p.status === 'IN_PROGRESS').length,
    filled: positions.filter((p) => p.status === 'FILLED').length,
  }), [positions]);

  const metrics = useMemo(() => {
    const openCount = positions.filter((p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').length;
    const filledCount = positions.filter((p) => p.status === 'FILLED').length;
    const totalApplicants = positions.reduce((s, p) => s + p.applicantCount, 0);
    return { total: positions.length, openCount, filledCount, totalApplicants };
  }, [positions]);

  const columns = useMemo<ColumnDef<JobPosition, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('recruitment.positions.colCode'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('recruitment.positions.colPosition'),
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">{row.original.title}</p>
            {row.original.departmentName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.departmentName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('recruitment.positions.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={jobPositionStatusColorMap}
            label={jobPositionStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'employmentType',
        header: t('recruitment.positions.colType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={employmentTypeColorMap}
            label={employmentTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'salaryMin',
        header: t('recruitment.positions.colSalary'),
        size: 160,
        cell: ({ row }) => {
          const min = row.original.salaryMin;
          const max = row.original.salaryMax;
          if (!min && !max) return <span className="text-neutral-500 dark:text-neutral-400">---</span>;
          return (
            <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
              {formatMoneyCompact(min)} - {formatMoneyCompact(max)}
            </span>
          );
        },
      },
      {
        accessorKey: 'applicantCount',
        header: t('recruitment.positions.colApplicants'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-primary-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'responsibleName',
        header: t('recruitment.positions.colResponsible'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('recruitment.positions.colCreatedAt'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (position: JobPosition) => navigate(`/recruitment/positions/${position.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('recruitment.positions.title')}
        subtitle={t('recruitment.positions.subtitle', { count: String(positions.length) })}
        breadcrumbs={[
          { label: t('recruitment.positions.breadcrumbHome'), href: '/' },
          { label: t('recruitment.positions.breadcrumbRecruitment') },
          { label: t('recruitment.positions.breadcrumbPositions') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/recruitment/positions/new')}>
            {t('recruitment.positions.newPosition')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('recruitment.positions.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('recruitment.positions.tabDraft'), count: tabCounts.draft },
          { id: 'OPEN', label: t('recruitment.positions.tabOpen'), count: tabCounts.open },
          { id: 'IN_PROGRESS', label: t('recruitment.positions.tabInProgress'), count: tabCounts.in_progress },
          { id: 'FILLED', label: t('recruitment.positions.tabFilled'), count: tabCounts.filled },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Briefcase size={18} />} label={t('recruitment.positions.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('recruitment.positions.metricOpen')} value={metrics.openCount} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('recruitment.positions.metricFilled')} value={metrics.filledCount} />
        <MetricCard icon={<Users size={18} />} label={t('recruitment.positions.metricTotalApplicants')} value={metrics.totalApplicants} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('recruitment.positions.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<JobPosition>
        data={filteredPositions}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('recruitment.positions.emptyTitle')}
        emptyDescription={t('recruitment.positions.emptyDescription')}
      />
    </div>
  );
};

export default JobPositionListPage;
