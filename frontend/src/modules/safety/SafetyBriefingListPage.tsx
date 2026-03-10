import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Plus,
  ClipboardCheck,
  Users,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { safetyBriefingApi } from '@/api/safetyBriefings';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { SafetyBriefing, BriefingType } from './types';

const typeColorMap: Record<string, string> = {
  INITIAL: 'blue',
  PRIMARY: 'green',
  REPEAT: 'yellow',
  UNSCHEDULED: 'orange',
  TARGET: 'purple',
};

const statusColorMap: Record<string, string> = {
  PLANNED: 'blue',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

const getTypeLabels = (): Record<string, string> => ({
  INITIAL: t('safety.briefings.typeInitial'),
  PRIMARY: t('safety.briefings.typePrimary'),
  REPEAT: t('safety.briefings.typeRepeat'),
  UNSCHEDULED: t('safety.briefings.typeUnscheduled'),
  TARGET: t('safety.briefings.typeTarget'),
});

const getStatusLabels = (): Record<string, string> => ({
  PLANNED: t('safety.briefings.statusPlanned'),
  IN_PROGRESS: t('safety.briefings.statusInProgress'),
  COMPLETED: t('safety.briefings.statusCompleted'),
  CANCELLED: t('safety.briefings.statusCancelled'),
});

type TabId = 'all' | 'PLANNED' | 'COMPLETED';

const SafetyBriefingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: briefingData, isLoading } = useQuery({
    queryKey: ['safety-briefings'],
    queryFn: () => safetyBriefingApi.getBriefings({ size: 200 }),
  });

  const briefings = briefingData?.content ?? [];

  const filtered = useMemo(() => {
    let result = briefings;
    if (activeTab === 'PLANNED') result = result.filter((b) => b.status === 'PLANNED' || b.status === 'IN_PROGRESS');
    else if (activeTab === 'COMPLETED') result = result.filter((b) => b.status === 'COMPLETED');
    if (typeFilter) result = result.filter((b) => b.briefingType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (b) =>
          (b.instructorName ?? '').toLowerCase().includes(lower) ||
          (b.topic ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [briefings, activeTab, typeFilter, search]);

  const metrics = useMemo(() => {
    const total = briefings.length;
    const completed = briefings.filter((b) => b.status === 'COMPLETED').length;
    const totalAttendees = briefings.reduce((s, b) => s + b.attendeeCount, 0);
    const overdue = briefings.filter(
      (b) => b.status === 'PLANNED' && new Date(b.briefingDate) < new Date(),
    ).length;
    const repeatUpcoming = briefings.filter((b) => {
      if (!b.nextBriefingDate) return false;
      const next = new Date(b.nextBriefingDate);
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      return next >= now && next <= thirtyDays;
    }).length;
    return { total, completed, totalAttendees, overdue, repeatUpcoming };
  }, [briefings]);

  const tabCounts = useMemo(() => ({
    all: briefings.length,
    planned: briefings.filter((b) => b.status === 'PLANNED' || b.status === 'IN_PROGRESS').length,
    completed: briefings.filter((b) => b.status === 'COMPLETED').length,
  }), [briefings]);

  const typeFilterOptions = useMemo(() => [
    { value: '', label: t('safety.briefings.filterAllTypes') },
    ...Object.entries(getTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
  ], []);

  const columns = useMemo<ColumnDef<SafetyBriefing, unknown>[]>(
    () => [
      {
        accessorKey: 'briefingDate',
        header: t('safety.briefings.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'briefingType',
        header: t('safety.briefings.colType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={typeColorMap}
            label={getTypeLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'topic',
        header: t('safety.briefings.colTopic'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-neutral-900 dark:text-neutral-100 truncate max-w-[230px] block">
            {getValue<string>() || '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'instructorName',
        header: t('safety.briefings.colInstructor'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '\u2014'}</span>
        ),
      },
      {
        accessorKey: 'attendeeCount',
        header: t('safety.briefings.colAttendees'),
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-neutral-400" />
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {row.original.signedCount}/{row.original.attendeeCount}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('safety.briefings.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'nextBriefingDate',
        header: t('safety.briefings.colNextDate'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          if (!val) return <span className="text-neutral-400">\u2014</span>;
          const next = new Date(val);
          const now = new Date();
          const daysLeft = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <div className="flex flex-col">
              <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(val)}</span>
              {daysLeft <= 30 && daysLeft >= 0 && (
                <span className="text-xs text-warning-600 dark:text-warning-400">
                  {daysLeft} {t('safety.briefings.daysLeft')}
                </span>
              )}
              {daysLeft < 0 && (
                <span className="text-xs text-danger-600 dark:text-danger-400 font-medium">
                  {t('safety.briefings.overdue')}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (briefing: SafetyBriefing) => navigate(`/safety/briefings/${briefing.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.briefings.title')}
        subtitle={`${briefings.length} ${t('safety.briefings.subtitleSuffix')}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.briefings.breadcrumbBriefings') },
        ]}
        tabs={[
          { id: 'all', label: t('safety.briefings.tabAll'), count: tabCounts.all },
          { id: 'PLANNED', label: t('safety.briefings.tabPlanned'), count: tabCounts.planned },
          { id: 'COMPLETED', label: t('safety.briefings.tabCompleted'), count: tabCounts.completed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <Button onClick={() => navigate('/safety/briefings/new')}>
            <Plus size={16} className="mr-1.5" />
            {t('safety.briefings.btnNew')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardCheck size={18} />} label={t('safety.briefings.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Users size={18} />} label={t('safety.briefings.metricAttendees')} value={metrics.totalAttendees} />
        <MetricCard icon={<CalendarCheck size={18} />} label={t('safety.briefings.metricCompleted')} value={metrics.completed} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('safety.briefings.metricOverdue')}
          value={metrics.overdue}
          trend={metrics.overdue > 0 ? { direction: 'down', value: t('safety.briefings.requireAttention') } : undefined}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('safety.briefings.searchPlaceholder')}
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

      <DataTable<SafetyBriefing>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('safety.briefings.emptyTitle')}
        emptyDescription={t('safety.briefings.emptyDescription')}
      />
    </div>
  );
};

export default SafetyBriefingListPage;
