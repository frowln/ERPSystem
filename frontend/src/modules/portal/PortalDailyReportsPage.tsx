import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Edit,
  Send,
  CheckCircle,
  Plus,
  Trash2,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  CloudFog,
  Search,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { projectsApi } from '@/api/projects';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { PortalDailyReport, DailyReportStatus, WeatherCondition } from './types';

const tp = (k: string) => t(`portal.dailyReports.${k}`);

const statusColorMap: Record<DailyReportStatus, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

const getStatusLabel = (status: DailyReportStatus): string => {
  const map: Record<DailyReportStatus, string> = {
    DRAFT: 'statusDraft',
    SUBMITTED: 'statusSubmitted',
    APPROVED: 'statusApproved',
    REJECTED: 'statusRejected',
  };
  return tp(map[status]);
};

const WeatherIcon: React.FC<{ weather?: WeatherCondition; size?: number }> = ({ weather, size = 14 }) => {
  if (!weather) return null;
  const map: Record<WeatherCondition, React.ReactNode> = {
    SUNNY: <Sun size={size} className="text-amber-500" />,
    CLOUDY: <Cloud size={size} className="text-neutral-400" />,
    RAINY: <CloudRain size={size} className="text-blue-500" />,
    SNOWY: <Snowflake size={size} className="text-cyan-400" />,
    WINDY: <Wind size={size} className="text-teal-500" />,
    FOGGY: <CloudFog size={size} className="text-neutral-500" />,
  };
  return <>{map[weather] ?? null}</>;
};

const getWeatherLabel = (weather?: WeatherCondition): string => {
  if (!weather) return '';
  const map: Record<WeatherCondition, string> = {
    SUNNY: 'weatherSunny',
    CLOUDY: 'weatherCloudy',
    RAINY: 'weatherRainy',
    SNOWY: 'weatherSnowy',
    WINDY: 'weatherWindy',
    FOGGY: 'weatherFoggy',
  };
  return tp(map[weather]);
};

const PortalDailyReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formProjectId, setFormProjectId] = useState('');
  const [formReportDate, setFormReportDate] = useState('');
  const [formWeather, setFormWeather] = useState<string>('SUNNY');
  const [formTempMin, setFormTempMin] = useState('');
  const [formTempMax, setFormTempMax] = useState('');
  const [formWorkersCount, setFormWorkersCount] = useState('');
  const [formEquipmentCount, setFormEquipmentCount] = useState('');
  const [formWorkPerformed, setFormWorkPerformed] = useState('');
  const [formMaterialsUsed, setFormMaterialsUsed] = useState('');
  const [formIssues, setFormIssues] = useState('');
  const [formSafetyNotes, setFormSafetyNotes] = useState('');

  const statusFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portal-daily-reports', statusFilter],
    queryFn: () => portalApi.getDailyReports({ status: statusFilter, size: 100 }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const reports = data?.content ?? [];

  const filteredReports = useMemo(() => {
    let result = reports;
    if (filterProject) {
      result = result.filter((r) => r.projectId === filterProject);
    }
    if (filterStatus) {
      result = result.filter((r) => r.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.projectName ?? '').toLowerCase().includes(q) ||
          (r.workPerformed ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [reports, filterProject, filterStatus, searchQuery]);

  const metrics = useMemo(() => ({
    total: reports.length,
    draft: reports.filter((r) => r.status === 'DRAFT').length,
    submitted: reports.filter((r) => r.status === 'SUBMITTED').length,
    approved: reports.filter((r) => r.status === 'APPROVED').length,
  }), [reports]);

  const tabs = useMemo(() => [
    { id: 'all', label: tp('tabAll'), count: metrics.total },
    { id: 'draft', label: tp('tabDraft'), count: metrics.draft },
    { id: 'submitted', label: tp('tabSubmitted'), count: metrics.submitted },
    { id: 'approved', label: tp('tabApprovedRejected'), count: metrics.approved },
  ], [metrics]);

  const projectOptions = useMemo(
    () => (projects?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  const weatherOptions = useMemo(() => [
    { value: 'SUNNY', label: tp('weatherSunny') },
    { value: 'CLOUDY', label: tp('weatherCloudy') },
    { value: 'RAINY', label: tp('weatherRainy') },
    { value: 'SNOWY', label: tp('weatherSnowy') },
    { value: 'WINDY', label: tp('weatherWindy') },
    { value: 'FOGGY', label: tp('weatherFoggy') },
  ], []);

  const statusOptions = useMemo(() => [
    { value: '', label: tp('statusAll') },
    { value: 'DRAFT', label: tp('statusDraft') },
    { value: 'SUBMITTED', label: tp('statusSubmitted') },
    { value: 'APPROVED', label: tp('statusApproved') },
    { value: 'REJECTED', label: tp('statusRejected') },
  ], []);

  const projectFilterOptions = useMemo(() => [
    { value: '', label: tp('allProjects') },
    ...projectOptions,
  ], [projectOptions]);

  const createMutation = useMutation({
    mutationFn: (req: Parameters<typeof portalApi.createDailyReport>[0]) =>
      portalApi.createDailyReport(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-daily-reports'] });
      toast.success(tp('createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => portalApi.submitDailyReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-daily-reports'] });
      toast.success(tp('submitSuccess'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalApi.deleteDailyReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-daily-reports'] });
      toast.success(tp('deleteSuccess'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const resetForm = () => {
    setFormProjectId('');
    setFormReportDate('');
    setFormWeather('SUNNY');
    setFormTempMin('');
    setFormTempMax('');
    setFormWorkersCount('');
    setFormEquipmentCount('');
    setFormWorkPerformed('');
    setFormMaterialsUsed('');
    setFormIssues('');
    setFormSafetyNotes('');
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      projectId: formProjectId,
      reportDate: formReportDate,
      weather: formWeather as WeatherCondition || undefined,
      temperatureMin: formTempMin ? parseFloat(formTempMin) : undefined,
      temperatureMax: formTempMax ? parseFloat(formTempMax) : undefined,
      workersCount: parseInt(formWorkersCount, 10) || 0,
      equipmentCount: parseInt(formEquipmentCount, 10) || 0,
      workPerformed: formWorkPerformed,
      materialsUsed: formMaterialsUsed || undefined,
      issues: formIssues || undefined,
      safetyNotes: formSafetyNotes || undefined,
    });
  }, [
    formProjectId, formReportDate, formWeather, formTempMin, formTempMax,
    formWorkersCount, formEquipmentCount, formWorkPerformed, formMaterialsUsed,
    formIssues, formSafetyNotes,
  ]);

  const columns: ColumnDef<PortalDailyReport, unknown>[] = useMemo(() => [
    {
      accessorKey: 'reportDate',
      header: tp('colReportDate'),
      cell: ({ row }) => (
        <span className="font-medium text-primary-600 dark:text-primary-400">
          {formatDate(row.original.reportDate)}
        </span>
      ),
    },
    {
      accessorKey: 'projectName',
      header: tp('colProject'),
    },
    {
      accessorKey: 'weather',
      header: tp('colWeather'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <WeatherIcon weather={row.original.weather} />
          <span className="text-sm">{getWeatherLabel(row.original.weather)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'workersCount',
      header: tp('colWorkers'),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.workersCount}</span>
      ),
    },
    {
      accessorKey: 'equipmentCount',
      header: tp('colEquipment'),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.equipmentCount}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          colorMap={statusColorMap}
          label={getStatusLabel(row.original.status)}
        />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: tp('colCreated'),
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatRelativeTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-1">
            {r.status === 'DRAFT' && (
              <>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); submitMutation.mutate(r.id); }}
                  title={tp('submitAction')}
                >
                  <Send size={12} />
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(r.id); }}
                  title={t('common.delete')}
                >
                  <Trash2 size={12} />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ], []);

  const isFormValid = formProjectId && formReportDate && formWorkersCount && formEquipmentCount && formWorkPerformed;

  /* ── Error state ─────────────────────────────────────────────── */
  if (isError) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={tp('title')}
          breadcrumbs={[
            { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
            { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
            { label: tp('breadcrumb') },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={40} className="text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('portal.dashboard.loadError')}
          </h3>
          <Button variant="outline" iconLeft={<RefreshCw size={14} />} onClick={() => refetch()}>
            {t('portal.dashboard.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: tp('breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1" /> {tp('createReport')}
          </Button>
        }
      />

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-pulse">
              <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
              <div className="h-7 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={<ClipboardList size={18} />} label={tp('metricTotal')} value={metrics.total} />
          <MetricCard icon={<Edit size={18} />} label={tp('metricDraft')} value={metrics.draft} />
          <MetricCard icon={<Send size={18} />} label={tp('metricSubmitted')} value={metrics.submitted} />
          <MetricCard icon={<CheckCircle size={18} />} label={tp('metricApproved')} value={metrics.approved} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tp('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="w-48">
          <Select
            options={projectFilterOptions}
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
            enableExport
                    columns={columns}
        data={filteredReports}
        loading={isLoading}
        onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
      />

      {/* Expanded Detail */}
      {expandedId && (() => {
        const report = reports.find((r) => r.id === expandedId);
        if (!report) return null;
        return (
          <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {tp('detailTitle')} — {formatDate(report.reportDate)}
              </h3>
              <StatusBadge
                status={report.status}
                colorMap={statusColorMap}
                label={getStatusLabel(report.status)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">{tp('colProject')}:</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{report.projectName}</p>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">{tp('colWeather')}:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <WeatherIcon weather={report.weather} />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{getWeatherLabel(report.weather)}</span>
                  {(report.temperatureMin != null || report.temperatureMax != null) && (
                    <span className="text-neutral-500 dark:text-neutral-400">
                      ({report.temperatureMin ?? '?'}..{report.temperatureMax ?? '?'}&deg;C)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">{tp('colWorkers')}:</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{report.workersCount}</p>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">{tp('colEquipment')}:</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{report.equipmentCount}</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{tp('fieldWorkPerformed')}:</span>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{report.workPerformed}</p>
            </div>
            {report.materialsUsed && (
              <div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{tp('fieldMaterialsUsed')}:</span>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{report.materialsUsed}</p>
              </div>
            )}
            {report.issues && (
              <div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{tp('fieldIssues')}:</span>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{report.issues}</p>
              </div>
            )}
            {report.safetyNotes && (
              <div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{tp('fieldSafetyNotes')}:</span>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{report.safetyNotes}</p>
              </div>
            )}
            {report.reviewComment && (
              <div className="rounded-md bg-neutral-50 dark:bg-neutral-800 p-3">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{tp('reviewComment')}:</span>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{report.reviewComment}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp('createModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('fieldProject')} required>
            <Select
              options={projectOptions}
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              placeholder={tp('projectPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldReportDate')} required>
            <Input
              type="date"
              value={formReportDate}
              onChange={(e) => setFormReportDate(e.target.value)}
            />
          </FormField>
          <FormField label={tp('fieldWeather')}>
            <Select
              options={weatherOptions}
              value={formWeather}
              onChange={(e) => setFormWeather(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldTempMin')}>
              <Input
                type="number"
                value={formTempMin}
                onChange={(e) => setFormTempMin(e.target.value)}
                placeholder="-10"
              />
            </FormField>
            <FormField label={tp('fieldTempMax')}>
              <Input
                type="number"
                value={formTempMax}
                onChange={(e) => setFormTempMax(e.target.value)}
                placeholder="25"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldWorkersCount')} required>
              <Input
                type="number"
                value={formWorkersCount}
                onChange={(e) => setFormWorkersCount(e.target.value)}
                placeholder="0"
              />
            </FormField>
            <FormField label={tp('fieldEquipmentCount')} required>
              <Input
                type="number"
                value={formEquipmentCount}
                onChange={(e) => setFormEquipmentCount(e.target.value)}
                placeholder="0"
              />
            </FormField>
          </div>
          <FormField label={tp('fieldWorkPerformed')} required>
            <Textarea
              rows={4}
              value={formWorkPerformed}
              onChange={(e) => setFormWorkPerformed(e.target.value)}
              placeholder={tp('workPerformedPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldMaterialsUsed')}>
            <Textarea
              rows={3}
              value={formMaterialsUsed}
              onChange={(e) => setFormMaterialsUsed(e.target.value)}
              placeholder={tp('materialsUsedPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldIssues')}>
            <Textarea
              rows={3}
              value={formIssues}
              onChange={(e) => setFormIssues(e.target.value)}
              placeholder={tp('issuesPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldSafetyNotes')}>
            <Textarea
              rows={3}
              value={formSafetyNotes}
              onChange={(e) => setFormSafetyNotes(e.target.value)}
              placeholder={tp('safetyNotesPlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!isFormValid}
              loading={createMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalDailyReportsPage;
