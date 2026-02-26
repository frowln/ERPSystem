import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  KeyRound,
  LinkIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Settings,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { isupApi, type IsupConfiguration } from '@/api/isup';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { Project, PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEP_KEYS = ['organization', 'connection', 'mappings', 'activate'] as const;

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface ConfigForm {
  organizationName: string;
  organizationInn: string;
  isupOrgId: string;
  apiUrl: string;
  apiKey: string;
  certificateThumbprint: string;
}

interface MappingRow {
  privodProjectId: string;
  privodProjectName: string;
  isupProjectId: string;
  isupProjectName: string;
}

const emptyForm: ConfigForm = {
  organizationName: '',
  organizationInn: '',
  isupOrgId: '',
  apiUrl: '',
  apiKey: '',
  certificateThumbprint: '',
};

// ---------------------------------------------------------------------------
// Color maps for configurations
// ---------------------------------------------------------------------------

const configStatusColorMap: Record<string, 'green' | 'red' | 'gray'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  ERROR: 'red',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IsupConfigWizardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ConfigForm>(emptyForm);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [createdConfigId, setCreatedConfigId] = useState<string | null>(null);

  const STEPS = [
    t('isup.wizard.stepOrganization'),
    t('isup.wizard.stepConnection'),
    t('isup.wizard.stepMappings'),
    t('isup.wizard.stepActivate'),
  ];

  // Fetch existing configurations
  const { data: configurationsRaw } = useQuery({
    queryKey: ['isup-configurations'],
    queryFn: async () => {
      try {
        return await isupApi.getConfigurations();
      } catch {
        return [];
      }
    },
  });
  const configurations = configurationsRaw ?? [];

  // Fetch projects for mapping step
  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects-for-isup'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 200 }),
    enabled: step === 2,
  });
  const projects = projectsData?.content ?? [];

  // Create configuration mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const config = await isupApi.createConfiguration({
        organizationName: form.organizationName,
        organizationInn: form.organizationInn,
        isupOrgId: form.isupOrgId,
        apiUrl: form.apiUrl,
        apiKey: form.apiKey,
        certificateThumbprint: form.certificateThumbprint || undefined,
        isActive: true,
      });
      // Create mappings
      for (const mapping of mappings) {
        if (mapping.privodProjectId && mapping.isupProjectId) {
          await isupApi.createProjectMapping(config.id, {
            privodProjectId: mapping.privodProjectId,
            privodProjectName: mapping.privodProjectName,
            isupProjectId: mapping.isupProjectId,
            isupProjectName: mapping.isupProjectName,
            syncEnabled: true,
          });
        }
      }
      return config;
    },
    onSuccess: (config) => {
      setCreatedConfigId(config.id);
      toast.success(t('isup.wizard.configCreated'));
      queryClient.invalidateQueries({ queryKey: ['isup-configurations'] });
    },
    onError: () => {
      toast.error(t('isup.wizard.createError'));
    },
  });

  const handleTestConnection = useCallback(async () => {
    if (createdConfigId) {
      setTestingConnection(true);
      setTestResult(null);
      try {
        const result = await isupApi.testConnection(createdConfigId);
        setTestResult(result);
        if (result.success) {
          toast.success(t('isup.wizard.connectionSuccess'));
        } else {
          toast.error(result.message || t('isup.wizard.connectionFailed'));
        }
      } catch {
        setTestResult({ success: false, message: t('isup.wizard.connectionError') });
        toast.error(t('isup.wizard.connectionError'));
      } finally {
        setTestingConnection(false);
      }
    }
  }, [createdConfigId]);

  const handleAddMapping = useCallback(() => {
    setMappings((prev) => [
      ...prev,
      { privodProjectId: '', privodProjectName: '', isupProjectId: '', isupProjectName: '' },
    ]);
  }, []);

  const handleRemoveMapping = useCallback((index: number) => {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMappingChange = useCallback((index: number, field: keyof MappingRow, value: string) => {
    setMappings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-fill project name when selecting project
      if (field === 'privodProjectId') {
        const project = projects.find((p) => p.id === value);
        if (project) {
          updated[index].privodProjectName = project.name;
        }
      }
      return updated;
    });
  }, [projects]);

  const handleReset = useCallback(() => {
    setStep(0);
    setForm(emptyForm);
    setMappings([]);
    setTestResult(null);
    setCreatedConfigId(null);
  }, []);

  // Validation per step
  const canNext =
    step === 0
      ? form.organizationName.trim() !== '' && form.organizationInn.trim() !== '' && form.isupOrgId.trim() !== ''
      : step === 1
        ? form.apiUrl.trim() !== '' && form.apiKey.trim() !== ''
        : step === 2
          ? true // Mappings are optional at this point
          : true;

  const handleNext = useCallback(() => {
    if (step === 2) {
      // When moving from mappings to activate, create the configuration
      createMutation.mutate();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, createMutation, STEPS.length]);

  const activeConfig = configurations.find((c) => c.isActive);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('isup.wizard.title')}
        subtitle={t('isup.wizard.subtitle')}
        breadcrumbs={[
          { label: t('isup.wizard.breadcrumbHome'), href: '/' },
          { label: t('isup.wizard.breadcrumbSettings'), href: '/settings' },
          { label: t('isup.wizard.breadcrumbIsup') },
        ]}
        backTo="/settings"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Building2 size={16} />}
          label={t('isup.wizard.metricConfigs')}
          value={configurations.length}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('isup.wizard.metricActive')}
          value={activeConfig ? t('isup.wizard.statusConnected') : t('isup.wizard.statusNotConfigured')}
        />
        <MetricCard
          icon={<Globe size={16} />}
          label={t('isup.wizard.metricLastSync')}
          value={activeConfig?.lastSyncAt ? formatDateTime(activeConfig.lastSyncAt) : '--'}
        />
      </div>

      {/* Existing configurations list */}
      {configurations.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-3">
            {t('isup.wizard.existingConfigs')}
          </h3>
          <div className="space-y-2">
            {configurations.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {config.organizationName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('isup.wizard.inn')}: {config.organizationInn} | {t('isup.wizard.orgId')}: {config.isupOrgId}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={config.isActive ? 'ACTIVE' : 'INACTIVE'}
                  colorMap={configStatusColorMap}
                  label={config.isActive ? t('isup.wizard.statusActive') : t('isup.wizard.statusInactive')}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wizard */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                  i < step
                    ? 'bg-success-600 text-white'
                    : i === step
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400',
                )}
              >
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm hidden sm:inline',
                  i <= step
                    ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                    : 'text-neutral-400 dark:text-neutral-500',
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1',
                    i < step ? 'bg-success-400' : 'bg-neutral-200 dark:bg-neutral-700',
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Organization */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('isup.wizard.step1Title')}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('isup.wizard.step1Description')}
                </p>
              </div>
            </div>
            <FormField label={t('isup.wizard.organizationName')} required>
              <Input
                placeholder={t('isup.wizard.organizationNamePlaceholder')}
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('isup.wizard.organizationInn')} required>
                <Input
                  placeholder={t('isup.wizard.innPlaceholder')}
                  value={form.organizationInn}
                  onChange={(e) => setForm({ ...form, organizationInn: e.target.value })}
                />
              </FormField>
              <FormField label={t('isup.wizard.isupOrgId')} required hint={t('isup.wizard.isupOrgIdHint')}>
                <Input
                  placeholder={t('isup.wizard.isupOrgIdPlaceholder')}
                  value={form.isupOrgId}
                  onChange={(e) => setForm({ ...form, isupOrgId: e.target.value })}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Step 2: API Connection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <Globe size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('isup.wizard.step2Title')}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('isup.wizard.step2Description')}
                </p>
              </div>
            </div>
            <FormField label={t('isup.wizard.apiUrl')} required hint="https://isup.minstroy.gov.ru/api">
              <Input
                placeholder="https://isup.minstroy.gov.ru/api"
                value={form.apiUrl}
                onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
              />
            </FormField>
            <FormField label={t('isup.wizard.apiKey')} required>
              <Input
                type="password"
                placeholder={t('isup.wizard.apiKeyPlaceholder')}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </FormField>
            <FormField label={t('isup.wizard.certificate')} hint={t('isup.wizard.certificateHint')}>
              <Input
                placeholder={t('isup.wizard.certificatePlaceholder')}
                value={form.certificateThumbprint}
                onChange={(e) => setForm({ ...form, certificateThumbprint: e.target.value })}
              />
            </FormField>
          </div>
        )}

        {/* Step 3: Project Mappings */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <LinkIcon size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('isup.wizard.step3Title')}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('isup.wizard.step3Description')}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Plus size={14} />}
                onClick={handleAddMapping}
              >
                {t('isup.wizard.addMapping')}
              </Button>
            </div>

            {mappings.length === 0 && (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <LinkIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('isup.wizard.noMappings')}</p>
                <p className="text-xs mt-1">{t('isup.wizard.noMappingsHint')}</p>
              </div>
            )}

            {mappings.map((mapping, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('isup.wizard.mappingNumber', { number: String(index + 1) })}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    iconLeft={<Trash2 size={12} />}
                    onClick={() => handleRemoveMapping(index)}
                  >
                    {t('isup.wizard.remove')}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t('isup.wizard.privodProject')}>
                    <select
                      className="w-full h-9 px-3 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded-lg"
                      value={mapping.privodProjectId}
                      onChange={(e) => handleMappingChange(index, 'privodProjectId', e.target.value)}
                    >
                      <option value="">{t('isup.wizard.selectProject')}</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label={t('isup.wizard.isupProjectId')}>
                    <Input
                      placeholder={t('isup.wizard.isupProjectIdPlaceholder')}
                      value={mapping.isupProjectId}
                      onChange={(e) => handleMappingChange(index, 'isupProjectId', e.target.value)}
                    />
                  </FormField>
                  <FormField label={t('isup.wizard.isupProjectName')}>
                    <Input
                      placeholder={t('isup.wizard.isupProjectNamePlaceholder')}
                      value={mapping.isupProjectName}
                      onChange={(e) => handleMappingChange(index, 'isupProjectName', e.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Test & Activate */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <ShieldCheck size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('isup.wizard.step4Title')}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('isup.wizard.step4Description')}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('isup.wizard.configSummary')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('isup.wizard.organizationName')}:</span>{' '}
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">{form.organizationName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('isup.wizard.organizationInn')}:</span>{' '}
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">{form.organizationInn}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('isup.wizard.isupOrgId')}:</span>{' '}
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">{form.isupOrgId}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('isup.wizard.apiUrl')}:</span>{' '}
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium font-mono text-xs">{form.apiUrl}</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('isup.wizard.mappingsCount')}:</span>{' '}
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">{mappings.length}</span>
                </div>
              </div>
            </div>

            {/* Connection test result */}
            {testResult && (
              <div
                className={cn(
                  'p-4 rounded-lg flex items-center gap-3',
                  testResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle size={18} className="text-red-600 dark:text-red-400" />
                )}
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      testResult.success
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300',
                    )}
                  >
                    {testResult.success ? t('isup.wizard.connectionSuccess') : t('isup.wizard.connectionFailed')}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Test button */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                iconLeft={
                  testingConnection ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Zap size={16} />
                  )
                }
                onClick={handleTestConnection}
                disabled={testingConnection || !createdConfigId}
              >
                {t('isup.wizard.testConnection')}
              </Button>
              {createMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <Loader2 size={14} className="animate-spin" />
                  {t('isup.wizard.creating')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button
            variant="secondary"
            onClick={step === 0 ? handleReset : () => setStep(step - 1)}
          >
            {step === 0 ? t('common.cancel') : t('common.previous')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canNext || (step === 2 && createMutation.isPending)}
              loading={step === 2 && createMutation.isPending}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button
              variant="success"
              iconLeft={<CheckCircle2 size={16} />}
              onClick={handleReset}
            >
              {t('isup.wizard.finish')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IsupConfigWizardPage;
