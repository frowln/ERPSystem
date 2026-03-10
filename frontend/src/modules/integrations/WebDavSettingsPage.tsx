import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  HardDrive,
  RefreshCw,
  Wifi,
  WifiOff,
  FolderSync,
  Settings,
  Power,
  PowerOff,
  Loader2,
  Save,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDateTime, formatFileSize } from '@/lib/format';
import {
  integrationsApi,
  type WebDavConfigData,
  type WebDavFileData,
  type ConnectionTestResult,
} from '@/api/integrations';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Status maps
// ---------------------------------------------------------------------------

const syncStatusColorMap: Record<string, 'green' | 'yellow' | 'orange' | 'red'> = {
  SYNCED: 'green',
  PENDING: 'yellow',
  CONFLICT: 'orange',
  ERROR: 'red',
};

const getSyncStatusLabels = (): Record<string, string> => ({
  SYNCED: t('integrations.webdav.statusSynced'),
  PENDING: t('integrations.webdav.statusPending'),
  CONFLICT: t('integrations.webdav.statusConflict'),
  ERROR: t('integrations.webdav.statusError'),
});

const connStatusColorMap: Record<string, 'green' | 'gray' | 'red'> = {
  CONNECTED: 'green',
  DISCONNECTED: 'gray',
  ERROR: 'red',
};

const getConnStatusLabels = (): Record<string, string> => ({
  CONNECTED: t('integrations.webdav.connConnected'),
  DISCONNECTED: t('integrations.webdav.connDisconnected'),
  ERROR: t('integrations.webdav.connError'),
});

type TabId = 'config' | 'files';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WebDavSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('config');
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncingFileId, setSyncingFileId] = useState<number | null>(null);

  const [form, setForm] = useState<{
    serverUrl: string;
    username: string;
    password: string;
    basePath: string;
    autoSync: boolean;
    syncIntervalMinutes: number;
    enabled: boolean;
  }>({
    serverUrl: '',
    username: '',
    password: '',
    basePath: '/',
    autoSync: false,
    syncIntervalMinutes: 60,
    enabled: false,
  });

  // Fetch config
  const { data: config } = useQuery({
    queryKey: ['webdav-config'],
    queryFn: async () => {
      try {
        return await integrationsApi.webdav.getConfig();
      } catch {
        return null;
      }
    },
    select: (data) => {
      if (data && !form.serverUrl && !form.username) {
        setForm({
          serverUrl: data.serverUrl ?? '',
          username: data.username ?? '',
          password: data.password ?? '',
          basePath: data.basePath ?? '/',
          autoSync: data.autoSync ?? false,
          syncIntervalMinutes: data.syncIntervalMinutes ?? 60,
          enabled: data.enabled ?? false,
        });
      }
      return data;
    },
  });

  // Fetch files
  const { data: filesRaw } = useQuery({
    queryKey: ['webdav-files'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.webdav.getFiles();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const files = filesRaw ?? [];

  // Save config
  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.webdav.updateConfig(form as Partial<WebDavConfigData>),
    onSuccess: () => {
      toast.success(t('integrations.webdav.configSaved'));
      queryClient.invalidateQueries({ queryKey: ['webdav-config'] });
    },
    onError: () => toast.error(t('integrations.webdav.configError')),
  });

  // Sync all
  const syncAllMutation = useMutation({
    mutationFn: () => integrationsApi.webdav.syncAll(),
    onSuccess: (result) => {
      toast.success(
        t('integrations.webdav.syncComplete', {
          synced: String(result.synced),
          total: String(result.totalFiles),
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['webdav-files'] });
    },
    onError: () => toast.error(t('integrations.webdav.syncError')),
  });

  // Test connection
  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await integrationsApi.webdav.testConnection();
      setTestResult(result);
      if (result.success) {
        toast.success(
          t('integrations.webdav.testSuccess') + ' (' + result.responseTimeMs + t('integrations.webdav.ms') + ')',
        );
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t('integrations.webdav.testFailed'));
    } finally {
      setTesting(false);
    }
  }, []);

  // Sync single file
  const handleSyncFile = useCallback(async (fileId: number) => {
    setSyncingFileId(fileId);
    try {
      await integrationsApi.webdav.syncFile(fileId);
      toast.success(t('integrations.webdav.fileSynced'));
      queryClient.invalidateQueries({ queryKey: ['webdav-files'] });
    } catch {
      toast.error(t('integrations.webdav.fileSyncError'));
    } finally {
      setTimeout(() => setSyncingFileId(null), 1500);
    }
  }, [queryClient]);

  const syncStatusLabels = getSyncStatusLabels();
  const connStatusLabels = getConnStatusLabels();

  const fileColumns = useMemo<ColumnDef<WebDavFileData, unknown>[]>(() => [
    {
      accessorKey: 'fileName',
      header: t('integrations.webdav.colFileName'),
      size: 200,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {row.original.fileName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'remotePath',
      header: t('integrations.webdav.colRemotePath'),
      size: 250,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate block max-w-[250px]" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'fileSize',
      header: t('integrations.webdav.colSize'),
      size: 100,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
          {formatFileSize(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'syncStatus',
      header: t('integrations.webdav.colSyncStatus'),
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<string>()}
          colorMap={syncStatusColorMap}
          label={syncStatusLabels[getValue<string>()] ?? getValue<string>()}
        />
      ),
    },
    {
      accessorKey: 'lastModified',
      header: t('integrations.webdav.colLastModified'),
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs text-neutral-700 dark:text-neutral-300">
          {getValue<string>() ? formatDateTime(getValue<string>()) : '--'}
        </span>
      ),
    },
    {
      accessorKey: 'syncedAt',
      header: t('integrations.webdav.colSyncedAt'),
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
      size: 100,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="xs"
          iconLeft={
            syncingFileId === row.original.id
              ? <Loader2 size={12} className="animate-spin" />
              : <RefreshCw size={12} />
          }
          onClick={() => handleSyncFile(row.original.id)}
          disabled={syncingFileId === row.original.id}
        >
          {t('integrations.webdav.syncFile')}
        </Button>
      ),
    },
  ], [syncingFileId, handleSyncFile]);

  const connectionStatus = config?.status ?? 'DISCONNECTED';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.webdav.title')}
        subtitle={t('integrations.webdav.subtitle')}
        breadcrumbs={[
          { label: t('integrations.webdav.breadcrumbHome'), href: '/' },
          { label: t('integrations.webdav.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.webdav.title') },
        ]}
        backTo="/integrations"
        actions={
          activeTab === 'files' ? (
            <Button
              iconLeft={syncAllMutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <FolderSync size={16} />}
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
            >
              {t('integrations.webdav.syncAll')}
            </Button>
          ) : undefined
        }
        tabs={[
          { id: 'config', label: t('integrations.webdav.tabConfig') },
          { id: 'files', label: t('integrations.webdav.tabFiles'), count: files.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Summary card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <HardDrive size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              {t('integrations.webdav.title')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {config?.serverUrl ?? t('integrations.webdav.notConfigured')}
            </p>
          </div>
          <StatusBadge
            status={connectionStatus}
            colorMap={connStatusColorMap}
            label={connStatusLabels[connectionStatus] ?? connectionStatus}
            size="sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard
            icon={<HardDrive size={16} />}
            label={t('integrations.webdav.metricFiles')}
            value={files.length}
          />
          <MetricCard
            icon={<CheckCircle2 size={16} />}
            label={t('integrations.webdav.metricSynced')}
            value={files.filter((f) => f.syncStatus === 'SYNCED').length}
          />
          <MetricCard
            icon={<AlertTriangle size={16} />}
            label={t('integrations.webdav.metricConflicts')}
            value={files.filter((f) => f.syncStatus === 'CONFLICT').length}
          />
          <MetricCard
            icon={<XCircle size={16} />}
            label={t('integrations.webdav.metricErrors')}
            value={files.filter((f) => f.syncStatus === 'ERROR').length}
          />
        </div>
      </div>

      {/* Test result banner */}
      {testResult && (
        <div
          className={cn(
            'p-4 rounded-lg mb-6 flex items-center gap-3',
            testResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
          )}
        >
          {testResult.success
            ? <Wifi size={18} className="text-green-600 dark:text-green-400" />
            : <WifiOff size={18} className="text-red-600 dark:text-red-400" />}
          <div>
            <p className={cn('text-sm font-medium', testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
              {testResult.success
                ? t('integrations.webdav.testSuccess')
                : t('integrations.webdav.testFailed')}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {testResult.message} ({testResult.responseTimeMs}{t('integrations.webdav.ms')})
            </p>
          </div>
        </div>
      )}

      {/* Config tab */}
      {activeTab === 'config' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('integrations.webdav.configTitle')}
          </h3>
          <div className="space-y-4 max-w-2xl">
            <FormField label={t('integrations.webdav.fieldServerUrl')} required hint="https://cloud.example.com/remote.php/dav">
              <Input
                placeholder="https://nextcloud.example.com/remote.php/dav"
                value={form.serverUrl}
                onChange={(e) => setForm({ ...form, serverUrl: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('integrations.webdav.fieldUsername')} required>
                <Input
                  placeholder="admin"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </FormField>
              <FormField label={t('integrations.webdav.fieldPassword')} required>
                <Input
                  type="password"
                  placeholder="********"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label={t('integrations.webdav.fieldBasePath')} hint={t('integrations.webdav.hintBasePath')}>
              <Input
                placeholder="/files/documents"
                value={form.basePath}
                onChange={(e) => setForm({ ...form, basePath: e.target.value })}
              />
            </FormField>

            {/* Auto-sync toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, autoSync: !form.autoSync })}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    form.autoSync ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      form.autoSync && 'translate-x-5',
                    )}
                  />
                </button>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('integrations.webdav.autoSyncLabel')}
                </span>
              </div>
              {form.autoSync && (
                <div className="flex-1 max-w-xs">
                  <Select
                    options={[
                      { value: '15', label: t('integrations.webdav.interval15') },
                      { value: '30', label: t('integrations.webdav.interval30') },
                      { value: '60', label: t('integrations.webdav.interval60') },
                      { value: '360', label: t('integrations.webdav.interval360') },
                      { value: '1440', label: t('integrations.webdav.interval1440') },
                    ]}
                    value={String(form.syncIntervalMinutes)}
                    onChange={(e) => setForm({ ...form, syncIntervalMinutes: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {/* Enable toggle */}
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  form.enabled ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-600',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    form.enabled && 'translate-x-5',
                  )}
                />
              </button>
              <span className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                {form.enabled ? <Power size={14} className="text-green-500" /> : <PowerOff size={14} className="text-neutral-400" />}
                {form.enabled ? t('integrations.webdav.toggleEnabled') : t('integrations.webdav.toggleDisabled')}
              </span>
            </div>

            {/* Connection status card */}
            <div
              className={cn(
                'p-4 rounded-lg border flex items-center gap-3',
                connectionStatus === 'CONNECTED'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : connectionStatus === 'ERROR'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
              )}
            >
              {connectionStatus === 'CONNECTED'
                ? <Wifi size={18} className="text-green-600 dark:text-green-400" />
                : connectionStatus === 'ERROR'
                  ? <WifiOff size={18} className="text-red-600 dark:text-red-400" />
                  : <WifiOff size={18} className="text-neutral-400" />}
              <div className="flex-1">
                <p className={cn(
                  'text-sm font-medium',
                  connectionStatus === 'CONNECTED'
                    ? 'text-green-700 dark:text-green-300'
                    : connectionStatus === 'ERROR'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-neutral-600 dark:text-neutral-400',
                )}>
                  {connStatusLabels[connectionStatus] ?? connectionStatus}
                </p>
                {config?.lastSyncAt && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {t('integrations.webdav.lastTested')}: {formatDateTime(config.lastSyncAt)}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="xs"
                iconLeft={testing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                onClick={handleTestConnection}
                disabled={testing || !form.serverUrl}
              >
                {t('integrations.webdav.testConnection')}
              </Button>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                iconLeft={saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
              >
                {t('integrations.webdav.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Files tab */}
      {activeTab === 'files' && (
        <DataTable<WebDavFileData>
          data={files}
          columns={fileColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.webdav.emptyTitle')}
          emptyDescription={t('integrations.webdav.emptyDescription')}
        />
      )}
    </div>
  );
};

export default WebDavSettingsPage;
