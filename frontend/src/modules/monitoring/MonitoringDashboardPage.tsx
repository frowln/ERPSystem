import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Server,
  HardDrive,
  Globe,
  Zap,
  Gauge,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SystemEvent {
  id: string;
  timestamp: string;
  service: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  details?: string;
}

interface HealthCheck {
  id: string;
  service: string;
  icon: React.ElementType;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  uptime: string;
  lastCheck: string;
}

const eventLevelColorMap: Record<string, 'blue' | 'yellow' | 'red' | 'gray'> = {
  info: 'blue',
  warning: 'yellow',
  error: 'red',
  critical: 'red',
};

const getEventLevelLabels = (): Record<string, string> => ({
  info: t('monitoring.levelInfo'),
  warning: t('monitoring.levelWarning'),
  error: t('monitoring.levelError'),
  critical: t('monitoring.levelCritical'),
});

const healthStatusColorMap: Record<string, 'green' | 'yellow' | 'red'> = {
  healthy: 'green',
  degraded: 'yellow',
  down: 'red',
};

const getHealthStatusLabels = (): Record<string, string> => ({
  healthy: t('monitoring.healthHealthy'),
  degraded: t('monitoring.healthDegraded'),
  down: t('monitoring.healthDown'),
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

const healthChecks: HealthCheck[] = [
  { id: '1', service: 'PostgreSQL', icon: Database, status: 'healthy', responseTime: 12, uptime: '99.98%', lastCheck: '11:20' },
  { id: '2', service: 'Redis', icon: Zap, status: 'healthy', responseTime: 2, uptime: '99.99%', lastCheck: '11:20' },
  { id: '3', service: 'MinIO (S3)', icon: HardDrive, status: 'degraded', responseTime: 250, uptime: '99.85%', lastCheck: '11:20' },
  { id: '4', service: 'API Gateway', icon: Globe, status: 'healthy', responseTime: 45, uptime: '99.95%', lastCheck: '11:20' },
  { id: '5', service: 'Auth Service', icon: Server, status: 'healthy', responseTime: 28, uptime: '99.97%', lastCheck: '11:20' },
  { id: '6', service: 'Notification Service', icon: Server, status: 'healthy', responseTime: 35, uptime: '99.92%', lastCheck: '11:20' },
  { id: '7', service: 'File Processor', icon: Server, status: 'healthy', responseTime: 120, uptime: '99.90%', lastCheck: '11:20' },
  { id: '8', service: 'Elasticsearch', icon: Database, status: 'healthy', responseTime: 18, uptime: '99.96%', lastCheck: '11:20' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MonitoringDashboardPage: React.FC = () => {
  const [eventFilter, setEventFilter] = useState<string>('all');

  const { data: evtData, isLoading } = useQuery({
    queryKey: ['monitoring-events'],
    queryFn: () => Promise.resolve({ content: [] as SystemEvent[], totalElements: 0, totalPages: 0, page: 0, size: 20 }),
  });

  const events = evtData?.content ?? [];

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    return events.filter((e) => e.level === eventFilter);
  }, [events, eventFilter]);

  const errorsCount = events.filter((e) => e.level === 'ERROR' || e.level === 'CRITICAL').length;
  const warningsCount = events.filter((e) => e.level === 'WARNING').length;
  const avgResponseTime = Math.round(healthChecks.reduce((s, h) => s + h.responseTime, 0) / healthChecks.length);
  const activeUsers = 23; // mock

  const eventLevelLabels = getEventLevelLabels();

  const eventColumns = useMemo<ColumnDef<SystemEvent, unknown>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: t('monitoring.colTime'),
      size: 160,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'level',
      header: t('monitoring.colLevel'),
      size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={eventLevelColorMap} label={eventLevelLabels[getValue<string>()] ?? getValue<string>()} />,
    },
    { accessorKey: 'SERVICE', header: t('monitoring.colService'), size: 140, cell: ({ getValue }) => <span className="font-medium text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    {
      accessorKey: 'message',
      header: t('monitoring.colMessage'),
      size: 350,
      cell: ({ row }) => (
        <div>
          <p className="text-neutral-900 dark:text-neutral-100 text-sm">{row.original.message}</p>
          {row.original.details && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.details}</p>}
        </div>
      ),
    },
  ], [eventLevelLabels]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('monitoring.title')}
        subtitle={t('monitoring.subtitle')}
        breadcrumbs={[{ label: t('monitoring.breadcrumbHome'), href: '/' }, { label: t('monitoring.breadcrumbAnalytics'), href: '/analytics' }, { label: t('monitoring.breadcrumbMonitoring') }]}
        actions={
          <Button variant="secondary" iconLeft={<RefreshCw size={16} />}>
            {t('monitoring.refresh')}
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Activity size={18} />} label="Uptime" value="99.95%" trend={{ direction: 'up', value: '+0.02%' }} subtitle={t('monitoring.metricUptimeSubtitle')} />
        <MetricCard icon={<Clock size={18} />} label={t('monitoring.metricAvgResponse')} value={`${avgResponseTime} ${t('monitoring.msUnit')}`} trend={{ direction: avgResponseTime < 100 ? 'down' : 'up', value: avgResponseTime < 100 ? `-5 ${t('monitoring.msUnit')}` : `+15 ${t('monitoring.msUnit')}` }} />
        <MetricCard icon={<Users size={18} />} label={t('monitoring.metricActiveUsers')} value={activeUsers} subtitle={t('monitoring.metricActiveUsersSubtitle')} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('monitoring.metricErrorsPerHour')} value={errorsCount} trend={errorsCount > 2 ? { direction: 'up', value: `${errorsCount}` } : { direction: 'neutral', value: '0' }} />
      </div>

      {/* Health checks */}
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('monitoring.serviceStatus')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {healthChecks.map((hc) => {
          const Icon = hc.icon;
          return (
            <div key={hc.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-neutral-400" />
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{hc.service}</h4>
                </div>
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  hc.status === 'healthy' ? 'bg-success-500' : hc.status === 'degraded' ? 'bg-warning-500' : 'bg-danger-500',
                )} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">{t('monitoring.hcTime')}</p>
                  <p className={cn('font-medium tabular-nums', hc.responseTime > 200 ? 'text-warning-600' : 'text-neutral-900 dark:text-neutral-100')}>{hc.responseTime} {t('monitoring.msUnit')}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">Uptime</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{hc.uptime}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">{t('monitoring.hcCheck')}</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{hc.lastCheck}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prometheus Metrics Export */}
      <div className="mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <Gauge size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('monitoring.prometheusTitle')}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('monitoring.prometheusDescription')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full animate-pulse bg-success-500" />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {t('monitoring.prometheusExporting')}
                </span>
              </div>
              <a
                href="/actuator/prometheus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                /actuator/prometheus
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('monitoring.systemEvents')}</h3>
        <div className="flex items-center gap-1.5">
          {['all', 'INFO', 'WARNING', 'ERROR'].map((level) => (
            <button
              key={level}
              onClick={() => setEventFilter(level)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                eventFilter === level ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              {level === 'all' ? t('monitoring.filterAll') : eventLevelLabels[level]}
            </button>
          ))}
        </div>
      </div>

      <DataTable<SystemEvent>
        data={filteredEvents}
        columns={eventColumns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('monitoring.emptyTitle')}
        emptyDescription={t('monitoring.emptyDescription')}
      />
    </div>
  );
};

export default MonitoringDashboardPage;
