import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Route, AlertTriangle, Clock, Layers } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { planningApi } from './api';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { CriticalPathTask } from './types';
import type { Project, PaginatedResponse } from '@/types';

const CriticalPathPage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '';

  const { data, isLoading } = useQuery<CriticalPathTask[]>({
    queryKey: ['critical-path', selectedProjectId],
    queryFn: () => planningApi.getCriticalPathTasks(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const tasks = data ?? [];

  const groups = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => {
      if (task.group) set.add(task.group);
    });
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (groupFilter) {
      result = result.filter((task) => task.group === groupFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((task) => task.name.toLowerCase().includes(lower));
    }
    return result;
  }, [tasks, groupFilter, search]);

  const criticalTasks = tasks.filter((task) => task.isCritical);
  const projectDuration = tasks.length > 0
    ? Math.max(...tasks.map((task) => task.lateFinish))
    : 0;
  const criticalPathLength = criticalTasks.length > 0
    ? criticalTasks.reduce((sum, task) => sum + task.duration, 0)
    : 0;

  // Gantt-like visualization data
  const maxFinish = tasks.length > 0 ? Math.max(...tasks.map((t) => t.lateFinish)) : 1;

  const columns = useMemo<ColumnDef<CriticalPathTask, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('planning.cpm.colTaskName'),
        size: 250,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.isCritical && (
              <AlertTriangle size={14} className="text-danger-500 flex-shrink-0" />
            )}
            <span
              className={cn(
                'font-medium',
                row.original.isCritical
                  ? 'text-danger-700 dark:text-danger-400'
                  : 'text-neutral-900 dark:text-neutral-100',
              )}
            >
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'duration',
        header: t('planning.cpm.colDuration'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<number>()} {t('planning.cpm.daysUnit')}
          </span>
        ),
      },
      {
        accessorKey: 'earlyStart',
        header: t('planning.cpm.colEarlyStart'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'earlyFinish',
        header: t('planning.cpm.colEarlyFinish'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'lateStart',
        header: t('planning.cpm.colLateStart'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'lateFinish',
        header: t('planning.cpm.colLateFinish'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'totalFloat',
        header: t('planning.cpm.colFloat'),
        size: 100,
        cell: ({ row }) => {
          const val = row.original.totalFloat;
          return (
            <span
              className={cn(
                'tabular-nums font-semibold',
                val === 0
                  ? 'text-danger-600 dark:text-danger-400'
                  : val <= 3
                    ? 'text-warning-600 dark:text-warning-400'
                    : 'text-success-600 dark:text-success-400',
              )}
            >
              {val} {t('planning.cpm.daysUnit')}
            </span>
          );
        },
      },
      {
        id: 'gantt',
        header: t('planning.cpm.colGanttBar'),
        size: 200,
        cell: ({ row }) => {
          const task = row.original;
          const startPct = (task.earlyStart / maxFinish) * 100;
          const widthPct = Math.max((task.duration / maxFinish) * 100, 1);
          return (
            <div className="relative h-5 w-full">
              <div
                className={cn(
                  'absolute h-4 rounded top-0.5',
                  task.isCritical ? 'bg-danger-500' : 'bg-primary-400',
                )}
                style={{ left: `${startPct}%`, width: `${widthPct}%` }}
              />
            </div>
          );
        },
      },
    ],
    [maxFinish],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.cpm.title')}
        subtitle={t('planning.cpm.subtitle')}
        breadcrumbs={[
          { label: t('planning.cpm.breadcrumbHome'), href: '/' },
          { label: t('planning.cpm.breadcrumbPlanning') },
          { label: t('planning.cpm.breadcrumbCpm') },
        ]}
        actions={
          <Select
            options={projectOptions}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t('planning.cpm.selectProject')}
            className="w-56"
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Layers size={18} />}
          label={t('planning.cpm.metricTotalTasks')}
          value={tasks.length}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('planning.cpm.metricCriticalTasks')}
          value={criticalTasks.length}
          trend={
            criticalTasks.length > 0
              ? { direction: 'down', value: `${((criticalTasks.length / Math.max(tasks.length, 1)) * 100).toFixed(0)}%` }
              : undefined
          }
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('planning.cpm.metricProjectDuration')}
          value={`${projectDuration} ${t('planning.cpm.daysUnit')}`}
        />
        <MetricCard
          icon={<Route size={18} />}
          label={t('planning.cpm.metricCriticalPathLength')}
          value={`${criticalPathLength} ${t('planning.cpm.daysUnit')}`}
        />
      </div>

      {/* Gantt-like visualization */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('planning.cpm.ganttTitle')}
        </h3>
        <div className="space-y-1">
          {filtered.slice(0, 20).map((task) => {
            const startPct = (task.earlyStart / maxFinish) * 100;
            const widthPct = Math.max((task.duration / maxFinish) * 100, 1);
            return (
              <div key={task.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    'text-xs w-40 truncate flex-shrink-0',
                    task.isCritical
                      ? 'text-danger-700 dark:text-danger-400 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  {task.name}
                </span>
                <div className="flex-1 relative h-5 bg-neutral-50 dark:bg-neutral-800 rounded">
                  <div
                    className={cn(
                      'absolute h-4 rounded top-0.5',
                      task.isCritical ? 'bg-danger-500' : 'bg-primary-400',
                    )}
                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-neutral-400 w-10 text-right flex-shrink-0">
                  {task.totalFloat}d
                </span>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-2.5 rounded bg-danger-500" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {t('planning.cpm.legendCritical')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-2.5 rounded bg-primary-400" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {t('planning.cpm.legendNonCritical')}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('planning.cpm.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('planning.cpm.allGroups') },
            ...groups.map((g) => ({ value: g, label: g })),
          ]}
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<CriticalPathTask>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('planning.cpm.emptyTitle')}
        emptyDescription={t('planning.cpm.emptyDescription')}
      />
    </div>
  );
};

export default CriticalPathPage;
