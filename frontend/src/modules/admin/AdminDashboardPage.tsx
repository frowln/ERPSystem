import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, FolderKanban, HardDrive, Activity, Shield, Settings, FileText,
  ArrowRight, CheckCircle, XCircle, AlertTriangle, Clock, Headphones,
  LifeBuoy, Server, Database, Cpu, BarChart3, TrendingUp, Eye,
  UserCheck, UserX, Zap, Bell, MessageCircle, Mail,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { t } from '@/i18n';
import { adminApi, type DashboardMetrics, type ServiceHealthStatus } from '@/api/admin';
import { supportApi } from '@/api/support';
import { formatRelativeTime } from '@/lib/format';

/* ─── Metric Card ─── */
const MetricTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  onClick?: () => void;
}> = ({ icon, label, value, color, bg, trend, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={cn(
      'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 text-left transition-all',
      onClick && 'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer',
    )}
  >
    <div className="flex items-start justify-between">
      <div className={cn('p-2.5 rounded-xl', bg)}>{icon}</div>
      {trend && (
        <span className={cn(
          'text-[11px] font-semibold px-2 py-0.5 rounded-full',
          trend.direction === 'up' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
          trend.direction === 'down' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
          'bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
        )}>
          {trend.value}
        </span>
      )}
    </div>
    <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{value}</p>
    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
  </button>
);

/* ─── Status Dot ─── */
const StatusDot: React.FC<{ healthy: boolean }> = ({ healthy }) => (
  <span className={cn('inline-block w-2.5 h-2.5 rounded-full', healthy ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
);

/* ─── Priority colors ─── */
const priorityColors: Record<string, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const statusColors: Record<string, string> = {
  OPEN: 'blue',
  ASSIGNED: 'cyan',
  IN_PROGRESS: 'orange',
  WAITING_RESPONSE: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

/* ─── Page ─── */
const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.getMetrics,
    refetchInterval: 30000,
  });

  const { data: ticketPage } = useQuery({
    queryKey: ['admin-support-tickets', { page: 0, size: 100 }],
    queryFn: () => supportApi.getTickets({ page: 0, size: 100 }),
    refetchInterval: 15000,
  });

  const { data: auditData } = useQuery({
    queryKey: ['admin-audit-latest'],
    queryFn: () => adminApi.getAuditLogs({ size: 15 }),
    refetchInterval: 15000,
  });

  const { data: healthData } = useQuery<ServiceHealthStatus[]>({
    queryKey: ['admin-health-check'],
    queryFn: adminApi.checkHealth,
    refetchInterval: 60000,
  });

  const tickets = ticketPage?.content ?? [];
  const auditLogs = auditData?.content ?? [];
  const recentActions = metrics?.recentActions ?? [];

  // Support metrics
  const supportMetrics = useMemo(() => {
    const open = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const critical = tickets.filter((t) => t.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const waitingResponse = tickets.filter((t) => t.status === 'WAITING_RESPONSE').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const resolvedToday = tickets.filter((t) =>
      (t.status === 'RESOLVED' || t.status === 'CLOSED') && t.resolvedDate?.startsWith(todayStr),
    ).length;
    return { total: tickets.length, open, critical, waitingResponse, resolvedToday };
  }, [tickets]);

  // Recent open tickets (for widget)
  const recentOpenTickets = useMemo(() =>
    tickets
      .filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6),
  [tickets]);

  // System health entries — use real health check data
  const serviceNameMap: Record<string, { label: string; icon: React.ElementType }> = {
    database: { label: t('admin.serviceDatabase'), icon: Database },
    api: { label: t('admin.serviceApi'), icon: Server },
    storage: { label: t('admin.serviceStorage'), icon: HardDrive },
    workers: { label: t('admin.serviceWorkers'), icon: Cpu },
  };
  const systemServices = (healthData ?? [
    { name: 'database', healthy: metrics?.systemHealthy ?? true },
    { name: 'api', healthy: metrics?.systemHealthy ?? true },
    { name: 'storage', healthy: metrics?.systemHealthy ?? true },
    { name: 'workers', healthy: metrics?.systemHealthy ?? true },
  ]).map((svc) => ({
    name: serviceNameMap[svc.name]?.label ?? svc.name,
    icon: serviceNameMap[svc.name]?.icon ?? Server,
    healthy: svc.healthy,
    responseTimeMs: svc.responseTimeMs,
  }));
  const allHealthy = systemServices.every((s) => s.healthy);

  const quickActions = [
    { label: t('adminDashboard.manageUsers'), icon: Users, href: '/admin/users', color: 'text-blue-600 dark:text-blue-400' },
    { label: t('adminDashboard.permissions'), icon: Shield, href: '/admin/permissions', color: 'text-purple-600 dark:text-purple-400' },
    { label: t('adminDashboard.auditLogs'), icon: FileText, href: '/admin/audit-logs', color: 'text-amber-600 dark:text-amber-400' },
    { label: t('adminDashboard.settings'), icon: Settings, href: '/admin/settings', color: 'text-neutral-600 dark:text-neutral-400' },
    { label: t('admin.allTickets'), icon: Headphones, href: '/support/tickets', color: 'text-cyan-600 dark:text-cyan-400' },
    { label: t('admin.supportDashboard'), icon: BarChart3, href: '/support/dashboard', color: 'text-green-600 dark:text-green-400' },
  ];

  const actionColorMap: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    STATUS_CHANGE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('adminDashboard.title')}
        subtitle={t('adminDashboard.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title') },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Row 1: Key Metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              label={t('adminDashboard.totalUsers')}
              value={metrics?.totalUsers ?? 0}
              color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20"
              onClick={() => navigate('/admin/users')}
            />
            <MetricTile
              icon={<FolderKanban className="h-5 w-5 text-green-600 dark:text-green-400" />}
              label={t('adminDashboard.totalProjects')}
              value={metrics?.totalProjects ?? 0}
              color="text-green-600" bg="bg-green-50 dark:bg-green-900/20"
            />
            <MetricTile
              icon={<HardDrive className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              label={t('adminDashboard.storage')}
              value={`${metrics?.storageUsedMb ?? 0} MB`}
              color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20"
            />
            <MetricTile
              icon={<Headphones className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
              label={t('admin.openTickets')}
              value={supportMetrics.open}
              color="text-cyan-600" bg="bg-cyan-50 dark:bg-cyan-900/20"
              trend={supportMetrics.critical > 0
                ? { value: `${supportMetrics.critical} ${t('admin.critical')}`, direction: 'down' }
                : undefined}
              onClick={() => navigate('/support/tickets')}
            />
          </div>

          {/* ── Row 2: System Health + Support Overview ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-neutral-400" />
                  {t('admin.systemHealth')}
                </h3>
                <div className="flex items-center gap-1.5">
                  <StatusDot healthy={allHealthy} />
                  <span className={cn('text-xs font-medium', allHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    {allHealthy ? t('adminDashboard.healthy') : t('adminDashboard.unhealthy')}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {systemServices.map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <div key={svc.name} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {svc.responseTimeMs != null && (
                          <span className="text-[10px] text-neutral-400 tabular-nums">{svc.responseTimeMs}ms</span>
                        )}
                        <StatusDot healthy={svc.healthy} />
                        <span className={cn('text-xs', svc.healthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                          {svc.healthy ? t('admin.operational') : t('admin.down')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Support Tickets Overview */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-neutral-400" />
                  {t('admin.supportTickets')}
                </h3>
                <button
                  onClick={() => navigate('/support/tickets')}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  {t('admin.viewAll')} <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Mini metrics row */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: t('admin.ticketOpen'), value: supportMetrics.open, color: 'text-blue-600 dark:text-blue-400' },
                  { label: t('admin.ticketCritical'), value: supportMetrics.critical, color: supportMetrics.critical > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400' },
                  { label: t('admin.ticketWaiting'), value: supportMetrics.waitingResponse, color: 'text-amber-600 dark:text-amber-400' },
                  { label: t('admin.ticketResolved'), value: supportMetrics.resolvedToday, color: 'text-green-600 dark:text-green-400' },
                ].map((m) => (
                  <div key={m.label} className="text-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <p className={cn('text-lg font-bold tabular-nums', m.color)}>{m.value}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent open tickets */}
              <div className="space-y-2">
                {recentOpenTickets.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400">
                    <CheckCircle className="h-6 w-6 mx-auto mb-1 opacity-30" />
                    <p className="text-sm">{t('admin.noOpenTickets')}</p>
                  </div>
                ) : recentOpenTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-neutral-400">{ticket.number}</span>
                        <StatusBadge status={ticket.priority} colorMap={priorityColors as any} label={ticket.priority} />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate mt-0.5">{ticket.subject}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={ticket.status} colorMap={statusColors as any} label={ticket.status} />
                      <p className="text-[10px] text-neutral-400 mt-1">{formatRelativeTime(ticket.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 3: Activity Log + Quick Actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-neutral-400" />
                  {t('admin.activityFeed')}
                </h3>
                <button
                  onClick={() => navigate('/admin/audit-logs')}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  {t('admin.viewAll')} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                {(auditLogs.length > 0 ? auditLogs : recentActions).slice(0, 10).map((entry: any) => {
                  const action = entry.action ?? 'UPDATE';
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-semibold text-neutral-500 shrink-0">
                        {(entry.userName ?? 'S').split(' ').map((p: string) => p[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.userName ?? 'System'}</span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', actionColorMap[action] ?? actionColorMap.UPDATE)}>
                            {action}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {entry.entityType}{entry.field ? ` → ${entry.field}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0 tabular-nums">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                  );
                })}
                {auditLogs.length === 0 && recentActions.length === 0 && (
                  <p className="text-sm text-neutral-400 text-center py-6">{t('adminDashboard.noActivity')}</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-neutral-400" />
                {t('adminDashboard.quickActions')}
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.href}
                      onClick={() => navigate(action.href)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left group"
                    >
                      <Icon className={cn('h-5 w-5', action.color)} />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex-1">{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
