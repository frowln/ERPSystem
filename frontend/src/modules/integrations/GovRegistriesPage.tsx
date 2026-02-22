import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Landmark,
  Search,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import {
  integrationsApi,
  type RegistryConfigData,
  type CheckResultData,
  type CounterpartyCheckSummaryData,
} from '@/api/integrations';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const configStatusColorMap: Record<string, 'green' | 'gray' | 'red'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  ERROR: 'red',
};

const getConfigStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('integrations.govRegistries.statusActive'),
  INACTIVE: t('integrations.govRegistries.statusInactive'),
  ERROR: t('integrations.govRegistries.statusError'),
});

const checkStatusColorMap: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  OK: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  NOT_FOUND: 'gray',
};

const getCheckStatusLabels = (): Record<string, string> => ({
  OK: t('integrations.govRegistries.checkStatusOk'),
  WARNING: t('integrations.govRegistries.checkStatusWarning'),
  ERROR: t('integrations.govRegistries.checkStatusError'),
  NOT_FOUND: t('integrations.govRegistries.checkStatusNotFound'),
});

const riskColorMap: Record<string, 'green' | 'yellow' | 'orange' | 'red'> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const getRiskLabels = (): Record<string, string> => ({
  LOW: t('integrations.govRegistries.riskLow'),
  MEDIUM: t('integrations.govRegistries.riskMedium'),
  HIGH: t('integrations.govRegistries.riskHigh'),
  CRITICAL: t('integrations.govRegistries.riskCritical'),
});

const riskBgClasses: Record<string, string> = {
  LOW: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  MEDIUM: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  HIGH: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  CRITICAL: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
};

const riskTextClasses: Record<string, string> = {
  LOW: 'text-green-700 dark:text-green-400',
  MEDIUM: 'text-yellow-700 dark:text-yellow-400',
  HIGH: 'text-orange-700 dark:text-orange-400',
  CRITICAL: 'text-red-700 dark:text-red-400',
};

const riskIcons: Record<string, React.ElementType> = {
  LOW: ShieldCheck,
  MEDIUM: AlertTriangle,
  HIGH: ShieldAlert,
  CRITICAL: ShieldX,
};

type TabId = 'configs' | 'check' | 'history';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GovRegistriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('configs');
  const [innInput, setInnInput] = useState('');
  const [checkResult, setCheckResult] = useState<CounterpartyCheckSummaryData | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const { data: configsRaw } = useQuery({
    queryKey: ['gov-registry-configs'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.govRegistries.getConfigs();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const configs = configsRaw ?? [];

  const { data: historyRaw } = useQuery({
    queryKey: ['gov-registry-history'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.govRegistries.getCheckHistory();
        return res.content ?? [];
      } catch {
        return [];
      }
    },
  });
  const history = historyRaw ?? [];

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const toggleMutation = useMutation({
    mutationFn: (config: RegistryConfigData) =>
      integrationsApi.govRegistries.updateConfig(config.id, { enabled: !config.enabled }),
    onSuccess: () => {
      toast.success(t('integrations.govRegistries.toastConfigUpdated'));
      queryClient.invalidateQueries({ queryKey: ['gov-registry-configs'] });
    },
    onError: () => toast.error(t('integrations.govRegistries.toastConfigError')),
  });

  const checkMutation = useMutation({
    mutationFn: (inn: string) => integrationsApi.govRegistries.checkCounterparty(inn),
    onSuccess: (data) => {
      setCheckResult(data);
      toast.success(t('integrations.govRegistries.toastCheckComplete'));
      queryClient.invalidateQueries({ queryKey: ['gov-registry-history'] });
    },
    onError: () => toast.error(t('integrations.govRegistries.toastCheckError')),
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleCheck = useCallback(() => {
    const trimmed = innInput.trim();
    if (!trimmed) {
      toast.error(t('integrations.govRegistries.innRequired'));
      return;
    }
    if (!/^\d{10,12}$/.test(trimmed)) {
      toast.error(t('integrations.govRegistries.innInvalid'));
      return;
    }
    setCheckResult(null);
    checkMutation.mutate(trimmed);
  }, [innInput, checkMutation]);

  // -------------------------------------------------------------------------
  // Table columns
  // -------------------------------------------------------------------------

  const configStatusLabels = getConfigStatusLabels();

  const configColumns = useMemo<ColumnDef<RegistryConfigData, unknown>[]>(
    () => [
      {
        accessorKey: 'registryType',
        header: t('integrations.govRegistries.colType'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('integrations.govRegistries.colDescription'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integrations.govRegistries.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={configStatusColorMap}
            label={configStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'apiUrl',
        header: t('integrations.govRegistries.colApiUrl'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate block max-w-[200px]">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'lastCheckAt',
        header: t('integrations.govRegistries.colLastCheck'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {getValue<string>() ? formatDateTime(getValue<string>()) : '--'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('integrations.govRegistries.colActions'),
        size: 140,
        cell: ({ row }) => (
          <Button
            variant={row.original.enabled ? 'secondary' : 'primary'}
            size="xs"
            onClick={() => toggleMutation.mutate(row.original)}
            disabled={toggleMutation.isPending}
          >
            {row.original.enabled
              ? t('integrations.govRegistries.actionDisable')
              : t('integrations.govRegistries.actionEnable')}
          </Button>
        ),
      },
    ],
    [configStatusLabels, toggleMutation],
  );

  const checkStatusLabels = getCheckStatusLabels();
  const riskLabels = getRiskLabels();

  const historyColumns = useMemo<ColumnDef<CheckResultData, unknown>[]>(
    () => [
      {
        accessorKey: 'checkDate',
        header: t('integrations.govRegistries.histColDate'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'inn',
        header: t('integrations.govRegistries.histColInn'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'registryType',
        header: t('integrations.govRegistries.histColRegistry'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integrations.govRegistries.histColStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={checkStatusColorMap}
            label={checkStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'riskLevel',
        header: t('integrations.govRegistries.histColRisk'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={riskColorMap}
            label={riskLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'source',
        header: t('integrations.govRegistries.histColSource'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    [checkStatusLabels, riskLabels],
  );

  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  const activeConfigs = configs.filter((c) => c.status === 'ACTIVE').length;
  const errorConfigs = configs.filter((c) => c.status === 'ERROR').length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.govRegistries.title')}
        subtitle={t('integrations.govRegistries.subtitle')}
        breadcrumbs={[
          { label: t('integrations.govRegistries.breadcrumbHome'), href: '/' },
          { label: t('integrations.govRegistries.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.govRegistries.title') },
        ]}
        backTo="/integrations"
        tabs={[
          { id: 'configs', label: t('integrations.govRegistries.tabConfigs'), count: configs.length },
          { id: 'check', label: t('integrations.govRegistries.tabCheckCounterparty') },
          { id: 'history', label: t('integrations.govRegistries.tabHistory'), count: history.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Summary metrics */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Landmark size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              {t('integrations.govRegistries.summaryTitle')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('integrations.govRegistries.summaryDescription')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard
            icon={<Database size={16} />}
            label={t('integrations.govRegistries.metricTotal')}
            value={configs.length}
          />
          <MetricCard
            icon={<CheckCircle2 size={16} />}
            label={t('integrations.govRegistries.metricActive')}
            value={activeConfigs}
          />
          <MetricCard
            icon={<XCircle size={16} />}
            label={t('integrations.govRegistries.metricErrors')}
            value={errorConfigs}
          />
          <MetricCard
            icon={<Activity size={16} />}
            label={t('integrations.govRegistries.metricChecks')}
            value={history.length}
          />
        </div>
      </div>

      {/* ==================== Configs Tab ==================== */}
      {activeTab === 'configs' && (
        <DataTable<RegistryConfigData>
          data={configs}
          columns={configColumns}
          enableColumnVisibility
          enableDensityToggle
          pageSize={15}
          emptyTitle={t('integrations.govRegistries.emptyConfigsTitle')}
          emptyDescription={t('integrations.govRegistries.emptyConfigsDescription')}
        />
      )}

      {/* ==================== Check Counterparty Tab ==================== */}
      {activeTab === 'check' && (
        <div className="space-y-6">
          {/* Input form */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('integrations.govRegistries.checkTitle')}
            </h3>
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-sm">
                <FormField label={t('integrations.govRegistries.checkInnLabel')} required>
                  <Input
                    placeholder={t('integrations.govRegistries.checkInnPlaceholder')}
                    value={innInput}
                    onChange={(e) => setInnInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  />
                </FormField>
              </div>
              <Button
                onClick={handleCheck}
                loading={checkMutation.isPending}
                iconLeft={
                  checkMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )
                }
              >
                {t('integrations.govRegistries.checkButton')}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {t('integrations.govRegistries.checkHint')}
            </p>
          </div>

          {/* Check results */}
          {checkResult && (
            <div className="space-y-4">
              {/* Overall summary card */}
              <div
                className={cn(
                  'rounded-xl border p-6',
                  riskBgClasses[checkResult.overallRisk] ?? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  {(() => {
                    const RiskIcon = riskIcons[checkResult.overallRisk] ?? ShieldCheck;
                    return (
                      <RiskIcon
                        size={32}
                        className={riskTextClasses[checkResult.overallRisk] ?? 'text-neutral-600'}
                      />
                    );
                  })()}
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-lg">
                      {checkResult.companyName || checkResult.inn}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t('integrations.govRegistries.resultInn')}: {checkResult.inn}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <div
                      className={cn(
                        'px-4 py-2 rounded-lg font-semibold text-sm',
                        riskBgClasses[checkResult.overallRisk],
                        riskTextClasses[checkResult.overallRisk],
                      )}
                    >
                      {t('integrations.govRegistries.resultOverallRisk')}:{' '}
                      {riskLabels[checkResult.overallRisk] ?? checkResult.overallRisk}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('integrations.govRegistries.resultCheckedAt')}: {formatDateTime(checkResult.checkedAt)}
                </p>
              </div>

              {/* Individual results */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {checkResult.results.map((result) => {
                  const ResultIcon = riskIcons[result.riskLevel] ?? ShieldCheck;
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        'rounded-lg border p-4',
                        'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ResultIcon
                            size={18}
                            className={riskTextClasses[result.riskLevel] ?? 'text-neutral-500'}
                          />
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                            {result.registryType}
                          </span>
                        </div>
                        <StatusBadge
                          status={result.riskLevel}
                          colorMap={riskColorMap}
                          label={riskLabels[result.riskLevel] ?? result.riskLevel}
                          size="sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            {t('integrations.govRegistries.resultStatus')}
                          </span>
                          <StatusBadge
                            status={result.status}
                            colorMap={checkStatusColorMap}
                            label={checkStatusLabels[result.status] ?? result.status}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            {t('integrations.govRegistries.resultSource')}
                          </span>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {result.source}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            {t('integrations.govRegistries.resultDate')}
                          </span>
                          <span className="text-neutral-700 dark:text-neutral-300">
                            {formatDateTime(result.checkDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== History Tab ==================== */}
      {activeTab === 'history' && (
        <DataTable<CheckResultData>
          data={history}
          columns={historyColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.govRegistries.emptyHistoryTitle')}
          emptyDescription={t('integrations.govRegistries.emptyHistoryDescription')}
        />
      )}
    </div>
  );
};

export default GovRegistriesPage;
