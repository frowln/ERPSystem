import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  AlertCircle,
  Flame,
  CheckCircle,
  Plus,
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
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { PortalDefect, DefectStatus, DefectPriority, DefectCategory } from './types';

const tp = (k: string) => t(`portal.defects.${k}`);

const statusColorMap: Record<string, string> = {
  SUBMITTED: 'blue',
  TRIAGED: 'cyan',
  ASSIGNED: 'amber',
  IN_PROGRESS: 'yellow',
  VERIFICATION: 'purple',
  CLOSED: 'green',
  REJECTED: 'red',
};

const priorityColorMap: Record<string, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'yellow',
  CRITICAL: 'red',
};

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    SUBMITTED: 'statusSubmitted',
    TRIAGED: 'statusTriaged',
    ASSIGNED: 'statusAssigned',
    IN_PROGRESS: 'statusInProgress',
    VERIFICATION: 'statusVerification',
    CLOSED: 'statusClosed',
    REJECTED: 'statusRejected',
  };
  return tp(map[status] ?? status);
};

const getPriorityLabel = (priority: string): string => {
  const map: Record<string, string> = {
    LOW: 'priorityLow',
    MEDIUM: 'priorityMedium',
    HIGH: 'priorityHigh',
    CRITICAL: 'priorityCritical',
  };
  return tp(map[priority] ?? priority);
};

const getCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    STRUCTURAL: 'catStructural',
    PLUMBING: 'catPlumbing',
    ELECTRICAL: 'catElectrical',
    HVAC: 'catHvac',
    FINISHING: 'catFinishing',
    EXTERIOR: 'catExterior',
    ELEVATOR: 'catElevator',
    FIRE_SAFETY: 'catFireSafety',
    OTHER: 'catOther',
  };
  return tp(map[category] ?? 'catOther');
};

/* ── Skeleton ────────────────────────────────────────────────── */
const SkeletonMetric: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-pulse">
    <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
    <div className="h-7 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
  </div>
);

const ACTIVE_STATUSES = ['SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'VERIFICATION'];
const CLOSED_STATUSES = ['CLOSED', 'REJECTED'];

const PortalDefectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Form state
  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<DefectCategory>('STRUCTURAL');
  const [formPriority, setFormPriority] = useState<DefectPriority>('MEDIUM');
  const [formLocation, setFormLocation] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portal-defects'],
    queryFn: () => portalApi.getDefects({ size: 200 }),
  });

  const { data: portalProjects } = useQuery({
    queryKey: ['portal-projects-select'],
    queryFn: () => portalApi.getProjects({ size: 200 }),
  });

  const allDefects = data?.content ?? [];

  const metrics = useMemo(() => ({
    total: allDefects.length,
    active: allDefects.filter((d) => ACTIVE_STATUSES.includes(d.status)).length,
    critical: allDefects.filter((d) => d.priority === 'CRITICAL').length,
    closed: allDefects.filter((d) => CLOSED_STATUSES.includes(d.status)).length,
  }), [allDefects]);

  const filteredDefects = useMemo(() => {
    let result = allDefects;

    if (activeTab === 'active') {
      result = result.filter((d) => ACTIVE_STATUSES.includes(d.status));
    } else if (activeTab === 'closed') {
      result = result.filter((d) => CLOSED_STATUSES.includes(d.status));
    } else if (activeTab === 'mine') {
      result = result.filter((d) => currentUser && d.reportedByPortalUserId === currentUser.id);
    }

    if (statusFilter) {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (priorityFilter) {
      result = result.filter((d) => d.priority === priorityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          (d.title ?? '').toLowerCase().includes(q) ||
          (d.claimNumber ?? '').toLowerCase().includes(q) ||
          (d.reportedByName ?? '').toLowerCase().includes(q) ||
          (d.locationDescription ?? '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [allDefects, activeTab, statusFilter, priorityFilter, searchQuery, currentUser]);

  const tabs = useMemo(() => [
    { id: 'all', label: tp('tabAll'), count: allDefects.length },
    { id: 'active', label: tp('tabActive'), count: metrics.active },
    { id: 'closed', label: tp('tabClosed'), count: metrics.closed },
    { id: 'mine', label: tp('tabMine') },
  ], [allDefects.length, metrics.active, metrics.closed]);

  const projectOptions = useMemo(
    () => (portalProjects?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
    [portalProjects],
  );

  const statusOptions = useMemo(() => [
    { value: '', label: tp('filterAllStatuses') },
    { value: 'SUBMITTED', label: tp('statusSubmitted') },
    { value: 'TRIAGED', label: tp('statusTriaged') },
    { value: 'ASSIGNED', label: tp('statusAssigned') },
    { value: 'IN_PROGRESS', label: tp('statusInProgress') },
    { value: 'VERIFICATION', label: tp('statusVerification') },
    { value: 'CLOSED', label: tp('statusClosed') },
    { value: 'REJECTED', label: tp('statusRejected') },
  ], []);

  const priorityOptions = useMemo(() => [
    { value: '', label: tp('filterAllPriorities') },
    { value: 'LOW', label: tp('priorityLow') },
    { value: 'MEDIUM', label: tp('priorityMedium') },
    { value: 'HIGH', label: tp('priorityHigh') },
    { value: 'CRITICAL', label: tp('priorityCritical') },
  ], []);

  const categoryOptions = useMemo(() => [
    { value: 'STRUCTURAL', label: tp('catStructural') },
    { value: 'PLUMBING', label: tp('catPlumbing') },
    { value: 'ELECTRICAL', label: tp('catElectrical') },
    { value: 'HVAC', label: tp('catHvac') },
    { value: 'FINISHING', label: tp('catFinishing') },
    { value: 'EXTERIOR', label: tp('catExterior') },
    { value: 'ELEVATOR', label: tp('catElevator') },
    { value: 'FIRE_SAFETY', label: tp('catFireSafety') },
    { value: 'OTHER', label: tp('catOther') },
  ], []);

  const formPriorityOptions = useMemo(() => [
    { value: 'LOW', label: tp('priorityLow') },
    { value: 'MEDIUM', label: tp('priorityMedium') },
    { value: 'HIGH', label: tp('priorityHigh') },
    { value: 'CRITICAL', label: tp('priorityCritical') },
  ], []);

  const createMutation = useMutation({
    mutationFn: (payload: { projectId: string; title: string; description: string; category: string; priority: string; location?: string }) =>
      portalApi.createDefect(payload as Partial<PortalDefect>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-defects'] });
      toast.success(tp('createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const resetForm = () => {
    setFormProjectId('');
    setFormTitle('');
    setFormDescription('');
    setFormCategory('STRUCTURAL');
    setFormPriority('MEDIUM');
    setFormLocation('');
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      projectId: formProjectId,
      title: formTitle,
      description: formDescription,
      category: formCategory,
      priority: formPriority,
      location: formLocation || undefined,
    });
  }, [formProjectId, formTitle, formDescription, formCategory, formPriority, formLocation]);

  const columns: ColumnDef<PortalDefect, unknown>[] = useMemo(() => [
    {
      accessorKey: 'claimNumber',
      header: tp('colNumber'),
      size: 130,
      cell: ({ row }) => (
        <span className="font-mono font-medium text-primary-600 dark:text-primary-400 text-sm">
          {row.original.claimNumber || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: tp('colTitle'),
      size: 220,
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title || '—'}</span>
          {row.original.category && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {row.original.categoryDisplayName || getCategoryLabel(row.original.category)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: tp('colPriority'),
      size: 120,
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.priority ?? 'MEDIUM'}
          colorMap={priorityColorMap}
          label={row.original.priorityDisplayName || getPriorityLabel(row.original.priority ?? 'MEDIUM')}
        />
      ),
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      size: 140,
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          colorMap={statusColorMap}
          label={row.original.statusDisplayName || getStatusLabel(row.original.status)}
        />
      ),
    },
    {
      accessorKey: 'locationDescription',
      header: tp('colLocation'),
      size: 150,
      cell: ({ row }) => (
        <span className="text-neutral-600 dark:text-neutral-400 text-sm truncate max-w-[130px] block">
          {row.original.locationDescription || '\u2014'}
        </span>
      ),
    },
    {
      accessorKey: 'reportedByName',
      header: tp('colReportedBy'),
      size: 140,
      cell: ({ row }) => (
        <span className="text-neutral-700 dark:text-neutral-300 text-sm">{row.original.reportedByName || '\u2014'}</span>
      ),
    },
    {
      accessorKey: 'slaDeadline',
      header: tp('colDueDate'),
      size: 110,
      cell: ({ row }) => {
        const deadline = row.original.slaDeadline;
        if (!deadline) return '\u2014';
        const isBreached = row.original.slaBreached || (new Date(deadline).getTime() < Date.now() && !CLOSED_STATUSES.includes(row.original.status));
        return (
          <span className={isBreached ? 'text-red-600 dark:text-red-400 font-medium tabular-nums text-sm' : 'tabular-nums text-sm'}>
            {formatDate(deadline)}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: tp('colCreated'),
      size: 100,
      cell: ({ row }) => (
        <span className="text-neutral-600 dark:text-neutral-400 text-sm">{formatRelativeTime(row.original.createdAt)}</span>
      ),
    },
  ], []);

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
            {tp('errorTitle')}
          </h3>
          <p className="text-neutral-500 mb-4">{tp('errorDescription')}</p>
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
        subtitle={t('portal.defects.subtitle', { count: String(filteredDefects.length) })}
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
            <Plus size={14} className="mr-1" /> {tp('createDefect')}
          </Button>
        }
      />

      {/* Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={<AlertTriangle size={18} />} label={tp('metricTotal')} value={metrics.total} />
          <MetricCard icon={<AlertCircle size={18} />} label={tp('metricOpen')} value={metrics.active} />
          <MetricCard
            icon={<Flame size={18} />}
            label={tp('metricCritical')}
            value={metrics.critical}
            trend={metrics.critical > 0 ? { direction: 'up', value: tp('trendCritical') } : undefined}
          />
          <MetricCard icon={<CheckCircle size={18} />} label={tp('metricResolved')} value={metrics.closed} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-48">
          <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <div className="w-48">
          <Select options={priorityOptions} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tp('searchPlaceholder')}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredDefects}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={tp('emptyTitle')}
        emptyDescription={tp('emptyDescription')}
      />

      {/* Create Defect Modal */}
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
          <FormField label={tp('fieldTitle')} required>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={tp('titlePlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldDescription')} required>
            <Textarea
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={tp('descriptionPlaceholder')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldCategory')}>
              <Select
                options={categoryOptions}
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as DefectCategory)}
              />
            </FormField>
            <FormField label={tp('fieldPriority')}>
              <Select
                options={formPriorityOptions}
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as DefectPriority)}
              />
            </FormField>
          </div>
          <FormField label={tp('fieldLocation')}>
            <Input
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder={tp('locationPlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formProjectId || !formTitle.trim() || !formDescription.trim()}
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

export default PortalDefectsPage;
