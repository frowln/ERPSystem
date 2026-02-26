import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Search, Users, Wrench, Package, AlertTriangle, UserCheck, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { planningApi } from './api';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { ResourceAssignment, ResourceHistogramEntry } from './types';
import type { Project, PaginatedResponse } from '@/types';

const resourceTypeIcons: Record<string, React.ReactNode> = {
  crew: <Users size={13} />,
  equipment: <Wrench size={13} />,
  material: <Package size={13} />,
};

const ResourcePlanningPage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '';

  const { data: assignmentsData, isLoading } = useQuery<ResourceAssignment[]>({
    queryKey: ['resource-plan', selectedProjectId],
    queryFn: () => planningApi.getResourcePlan(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const { data: histogramData } = useQuery<ResourceHistogramEntry[]>({
    queryKey: ['resource-histogram', selectedProjectId],
    queryFn: () => planningApi.getResourceHistogram(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const assignments = assignmentsData ?? [];
  const histogram = histogramData ?? [];

  const filtered = useMemo(() => {
    let result = assignments;
    if (typeFilter) {
      result = result.filter((a) => a.resourceType === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.resourceName.toLowerCase().includes(lower) ||
          a.taskName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [assignments, typeFilter, search]);

  // Metrics
  const uniqueResources = new Set(assignments.map((a) => a.resourceName)).size;
  const assignedCount = assignments.length;
  const overAllocated = assignments.filter((a) => a.isOverAllocated).length;
  const idleEstimate = Math.max(0, uniqueResources - new Set(assignments.filter((a) => a.utilization > 0).map((a) => a.resourceName)).size);

  const columns = useMemo<ColumnDef<ResourceAssignment, unknown>[]>(
    () => [
      {
        accessorKey: 'taskName',
        header: t('planning.resourcePlanning.colTask'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'resourceName',
        header: t('planning.resourcePlanning.colResource'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'resourceType',
        header: t('planning.resourcePlanning.colType'),
        size: 130,
        cell: ({ getValue }) => {
          const rt = getValue<string>();
          const typeLabels: Record<string, string> = {
            crew: t('planning.resourcePlanning.typeCrew'),
            equipment: t('planning.resourcePlanning.typeEquipment'),
            material: t('planning.resourcePlanning.typeMaterial'),
          };
          return (
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              {resourceTypeIcons[rt]}
              <span className="text-xs">{typeLabels[rt] ?? rt}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'startDate',
        header: t('planning.resourcePlanning.colStart'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'endDate',
        header: t('planning.resourcePlanning.colEnd'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'utilization',
        header: t('planning.resourcePlanning.colUtilization'),
        size: 160,
        cell: ({ row }) => {
          const val = row.original.utilization;
          const isOver = row.original.isOverAllocated;
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    isOver
                      ? 'bg-danger-500'
                      : val >= 80
                        ? 'bg-success-500'
                        : val >= 50
                          ? 'bg-warning-500'
                          : 'bg-neutral-400',
                  )}
                  style={{ width: `${Math.min(val, 100)}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium tabular-nums',
                  isOver ? 'text-danger-600 dark:text-danger-400' : 'text-neutral-600 dark:text-neutral-400',
                )}
              >
                {val}%
              </span>
              {isOver && <AlertTriangle size={12} className="text-danger-500" />}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.resourcePlanning.title')}
        subtitle={t('planning.resourcePlanning.subtitle')}
        breadcrumbs={[
          { label: t('planning.resourcePlanning.breadcrumbHome'), href: '/' },
          { label: t('planning.resourcePlanning.breadcrumbPlanning') },
          { label: t('planning.resourcePlanning.breadcrumbResourcePlanning') },
        ]}
        actions={
          <Select
            options={projectOptions}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t('planning.resourcePlanning.selectProject')}
            className="w-56"
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Users size={18} />}
          label={t('planning.resourcePlanning.metricTotalResources')}
          value={uniqueResources}
        />
        <MetricCard
          icon={<UserCheck size={18} />}
          label={t('planning.resourcePlanning.metricAssigned')}
          value={assignedCount}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('planning.resourcePlanning.metricOverAllocated')}
          value={overAllocated}
          trend={
            overAllocated > 0
              ? { direction: 'down', value: t('planning.resourcePlanning.needsAttention') }
              : { direction: 'up', value: t('planning.resourcePlanning.allGood') }
          }
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('planning.resourcePlanning.metricIdle')}
          value={idleEstimate}
        />
      </div>

      {/* Resource Utilization Histogram */}
      {histogram.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('planning.resourcePlanning.histogramTitle')}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            {t('planning.resourcePlanning.histogramSubtitle')}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histogram} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(val: string) => val.slice(5)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-neutral-50, #fafafa)',
                  borderColor: 'var(--color-neutral-200, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label="100%" />
              <Bar
                dataKey="allocated"
                name={t('planning.resourcePlanning.legendAllocated')}
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="capacity"
                name={t('planning.resourcePlanning.legendCapacity')}
                fill="#d1d5db"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('planning.resourcePlanning.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('planning.resourcePlanning.allTypes') },
            { value: 'crew', label: t('planning.resourcePlanning.typeCrew') },
            { value: 'equipment', label: t('planning.resourcePlanning.typeEquipment') },
            { value: 'material', label: t('planning.resourcePlanning.typeMaterial') },
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<ResourceAssignment>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('planning.resourcePlanning.emptyTitle')}
        emptyDescription={t('planning.resourcePlanning.emptyDescription')}
      />
    </div>
  );
};

export default ResourcePlanningPage;
