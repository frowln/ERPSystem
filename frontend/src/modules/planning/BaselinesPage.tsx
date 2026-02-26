import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  CalendarCheck,
  GitCompare,
  Plus,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { planningApi } from './api';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { Baseline, BaselineComparison } from './types';
import type { Project, PaginatedResponse } from '@/types';

const BaselinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [newBaselineName, setNewBaselineName] = useState('');
  const [compareId1, setCompareId1] = useState('');
  const [compareId2, setCompareId2] = useState('');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '';

  const { data, isLoading } = useQuery<Baseline[]>({
    queryKey: ['baselines-list', selectedProjectId],
    queryFn: () => planningApi.getBaselinesList(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const baselines = data ?? [];

  const { data: comparisonData, isLoading: comparisonLoading } = useQuery<BaselineComparison>({
    queryKey: ['baseline-comparison', compareId1, compareId2],
    queryFn: () => planningApi.compareBaselines(compareId1, compareId2),
    enabled: !!compareId1 && !!compareId2 && showCompareModal,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      planningApi.createBaselineSnapshot({ projectId: selectedProjectId, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines-list'] });
      toast.success(t('planning.baselinesPage.createSuccess'));
      setShowCreateModal(false);
      setNewBaselineName('');
    },
    onError: () => {
      toast.error(t('planning.baselinesPage.createError'));
    },
  });

  const filtered = useMemo(() => {
    if (!search) return baselines;
    const lower = search.toLowerCase();
    return baselines.filter((b) => b.name.toLowerCase().includes(lower));
  }, [baselines, search]);

  // Metrics
  const totalBaselines = baselines.length;
  const latestBaseline = baselines.length > 0 ? baselines[0] : null;
  const avgVariance = baselines.length > 0
    ? baselines.reduce((s, b) => s + Math.abs(b.varianceVsCurrent), 0) / baselines.length
    : 0;

  const baselineOptions = baselines.map((b) => ({ value: b.id, label: b.name }));

  const columns = useMemo<ColumnDef<Baseline, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('planning.baselinesPage.colName'),
        size: 240,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('planning.baselinesPage.colCreatedDate'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'totalTasks',
        header: t('planning.baselinesPage.colTotalTasks'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'totalDuration',
        header: t('planning.baselinesPage.colTotalDuration'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<number>()} {t('planning.baselinesPage.daysUnit')}
          </span>
        ),
      },
      {
        accessorKey: 'varianceVsCurrent',
        header: t('planning.baselinesPage.colVariance'),
        size: 140,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span
              className={cn(
                'tabular-nums font-semibold',
                val > 0
                  ? 'text-danger-600 dark:text-danger-400'
                  : val < 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {val > 0 ? '+' : ''}
              {val} {t('planning.baselinesPage.daysUnit')}
            </span>
          );
        },
      },
    ],
    [],
  );

  const comparisonColumns = useMemo<ColumnDef<BaselineComparison['tasks'][number], unknown>[]>(
    () => [
      {
        accessorKey: 'taskName',
        header: t('planning.baselinesPage.compareColTask'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'baselinePlannedStart',
        header: t('planning.baselinesPage.compareColBaselineStart'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'baselinePlannedEnd',
        header: t('planning.baselinesPage.compareColBaselineEnd'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'currentPlannedStart',
        header: t('planning.baselinesPage.compareColCurrentStart'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'currentPlannedEnd',
        header: t('planning.baselinesPage.compareColCurrentEnd'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'driftDays',
        header: t('planning.baselinesPage.compareColDrift'),
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span
              className={cn(
                'tabular-nums font-semibold',
                val > 0
                  ? 'text-danger-600 dark:text-danger-400'
                  : val < 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {val > 0 ? '+' : ''}
              {val}d
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.baselinesPage.title')}
        subtitle={t('planning.baselinesPage.subtitle')}
        breadcrumbs={[
          { label: t('planning.baselinesPage.breadcrumbHome'), href: '/' },
          { label: t('planning.baselinesPage.breadcrumbPlanning') },
          { label: t('planning.baselinesPage.breadcrumbBaselines') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('planning.baselinesPage.selectProject')}
              className="w-56"
            />
            <Button
              variant="secondary"
              iconLeft={<GitCompare size={16} />}
              onClick={() => setShowCompareModal(true)}
              disabled={baselines.length < 2}
            >
              {t('planning.baselinesPage.compareButton')}
            </Button>
            <Button
              iconLeft={<Plus size={16} />}
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedProjectId}
            >
              {t('planning.baselinesPage.createButton')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<CalendarCheck size={18} />}
          label={t('planning.baselinesPage.metricTotal')}
          value={totalBaselines}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('planning.baselinesPage.metricLatest')}
          value={latestBaseline?.name ?? '---'}
          subtitle={latestBaseline ? formatDate(latestBaseline.createdAt) : ''}
        />
        <MetricCard
          icon={<ArrowRightLeft size={18} />}
          label={t('planning.baselinesPage.metricAvgVariance')}
          value={`${avgVariance.toFixed(1)} ${t('planning.baselinesPage.daysUnit')}`}
        />
        <MetricCard
          label={t('planning.baselinesPage.metricLatestTasks')}
          value={latestBaseline?.totalTasks ?? 0}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('planning.baselinesPage.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<Baseline>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('planning.baselinesPage.emptyTitle')}
        emptyDescription={t('planning.baselinesPage.emptyDescription')}
      />

      {/* Create Baseline Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('planning.baselinesPage.createModalTitle')}
      >
        <div className="space-y-4">
          <FormField label={t('planning.baselinesPage.baselineNameLabel')} required>
            <Input
              value={newBaselineName}
              onChange={(e) => setNewBaselineName(e.target.value)}
              placeholder={t('planning.baselinesPage.baselineNamePlaceholder')}
            />
          </FormField>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('planning.baselinesPage.createModalDescription')}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setNewBaselineName('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createMutation.mutate(newBaselineName)}
              disabled={!newBaselineName.trim()}
              loading={createMutation.isPending}
            >
              {t('planning.baselinesPage.createButton')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Compare Baselines Modal */}
      <Modal
        open={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title={t('planning.baselinesPage.compareModalTitle')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('planning.baselinesPage.baseline1Label')}>
              <Select
                options={baselineOptions}
                value={compareId1}
                onChange={(e) => setCompareId1(e.target.value)}
                placeholder={t('planning.baselinesPage.selectBaseline')}
              />
            </FormField>
            <FormField label={t('planning.baselinesPage.baseline2Label')}>
              <Select
                options={baselineOptions}
                value={compareId2}
                onChange={(e) => setCompareId2(e.target.value)}
                placeholder={t('planning.baselinesPage.selectBaseline')}
              />
            </FormField>
          </div>

          {comparisonLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}

          {comparisonData && comparisonData.tasks.length > 0 && (
            <div className="max-h-96 overflow-auto">
              <DataTable<BaselineComparison['tasks'][number]>
                data={comparisonData.tasks}
                columns={comparisonColumns}
                pageSize={50}
                emptyTitle={t('planning.baselinesPage.compareNoData')}
                emptyDescription=""
              />
            </div>
          )}

          {comparisonData && comparisonData.tasks.length === 0 && (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-4">
              {t('planning.baselinesPage.compareNoData')}
            </p>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setShowCompareModal(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BaselinesPage;
