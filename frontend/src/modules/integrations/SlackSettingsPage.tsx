import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Hash,
  Link2,
  Power,
  PowerOff,
  Loader2,
  Save,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  events: Record<string, boolean>;
}

type EventKey =
  | 'task.created'
  | 'task.completed'
  | 'safety.incident'
  | 'document.uploaded'
  | 'budget.exceeded';

const EVENT_KEYS: EventKey[] = [
  'task.created',
  'task.completed',
  'safety.incident',
  'document.uploaded',
  'budget.exceeded',
];

const getEventLabels = (): Record<EventKey, string> => ({
  'task.created': t('integrations.slack.events.taskCreated'),
  'task.completed': t('integrations.slack.events.taskCompleted'),
  'safety.incident': t('integrations.slack.events.safetyIncident'),
  'document.uploaded': t('integrations.slack.events.documentUploaded'),
  'budget.exceeded': t('integrations.slack.events.budgetExceeded'),
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SlackSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<SlackConfig>({
    webhookUrl: '',
    channel: '',
    events: {
      'task.created': true,
      'task.completed': true,
      'safety.incident': true,
      'document.uploaded': false,
      'budget.exceeded': true,
    },
  });

  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Test connection
  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/integrations/slack/test', {
        webhookUrl: config.webhookUrl,
      });
      return res.data;
    },
    onSuccess: () => {
      setConnectionStatus('connected');
      toast.success(t('integrations.slack.testSuccess'));
    },
    onError: () => {
      setConnectionStatus('disconnected');
      toast.error(t('integrations.slack.testFailed'));
    },
  });

  // Save config
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.put('/integrations/slack/config', config);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('integrations.slack.saveSuccess'));
    },
    onError: () => {
      toast.error(t('integrations.slack.saveError'));
    },
  });

  const toggleEvent = (key: EventKey) => {
    setConfig((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [key]: !prev.events[key],
      },
    }));
  };

  const eventLabels = getEventLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.slack.title')}
        subtitle={t('integrations.slack.description')}
        breadcrumbs={[
          { label: t('integrations.slack.breadcrumbHome'), href: '/' },
          { label: t('integrations.slack.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.slack.title') },
        ]}
        backTo="/integrations"
      />

      {/* Status banner */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <Hash size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              Slack
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('integrations.slack.statusLabel')}
            </p>
          </div>
          {connectionStatus === 'connected' && (
            <StatusBadge
              status="connected"
              colorMap={{ connected: 'green' }}
              label={t('integrations.slack.connected')}
              size="sm"
            />
          )}
          {connectionStatus === 'disconnected' && (
            <StatusBadge
              status="disconnected"
              colorMap={{ disconnected: 'red' }}
              label={t('integrations.slack.disconnected')}
              size="sm"
            />
          )}
          {connectionStatus === 'unknown' && (
            <StatusBadge
              status="unknown"
              colorMap={{ unknown: 'gray' }}
              label={t('integrations.slack.disconnected')}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Configuration form */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="space-y-5 max-w-2xl">
          {/* Webhook URL */}
          <FormField
            label={t('integrations.slack.webhookUrl')}
            hint={t('integrations.slack.webhookUrlHint')}
            required
          >
            <Input
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              placeholder={t('integrations.slack.webhookUrlPlaceholder')}
              type="url"
            />
          </FormField>

          {/* Default channel */}
          <FormField
            label={t('integrations.slack.channel')}
            hint={t('integrations.slack.channelHint')}
          >
            <Input
              value={config.channel}
              onChange={(e) => setConfig({ ...config, channel: e.target.value })}
              placeholder={t('integrations.slack.channelPlaceholder')}
            />
          </FormField>

          {/* Test connection */}
          <div className="flex items-center gap-3 py-2">
            <Button
              variant="outline"
              iconLeft={
                testMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )
              }
              onClick={() => testMutation.mutate()}
              disabled={!config.webhookUrl || testMutation.isPending}
            >
              {t('integrations.slack.testConnection')}
            </Button>
            {connectionStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-sm text-success-600">
                <CheckCircle size={14} />
                {t('integrations.slack.connected')}
              </span>
            )}
            {connectionStatus === 'disconnected' && (
              <span className="flex items-center gap-1.5 text-sm text-danger-600">
                <XCircle size={14} />
                {t('integrations.slack.disconnected')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notification events */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 text-sm">
          {t('integrations.slack.eventsTitle')}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {t('integrations.slack.eventsDescription')}
        </p>
        <div className="space-y-2 max-w-2xl">
          {EVENT_KEYS.map((key) => (
            <label
              key={key}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors',
                'border border-neutral-200 dark:border-neutral-700',
                config.events[key]
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                  : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              <input
                type="checkbox"
                checked={config.events[key] ?? false}
                onChange={() => toggleEvent(key)}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {eventLabels[key]}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2 font-mono">
                  {key}
                </span>
              </div>
              {config.events[key] ? (
                <Power size={14} className="text-success-500" />
              ) : (
                <PowerOff size={14} className="text-neutral-400" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button
          iconLeft={
            saveMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )
          }
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={!config.webhookUrl}
        >
          {t('integrations.slack.save')}
        </Button>
      </div>
    </div>
  );
};

export default SlackSettingsPage;
