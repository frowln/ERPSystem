import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Headphones,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { supportApi } from '@/api/support';
import { formatRelativeTime } from '@/lib/format';
import type { SupportTicket } from './types';
import { t } from '@/i18n';

const ticketStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  OPEN: 'blue',
  ASSIGNED: 'cyan',
  IN_PROGRESS: 'orange',
  WAITING_RESPONSE: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

const getTicketStatusLabels = (): Record<string, string> => ({
  OPEN: t('support.colOpen'),
  ASSIGNED: t('support.colAssigned'),
  IN_PROGRESS: t('support.colInProgress'),
  WAITING_RESPONSE: t('support.colWaitingResponse'),
  RESOLVED: t('support.colResolved'),
  CLOSED: t('support.colClosed'),
});

const ticketPriorityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const getTicketPriorityLabels = (): Record<string, string> => ({
  LOW: t('support.priorityLow'),
  MEDIUM: t('support.priorityMedium'),
  HIGH: t('support.priorityHigh'),
  CRITICAL: t('support.priorityCritical'),
});

const getCategoryLabels = (): Record<string, string> => ({
  TECHNICAL: t('support.catTechnical'),
  ACCESS: t('support.catAccess'),
  DOCUMENTS: t('support.catDocuments'),
  EQUIPMENT: t('support.catEquipment'),
  SAFETY: t('support.catSafety'),
  SCHEDULE: t('support.catSchedule'),
  OTHER: t('support.catOther'),
  BUG: t('support.catBug'),
  QUESTION: t('support.catQuestion'),
  FEATURE_REQUEST: t('support.catFeatureRequest'),
});

function categoryLabel(value?: string): string {
  if (!value) return t('support.catNone');
  return getCategoryLabels()[value] ?? value;
}

function averageResolutionHours(tickets: SupportTicket[]): number {
  const resolved = tickets.filter(
    (ticket) => (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && ticket.resolvedDate,
  );

  if (resolved.length === 0) return 0;

  const hoursSum = resolved.reduce((sum, ticket) => {
    const resolvedAt = new Date(ticket.resolvedDate!).getTime();
    const createdAt = new Date(ticket.createdAt).getTime();
    if (Number.isNaN(resolvedAt) || Number.isNaN(createdAt) || resolvedAt < createdAt) return sum;
    return sum + ((resolvedAt - createdAt) / (1000 * 60 * 60));
  }, 0);

  return Math.round((hoursSum / resolved.length) * 10) / 10;
}

const SupportDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: ticketPage,
    isError: ticketsError,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['support-tickets', { page: 0, size: 200 }],
    queryFn: async () => {
      try {
        return await supportApi.getTickets({ page: 0, size: 200 });
      } catch {
        return { content: [] as SupportTicket[], totalElements: 0, totalPages: 0, size: 200, number: 0 };
      }
    },
    retry: 1,
  });

  const {
    data: dashboardStats,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['support-dashboard'],
    queryFn: async () => {
      try {
        return await supportApi.getDashboardStats();
      } catch {
        return undefined;
      }
    },
    retry: 1,
  });

  const tickets = ticketPage?.content ?? [];

  useEffect(() => {
    if (dashboardError && !ticketsError) {
      toast.error(t('support.errorLoadDashboard'));
    }
  }, [dashboardError, ticketsError]);

  const metrics = useMemo(() => {
    const total = dashboardStats?.totalTickets ?? tickets.length;
    const openTickets = dashboardStats?.openTickets
      ?? tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length;

    const criticalOpen = tickets.filter(
      (ticket) => ticket.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(ticket.status),
    ).length;

    const today = new Date().toISOString().split('T')[0];
    const resolvedToday = tickets.filter((ticket) => (
      (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')
      && Boolean(ticket.resolvedDate)
      && ticket.resolvedDate!.startsWith(today)
    )).length;

    return {
      total,
      openTickets,
      criticalOpen,
      resolvedToday,
      avgResolutionHours: averageResolutionHours(tickets),
    };
  }, [dashboardStats, tickets]);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets
      .filter((ticket) => !['RESOLVED', 'CLOSED'].includes(ticket.status))
      .forEach((ticket) => {
        const key = ticket.category ?? 'UNCATEGORIZED';
        counts[key] = (counts[key] || 0) + 1;
      });

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        label: category === 'UNCATEGORIZED' ? t('support.catUncategorized') : categoryLabel(category),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  const recentTickets = useMemo(
    () => (
      [...tickets]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    ),
    [tickets],
  );

  const showFatalError = tickets.length === 0 && ticketsError && dashboardError;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('support.dashboardTitle')}
        subtitle={t('support.dashboardSubtitle')}
        breadcrumbs={[
          { label: t('support.breadcrumbHome'), href: '/' },
          { label: t('support.breadcrumbSupport'), href: '/support/tickets' },
          { label: t('support.breadcrumbDashboard') },
        ]}
        actions={(
          <Button onClick={() => navigate('/support/tickets')}>
            {t('support.btnAllTickets')}
          </Button>
        )}
      />

      {showFatalError ? (
        <EmptyState
          variant="ERROR"
          title={t('support.errorLoadDashboard')}
          description={t('support.errorLoadDashboardDesc')}
          actionLabel={t('support.btnRetry')}
          onAction={() => {
            void Promise.all([refetchTickets(), refetchDashboard()]);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard icon={<Headphones size={18} />} label={t('support.metricTotalTickets')} value={metrics.total} />
            <MetricCard
              icon={<Clock size={18} />}
              label={t('support.metricOpenTickets')}
              value={metrics.openTickets}
              trend={{ direction: metrics.openTickets > 0 ? 'up' : 'neutral', value: t('support.trendItemsCount', { count: String(metrics.openTickets) }) }}
            />
            <MetricCard
              icon={<AlertTriangle size={18} />}
              label={t('support.metricCritical')}
              value={metrics.criticalOpen}
              trend={{
                direction: metrics.criticalOpen > 0 ? 'down' : 'neutral',
                value: metrics.criticalOpen > 0 ? t('support.trendNeedAttention') : t('support.trendNone'),
              }}
            />
            <MetricCard icon={<CheckCircle size={18} />} label={t('support.metricResolvedToday')} value={metrics.resolvedToday} />
            <MetricCard
              icon={<TrendingUp size={18} />}
              label={t('support.metricAvgResolution')}
              value={t('support.avgResolutionValue', { hours: String(metrics.avgResolutionHours) })}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('support.sectionRecentTickets')}</h3>
                <Button
                  variant="ghost"
                  size="xs"
                  iconRight={<ArrowRight size={14} />}
                  onClick={() => navigate('/support/tickets')}
                >
                  {t('support.btnAllTickets')}
                </Button>
              </div>

              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors border border-neutral-100 dark:border-neutral-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-neutral-400">{ticket.number}</span>
                        <StatusBadge
                          status={ticket.priority}
                          colorMap={ticketPriorityColorMap}
                          label={getTicketPriorityLabels()[ticket.priority] ?? ticket.priority}
                        />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{ticket.subject}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {(ticket.requesterName ?? ticket.requesterId ?? t('support.noAuthor'))} &middot; {formatRelativeTime(ticket.createdAt)}
                      </p>
                    </div>
                    <StatusBadge
                      status={ticket.status}
                      colorMap={ticketStatusColorMap}
                      label={getTicketStatusLabels()[ticket.status] ?? ticket.status}
                    />
                  </div>
                ))}

                {recentTickets.length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">{t('support.noTicketsYet')}</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('support.sectionOpenByCategory')}</h3>
              </div>

              <div className="space-y-3">
                {categoryStats.map((stat) => (
                  <div key={stat.category} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{stat.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${Math.min(100, (stat.count / Math.max(1, metrics.openTickets)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 w-6 text-right">{stat.count}</span>
                    </div>
                  </div>
                ))}

                {categoryStats.length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">{t('support.noOpenTickets')}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportDashboardPage;
