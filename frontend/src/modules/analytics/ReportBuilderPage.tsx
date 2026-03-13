import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileBarChart,
  Plus,
  Play,
  Copy,
  Trash2,
  Clock,
  Globe,
  Lock,
  Settings,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import {
  reportBuilderApi,
  type ReportTemplate,
  type CreateReportTemplateRequest,
  type ReportDataSource,
  type ChartType,
} from '@/api/reportBuilder';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const tp = (k: string) => t(`reportBuilder.${k}`);

const dataSourceLabels: Record<ReportDataSource, string> = {
  PROJECTS: 'projects',
  CONTRACTS: 'contracts',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  EMPLOYEES: 'employees',
  MATERIALS: 'materials',
  DAILY_LOGS: 'dailyLogs',
  QUALITY_CHECKS: 'qualityChecks',
  SAFETY_INCIDENTS: 'safetyIncidents',
  KS2_DOCUMENTS: 'ks2Documents',
  TASKS: 'tasks',
  PURCHASE_REQUESTS: 'purchaseRequests',
};

const chartTypeLabels: Record<ChartType, string> = {
  NONE: 'none',
  BAR: 'bar',
  LINE: 'line',
  PIE: 'pie',
  AREA: 'area',
  STACKED_BAR: 'stackedBar',
};

const ReportBuilderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  // Create form
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDataSource, setFormDataSource] = useState<ReportDataSource>('PROJECTS');
  const [formChartType, setFormChartType] = useState<ChartType>('NONE');
  const [formIsPublic, setFormIsPublic] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => reportBuilderApi.getTemplates({ size: 100 }),
  });

  const { data: historyData } = useQuery({
    queryKey: ['report-history', showHistory],
    queryFn: () => reportBuilderApi.getExecutionHistory(showHistory!, { size: 20 }),
    enabled: !!showHistory,
  });

  const templates = data?.content ?? [];
  const executions = historyData?.content ?? [];

  const metrics = useMemo(() => ({
    total: templates.length,
    public: templates.filter((t) => t.isPublic).length,
    scheduled: templates.filter((t) => t.scheduleEnabled).length,
    recentRuns: templates.filter((t) => t.lastRunAt).length,
  }), [templates]);

  const filteredTemplates = activeTab === 'all' ? templates
    : activeTab === 'public' ? templates.filter((t) => t.isPublic)
    : activeTab === 'scheduled' ? templates.filter((t) => t.scheduleEnabled)
    : templates.filter((t) => !t.isPublic);

  const tabs = [
    { id: 'all', label: tp('tabAll'), count: metrics.total },
    { id: 'public', label: tp('tabPublic'), count: metrics.public },
    { id: 'private', label: tp('tabPrivate'), count: metrics.total - metrics.public },
    { id: 'scheduled', label: tp('tabScheduled'), count: metrics.scheduled },
  ];

  const dataSourceOptions = Object.entries(dataSourceLabels).map(([value, key]) => ({
    value,
    label: tp(`source${key.charAt(0).toUpperCase() + key.slice(1)}`),
  }));

  const chartTypeOptions = Object.entries(chartTypeLabels).map(([value, key]) => ({
    value,
    label: tp(`chart${key.charAt(0).toUpperCase() + key.slice(1)}`),
  }));

  const createMutation = useMutation({
    mutationFn: (data: CreateReportTemplateRequest) => reportBuilderApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success(tp('createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(tp('createError')),
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => reportBuilderApi.executeReport(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success(tp('executeSuccess').replace('{rows}', String(result.rowCount || 0)));
    },
    onError: () => toast.error(tp('executeError')),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => reportBuilderApi.duplicateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success(tp('duplicateSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportBuilderApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success(tp('deleteSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDataSource('PROJECTS');
    setFormChartType('NONE');
    setFormIsPublic(false);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: tp('colName'),
      cell: ({ row }: { row: { original: ReportTemplate } }) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {row.original.isPublic ? (
              <Globe size={12} className="text-green-500" />
            ) : (
              <Lock size={12} className="text-neutral-400 dark:text-neutral-500" />

            )}
          </div>
          {row.original.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dataSource',
      header: tp('colSource'),
      cell: ({ row }: { row: { original: ReportTemplate } }) => {
        const key = dataSourceLabels[row.original.dataSource] || row.original.dataSource;
        return <StatusBadge status={tp(`source${key.charAt(0).toUpperCase() + key.slice(1)}`)} colorMap={{ [tp(`source${key.charAt(0).toUpperCase() + key.slice(1)}`)]: 'blue' }} />;
      },
    },
    {
      accessorKey: 'chartType',
      header: tp('colChart'),
      cell: ({ row }: { row: { original: ReportTemplate } }) => {
        const ct = row.original.chartType;
        if (ct === 'NONE') return '—';
        const key = chartTypeLabels[ct];
        return tp(`chart${key.charAt(0).toUpperCase() + key.slice(1)}`);
      },
    },
    {
      accessorKey: 'lastRunAt',
      header: tp('colLastRun'),
      cell: ({ row }: { row: { original: ReportTemplate } }) =>
        row.original.lastRunAt ? formatRelativeTime(row.original.lastRunAt) : '—',
    },
    {
      accessorKey: 'createdAt',
      header: tp('colCreated'),
      cell: ({ row }: { row: { original: ReportTemplate } }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: ReportTemplate } }) => {
        const tmpl = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button size="xs" variant="primary" onClick={() => executeMutation.mutate(tmpl.id)} title={tp('runAction')}>
              <Play size={12} />
            </Button>
            <Button size="xs" variant="outline" onClick={() => setShowHistory(tmpl.id)} title={tp('historyAction')}>
              <Clock size={12} />
            </Button>
            <Button size="xs" variant="ghost" onClick={() => duplicateMutation.mutate(tmpl.id)} title={tp('duplicateAction')}>
              <Copy size={12} />
            </Button>
            <Button size="xs" variant="ghost" onClick={() => deleteMutation.mutate(tmpl.id)} title={t('common.delete')}>
              <Trash2 size={12} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: tp('breadcrumbAnalytics'), href: '/analytics' },
          { label: tp('breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1" /> {tp('createTemplate')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileBarChart size={18} />} label={tp('metricTotal')} value={metrics.total} />
        <MetricCard icon={<Globe size={18} />} label={tp('metricPublic')} value={metrics.public} />
        <MetricCard icon={<Settings size={18} />} label={tp('metricScheduled')} value={metrics.scheduled} />
        <MetricCard icon={<Play size={18} />} label={tp('metricRuns')} value={metrics.recentRuns} />
      </div>

      <DataTable columns={columns} data={filteredTemplates} loading={isLoading} enableExport />

      {/* Create Template Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp('createModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('fieldName')} required>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={tp('namePlaceholder')} />
          </FormField>
          <FormField label={tp('fieldDescription')}>
            <textarea className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200" rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={tp('descriptionPlaceholder')} />
          </FormField>
          <FormField label={tp('fieldDataSource')} required>
            <Select options={dataSourceOptions} value={formDataSource} onChange={(e) => setFormDataSource(e.target.value as ReportDataSource)} />
          </FormField>
          <FormField label={tp('fieldChartType')}>
            <Select options={chartTypeOptions} value={formChartType} onChange={(e) => setFormChartType(e.target.value as ChartType)} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formIsPublic} onChange={(e) => setFormIsPublic(e.target.checked)} className="rounded" />
            {tp('fieldPublic')}
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={() => createMutation.mutate({ name: formName, description: formDescription || undefined, dataSource: formDataSource, chartType: formChartType, isPublic: formIsPublic })} disabled={!formName.trim()} loading={createMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal open={!!showHistory} onClose={() => setShowHistory(null)} title={tp('historyModalTitle')}>
        <div className="space-y-3">
          {executions.length === 0 ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{tp('noHistory')}</p>
          ) : (
            executions.map((exec) => (
              <div key={exec.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div>
                  <StatusBadge
                    status={exec.status}
                    colorMap={{ RUNNING: 'blue', COMPLETED: 'green', FAILED: 'red' }}
                  />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                    {exec.rowCount != null && `${exec.rowCount} ${tp('rows')}`}
                    {exec.executionTimeMs != null && ` / ${exec.executionTimeMs}${tp('ms')}`}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">{formatRelativeTime(exec.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ReportBuilderPage;
