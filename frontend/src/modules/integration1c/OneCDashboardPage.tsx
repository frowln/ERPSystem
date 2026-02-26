import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Building2,
  Wifi,
  WifiOff,
  Zap,
  Loader2,
  FileSpreadsheet,
  CreditCard,
  ArrowDownToLine,
  Users,
  RefreshCw,
  Clock,
  Activity,
  ArrowRight,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { integration1cApi } from '@/api/integration1c';
import { t } from '@/i18n';
import type { OneCConnectionStatus, ActivityRecord } from './types';

const activityStatusColorMap: Record<string, 'green' | 'yellow' | 'red'> = {
  success: 'green',
  partial: 'yellow',
  failed: 'red',
};

interface QuickLink {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const OneCDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [testingConnection, setTestingConnection] = useState(false);

  const { data: connectionStatus } = useQuery({
    queryKey: ['1c-connection-status'],
    queryFn: async () => {
      try {
        return await integration1cApi.getConnectionStatus();
      } catch {
        return null;
      }
    },
    refetchInterval: 60_000,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['1c-recent-activity'],
    queryFn: async () => {
      try {
        return await integration1cApi.getRecentActivity(10);
      } catch {
        return [];
      }
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => integration1cApi.testConnection(),
    onSuccess: (result) => {
      setTestingConnection(false);
      if (result.success) {
        toast.success(t('integration1c.connectionTestSuccess'));
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      setTestingConnection(false);
      toast.error(t('integration1c.connectionTestFailed'));
    },
  });

  const handleTestConnection = () => {
    setTestingConnection(true);
    testConnectionMutation.mutate();
  };

  // Metrics
  const todaySyncs = recentActivity.filter((a) => {
    const d = new Date(a.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const pendingItems = recentActivity.filter((a) => a.status === 'partial').length;

  const quickLinks: QuickLink[] = [
    {
      title: t('integration1c.linkKsExport'),
      description: t('integration1c.linkKsExportDesc'),
      icon: <FileSpreadsheet size={20} className="text-blue-500" />,
      href: '/settings/1c/ks-export',
    },
    {
      title: t('integration1c.linkPaymentExport'),
      description: t('integration1c.linkPaymentExportDesc'),
      icon: <CreditCard size={20} className="text-green-500" />,
      href: '/settings/1c/payment-export',
    },
    {
      title: t('integration1c.linkBankImport'),
      description: t('integration1c.linkBankImportDesc'),
      icon: <ArrowDownToLine size={20} className="text-purple-500" />,
      href: '/settings/1c/bank-import',
    },
    {
      title: t('integration1c.linkSync'),
      description: t('integration1c.linkSyncDesc'),
      icon: <Users size={20} className="text-orange-500" />,
      href: '/settings/1c/sync',
    },
  ];

  const activityColumns = useMemo<ColumnDef<ActivityRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'type',
        header: t('integration1c.colType'),
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const typeLabels: Record<string, string> = {
            import: t('integration1c.activityImport'),
            export: t('integration1c.activityExport'),
            sync: t('integration1c.activitySync'),
          };
          return (
            <StatusBadge
              status={val}
              colorMap={{ import: 'purple', export: 'blue', sync: 'orange' }}
              label={typeLabels[val] ?? val}
            />
          );
        },
      },
      {
        accessorKey: 'description',
        header: t('integration1c.colDescription'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'recordsCount',
        header: t('integration1c.colRecords'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integration1c.colStatus'),
        size: 100,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          const labelMap: Record<string, string> = {
            success: t('integration1c.statusSuccess'),
            partial: t('integration1c.statusPartial'),
            failed: t('integration1c.statusFailed'),
          };
          return (
            <StatusBadge
              status={status}
              colorMap={activityStatusColorMap}
              label={labelMap[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: t('integration1c.colTimestamp'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  const isConnected = connectionStatus?.connected ?? false;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integration1c.dashboardTitle')}
        subtitle={t('integration1c.dashboardSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('integration1c.breadcrumbSettings'), href: '/settings' },
          { label: t('integration1c.dashboardTitle') },
        ]}
        backTo="/settings"
      />

      {/* Connection status card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isConnected
                ? 'bg-green-50 dark:bg-green-900/30'
                : 'bg-red-50 dark:bg-red-900/30',
            )}>
              {isConnected
                ? <Wifi size={20} className="text-green-600 dark:text-green-400" />
                : <WifiOff size={20} className="text-red-600 dark:text-red-400" />}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                {isConnected ? t('integration1c.connectionActive') : t('integration1c.connectionInactive')}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {connectionStatus
                  ? `${connectionStatus.database} | v${connectionStatus.version}`
                  : t('integration1c.noConnectionInfo')}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={testingConnection ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            onClick={handleTestConnection}
            disabled={testingConnection}
          >
            {t('integration1c.testConnection')}
          </Button>
        </div>

        {connectionStatus && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <Clock size={12} />
            {t('integration1c.lastCheck')}: {formatDateTime(connectionStatus.lastCheck)}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Wifi size={16} />}
          label={t('integration1c.metricConnectionStatus')}
          value={isConnected ? t('integration1c.connected') : t('integration1c.disconnected')}
        />
        <MetricCard
          icon={<Activity size={16} />}
          label={t('integration1c.metricTodaySyncs')}
          value={todaySyncs}
        />
        <MetricCard
          icon={<Clock size={16} />}
          label={t('integration1c.metricPendingItems')}
          value={pendingItems}
        />
        <MetricCard
          icon={<Database size={16} />}
          label={t('integration1c.metricDatabase')}
          value={connectionStatus?.database ?? '--'}
        />
      </div>

      {/* Quick links */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('integration1c.quickLinks')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-left hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                  {link.icon}
                </div>
                <ArrowRight
                  size={14}
                  className="text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 transition-colors"
                />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {link.title}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {link.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('integration1c.recentActivity')}
        </h3>
      </div>
      <DataTable<ActivityRecord>
        data={recentActivity}
        columns={activityColumns}
        enableColumnVisibility
        enableDensityToggle
        pageSize={10}
        emptyTitle={t('integration1c.emptyActivityTitle')}
        emptyDescription={t('integration1c.emptyActivityDescription')}
      />
    </div>
  );
};

export default OneCDashboardPage;
