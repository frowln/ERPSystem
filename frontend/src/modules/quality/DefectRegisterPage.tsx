import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Map,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { DefectRegisterEntry, DefectStatus, DefectSeverity } from '@/modules/quality/types';

const defectStatusColorMap: Record<string, 'blue' | 'yellow' | 'green' | 'gray'> = {
  open: 'blue',
  in_progress: 'yellow',
  fixed: 'green',
  closed: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  open: t('quality.defectRegister.statusOpen'),
  in_progress: t('quality.defectRegister.statusInProgress'),
  fixed: t('quality.defectRegister.statusFixed'),
  closed: t('quality.defectRegister.statusClosed'),
});

const defectSeverityColorMap: Record<string, 'green' | 'orange' | 'red'> = {
  minor: 'green',
  major: 'orange',
  critical: 'red',
};

const getSeverityLabels = (): Record<string, string> => ({
  minor: t('quality.defectRegister.severityMinor'),
  major: t('quality.defectRegister.severityMajor'),
  critical: t('quality.defectRegister.severityCritical'),
});

type TabId = 'all' | 'open' | 'in_progress' | 'fixed' | 'closed';
type GroupBy = 'none' | 'location' | 'type';

const DefectRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const { data: defectsData, isLoading } = useQuery({
    queryKey: ['defect-register'],
    queryFn: () => qualityApi.getDefectRegister(),
  });

  const defects = defectsData?.content ?? [];

  const projects = useMemo(
    () => [...new Set(defects.map((d) => d.projectName))],
    [defects],
  );

  const filteredDefects = useMemo(() => {
    let filtered = defects;
    if (activeTab !== 'all') filtered = filtered.filter((d) => d.status === activeTab);
    if (statusFilter) filtered = filtered.filter((d) => d.status === statusFilter);
    if (severityFilter) filtered = filtered.filter((d) => d.severity === severityFilter);
    if (projectFilter) filtered = filtered.filter((d) => d.projectName === projectFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.number.toLowerCase().includes(lower) ||
          d.location.toLowerCase().includes(lower) ||
          d.defectType.toLowerCase().includes(lower) ||
          d.responsibleName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [defects, activeTab, statusFilter, severityFilter, projectFilter, search]);

  const sortedDefects = useMemo(() => {
    if (groupBy === 'none') return filteredDefects;
    const key = groupBy === 'location' ? 'location' : 'defectType';
    return [...filteredDefects].sort((a, b) => a[key].localeCompare(b[key]));
  }, [filteredDefects, groupBy]);

  const metrics = useMemo(() => {
    const total = defects.length;
    const open = defects.filter((d) => d.status === 'open').length;
    const overdue = defects.filter(
      (d) =>
        (d.status === 'open' || d.status === 'in_progress') &&
        d.deadline &&
        new Date(d.deadline) < new Date(),
    ).length;
    const fixed = defects.filter((d) => d.status === 'fixed').length;
    return { total, open, overdue, fixed };
  }, [defects]);

  const tabCounts = useMemo(
    () => ({
      all: defects.length,
      open: defects.filter((d) => d.status === 'open').length,
      in_progress: defects.filter((d) => d.status === 'in_progress').length,
      fixed: defects.filter((d) => d.status === 'fixed').length,
      closed: defects.filter((d) => d.status === 'closed').length,
    }),
    [defects],
  );

  const handleExport = () => {
    toast.success(t('quality.defectRegister.toastExport'));
  };

  const columns = useMemo<ColumnDef<DefectRegisterEntry, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    const severityLabels = getSeverityLabels();
    return [
      {
        accessorKey: 'number',
        header: t('quality.defectRegister.colNumber'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: t('quality.defectRegister.colLocation'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'defectType',
        header: t('quality.defectRegister.colType'),
        size: 150,
      },
      {
        accessorKey: 'severity',
        header: t('quality.defectRegister.colSeverity'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={defectSeverityColorMap}
            label={severityLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'detectedDate',
        header: t('quality.defectRegister.colDetectedDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'deadline',
        header: t('quality.defectRegister.colDeadline'),
        size: 110,
        cell: ({ row }) => {
          const deadline = row.original.deadline;
          const isOverdue =
            (row.original.status === 'open' || row.original.status === 'in_progress') &&
            deadline &&
            new Date(deadline) < new Date();
          return (
            <span
              className={
                isOverdue
                  ? 'text-danger-600 dark:text-danger-400 font-medium tabular-nums'
                  : 'tabular-nums'
              }
            >
              {formatDate(deadline)}
            </span>
          );
        },
      },
      {
        accessorKey: 'responsibleName',
        header: t('quality.defectRegister.colResponsible'),
        size: 150,
      },
      {
        accessorKey: 'status',
        header: t('quality.defectRegister.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={defectStatusColorMap}
            label={statusLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('quality.defectRegister.colProject'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.defectRegister.title')}
        subtitle={t('quality.defectRegister.subtitle', {
          count: String(defects.length),
        })}
        breadcrumbs={[
          { label: t('quality.defectRegister.breadcrumbHome'), href: '/' },
          { label: t('quality.defectRegister.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.defectRegister.breadcrumbDefects') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" iconLeft={<Map size={16} />} onClick={() => navigate('/quality/plan-view')}>
              {t('quality.planView.btnPlanView')}
            </Button>
            <Button variant="secondary" iconLeft={<Download size={16} />} onClick={handleExport}>
              {t('quality.defectRegister.btnExport')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: t('quality.defectRegister.tabAll'), count: tabCounts.all },
          { id: 'open', label: t('quality.defectRegister.tabOpen'), count: tabCounts.open },
          {
            id: 'in_progress',
            label: t('quality.defectRegister.tabInProgress'),
            count: tabCounts.in_progress,
          },
          { id: 'fixed', label: t('quality.defectRegister.tabFixed'), count: tabCounts.fixed },
          { id: 'closed', label: t('quality.defectRegister.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<AlertTriangle size={16} />}
          label={t('quality.defectRegister.metricTotal')}
          value={metrics.total}
          loading={isLoading}
        />
        <MetricCard
          icon={<AlertCircle size={16} />}
          label={t('quality.defectRegister.metricOpen')}
          value={metrics.open}
          loading={isLoading}
        />
        <MetricCard
          icon={<Clock size={16} />}
          label={t('quality.defectRegister.metricOverdue')}
          value={metrics.overdue}
          subtitle={metrics.overdue > 0 ? t('quality.defectRegister.trendNeedAttention') : undefined}
          loading={isLoading}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('quality.defectRegister.metricFixed')}
          value={metrics.fixed}
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.defectRegister.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('quality.defectRegister.filterAllStatuses') },
            ...Object.entries(getStatusLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: t('quality.defectRegister.filterAllSeverities') },
            ...Object.entries(getSeverityLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: t('quality.defectRegister.filterAllProjects') },
            ...projects.map((p) => ({ value: p, label: p })),
          ]}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: 'none', label: t('quality.defectRegister.groupByNone') },
            { value: 'location', label: t('quality.defectRegister.groupByLocation') },
            { value: 'type', label: t('quality.defectRegister.groupByType') },
          ]}
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<DefectRegisterEntry>
        data={sortedDefects}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('quality.defectRegister.emptyTitle')}
        emptyDescription={t('quality.defectRegister.emptyDescription')}
      />
    </div>
  );
};

export default DefectRegisterPage;
