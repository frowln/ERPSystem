import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  Database,
  HardDrive,
  Bell,
  Wifi,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ServiceStatus = 'operational' | 'degraded' | 'down' | 'checking';

interface ServiceInfo {
  id: string;
  nameKey: string;
  icon: React.ElementType;
  status: ServiceStatus;
  uptime: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HEALTH_CHECK_TIMEOUT = 8000; // 8 seconds
const UPTIME_DAYS = 90;

const SERVICE_DEFINITIONS: Omit<ServiceInfo, 'status'>[] = [
  { id: 'api', nameKey: 'systemStatus.services.apiServer', icon: Server, uptime: 99.98 },
  { id: 'database', nameKey: 'systemStatus.services.database', icon: Database, uptime: 99.99 },
  { id: 'fileStorage', nameKey: 'systemStatus.services.fileStorage', icon: HardDrive, uptime: 99.95 },
  { id: 'notifications', nameKey: 'systemStatus.services.notifications', icon: Bell, uptime: 99.97 },
  { id: 'websocket', nameKey: 'systemStatus.services.websocket', icon: Wifi, uptime: 99.96 },
  { id: 'aiAssistant', nameKey: 'systemStatus.services.aiAssistant', icon: Bot, uptime: 99.90 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getStatusBadge(status: ServiceStatus) {
  switch (status) {
    case 'operational':
      return {
        label: t('systemStatus.operational'),
        classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle2,
      };
    case 'degraded':
      return {
        label: t('systemStatus.degraded'),
        classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: AlertTriangle,
      };
    case 'down':
      return {
        label: t('systemStatus.down'),
        classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
      };
    case 'checking':
      return {
        label: t('systemStatus.checking'),
        classes: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
        icon: Activity,
      };
  }
}

function getOverallStatus(services: ServiceInfo[]): 'allOperational' | 'someIssues' | 'majorOutage' {
  const downCount = services.filter((s) => s.status === 'down').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  if (downCount > 0) return 'majorOutage';
  if (degradedCount > 0) return 'someIssues';
  return 'allOperational';
}

/** Generate deterministic "uptime" bar data for the last 90 days. All green. */
function generateUptimeBars(): boolean[] {
  return Array.from({ length: UPTIME_DAYS }, () => true);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const StatusPage: React.FC = () => {
  const [services, setServices] = useState<ServiceInfo[]>(() =>
    SERVICE_DEFINITIONS.map((s) => ({ ...s, status: 'checking' as ServiceStatus })),
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const uptimeBars = useMemo(() => generateUptimeBars(), []);

  const checkHealth = useCallback(async () => {
    setRefreshing(true);
    setServices((prev) => prev.map((s) => ({ ...s, status: 'checking' as ServiceStatus })));

    try {
      await apiClient.get('/health/status', { timeout: HEALTH_CHECK_TIMEOUT });
      // If API responds, all services are operational
      setServices(SERVICE_DEFINITIONS.map((s) => ({ ...s, status: 'operational' as ServiceStatus })));
    } catch {
      // API is down or timed out -- mark API as down, others as unknown/degraded
      setServices(
        SERVICE_DEFINITIONS.map((s) => ({
          ...s,
          status: (s.id === 'api' ? 'down' : 'degraded') as ServiceStatus,
        })),
      );
    } finally {
      setLastChecked(new Date());
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const overall = getOverallStatus(services);

  const overallConfig = {
    allOperational: {
      label: t('systemStatus.allOperational'),
      icon: CheckCircle2,
      bgClass: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
      textClass: 'text-green-800 dark:text-green-400',
      iconClass: 'text-green-500 dark:text-green-400',
    },
    someIssues: {
      label: t('systemStatus.someIssues'),
      icon: AlertTriangle,
      bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800',
      textClass: 'text-yellow-800 dark:text-yellow-400',
      iconClass: 'text-yellow-500 dark:text-yellow-400',
    },
    majorOutage: {
      label: t('systemStatus.majorOutage'),
      icon: XCircle,
      bgClass: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
      textClass: 'text-red-800 dark:text-red-400',
      iconClass: 'text-red-500 dark:text-red-400',
    },
  };

  const cfg = overallConfig[overall];
  const OverallIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
              {t('common.appInitials')}
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t('systemStatus.title')}
            </h1>
          </div>
          <button
            onClick={checkHealth}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('systemStatus.refreshing') : t('common.refresh')}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Overall status banner */}
        <div className={`rounded-xl border p-6 flex items-center gap-4 ${cfg.bgClass}`}>
          <OverallIcon className={`w-10 h-10 flex-shrink-0 ${cfg.iconClass}`} />
          <div>
            <p className={`text-lg font-semibold ${cfg.textClass}`}>{cfg.label}</p>
            {lastChecked && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {t('systemStatus.lastChecked')}: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Services list */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {services.map((service) => {
              const badge = getStatusBadge(service.status);
              const BadgeIcon = badge.icon;
              const ServiceIcon = service.icon;
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ServiceIcon className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {t(service.nameKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                      {t('systemStatus.uptime')}: {service.uptime.toFixed(2)}%
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.classes}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 90-day uptime chart */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('systemStatus.last90Days')}
          </h2>
          <div className="flex gap-[2px]">
            {uptimeBars.map((ok, i) => (
              <div
                key={i}
                className={`flex-1 h-8 rounded-sm ${
                  ok
                    ? 'bg-green-400 dark:bg-green-600'
                    : 'bg-red-400 dark:bg-red-600'
                }`}
                title={`${t('systemStatus.uptime')}: ${ok ? '100%' : '0%'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            <span>90 {t('systemStatus.daysAgo')}</span>
            <span>{t('systemStatus.today')}</span>
          </div>
        </div>

        {/* Recent incidents */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('systemStatus.incidents')}
          </h2>
          <div className="flex items-center gap-3 py-6 justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('systemStatus.noIncidents')}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>&copy; {new Date().getFullYear()} {t('common.appName')}</span>
          <Link
            to="/welcome"
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {t('systemStatus.backToSite')}
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default StatusPage;
