import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Building2,
  RefreshCw,
  Zap,
  Settings,
  Wifi,
  WifiOff,
  Clock,
  Database,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Plus,
  Power,
  Trash2,
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
import { formatDateTime } from '@/lib/format';
import {
  integrationsApi,
  type OneCConfigData,
  type OneCConfigForm,
  type ConnectionTestResult,
} from '@/api/integrations';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface ExchangeLog {
  id: string;
  configName: string;
  exchangeType: string;
  status: string;
  processedCount: number;
  errorCount: number;
  duration: string;
  createdAt: string;
}

const logStatusColorMap: Record<string, 'green' | 'red' | 'yellow' | 'gray' | 'blue'> = {
  COMPLETED: 'green',
  FAILED: 'red',
  RUNNING: 'blue',
  PENDING: 'yellow',
};

const getLogStatusLabels = (): Record<string, string> => ({
  COMPLETED: t('integrations.oneC.logStatusCompleted'),
  FAILED: t('integrations.oneC.logStatusFailed'),
  RUNNING: t('integrations.oneC.logStatusRunning'),
  PENDING: t('integrations.oneC.logStatusPending'),
});

type TabId = 'configs' | 'logs';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OneCSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('configs');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [form, setForm] = useState<OneCConfigForm>({
    name: '',
    baseUrl: '',
    username: '',
    password: '',
    databaseName: '',
    syncDirection: 'BIDIRECTIONAL',
    syncIntervalMinutes: 60,
  });

  // Fetch configs
  const { data: configsRaw } = useQuery({
    queryKey: ['1c-configs'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.oneC.getConfigs();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const configs = configsRaw ?? [];

  // Fetch exchange logs
  const { data: logsRaw } = useQuery({
    queryKey: ['1c-exchange-logs'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.oneC.getExchangeLogs();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const logs = (logsRaw ?? []) as ExchangeLog[];

  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.oneC.createConfig(form),
    onSuccess: () => {
      toast.success(t('integrations.oneC.configSaved'));
      setShowConfigModal(false);
      queryClient.invalidateQueries({ queryKey: ['1c-configs'] });
    },
    onError: () => toast.error(t('integrations.oneC.saveError')),
  });

  const handleTest = useCallback(async (configId: string) => {
    setTestingId(configId);
    setTestResult(null);
    try {
      const result = await integrationsApi.oneC.testConnection(configId);
      setTestResult(result);
      if (result.success) {
        toast.success(t('integrations.oneC.connectionEstablished') + ' (' + result.responseTimeMs + t('integrations.oneC.ms') + ')');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t('integrations.oneC.testError'));
    } finally {
      setTestingId(null);
    }
  }, []);

  const handleSync = useCallback(async (configId: string) => {
    setSyncingId(configId);
    try {
      await integrationsApi.oneC.triggerSync(configId);
      toast.success(t('integrations.oneC.syncStarted'));
      queryClient.invalidateQueries({ queryKey: ['1c-exchange-logs'] });
    } catch {
      toast.error(t('integrations.oneC.syncFailed'));
    } finally {
      setTimeout(() => setSyncingId(null), 2000);
    }
  }, [queryClient]);

  const logStatusLabels = getLogStatusLabels();

  const configColumns = useMemo<ColumnDef<OneCConfigData, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: t('integrations.oneC.colName'),
      size: 200,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.baseUrl}</p>
        </div>
      ),
    },
    {
      accessorKey: 'databaseName',
      header: t('integrations.oneC.colDatabase'),
      size: 180,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'syncDirectionDisplayName',
      header: t('integrations.oneC.colDirection'),
      size: 140,
    },
    {
      accessorKey: 'isActive',
      header: t('integrations.oneC.colStatus'),
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<boolean>() ? 'ACTIVE' : 'INACTIVE'}
          colorMap={{ active: 'green', inactive: 'gray' }}
          label={getValue<boolean>() ? t('integrations.oneC.statusActive') : t('integrations.oneC.statusInactive')}
        />
      ),
    },
    {
      accessorKey: 'lastSyncAt',
      header: t('integrations.oneC.colLastSync'),
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-700 dark:text-neutral-300">
          {getValue<string>() ? formatDateTime(getValue<string>()) : '--'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 200,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs"
            iconLeft={testingId === row.original.id
              ? <Loader2 size={12} className="animate-spin" />
              : <Zap size={12} />}
            onClick={() => handleTest(row.original.id)}
            disabled={testingId === row.original.id}>
            {t('integrations.oneC.test')}
          </Button>
          <Button variant="ghost" size="xs"
            iconLeft={syncingId === row.original.id
              ? <Loader2 size={12} className="animate-spin" />
              : <RefreshCw size={12} />}
            onClick={() => handleSync(row.original.id)}
            disabled={syncingId === row.original.id}>
            {t('integrations.oneC.syncShort')}
          </Button>
        </div>
      ),
    },
  ], [testingId, syncingId, handleTest, handleSync]);

  const logColumns = useMemo<ColumnDef<ExchangeLog, unknown>[]>(() => [
    {
      accessorKey: 'configName',
      header: t('integrations.oneC.logColConfig'),
      size: 160,
    },
    {
      accessorKey: 'exchangeType',
      header: t('integrations.oneC.logColExchangeType'),
      size: 140,
    },
    {
      accessorKey: 'status',
      header: t('integrations.oneC.logColStatus'),
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<string>()}
          colorMap={logStatusColorMap}
          label={logStatusLabels[getValue<string>()] ?? getValue<string>()}
        />
      ),
    },
    {
      accessorKey: 'processedCount',
      header: t('integrations.oneC.logColProcessed'),
      size: 100,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'errorCount',
      header: t('integrations.oneC.logColErrors'),
      size: 80,
      cell: ({ getValue }) => {
        const val = getValue<number>();
        return (
          <span className={cn('tabular-nums', val > 0 ? 'text-red-600 font-medium' : 'text-neutral-500 dark:text-neutral-400')}>
            {val}
          </span>
        );
      },
    },
    {
      accessorKey: 'duration',
      header: t('integrations.oneC.logColDuration'),
      size: 100,
    },
    {
      accessorKey: 'createdAt',
      header: t('integrations.oneC.logColDate'),
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-700 dark:text-neutral-300">{formatDateTime(getValue<string>())}</span>
      ),
    },
  ], []);

  const activeConfig = configs.find((c) => c.isActive);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.oneC.title')}
        subtitle={t('integrations.oneC.subtitle')}
        breadcrumbs={[
          { label: t('integrations.oneC.breadcrumbHome'), href: '/' },
          { label: t('integrations.oneC.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.oneC.title') },
        ]}
        backTo="/integrations"
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setShowConfigModal(true)}>
            {t('integrations.oneC.addConfig')}
          </Button>
        }
        tabs={[
          { id: 'configs', label: t('integrations.oneC.tabConfigs'), count: configs.length },
          { id: 'logs', label: t('integrations.oneC.tabLogs'), count: logs.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
            <Building2 size={20} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              {activeConfig?.name ?? t('integrations.oneC.notConfigured')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {activeConfig?.baseUrl ?? t('integrations.oneC.addConfigHint')}
            </p>
          </div>
          <StatusBadge
            status={activeConfig ? 'ACTIVE' : 'INACTIVE'}
            colorMap={{ active: 'green', inactive: 'gray' }}
            label={activeConfig ? t('integrations.oneC.connected') : t('integrations.oneC.notConnected')}
            size="sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard icon={<Database size={16} />} label={t('integrations.oneC.metricConfigs')} value={configs.length} />
          <MetricCard icon={<Clock size={16} />} label={t('integrations.oneC.metricInterval')}
            value={activeConfig ? `${activeConfig.syncIntervalMinutes} ${t('integrations.oneC.minutes')}` : '--'} />
          <MetricCard icon={<CheckCircle2 size={16} />} label={t('integrations.oneC.metricLastSync')}
            value={activeConfig?.lastSyncAt ? formatDateTime(activeConfig.lastSyncAt) : '--'} />
          <MetricCard icon={<RefreshCw size={16} />} label={t('integrations.oneC.metricDirection')}
            value={activeConfig?.syncDirectionDisplayName ?? '--'} />
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
              {testResult.success ? t('integrations.oneC.connectionEstablished') : t('integrations.oneC.connectionError')}
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {testResult.message} ({testResult.responseTimeMs}{t('integrations.oneC.ms')})
            </p>
          </div>
        </div>
      )}

      {activeTab === 'configs' && (
        <DataTable<OneCConfigData>
          data={configs}
          columns={configColumns}
          enableColumnVisibility
          enableDensityToggle
          pageSize={10}
          emptyTitle={t('integrations.oneC.emptyConfigsTitle')}
          emptyDescription={t('integrations.oneC.emptyConfigsDescription')}
        />
      )}

      {activeTab === 'logs' && (
        <DataTable<ExchangeLog>
          data={logs}
          columns={logColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.oneC.emptyLogsTitle')}
          emptyDescription={t('integrations.oneC.emptyLogsDescription')}
        />
      )}

      {/* Config modal */}
      <Modal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={t('integrations.oneC.newConfigTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>{t('integrations.oneC.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>{t('integrations.oneC.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('integrations.oneC.fieldName')} required>
            <Input placeholder={t('integrations.oneC.placeholderName')} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label={t('integrations.oneC.fieldServerUrl')} required hint="http://server:port">
            <Input placeholder="http://1c-server.local:8080" value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('integrations.oneC.fieldUsername')} required>
              <Input placeholder="admin" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </FormField>
            <FormField label={t('integrations.oneC.fieldPassword')} required>
              <Input type="password" placeholder="********" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </FormField>
          </div>
          <FormField label={t('integrations.oneC.fieldDatabaseName')} required>
            <Input placeholder="BuhgalteriyaEnterprise" value={form.databaseName}
              onChange={(e) => setForm({ ...form, databaseName: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('integrations.oneC.fieldSyncDirection')}>
              <Select
                options={[
                  { value: 'IMPORT', label: t('integrations.oneC.syncImportOnly') },
                  { value: 'EXPORT', label: t('integrations.oneC.syncExportOnly') },
                  { value: 'BIDIRECTIONAL', label: t('integrations.oneC.syncBidirectional') },
                ]}
                value={form.syncDirection}
                onChange={(e) => setForm({ ...form, syncDirection: e.target.value as OneCConfigForm['syncDirection'] })}
              />
            </FormField>
            <FormField label={t('integrations.oneC.fieldInterval')}>
              <Select
                options={[
                  { value: '15', label: t('integrations.oneC.interval15min') },
                  { value: '30', label: t('integrations.oneC.interval30min') },
                  { value: '60', label: t('integrations.oneC.interval1hour') },
                  { value: '360', label: t('integrations.oneC.interval6hours') },
                  { value: '1440', label: t('integrations.oneC.interval1day') },
                ]}
                value={String(form.syncIntervalMinutes)}
                onChange={(e) => setForm({ ...form, syncIntervalMinutes: Number(e.target.value) })}
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OneCSettingsPage;
