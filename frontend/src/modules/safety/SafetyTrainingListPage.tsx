import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, GraduationCap, Users, Clock, CalendarCheck, Plus, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { safetyApi, type SafetyTraining, type TrainingStatus } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  PLANNED: 'blue',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  PLANNED: t('safety.training.statusPlanned'),
  IN_PROGRESS: t('safety.training.statusInProgress'),
  COMPLETED: t('safety.training.statusCompleted'),
  CANCELLED: t('safety.training.statusCancelled'),
});

const getTypeLabels = (): Record<string, string> => ({
  INITIAL: t('safety.training.typeInitial'),
  PRIMARY: t('safety.training.typePrimary'),
  PERIODIC: t('safety.training.typePeriodic'),
  UNSCHEDULED: t('safety.training.typeUnscheduled'),
  SPECIAL: t('safety.training.typeSpecial'),
});

const typeColorMap: Record<string, 'blue' | 'green' | 'yellow' | 'orange' | 'red'> = {
  INITIAL: 'blue',
  PRIMARY: 'green',
  PERIODIC: 'yellow',
  UNSCHEDULED: 'orange',
  SPECIAL: 'red',
};

type TabId = 'all' | 'PLANNED' | 'COMPLETED' | 'CANCELLED';

const SafetyTrainingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: trainingData, isLoading } = useQuery({
    queryKey: ['safety-trainings'],
    queryFn: () => safetyApi.getTrainings({ size: 200 }),
  });

  const trainings = trainingData?.content ?? [];

  const filtered = useMemo(() => {
    let result = trainings;
    if (activeTab === 'PLANNED') result = result.filter((tr) => tr.status === 'PLANNED' || tr.status === 'IN_PROGRESS');
    else if (activeTab === 'COMPLETED') result = result.filter((tr) => tr.status === 'COMPLETED');
    else if (activeTab === 'CANCELLED') result = result.filter((tr) => tr.status === 'CANCELLED');
    if (typeFilter) result = result.filter((tr) => tr.trainingType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (tr) =>
          tr.title.toLowerCase().includes(lower) ||
          (tr.instructorName ?? '').toLowerCase().includes(lower) ||
          (tr.topics ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [trainings, activeTab, typeFilter, search]);

  const tabCounts = useMemo(
    () => ({
      all: trainings.length,
      planned: trainings.filter((tr) => tr.status === 'PLANNED' || tr.status === 'IN_PROGRESS').length,
      completed: trainings.filter((tr) => tr.status === 'COMPLETED').length,
      cancelled: trainings.filter((tr) => tr.status === 'CANCELLED').length,
    }),
    [trainings],
  );

  const metrics = useMemo(() => {
    const totalParticipants = trainings.reduce((s, tr) => s + tr.participantCount, 0);
    const completed = trainings.filter((tr) => tr.status === 'COMPLETED');
    const totalHours = completed.reduce((s, tr) => s + (tr.duration ?? 0), 0);
    const overdue = trainings.filter(
      (tr) => tr.status === 'PLANNED' && new Date(tr.date) < new Date(),
    ).length;
    return { total: trainings.length, totalParticipants, totalHours, overdue };
  }, [trainings]);

  const typeFilterOptions = useMemo(
    () => [
      { value: '', label: t('safety.training.filterAllTypes') },
      ...Object.entries(getTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
    ],
    [],
  );

  const columns = useMemo<ColumnDef<SafetyTraining, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('safety.training.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('safety.training.colTitle'),
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">
              {row.original.title}
            </p>
            {row.original.topics && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[230px]">
                {row.original.topics}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'trainingType',
        header: t('safety.training.colType'),
        size: 140,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <StatusBadge
              status={val}
              colorMap={typeColorMap}
              label={getTypeLabels()[val] ?? val}
            />
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('safety.training.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <StatusBadge
              status={val}
              colorMap={statusColorMap}
              label={getStatusLabels()[val] ?? val}
            />
          );
        },
      },
      {
        accessorKey: 'instructorName',
        header: t('safety.training.colInstructor'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'participantCount',
        header: t('safety.training.colParticipants'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {getValue<number>() || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'duration',
        header: t('safety.training.colDuration'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {v ? `${v} ${t('safety.training.durationMinutes')}` : '—'}
            </span>
          );
        },
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
              navigate(`/safety/trainings/${row.original.id}`);
            }}
          >
            {t('common.open')}
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (training: SafetyTraining) => navigate(`/safety/trainings/${training.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.training.title')}
        subtitle={`${trainings.length} ${t('safety.training.subtitleSuffix')}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.training.breadcrumbTrainings') },
        ]}
        tabs={[
          { id: 'all', label: t('safety.training.tabAll'), count: tabCounts.all },
          { id: 'PLANNED', label: t('safety.training.tabPlanned'), count: tabCounts.planned },
          { id: 'COMPLETED', label: t('safety.training.tabCompleted'), count: tabCounts.completed },
          { id: 'CANCELLED', label: t('safety.training.tabCancelled'), count: tabCounts.cancelled },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <Button onClick={() => navigate('/safety/trainings/new')}>
            <Plus size={16} className="mr-1.5" />
            {t('safety.training.newTraining')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<GraduationCap size={18} />} label={t('safety.training.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Users size={18} />} label={t('safety.training.metricParticipants')} value={metrics.totalParticipants} />
        <MetricCard icon={<Clock size={18} />} label={t('safety.training.metricHours')} value={`${Math.round(metrics.totalHours / 60)}`} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('safety.training.metricOverdue')}
          value={metrics.overdue}
          trend={metrics.overdue > 0 ? { direction: 'down', value: t('safety.training.requireAttention') } : undefined}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('safety.training.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<SafetyTraining>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('safety.training.emptyTitle')}
        emptyDescription={t('safety.training.emptyDescription')}
      />
    </div>
  );
};

export default SafetyTrainingListPage;
