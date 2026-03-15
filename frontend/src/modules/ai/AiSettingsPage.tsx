import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Settings2,
  Brain,
  Key,
  Thermometer,
  Hash,
  Save,
  Plus,
  Trash2,
  BarChart3,
  Clock,
  Coins,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Skeleton } from '@/design-system/components/Skeleton';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import {
  aiApi,
  type AiModelConfig,
  type AiProvider,
  type AiUsageLogEntry,
  type CreateAiModelConfigRequest,
} from '@/api/ai';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_OPTIONS: { value: AiProvider; label: string }[] = [
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'YANDEX_GPT', label: 'Yandex GPT' },
  { value: 'GIGACHAT', label: 'GigaChat' },
  { value: 'SELF_HOSTED', label: 'Self-Hosted' },
];

const MODEL_PRESETS: Record<AiProvider, string[]> = {
  OPENAI: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  YANDEX_GPT: ['yandexgpt', 'yandexgpt-lite', 'yandexgpt-32k'],
  GIGACHAT: ['GigaChat', 'GigaChat-Plus', 'GigaChat-Pro'],
  SELF_HOSTED: [],
};

type SettingsTab = 'config' | 'usage';
type UsagePeriod = '7d' | '30d' | 'all';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateRange(period: UsagePeriod): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (period === '7d') {
    from.setDate(from.getDate() - 7);
  } else if (period === '30d') {
    from.setDate(from.getDate() - 30);
  } else {
    from.setFullYear(from.getFullYear() - 5);
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function formatCostRub(cost: number): string {
  return cost.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  });
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

// ---------------------------------------------------------------------------
// Model Configuration Form
// ---------------------------------------------------------------------------

interface ConfigFormState {
  provider: AiProvider;
  modelName: string;
  apiUrl: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  isDefault: boolean;
}

const defaultFormState: ConfigFormState = {
  provider: 'OPENAI',
  modelName: 'gpt-4o-mini',
  apiUrl: '',
  apiKey: '',
  maxTokens: 4096,
  temperature: 0.7,
  isDefault: false,
};

const ModelConfigForm: React.FC<{
  initial?: ConfigFormState;
  editId?: string;
  onSave: (data: CreateAiModelConfigRequest, id?: string) => void;
  onCancel: () => void;
  saving: boolean;
}> = ({ initial, editId, onSave, onCancel, saving }) => {
  const [form, setForm] = useState<ConfigFormState>(initial ?? defaultFormState);

  const modelPresets = MODEL_PRESETS[form.provider] ?? [];

  const handleProviderChange = (provider: AiProvider) => {
    const presets = MODEL_PRESETS[provider] ?? [];
    setForm((prev) => ({
      ...prev,
      provider,
      modelName: presets[0] ?? prev.modelName,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        provider: form.provider,
        modelName: form.modelName,
        apiUrl: form.apiUrl || undefined,
        apiKeyEncrypted: form.apiKey || undefined,
        maxTokens: form.maxTokens,
        temperature: form.temperature,
        isDefault: form.isDefault,
        dataProcessingAgreementSigned: true,
      },
      editId,
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Provider */}
        <FormField label={t('ai.settings.provider')}>
          <Select
            value={form.provider}
            onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
            options={PROVIDER_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </FormField>

        {/* Model */}
        <FormField label={t('ai.settings.model')}>
          {modelPresets.length > 0 ? (
            <Select
              value={form.modelName}
              onChange={(e) => setForm((prev) => ({ ...prev, modelName: e.target.value }))}
              options={modelPresets.map((m) => ({ value: m, label: m }))}
            />
          ) : (
            <Input
              value={form.modelName}
              onChange={(e) => setForm((prev) => ({ ...prev, modelName: e.target.value }))}
              placeholder={t('ai.settings.modelPlaceholder')}
            />
          )}
        </FormField>
      </div>

      {/* API URL */}
      <FormField label={t('ai.settings.apiUrl')} hint={t('ai.settings.apiUrlHint')}>
        <Input
          value={form.apiUrl}
          onChange={(e) => setForm((prev) => ({ ...prev, apiUrl: e.target.value }))}
          placeholder="https://api.openai.com/v1"
        />
      </FormField>

      {/* API Key */}
      <FormField label={t('ai.settings.apiKey')}>
        <Input
          type="password"
          value={form.apiKey}
          onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
          placeholder={editId ? t('ai.settings.apiKeyUnchanged') : 'sk-...'}
          autoComplete="off"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Temperature */}
        <FormField label={`${t('ai.settings.temperature')}: ${form.temperature.toFixed(1)}`}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={form.temperature}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
            }
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>{t('ai.settings.temperaturePrecise')}</span>
            <span>{t('ai.settings.temperatureCreative')}</span>
          </div>
        </FormField>

        {/* Max Tokens */}
        <FormField label={t('ai.settings.maxTokens')}>
          <Input
            type="number"
            min={1}
            max={128000}
            value={form.maxTokens}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))
            }
          />
        </FormField>
      </div>

      {/* Default checkbox */}
      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        {t('ai.settings.setAsDefault')}
      </label>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" iconLeft={<Save size={16} />} disabled={!form.modelName || saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Model Config List
// ---------------------------------------------------------------------------

const ModelConfigList: React.FC<{
  configs: AiModelConfig[];
  loading: boolean;
  onEdit: (config: AiModelConfig) => void;
  onDelete: (id: string) => void;
}> = ({ configs, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <Brain size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">{t('ai.settings.noConfigs')}</p>
      </div>
    );
  }

  const statusColorMap: Record<string, 'green' | 'gray'> = {
    active: 'green',
    inactive: 'gray',
  };

  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <div
          key={config.id}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <Brain size={18} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {config.modelName}
                  </h4>
                  {config.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded">
                      <Star size={10} />
                      {t('ai.settings.default')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {config.providerDisplayName} &middot; {t('ai.settings.temp')} {config.temperature} &middot; {t('ai.settings.tokens')} {config.maxTokens.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                status={config.isActive ? 'active' : 'inactive'}
                colorMap={statusColorMap}
                label={config.isActive ? t('ai.settings.active') : t('ai.settings.inactive')}
              />
              <button
                onClick={() => onEdit(config)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                title={t('common.edit')}
              >
                <Settings2 size={16} />
              </button>
              <button
                onClick={() => onDelete(config.id)}
                className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-neutral-400 hover:text-danger-600 transition-colors"
                title={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Usage Section
// ---------------------------------------------------------------------------

const UsageSection: React.FC = () => {
  const [period, setPeriod] = useState<UsagePeriod>('7d');
  const { from, to } = getDateRange(period);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-usage-summary', from, to],
    queryFn: () => aiApi.getUsageSummary(from, to),
  });

  const { data: logsPage, isLoading: logsLoading } = useQuery({
    queryKey: ['ai-usage-logs', from, to],
    queryFn: () => aiApi.getUsageLogs(from, to),
  });

  const logs = logsPage?.content ?? [];

  const periodOptions: { value: UsagePeriod; label: string }[] = [
    { value: '7d', label: t('ai.settings.usageLast7d') },
    { value: '30d', label: t('ai.settings.usageLast30d') },
    { value: 'all', label: t('ai.settings.usageAllTime') },
  ];

  const successColorMap: Record<string, 'green' | 'red'> = {
    true: 'green',
    false: 'red',
  };

  const columns = useMemo<ColumnDef<AiUsageLogEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: t('ai.settings.usageColDate'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'feature',
        header: t('ai.settings.usageColFeature'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'tokens',
        header: t('ai.settings.usageColTokens'),
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
            {(row.original.tokensInput + row.original.tokensOutput).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'costRub',
        header: t('ai.settings.usageColCost'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatCostRub(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'responseTimeMs',
        header: t('ai.settings.usageColDuration'),
        size: 100,
        cell: ({ getValue }) => {
          const ms = getValue<number | null>();
          return (
            <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
              {ms != null ? `${ms} ms` : '--'}
            </span>
          );
        },
      },
      {
        accessorKey: 'wasSuccessful',
        header: t('ai.settings.usageColStatus'),
        size: 100,
        cell: ({ getValue }) => {
          const ok = getValue<boolean>();
          return (
            <StatusBadge
              status={String(ok)}
              colorMap={successColorMap}
              label={ok ? t('ai.settings.usageSuccess') : t('ai.settings.usageFailed')}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {t('ai.settings.usageTitle')}
        </h3>
        <div className="flex items-center gap-1.5">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                period === opt.value
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<BarChart3 size={16} />}
          label={t('ai.settings.metricTotalRequests')}
          value={summary?.totalConversations ?? 0}
          loading={summaryLoading}
        />
        <MetricCard
          icon={<Hash size={16} />}
          label={t('ai.settings.metricTotalTokens')}
          value={summary ? formatTokens(summary.totalTokens) : '0'}
          loading={summaryLoading}
        />
        <MetricCard
          icon={<Coins size={16} />}
          label={t('ai.settings.metricEstimatedCost')}
          value={summary ? formatCostRub(summary.totalCostRub) : formatCostRub(0)}
          loading={summaryLoading}
        />
        <MetricCard
          icon={<Clock size={16} />}
          label={t('ai.settings.metricAvgResponseTime')}
          value={summary ? `${Math.round(summary.avgResponseTimeMs)} ms` : '-- ms'}
          loading={summaryLoading}
        />
      </div>

      {/* Usage table */}
      <DataTable<AiUsageLogEntry>
        data={logs}
        columns={columns}
        loading={logsLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('ai.settings.usageEmpty')}
        emptyDescription={t('ai.settings.usageEmptyDesc')}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

const AiSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('config');
  const [showForm, setShowForm] = useState(false);
  const [editConfig, setEditConfig] = useState<AiModelConfig | null>(null);

  // Model configs query
  const { data: configsPage, isLoading: configsLoading } = useQuery({
    queryKey: ['ai-model-configs'],
    queryFn: () => aiApi.getModelConfigs(),
  });

  const configs = configsPage?.content ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAiModelConfigRequest) => aiApi.createModelConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-model-configs'] });
      toast.success(t('ai.settings.saveSuccess'));
      setShowForm(false);
    },
    onError: () => {
      toast.error(t('ai.settings.saveError'));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateAiModelConfigRequest }) =>
      aiApi.updateModelConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-model-configs'] });
      toast.success(t('ai.settings.saveSuccess'));
      setShowForm(false);
      setEditConfig(null);
    },
    onError: () => {
      toast.error(t('ai.settings.saveError'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteModelConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-model-configs'] });
      toast.success(t('ai.settings.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('ai.settings.deleteError'));
    },
  });

  const handleSave = useCallback(
    (data: CreateAiModelConfigRequest, id?: string) => {
      if (id) {
        updateMutation.mutate({ id, data });
      } else {
        createMutation.mutate(data);
      }
    },
    [createMutation, updateMutation],
  );

  const handleEdit = useCallback((config: AiModelConfig) => {
    setEditConfig(config);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm(t('ai.settings.deleteConfirm'))) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditConfig(null);
  }, []);

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'config', label: t('ai.settings.tabConfig'), icon: Settings2 },
    { id: 'usage', label: t('ai.settings.tabUsage'), icon: BarChart3 },
  ];

  const editFormState: ConfigFormState | undefined = editConfig
    ? {
        provider: editConfig.provider,
        modelName: editConfig.modelName,
        apiUrl: editConfig.apiUrl ?? '',
        apiKey: '',
        maxTokens: editConfig.maxTokens,
        temperature: editConfig.temperature,
        isDefault: editConfig.isDefault,
      }
    : undefined;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('ai.settings.title')}
        subtitle={t('ai.settings.subtitle')}
        breadcrumbs={[
          { label: t('ai.settings.breadcrumbHome'), href: '/' },
          { label: t('ai.settings.breadcrumbSettings'), href: '/settings' },
          { label: t('ai.settings.breadcrumbAi') },
        ]}
        actions={
          activeTab === 'config' && !showForm ? (
            <Button
              variant="primary"
              iconLeft={<Plus size={16} />}
              onClick={() => {
                setEditConfig(null);
                setShowForm(true);
              }}
            >
              {t('ai.settings.addConfig')}
            </Button>
          ) : undefined
        }
      />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div>
          {showForm ? (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                {editConfig ? t('ai.settings.editConfig') : t('ai.settings.newConfig')}
              </h3>
              <ModelConfigForm
                initial={editFormState}
                editId={editConfig?.id}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={createMutation.isPending || updateMutation.isPending}
              />
            </div>
          ) : (
            <ModelConfigList
              configs={configs}
              loading={configsLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && <UsageSection />}
    </div>
  );
};

export default AiSettingsPage;
