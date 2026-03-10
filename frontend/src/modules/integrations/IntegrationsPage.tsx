import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Link2,
  Send,
  MessageSquare,
  Cloud,
  HardDrive,
  Box,
  Calculator,
  Landmark,
  Key,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSync?: string;
  route: string;
}

const statusColorMap: Record<string, 'green' | 'gray' | 'red'> = {
  CONNECTED: 'green',
  DISCONNECTED: 'gray',
  ERROR: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  CONNECTED: t('integrations.main.statusConnected'),
  DISCONNECTED: t('integrations.main.statusDisconnected'),
  ERROR: t('integrations.main.statusError'),
});

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const getIntegrationCards = (): IntegrationCard[] => [
  {
    id: '1c',
    name: t('integrations.main.oneCName'),
    description: t('integrations.main.oneCDescription'),
    icon: Calculator,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    status: 'DISCONNECTED',
    route: '/integrations/1c',
  },
  {
    id: 'TELEGRAM',
    name: 'Telegram',
    description: t('integrations.main.telegramDescription'),
    icon: Send,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    status: 'CONNECTED',
    lastSync: '15.02.2026, 10:30',
    route: '/integrations/telegram',
  },
  {
    id: 'SBIS',
    name: t('integrations.main.sbisName'),
    description: t('integrations.main.sbisDescription'),
    icon: Landmark,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    status: 'DISCONNECTED',
    route: '/integrations/sbis',
  },
  {
    id: 'EDO',
    name: t('integrations.main.edoName'),
    description: t('integrations.main.edoDescription'),
    icon: HardDrive,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    status: 'DISCONNECTED',
    route: '/integrations/edo',
  },
  {
    id: 'sms',
    name: 'SMS',
    description: t('integrations.main.smsDescription'),
    icon: MessageSquare,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    status: 'DISCONNECTED',
    route: '/integrations/sms',
  },
  {
    id: 'weather',
    name: t('integrations.main.weatherName'),
    description: t('integrations.main.weatherDescription'),
    icon: Cloud,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    status: 'CONNECTED',
    lastSync: '15.02.2026, 09:00',
    route: '/integrations/weather',
  },
  {
    id: 'bim',
    name: 'BIM / Renga',
    description: t('integrations.main.bimDescription'),
    icon: Box,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    status: 'CONNECTED',
    lastSync: '14.02.2026, 18:45',
    route: '/integrations/bim',
  },
  {
    id: 'gov-registries',
    name: t('integrations.main.govRegistriesName'),
    description: t('integrations.main.govRegistriesDescription'),
    icon: Landmark,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    status: 'CONNECTED',
    lastSync: '15.02.2026, 08:15',
    route: '/integrations/gov-registries',
  },
  {
    id: 'api-keys',
    name: t('integrations.main.apiKeysName'),
    description: t('integrations.main.apiKeysDescription'),
    icon: Key,
    iconColor: 'text-neutral-600',
    iconBg: 'bg-neutral-100 dark:bg-neutral-800',
    status: 'CONNECTED',
    route: '/integrations/api-keys',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/status', { _silentErrors: true } as any);
        return res.data as Record<string, { status: string; lastSync?: string }>;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Merge server data with demo cards
  const cards = getIntegrationCards().map((card) => {
    if (statusData && statusData[card.id]) {
      return {
        ...card,
        status: statusData[card.id].status as IntegrationCard['status'],
        lastSync: statusData[card.id].lastSync ?? card.lastSync,
      };
    }
    return card;
  });

  const connectedCount = cards.filter((c) => c.status === 'CONNECTED').length;

  const latestSync = cards
    .filter(c => c.status === 'CONNECTED' && c.lastSync)
    .map(c => c.lastSync!)
    .sort()
    .pop() ?? '--';

  const handleSync = useCallback(async (id: string) => {
    setSyncing(id);
    try {
      await apiClient.post(`/integrations/${id}/sync`, null, { _silentErrors: true } as any);
      toast.success(t('integrations.main.syncStarted'));
    } catch {
      toast.error(t('integrations.main.syncFailed'));
    } finally {
      setTimeout(() => setSyncing(null), 1500);
    }
  }, []);

  const statusLabels = getStatusLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.main.title')}
        subtitle={t('integrations.main.subtitle')}
        breadcrumbs={[
          { label: t('integrations.main.breadcrumbHome'), href: '/' },
          { label: t('integrations.main.breadcrumbSettings'), href: '/settings' },
          { label: t('integrations.main.title') },
        ]}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Link2 size={18} />}
          label={t('integrations.main.metricConnected')}
          value={`${connectedCount} ${t('integrations.main.metricOutOf')} ${cards.length}`}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label={t('integrations.main.metricActiveServices')}
          value={connectedCount}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('integrations.main.metricLastSync')}
          value={latestSync}
        />
      </div>

      {/* Integration cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSyncing = syncing === card.id;

          return (
            <div
              key={card.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-sm transition-shadow flex flex-col cursor-pointer"
              onClick={() => navigate(card.route)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      card.iconBg,
                    )}
                  >
                    <Icon size={20} className={card.iconColor} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{card.name}</h3>
                    <StatusBadge
                      status={card.status}
                      colorMap={statusColorMap}
                      label={statusLabels[card.status]}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2 flex-1">
                {card.description}
              </p>

              {/* Last sync */}
              {card.lastSync && card.status === 'CONNECTED' && (
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('integrations.main.lastSyncShort')}</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">{card.lastSync}</span>
                </div>
              )}

              {/* Actions */}
              <div
                className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="secondary"
                  size="xs"
                  iconLeft={<Settings size={13} />}
                  onClick={() => navigate(card.route)}
                >
                  {t('integrations.main.configure')}
                </Button>
                {card.status === 'CONNECTED' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    iconLeft={
                      isSyncing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )
                    }
                    onClick={() => handleSync(card.id)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? t('integrations.main.syncing') : t('integrations.main.synchronize')}
                  </Button>
                )}
                {card.status === 'DISCONNECTED' && (
                  <Button
                    variant="primary"
                    size="xs"
                    iconLeft={<Link2 size={13} />}
                    onClick={() => navigate(card.route)}
                  >
                    {t('integrations.main.connect')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegrationsPage;
