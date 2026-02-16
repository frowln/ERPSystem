import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2,
  Settings,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  Landmark,
  FileText,
  Send,
  Clock,
  Loader2,
  Zap,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import {
  integrationsApi,
  type IntegrationSummary,
  type IntegrationSettingsResponse,
  type OneCConfigForm,
  type SbisConfigForm,
  type TelegramConfigForm,
  type ConnectionTestResult,
} from '@/api/integrations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationCardData extends IntegrationSummary {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const statusColorMap: Record<string, 'green' | 'gray' | 'red'> = {
  connected: 'green',
  disconnected: 'gray',
  error: 'red',
};

const statusLabels: Record<string, string> = {
  connected: t('settings.integrations.statusConnected'),
  disconnected: t('settings.integrations.statusDisconnected'),
  error: t('settings.integrations.statusError'),
};

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  '1c': { icon: Building2, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  telegram: { icon: Send, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  sbis: { icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
  edo: { icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
};

// Fallback mock data when API is unavailable
const fallbackIntegrations: IntegrationSummary[] = [
  {
    id: '1c',
    name: '1С:Предприятие',
    description: 'Синхронизация справочников, документов, бухгалтерских проводок и взаиморасчётов.',
    type: '1c',
    enabled: false,
    configured: false,
    status: 'DISCONNECTED',
    lastSyncAt: null,
    configSummary: null,
    documentsProcessed: 0,
  },
  {
    id: 'TELEGRAM',
    name: 'Telegram Bot',
    description: 'Push-уведомления в Telegram, отправка отчётов и оповещений о задачах.',
    type: 'TELEGRAM',
    enabled: false,
    configured: false,
    status: 'DISCONNECTED',
    lastSyncAt: null,
    configSummary: null,
    documentsProcessed: 0,
  },
  {
    id: 'SBIS',
    name: 'СБИС',
    description: 'Документооборот через СБИС: отправка, приём и подписание первичных документов.',
    type: 'SBIS',
    enabled: false,
    configured: false,
    status: 'DISCONNECTED',
    lastSyncAt: null,
    configSummary: null,
    documentsProcessed: 0,
  },
  {
    id: 'EDO',
    name: 'ЭДО (Диадок / Контур)',
    description: 'Электронный документооборот: отправка и получение документов через ЭДО.',
    type: 'EDO',
    enabled: false,
    configured: false,
    status: 'DISCONNECTED',
    lastSyncAt: null,
    configSummary: null,
    documentsProcessed: 0,
  },
];

// ---------------------------------------------------------------------------
// Config modal forms
// ---------------------------------------------------------------------------

interface ConfigModalProps {
  type: string;
  onClose: () => void;
  onSaved: () => void;
}

const OneCConfigModal: React.FC<ConfigModalProps> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState<OneCConfigForm>({
    name: '',
    baseUrl: '',
    username: '',
    password: '',
    databaseName: '',
    syncDirection: 'BIDIRECTIONAL',
    syncIntervalMinutes: 60,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.oneC.createConfig(form),
    onSuccess: () => {
      toast.success(t('settings.integrations.toastConfigSaved1C'));
      onSaved();
      onClose();
    },
    onError: () => toast.error(t('settings.integrations.toastConfigError1C')),
  });

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // First save, then test
      const config = await integrationsApi.oneC.createConfig(form);
      const result = await integrationsApi.oneC.testConnection(config.id);
      setTestResult(result);
      if (result.success) {
        toast.success(t('settings.integrations.testSuccess'));
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t('settings.integrations.testFailed'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormField label={t('settings.integrations.fieldConfigName')} required>
        <Input placeholder="Основная 1С" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormField>
      <FormField label={t('settings.integrations.fieldServerUrl')} required hint="Например: http://server:8080/1c">
        <Input placeholder="http://1c-server:8080" value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('settings.integrations.fieldUsername')} required>
          <Input placeholder="admin" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </FormField>
        <FormField label={t('settings.integrations.fieldPassword')} required>
          <Input type="password" placeholder="********" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </FormField>
      </div>
      <FormField label={t('settings.integrations.fieldDatabaseName')} required>
        <Input placeholder="AccountingDB" value={form.databaseName}
          onChange={(e) => setForm({ ...form, databaseName: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('settings.integrations.fieldSyncDirection')}>
          <Select
            options={[
              { value: 'IMPORT', label: t('settings.integrations.syncImport') },
              { value: 'EXPORT', label: t('settings.integrations.syncExport') },
              { value: 'BIDIRECTIONAL', label: t('settings.integrations.syncBidirectional') },
            ]}
            value={form.syncDirection}
            onChange={(e) => setForm({ ...form, syncDirection: e.target.value as OneCConfigForm['syncDirection'] })}
          />
        </FormField>
        <FormField label={t('settings.integrations.fieldSyncInterval')}>
          <Select
            options={[
              { value: '15', label: t('settings.integrations.every15') },
              { value: '30', label: t('settings.integrations.every30') },
              { value: '60', label: t('settings.integrations.everyHour') },
              { value: '360', label: t('settings.integrations.every6Hours') },
              { value: '1440', label: t('settings.integrations.everyDay') },
            ]}
            value={String(form.syncIntervalMinutes)}
            onChange={(e) => setForm({ ...form, syncIntervalMinutes: Number(e.target.value) })}
          />
        </FormField>
      </div>

      {testResult && (
        <div className={cn(
          'p-3 rounded-lg text-sm flex items-center gap-2',
          testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
        )}>
          {testResult.success ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{testResult.message} ({testResult.responseTimeMs}ms)</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>{t('settings.integrations.btnCancel')}</Button>
        <Button variant="ghost" onClick={handleTest} loading={testing}
          iconLeft={<Zap size={14} />}>{t('settings.integrations.btnTest')}</Button>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>{t('settings.integrations.btnSave')}</Button>
      </div>
    </div>
  );
};

const TelegramConfigModal: React.FC<ConfigModalProps> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState<TelegramConfigForm>({
    botToken: '',
    botUsername: '',
    webhookUrl: '',
    enabled: true,
    organizationId: '00000000-0000-0000-0000-000000000001',
  });

  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.telegram.updateConfig(form),
    onSuccess: () => {
      toast.success(t('settings.integrations.toastConfigSavedTelegram'));
      onSaved();
      onClose();
    },
    onError: () => toast.error(t('settings.integrations.toastConfigErrorTelegram')),
  });

  return (
    <div className="space-y-4">
      <FormField label={t('settings.integrations.fieldBotToken')} required hint={t('settings.integrations.fieldBotTokenHint')}>
        <Input placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" value={form.botToken}
          onChange={(e) => setForm({ ...form, botToken: e.target.value })} />
      </FormField>
      <FormField label={t('settings.integrations.fieldBotUsername')} required hint={t('settings.integrations.fieldBotUsernameHint')}>
        <Input placeholder="privod_erp_bot" value={form.botUsername}
          onChange={(e) => setForm({ ...form, botUsername: e.target.value })} />
      </FormField>
      <FormField label={t('settings.integrations.fieldWebhookUrl')} hint={t('settings.integrations.fieldWebhookUrlHint')}>
        <Input placeholder="https://your-domain.com/api/integrations/telegram/webhook"
          value={form.webhookUrl ?? ''}
          onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} />
      </FormField>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>{t('settings.integrations.btnCancel')}</Button>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>{t('settings.integrations.btnSave')}</Button>
      </div>
    </div>
  );
};

const SbisConfigModal: React.FC<ConfigModalProps> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState<SbisConfigForm>({
    name: '',
    apiUrl: 'https://online.sbis.ru/service/',
    login: '',
    password: '',
    organizationInn: '',
    organizationKpp: '',
    autoSend: false,
  });

  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.sbis.createConfig(form),
    onSuccess: () => {
      toast.success(t('settings.integrations.toastConfigSavedSBIS'));
      onSaved();
      onClose();
    },
    onError: () => toast.error(t('settings.integrations.toastConfigErrorSBIS')),
  });

  return (
    <div className="space-y-4">
      <FormField label={t('settings.integrations.fieldConfigName')} required>
        <Input placeholder="СБИС основной" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormField>
      <FormField label={t('settings.integrations.fieldSbisApiUrl')} required>
        <Input placeholder="https://online.sbis.ru/service/" value={form.apiUrl}
          onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('settings.integrations.fieldLogin')} required>
          <Input placeholder="login@company.ru" value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })} />
        </FormField>
        <FormField label={t('settings.integrations.fieldPassword')} required>
          <Input type="password" placeholder="********" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('settings.integrations.fieldOrgINN')} required>
          <Input placeholder="1234567890" value={form.organizationInn}
            onChange={(e) => setForm({ ...form, organizationInn: e.target.value })} />
        </FormField>
        <FormField label={t('settings.integrations.fieldOrgKPP')}>
          <Input placeholder="123456789" value={form.organizationKpp ?? ''}
            onChange={(e) => setForm({ ...form, organizationKpp: e.target.value })} />
        </FormField>
      </div>
      <FormField label={t('settings.integrations.fieldCertThumbprint')}>
        <Input placeholder="AA BB CC DD ..." value={form.certificateThumbprint ?? ''}
          onChange={(e) => setForm({ ...form, certificateThumbprint: e.target.value })} />
      </FormField>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>{t('settings.integrations.btnCancel')}</Button>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>{t('settings.integrations.btnSave')}</Button>
      </div>
    </div>
  );
};

const EdoConfigModal: React.FC<ConfigModalProps> = ({ onClose }) => {
  const [provider, setProvider] = useState('DIADOC');

  return (
    <div className="space-y-4">
      <FormField label={t('settings.integrations.fieldEdoProvider')} required>
        <Select
          options={[
            { value: 'DIADOC', label: t('settings.integrations.providerDiadoc') },
            { value: 'SBIS', label: t('settings.integrations.providerSBIS') },
            { value: 'KONTUR', label: t('settings.integrations.providerKontur') },
          ]}
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        />
      </FormField>
      <FormField label={t('settings.integrations.fieldApiKey')} required>
        <Input placeholder={t('settings.integrations.fieldApiKeyPlaceholder')} />
      </FormField>
      <FormField label={t('settings.integrations.fieldOrgINN')} required>
        <Input placeholder="1234567890" />
      </FormField>
      <FormField label={t('settings.integrations.fieldOrgKPP')}>
        <Input placeholder="123456789" />
      </FormField>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {t('settings.integrations.edoHint')}
      </p>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>{t('settings.integrations.btnCancel')}</Button>
        <Button onClick={onClose}>{t('settings.integrations.btnSave')}</Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data: settingsData } = useQuery<IntegrationSettingsResponse>({
    queryKey: ['integration-settings'],
    queryFn: async () => {
      try {
        return await integrationsApi.getSettings();
      } catch {
        return {
          integrations: fallbackIntegrations,
          totalConfigured: 0,
          totalConnected: 0,
          lastGlobalSync: null,
        };
      }
    },
    refetchInterval: 30000,
  });

  const integrations: IntegrationCardData[] = (settingsData?.integrations ?? fallbackIntegrations).map((item) => ({
    ...item,
    icon: iconMap[item.id]?.icon ?? FileText,
    iconColor: iconMap[item.id]?.color ?? 'text-neutral-600',
    iconBg: iconMap[item.id]?.bg ?? 'bg-neutral-50 dark:bg-neutral-800',
  }));

  const connectedCount = settingsData?.totalConnected ?? 0;
  const configuredCount = settingsData?.totalConfigured ?? 0;

  const handleConfigure = useCallback((type: string) => {
    setSelectedType(type);
    setShowConfigModal(true);
  }, []);

  const handleSync = useCallback(async (id: string) => {
    setSyncing(id);
    try {
      if (id === '1c') {
        const status = await integrationsApi.oneC.getStatus();
        if (status?.id) {
          await integrationsApi.oneC.triggerSync(status.id);
        }
      } else if (id === 'SBIS') {
        await integrationsApi.sbis.syncDocuments();
      }
      toast.success(t('settings.integrations.toastSyncStarted'));
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] });
    } catch {
      toast.error(t('settings.integrations.toastSyncFailed'));
    } finally {
      setTimeout(() => setSyncing(null), 1500);
    }
  }, [queryClient]);

  const handleSaved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['integration-settings'] });
  }, [queryClient]);

  const renderConfigModal = () => {
    if (!selectedType) return null;
    const props: ConfigModalProps = {
      type: selectedType,
      onClose: () => setShowConfigModal(false),
      onSaved: handleSaved,
    };
    switch (selectedType) {
      case '1c': return <OneCConfigModal {...props} />;
      case 'TELEGRAM': return <TelegramConfigModal {...props} />;
      case 'SBIS': return <SbisConfigModal {...props} />;
      case 'EDO': return <EdoConfigModal {...props} />;
      default: return null;
    }
  };

  const getModalTitle = () => {
    switch (selectedType) {
      case '1c': return t('settings.integrations.configTitle1C');
      case 'TELEGRAM': return t('settings.integrations.configTitleTelegram');
      case 'SBIS': return t('settings.integrations.configTitleSBIS');
      case 'EDO': return t('settings.integrations.configTitleEDO');
      default: return t('settings.integrations.configTitleDefault');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('settings.integrations.title')}
        subtitle={t('settings.integrations.subtitle')}
        breadcrumbs={[
          { label: t('settings.integrations.breadcrumbHome'), href: '/' },
          { label: t('settings.integrations.breadcrumbSettings'), href: '/settings' },
          { label: t('settings.integrations.breadcrumbIntegrations') },
        ]}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Link2 size={18} />}
          label={t('settings.integrations.metricConnected')}
          value={`${connectedCount} из ${integrations.length}`}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label={t('settings.integrations.metricConfigured')}
          value={configuredCount}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('settings.integrations.metricLastSync')}
          value={settingsData?.lastGlobalSync ? formatDateTime(settingsData.lastGlobalSync) : '--'}
        />
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isSyncing = syncing === integration.id;

          return (
            <div
              key={integration.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-sm transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      integration.iconBg,
                    )}
                  >
                    <Icon size={20} className={integration.iconColor} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{integration.name}</h3>
                    <StatusBadge
                      status={integration.status}
                      colorMap={statusColorMap}
                      label={statusLabels[integration.status]}
                      size="sm"
                    />
                  </div>
                </div>
                {integration.configured && integration.status === 'CONNECTED' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi size={14} />
                  </div>
                )}
                {integration.configured && integration.status === 'ERROR' && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertTriangle size={14} />
                  </div>
                )}
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">{integration.description}</p>

              {/* Config summary */}
              {integration.configured && (
                <div className="space-y-2 mb-4 text-xs">
                  {integration.configSummary && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">{t('settings.integrations.configLabel')}</span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate ml-2">
                        {integration.configSummary}
                      </span>
                    </div>
                  )}
                  {integration.lastSyncAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">{t('settings.integrations.lastSyncLabel')}</span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {formatDateTime(integration.lastSyncAt)}
                      </span>
                    </div>
                  )}
                  {integration.documentsProcessed > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">{t('settings.integrations.processedLabel')}</span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {integration.documentsProcessed.toLocaleString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  iconLeft={<Settings size={13} />}
                  onClick={() => handleConfigure(integration.id)}
                >
                  {t('settings.integrations.btnConfigure')}
                </Button>
                {integration.status === 'CONNECTED' && (integration.id === '1c' || integration.id === 'SBIS') && (
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
                    onClick={() => handleSync(integration.id)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? t('settings.integrations.btnSyncing') : t('settings.integrations.btnSync')}
                  </Button>
                )}
                {integration.status === 'DISCONNECTED' && (
                  <Button
                    variant="primary"
                    size="xs"
                    iconLeft={<Link2 size={13} />}
                    onClick={() => handleConfigure(integration.id)}
                  >
                    {t('settings.integrations.btnConnect')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure modal */}
      <Modal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={getModalTitle()}
        size="lg"
      >
        {renderConfigModal()}
      </Modal>
    </div>
  );
};

export default IntegrationsPage;
