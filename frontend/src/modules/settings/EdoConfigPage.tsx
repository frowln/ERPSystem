import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { MetricCard } from '@/design-system/components/MetricCard';
import { sbisApi } from '@/api/sbis';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { SbisConfig } from '@/modules/russianDocs/types';

const EdoConfigPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery<SbisConfig>({
    queryKey: ['sbis-config'],
    queryFn: () => sbisApi.getConfig(),
  });

  const [form, setForm] = useState({
    organizationName: '',
    organizationInn: '',
    apiKey: '',
    autoSend: false,
  });
  const [initialized, setInitialized] = useState(false);

  if (config && !initialized) {
    setForm({
      organizationName: config.organizationName ?? '',
      organizationInn: config.organizationInn ?? '',
      apiKey: config.apiKey ?? '',
      autoSend: config.autoSend ?? false,
    });
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: (data: Partial<SbisConfig>) => sbisApi.updateConfig(data),
    onSuccess: () => {
      toast.success(t('edo.configSaved'));
      queryClient.invalidateQueries({ queryKey: ['sbis-config'] });
    },
    onError: () => toast.error(t('edo.configSaveError')),
  });

  const syncMutation = useMutation({
    mutationFn: () => sbisApi.syncDocuments(),
    onSuccess: () => {
      toast.success(t('edo.syncStarted'));
      queryClient.invalidateQueries({ queryKey: ['sbis-config'] });
    },
    onError: () => toast.error(t('edo.syncError')),
  });

  const handleSave = () => {
    saveMutation.mutate({
      organizationName: form.organizationName,
      organizationInn: form.organizationInn,
      apiKey: form.apiKey,
      autoSend: form.autoSend,
    } as Partial<SbisConfig>);
  };

  const isConnected = config?.isActive ?? false;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('edo.configTitle')}
        subtitle={t('edo.configSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('nav.settings'), href: '/settings' },
          { label: t('edo.configTitle') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw size={14} />}
              loading={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
            >
              {t('edo.syncNow')}
            </Button>
            <Button
              size="sm"
              iconLeft={<Save size={14} />}
              loading={saveMutation.isPending}
              onClick={handleSave}
            >
              {t('common.save')}
            </Button>
          </div>
        }
      />

      {/* Connection status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
          label={t('edo.connectionStatus')}
          value={isConnected ? t('edo.connected') : t('edo.disconnected')}
          trend={{ direction: isConnected ? 'up' : 'down', value: isConnected ? t('edo.active') : t('edo.inactive') }}
        />
        <MetricCard
          icon={<Settings size={18} />}
          label={t('edo.autoSendLabel')}
          value={form.autoSend ? t('edo.enabled') : t('edo.disabled')}
        />
        <MetricCard
          icon={<RefreshCw size={18} />}
          label={t('edo.lastSync')}
          value={config?.lastSyncAt ? formatDate(config.lastSyncAt) : '—'}
        />
      </div>

      {/* Connection settings form */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-600',
          )} />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {t('edo.sbisConnection')}
          </h3>
        </div>

        <div className="space-y-4">
          <FormField label={t('edo.orgName')}>
            <Input
              value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              placeholder={t('edo.orgNamePlaceholder')}
            />
          </FormField>

          <FormField label={t('edo.inn')}>
            <Input
              value={form.organizationInn}
              onChange={(e) => setForm({ ...form, organizationInn: e.target.value })}
              placeholder="7701234567"
              maxLength={12}
            />
          </FormField>

          <FormField label={t('edo.apiKey')} hint={t('edo.apiKeyHint')}>
            <Input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="••••••••••••"
            />
          </FormField>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoSend}
                onChange={(e) => setForm({ ...form, autoSend: e.target.checked })}
                className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {t('edo.autoSendDocuments')}
              </span>
            </label>
          </div>
        </div>

        {/* Supported document types */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            {t('edo.supportedTypes')}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {['КС-2', 'КС-3', t('edo.typeInvoice'), t('edo.typeContract'), t('edo.typeAct'), t('edo.typeWaybill')].map((type) => (
              <div key={type} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <CheckCircle size={14} className="text-success-500 flex-shrink-0" />
                {type}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdoConfigPage;
