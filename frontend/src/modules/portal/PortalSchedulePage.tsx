import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CalendarDays,
  CheckCircle,
  AlertTriangle,
  Play,
  List,
  LayoutGrid,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { portalApi } from '@/api/portal';
import { formatDate, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { PortalScheduleItem } from './types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type ViewMode = 'timeline' | 'list';

const statusColorMap: Record<string, string> = {
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  DELAYED: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  NOT_STARTED: t('portal.schedule.statusNotStarted'),
  IN_PROGRESS: t('portal.schedule.statusInProgress'),
  COMPLETED: t('portal.schedule.statusCompleted'),
  DELAYED: t('portal.schedule.statusDelayed'),
});

const PortalSchedulePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['portal-schedule'],
    queryFn: () => portalApi.getSchedule({ size: 200 }),
  });

  const items = data?.content ?? [];

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    const statusMap: Record<string, string> = {
      in_progress: 'IN_PROGRESS',
      delayed: 'DELAYED',
      completed: 'COMPLETED',
      not_started: 'NOT_STARTED',
    };
    const mappedStatus = statusMap[activeTab] ?? activeTab.toUpperCase();
    return items.filter((i) => i.status === mappedStatus);
  }, [items, activeTab]);

  const metrics = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'COMPLETED').length;
    const inProgress = items.filter((i) => i.status === 'IN_PROGRESS').length;
    const delayed = items.filter((i) => i.status === 'DELAYED').length;
    const avgProgress = total > 0 ? items.reduce((s, i) => s + i.progress, 0) / total : 0;
    return { total, completed, inProgress, delayed, avgProgress };
  }, [items]);

  const tabs = [
    { id: 'all', label: t('portal.schedule.tabAll'), count: metrics.total },
    { id: 'in_progress', label: t('portal.schedule.tabInProgress'), count: metrics.inProgress },
    { id: 'delayed', label: t('portal.schedule.tabDelayed'), count: metrics.delayed },
    { id: 'completed', label: t('portal.schedule.tabCompleted'), count: metrics.completed },
  ];

  // Group items by project for timeline view
  const projectGroups = useMemo(() => {
    const groups = new Map<string, { projectName: string; items: PortalScheduleItem[] }>();
    filteredItems.forEach((item) => {
      const existing = groups.get(item.projectId);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.projectId, { projectName: item.projectName, items: [item] });
      }
    });
    return Array.from(groups.values());
  }, [filteredItems]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (items.length === 0) return { start: new Date(), end: new Date(), totalDays: 30 };
    const dates = items.flatMap((i) => [new Date(i.startDate), new Date(i.endDate)]);
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));
    // Add some padding
    start.setDate(start.getDate() - 3);
    end.setDate(end.getDate() + 3);
    const totalDays = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);
    return { start, end, totalDays };
  }, [items]);

  const getBarStyle = (item: PortalScheduleItem) => {
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    const startOffset = Math.max(0, (startDate.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const leftPercent = (startOffset / timelineRange.totalDays) * 100;
    const widthPercent = (duration / timelineRange.totalDays) * 100;
    return { left: `${leftPercent}%`, width: `${Math.min(widthPercent, 100 - leftPercent)}%` };
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'DELAYED': return 'bg-red-500';
      default: return 'bg-neutral-400';
    }
  };

  const statusLabels = getStatusLabels();

  const columns: ColumnDef<PortalScheduleItem, unknown>[] = [
    {
      accessorKey: 'title',
      header: t('portal.schedule.colTitle'),
      size: 250,
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</span>
          {row.original.milestoneName && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.milestoneName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'projectName',
      header: t('portal.schedule.colProject'),
      size: 180,
    },
    {
      accessorKey: 'status',
      header: t('portal.schedule.colStatus'),
      size: 130,
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          colorMap={statusColorMap}
          label={statusLabels[row.original.status] ?? row.original.status}
        />
      ),
    },
    {
      accessorKey: 'progress',
      header: t('portal.schedule.colProgress'),
      size: 140,
      cell: ({ row }) => {
        const val = row.original.progress;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
              <div
                className={cn('h-full rounded-full', getBarColor(row.original.status))}
                style={{ width: `${Math.min(val, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatPercent(val)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: t('portal.schedule.colStartDate'),
      size: 110,
      cell: ({ row }) => (
        <span className="text-neutral-700 dark:text-neutral-300 tabular-nums text-sm">{formatDate(row.original.startDate)}</span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: t('portal.schedule.colEndDate'),
      size: 110,
      cell: ({ row }) => {
        const isOverdue = new Date(row.original.endDate) < new Date() && row.original.status !== 'COMPLETED';
        return (
          <span className={cn('tabular-nums text-sm', isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-700 dark:text-neutral-300')}>
            {formatDate(row.original.endDate)}
          </span>
        );
      },
    },
    {
      accessorKey: 'assignedTeam',
      header: t('portal.schedule.colTeam'),
      size: 150,
      cell: ({ row }) => (
        <span className="text-neutral-600 dark:text-neutral-400">{row.original.assignedTeam || '\u2014'}</span>
      ),
    },
  ];

  // Generate month markers for timeline
  const monthMarkers = useMemo(() => {
    const markers: { label: string; leftPercent: number }[] = [];
    const current = new Date(timelineRange.start);
    current.setDate(1);
    current.setMonth(current.getMonth() + 1);
    while (current <= timelineRange.end) {
      const dayOffset = (current.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24);
      const leftPercent = (dayOffset / timelineRange.totalDays) * 100;
      if (leftPercent >= 0 && leftPercent <= 100) {
        markers.push({
          label: format(current, 'MMM yy', { locale: ru }),
          leftPercent,
        });
      }
      current.setMonth(current.getMonth() + 1);
    }
    return markers;
  }, [timelineRange]);

  // Today marker
  const todayPercent = useMemo(() => {
    const now = new Date();
    const dayOffset = (now.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24);
    return (dayOffset / timelineRange.totalDays) * 100;
  }, [timelineRange]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.schedule.title')}
        subtitle={t('portal.schedule.subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: t('portal.schedule.breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'timeline' ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('timeline')}
              title={t('portal.schedule.viewTimeline')}
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => setViewMode('list')}
              title={t('portal.schedule.viewList')}
            >
              <List size={14} />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<CalendarDays size={18} />} label={t('portal.schedule.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Play size={18} />} label={t('portal.schedule.metricInProgress')} value={metrics.inProgress} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('portal.schedule.metricDelayed')}
          value={metrics.delayed}
          trend={metrics.delayed > 0 ? { direction: 'up', value: t('portal.schedule.trendNeedsAttention') } : undefined}
        />
        <MetricCard icon={<CheckCircle size={18} />} label={t('portal.schedule.metricAvgProgress')} value={formatPercent(metrics.avgProgress)} />
      </div>

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={filteredItems}
          loading={isLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          emptyTitle={t('portal.schedule.emptyTitle')}
          emptyDescription={t('portal.schedule.emptyDescription')}
        />
      ) : (
        /* Timeline (Gantt-like) View */
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('portal.schedule.emptyTitle')}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{t('portal.schedule.emptyDescription')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Timeline header with month markers */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-700">
                  <div className="w-64 flex-shrink-0 px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-700">
                    {t('portal.schedule.colTitle')}
                  </div>
                  <div className="flex-1 relative h-10">
                    {monthMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 h-full border-l border-neutral-200 dark:border-neutral-700"
                        style={{ left: `${marker.leftPercent}%` }}
                      >
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-1 whitespace-nowrap">{marker.label}</span>
                      </div>
                    ))}
                    {todayPercent >= 0 && todayPercent <= 100 && (
                      <div
                        className="absolute top-0 h-full border-l-2 border-red-400 z-10"
                        style={{ left: `${todayPercent}%` }}
                      >
                        <span className="text-[9px] text-red-500 font-medium ml-0.5">{t('portal.schedule.today')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline rows grouped by project */}
                {projectGroups.map((group) => (
                  <div key={group.projectName}>
                    <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{group.projectName}</span>
                    </div>
                    {group.items.map((item) => {
                      const barStyle = getBarStyle(item);
                      return (
                        <div key={item.id} className="flex border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge
                                status={item.status}
                                colorMap={statusColorMap}
                                label={statusLabels[item.status] ?? item.status}
                                size="sm"
                              />
                              <span className="text-[10px] text-neutral-400 tabular-nums">{formatPercent(item.progress)}</span>
                            </div>
                          </div>
                          <div className="flex-1 relative py-3 px-1">
                            {/* Month gridlines */}
                            {monthMarkers.map((marker, idx) => (
                              <div
                                key={idx}
                                className="absolute top-0 h-full border-l border-neutral-100 dark:border-neutral-800"
                                style={{ left: `${marker.leftPercent}%` }}
                              />
                            ))}
                            {/* Today line */}
                            {todayPercent >= 0 && todayPercent <= 100 && (
                              <div
                                className="absolute top-0 h-full border-l-2 border-red-400/30 z-10"
                                style={{ left: `${todayPercent}%` }}
                              />
                            )}
                            {/* Gantt bar */}
                            <div
                              className={cn('absolute top-1/2 -translate-y-1/2 h-5 rounded-md', getBarColor(item.status), 'opacity-80')}
                              style={barStyle}
                              title={`${item.title}: ${formatDate(item.startDate)} \u2014 ${formatDate(item.endDate)} (${formatPercent(item.progress)})`}
                            >
                              {/* Progress fill */}
                              <div
                                className="h-full rounded-md bg-white/20"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortalSchedulePage;
