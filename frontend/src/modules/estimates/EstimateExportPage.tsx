import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Download, ShieldCheck, AlertTriangle, CheckCircle2, Clock, FileDown } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Select, Checkbox } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { estimatesApi } from '@/api/estimates';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Estimate } from '@/types';
import type { ExportConfig, ExportHistory, ExportValidation } from './types';
import toast from 'react-hot-toast';

const exportStatusColorMap: Record<string, string> = {
  success: 'green',
  failed: 'red',
};

const EstimateExportPage: React.FC = () => {
  const [selectedEstimateId, setSelectedEstimateId] = useState('');
  const [config, setConfig] = useState<ExportConfig>({
    includeSummary: true,
    includeDetails: true,
    formatVersion: '3.0',
  });
  const [validation, setValidation] = useState<ExportValidation | null>(null);

  const { data: estimatesData } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimatesApi.getEstimates(),
  });

  const estimates = estimatesData?.content ?? [];
  const estimateOptions = estimates.map((e: Estimate) => ({
    value: e.id,
    label: e.name,
  }));

  const { data: exportHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['estimate-export-history'],
    queryFn: () => estimatesApi.getExportHistory(),
  });

  const validateMutation = useMutation({
    mutationFn: (estimateId: string) => estimatesApi.validateForExport(estimateId),
    onSuccess: (result) => setValidation(result),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await estimatesApi.exportEstimate(selectedEstimateId, config);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `estimate_gge_${selectedEstimateId}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleValidate = useCallback(() => {
    if (!selectedEstimateId) return;
    validateMutation.mutate(selectedEstimateId);
  }, [selectedEstimateId, validateMutation]);

  const handleExport = useCallback(() => {
    if (!selectedEstimateId) return;
    exportMutation.mutate();
  }, [selectedEstimateId, exportMutation]);

  const historyColumns = useMemo<ColumnDef<ExportHistory, unknown>[]>(
    () => [
      {
        accessorKey: 'estimateName',
        header: t('estimates.export.colEstimate'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'exportDate',
        header: t('estimates.export.colDate'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm tabular-nums">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'format',
        header: t('estimates.export.colFormat'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="uppercase text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('estimates.export.colStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <StatusBadge
              status={status}
              colorMap={exportStatusColorMap}
              label={t(`estimates.export.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
            />
          );
        },
      },
    ],
    [],
  );

  const versionOptions = [
    { value: '2.0', label: 'v2.0' },
    { value: '3.0', label: 'v3.0' },
    { value: '4.0', label: 'v4.0' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.export.title')}
        subtitle={t('estimates.export.subtitle')}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.export.breadcrumbHome'), href: '/' },
          { label: t('estimates.export.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.export.breadcrumbExport') },
        ]}
      />

      {/* Validation summary cards */}
      {validation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <MetricCard
            icon={<ShieldCheck size={18} />}
            label={t('estimates.export.metricValidation')}
            value={validation.valid ? t('estimates.export.validationPassed') : t('estimates.export.validationFailed')}
          />
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label={t('estimates.export.metricErrors')}
            value={String(validation.errors.length)}
          />
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label={t('estimates.export.metricWarnings')}
            value={String(validation.warnings.length)}
          />
        </div>
      )}

      {/* Export configuration */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('estimates.export.configSection')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label={t('estimates.export.labelEstimate')} required>
            <Select
              value={selectedEstimateId}
              onChange={(e) => {
                setSelectedEstimateId(e.target.value);
                setValidation(null);
              }}
              options={estimateOptions}
              placeholder={t('estimates.export.selectEstimate')}
            />
          </FormField>

          <FormField label={t('estimates.export.labelFormatVersion')}>
            <Select
              value={config.formatVersion}
              onChange={(e) => setConfig((prev) => ({ ...prev, formatVersion: e.target.value }))}
              options={versionOptions}
            />
          </FormField>
        </div>

        <div className="flex items-center gap-6 mt-4">
          <Checkbox
            id="includeSummary"
            label={t('estimates.export.optIncludeSummary')}
            checked={config.includeSummary}
            onChange={(e) => setConfig((prev) => ({ ...prev, includeSummary: e.target.checked }))}
          />
          <Checkbox
            id="includeDetails"
            label={t('estimates.export.optIncludeDetails')}
            checked={config.includeDetails}
            onChange={(e) => setConfig((prev) => ({ ...prev, includeDetails: e.target.checked }))}
          />
        </div>

        {/* Validation results */}
        {validation && !validation.valid && (
          <div className="mt-4 space-y-3">
            {validation.errors.length > 0 && (
              <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-danger-600" />
                  <span className="text-sm font-medium text-danger-700 dark:text-danger-300">
                    {t('estimates.export.errorsTitle')}
                  </span>
                </div>
                <ul className="space-y-1">
                  {validation.errors.map((err, idx) => (
                    <li key={idx} className="text-sm text-danger-600 dark:text-danger-400 pl-6">
                      <span className="font-medium">{err.field}:</span> {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-warning-600" />
                  <span className="text-sm font-medium text-warning-700 dark:text-warning-300">
                    {t('estimates.export.warningsTitle')}
                  </span>
                </div>
                <ul className="space-y-1">
                  {validation.warnings.map((warn, idx) => (
                    <li key={idx} className="text-sm text-warning-600 dark:text-warning-400 pl-6">
                      <span className="font-medium">{warn.field}:</span> {warn.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {validation?.valid && (
          <div className="mt-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-success-600 flex-shrink-0" />
            <span className="text-sm text-success-700 dark:text-success-300">
              {t('estimates.export.validationPassedMsg')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="secondary"
            iconLeft={<ShieldCheck size={16} />}
            onClick={handleValidate}
            loading={validateMutation.isPending}
            disabled={!selectedEstimateId}
          >
            {t('estimates.export.btnValidate')}
          </Button>
          <Button
            iconLeft={<Download size={16} />}
            onClick={handleExport}
            loading={exportMutation.isPending}
            disabled={!selectedEstimateId || (validation !== null && !validation.valid)}
          >
            {t('estimates.export.btnExport')}
          </Button>
        </div>
      </div>

      {/* Export history */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-neutral-400" />
          {t('estimates.export.historyTitle')}
        </h3>
        <DataTable<ExportHistory>
          data={exportHistory}
          columns={historyColumns}
          loading={historyLoading}
          pageSize={10}
          emptyTitle={t('estimates.export.historyEmpty')}
          emptyDescription={t('estimates.export.historyEmptyDesc')}
          enableExport
        />
      </div>
    </div>
  );
};

export default EstimateExportPage;
