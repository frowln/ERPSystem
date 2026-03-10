import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Landmark,
  RefreshCw,
  Zap,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  Settings,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { cn } from '@/lib/cn';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  integrationsApi,
  type SbisConfigData,
  type SbisConfigForm,
  type ConnectionTestResult,
} from '@/api/integrations';
import { t } from '@/i18n';


const docStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'cyan' | 'yellow'> = {
  draft: 'gray',
  sent: 'blue',
  delivered: 'cyan',
  signed: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

const getDocStatusLabels = (): Record<string, string> => ({
  draft: t('integrations.sbis.docStatusDraft'),
  sent: t('integrations.sbis.docStatusSent'),
  delivered: t('integrations.sbis.docStatusDelivered'),
  signed: t('integrations.sbis.docStatusSigned'),
  rejected: t('integrations.sbis.docStatusRejected'),
  cancelled: t('integrations.sbis.docStatusCancelled'),
});

type TabId = 'config' | 'documents';

const SbisSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('config');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [form, setForm] = useState<SbisConfigForm>({
    name: '',
    apiUrl: 'https://online.sbis.ru/service/',
    login: '',
    password: '',
    organizationInn: '',
    organizationKpp: '',
    autoSend: false,
  });

  const { data: configsRaw } = useQuery({
    queryKey: ['sbis-configs'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.sbis.getConfigs();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const configs = configsRaw ?? [];

  const { data: docsRaw } = useQuery({
    queryKey: ['sbis-documents-list'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.sbis.getDocuments();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const documents = (docsRaw ?? []) as { id: string; number: string; name: string; documentType: string; documentTypeLabel: string; counterpartyName: string; status: string; totalAmount: number; createdAt: string }[];

  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.sbis.createConfig(form),
    onSuccess: () => {
      toast.success(t('integrations.sbis.configSaved'));
      setShowConfigModal(false);
      queryClient.invalidateQueries({ queryKey: ['sbis-configs'] });
    },
    onError: () => toast.error(t('integrations.sbis.saveError')),
  });

  const handleTest = useCallback(async (configId: string) => {
    setTestingId(configId);
    setTestResult(null);
    try {
      const result = await integrationsApi.sbis.testConnection(configId);
      setTestResult(result);
      if (result.success) {
        toast.success(t('integrations.sbis.connectionEstablished'));
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t('integrations.sbis.testError'));
    } finally {
      setTestingId(null);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await integrationsApi.sbis.syncDocuments();
      toast.success(t('integrations.sbis.syncStarted'));
      queryClient.invalidateQueries({ queryKey: ['sbis-documents-list'] });
    } catch {
      toast.error(t('integrations.sbis.syncFailed'));
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  }, [queryClient]);

  const docStatusLabels = getDocStatusLabels();

  const configColumns = useMemo<ColumnDef<SbisConfigData, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: t('integrations.sbis.colName'),
      size: 180,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.apiUrl}</p>
        </div>
      ),
    },
    {
      accessorKey: 'login',
      header: t('integrations.sbis.colLogin'),
      size: 160,
    },
    {
      accessorKey: 'organizationInn',
      header: t('integrations.sbis.colInn'),
      size: 140,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: t('integrations.sbis.colStatus'),
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<boolean>() ? 'ACTIVE' : 'INACTIVE'}
          colorMap={{ active: 'green', inactive: 'gray' }}
          label={getValue<boolean>() ? t('integrations.sbis.statusActive') : t('integrations.sbis.statusInactive')}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 150,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs"
            iconLeft={testingId === row.original.id
              ? <Loader2 size={12} className="animate-spin" />
              : <Zap size={12} />}
            onClick={() => handleTest(row.original.id)}
            disabled={testingId === row.original.id}>
            {t('integrations.sbis.test')}
          </Button>
        </div>
      ),
    },
  ], [testingId, handleTest]);

  const documentColumns = useMemo<ColumnDef<(typeof documents)[0], unknown>[]>(() => [
    {
      accessorKey: 'number',
      header: t('integrations.sbis.colNumber'),
      size: 160,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.number}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.documentTypeLabel}</p>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('integrations.sbis.colDocument'),
      size: 250,
    },
    {
      accessorKey: 'counterpartyName',
      header: t('integrations.sbis.colCounterparty'),
      size: 180,
    },
    {
      accessorKey: 'status',
      header: t('integrations.sbis.colDocStatus'),
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<string>()}
          colorMap={docStatusColorMap}
          label={docStatusLabels[getValue<string>()] ?? getValue<string>()}
        />
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: t('integrations.sbis.colAmount'),
      size: 120,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
          {formatMoney(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('integrations.sbis.colDate'),
      size: 140,
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-700 dark:text-neutral-300">{formatDateTime(getValue<string>())}</span>
      ),
    },
  ], []);

  const activeConfig = configs.find((c) => c.isActive);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.sbis.title')}
        subtitle={t('integrations.sbis.subtitle')}
        breadcrumbs={[
          { label: t('integrations.sbis.breadcrumbHome'), href: '/' },
          { label: t('integrations.sbis.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.sbis.title') },
        ]}
        backTo="/integrations"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" iconLeft={
              syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />
            } onClick={handleSync} disabled={syncing}>
              {syncing ? t('integrations.sbis.syncing') : t('integrations.sbis.synchronization')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => setShowConfigModal(true)}>
              {t('integrations.sbis.add')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'config', label: t('integrations.sbis.tabConfigs'), count: configs.length },
          { id: 'documents', label: t('integrations.sbis.tabDocuments'), count: documents.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Status */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Landmark size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              {activeConfig?.name ?? t('integrations.sbis.notConfigured')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {activeConfig ? `${t('integrations.sbis.inn')}: ${activeConfig.organizationInn}` : t('integrations.sbis.addConfigHint')}
            </p>
          </div>
          <StatusBadge
            status={activeConfig ? 'ACTIVE' : 'INACTIVE'}
            colorMap={{ active: 'green', inactive: 'gray' }}
            label={activeConfig ? t('integrations.sbis.connected') : t('integrations.sbis.notConnected')}
            size="sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard icon={<Settings size={16} />} label={t('integrations.sbis.metricConfigs')} value={configs.length} />
          <MetricCard icon={<FileText size={16} />} label={t('integrations.sbis.metricDocuments')} value={documents.length} />
          <MetricCard icon={<CheckCircle2 size={16} />} label={t('integrations.sbis.metricSigned')}
            value={documents.filter((d) => d.status === 'SIGNED').length} />
        </div>
      </div>

      {testResult && (
        <div className={cn(
          'p-4 rounded-lg mb-6 flex items-center gap-3',
          testResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
        )}>
          {testResult.success ? <Wifi size={18} className="text-green-600 dark:text-green-400" /> : <WifiOff size={18} className="text-red-600 dark:text-red-400" />}
          <div>
            <p className={cn('text-sm font-medium', testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
              {testResult.success ? t('integrations.sbis.connectionEstablished') : t('integrations.sbis.connectionError')}
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">{testResult.message} ({testResult.responseTimeMs}{t('integrations.sbis.ms')})</p>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <DataTable<SbisConfigData>
          data={configs}
          columns={configColumns}
          enableColumnVisibility
          pageSize={10}
          emptyTitle={t('integrations.sbis.emptyConfigsTitle')}
          emptyDescription={t('integrations.sbis.emptyConfigsDescription')}
        />
      )}

      {activeTab === 'documents' && (
        <DataTable<(typeof documents)[0]>
          data={documents}
          columns={documentColumns}
          enableColumnVisibility
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.sbis.emptyDocsTitle')}
          emptyDescription={t('integrations.sbis.emptyDocsDescription')}
        />
      )}

      <Modal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={t('integrations.sbis.newConfigTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>{t('integrations.sbis.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>{t('integrations.sbis.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('integrations.sbis.fieldName')} required>
            <Input placeholder={t('integrations.sbis.placeholderName')} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label={t('integrations.sbis.fieldApiUrl')} required>
            <Input placeholder="https://online.sbis.ru/service/" value={form.apiUrl}
              onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('integrations.sbis.fieldLogin')} required>
              <Input placeholder="login@company.ru" value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })} />
            </FormField>
            <FormField label={t('integrations.sbis.fieldPassword')} required>
              <Input type="password" placeholder="********" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('integrations.sbis.fieldInn')} required>
              <Input placeholder="1234567890" value={form.organizationInn}
                onChange={(e) => setForm({ ...form, organizationInn: e.target.value })} />
            </FormField>
            <FormField label={t('integrations.sbis.fieldKpp')}>
              <Input placeholder="123456789" value={form.organizationKpp ?? ''}
                onChange={(e) => setForm({ ...form, organizationKpp: e.target.value })} />
            </FormField>
          </div>
          <FormField label={t('integrations.sbis.fieldCertificateThumbprint')}>
            <Input placeholder="AA BB CC DD EE FF" value={form.certificateThumbprint ?? ''}
              onChange={(e) => setForm({ ...form, certificateThumbprint: e.target.value })} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default SbisSettingsPage;
