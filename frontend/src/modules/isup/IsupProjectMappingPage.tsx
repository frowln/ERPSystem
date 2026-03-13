import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  LinkIcon,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge, type BadgeColor } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { isupApi, type IsupConfiguration, type IsupProjectMapping } from '@/api/isup';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { Project, PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const syncStatusColorMap: Record<string, BadgeColor> = {
  ENABLED: 'green',
  DISABLED: 'gray',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IsupProjectMappingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMapping, setNewMapping] = useState({
    privodProjectId: '',
    isupProjectId: '',
    isupProjectName: '',
  });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch configurations to get the active one
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
  const activeConfig = configurations.find((c) => c.isActive) ?? configurations[0];

  // Fetch project mappings
  const { data: mappingsRaw, isLoading } = useQuery({
    queryKey: ['isup-mappings', activeConfig?.id],
    queryFn: async () => {
      if (!activeConfig) return [];
      try {
        return await isupApi.getProjectMappings(activeConfig.id);
      } catch {
        return [];
      }
    },
    enabled: !!activeConfig,
  });
  const mappings = mappingsRaw ?? [];

  // Fetch Privod projects for the add modal
  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects-for-isup-mapping'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 200 }),
    enabled: showAddModal,
  });
  const projects = projectsData?.content ?? [];

  // Create mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: async () => {
      if (!activeConfig) throw new Error('No active configuration');
      const project = projects.find((p) => p.id === newMapping.privodProjectId);
      return isupApi.createProjectMapping(activeConfig.id, {
        privodProjectId: newMapping.privodProjectId,
        privodProjectName: project?.name ?? '',
        isupProjectId: newMapping.isupProjectId,
        isupProjectName: newMapping.isupProjectName,
        syncEnabled: true,
      });
    },
    onSuccess: () => {
      toast.success(t('isup.mappings.mappingCreated'));
      setShowAddModal(false);
      setNewMapping({ privodProjectId: '', isupProjectId: '', isupProjectName: '' });
      queryClient.invalidateQueries({ queryKey: ['isup-mappings'] });
    },
    onError: () => {
      toast.error(t('isup.mappings.createError'));
    },
  });

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: async (mappingId: string) => {
      if (!activeConfig) throw new Error('No active configuration');
      return isupApi.deleteProjectMapping(activeConfig.id, mappingId);
    },
    onSuccess: () => {
      toast.success(t('isup.mappings.mappingDeleted'));
      queryClient.invalidateQueries({ queryKey: ['isup-mappings'] });
    },
    onError: () => {
      toast.error(t('isup.mappings.deleteError'));
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  // Toggle sync mutation
  const toggleSyncMutation = useMutation({
    mutationFn: async ({ mappingId, enabled }: { mappingId: string; enabled: boolean }) => {
      if (!activeConfig) throw new Error('No active configuration');
      return isupApi.updateProjectMapping(activeConfig.id, mappingId, { syncEnabled: enabled });
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.enabled ? t('isup.mappings.syncEnabled') : t('isup.mappings.syncDisabled'),
      );
      queryClient.invalidateQueries({ queryKey: ['isup-mappings'] });
    },
    onError: () => {
      toast.error(t('isup.mappings.toggleError'));
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  const handleToggleSync = useCallback(
    (mapping: IsupProjectMapping) => {
      setTogglingId(mapping.id);
      toggleSyncMutation.mutate({ mappingId: mapping.id, enabled: !mapping.syncEnabled });
    },
    [toggleSyncMutation],
  );

  const handleDelete = useCallback(
    (mappingId: string) => {
      setDeletingId(mappingId);
      deleteMappingMutation.mutate(mappingId);
    },
    [deleteMappingMutation],
  );

  // Computed metrics
  const metrics = useMemo(() => {
    const total = mappings.length;
    const syncing = mappings.filter((m) => m.syncEnabled).length;
    const disabled = total - syncing;
    return { total, syncing, disabled };
  }, [mappings]);

  const columns = useMemo<ColumnDef<IsupProjectMapping, unknown>[]>(
    () => [
      {
        accessorKey: 'privodProjectName',
        header: t('isup.mappings.colPrivodProject'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
              {row.original.privodProjectName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              {row.original.privodProjectId.slice(0, 8)}...
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'isupProjectName',
        header: t('isup.mappings.colIsupProject'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
              {row.original.isupProjectName || '--'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              ID: {row.original.isupProjectId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'syncEnabled',
        header: t('isup.mappings.colSyncStatus'),
        size: 140,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.syncEnabled ? 'ENABLED' : 'DISABLED'}
            colorMap={syncStatusColorMap}
            label={
              row.original.syncEnabled
                ? t('isup.mappings.syncOn')
                : t('isup.mappings.syncOff')
            }
            size="sm"
          />
        ),
      },
      {
        accessorKey: 'lastSyncAt',
        header: t('isup.mappings.colLastSync'),
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
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              iconLeft={
                togglingId === row.original.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : row.original.syncEnabled ? (
                  <ToggleRight size={12} className="text-success-600" />
                ) : (
                  <ToggleLeft size={12} />
                )
              }
              onClick={() => handleToggleSync(row.original)}
              disabled={togglingId === row.original.id}
            >
              {row.original.syncEnabled
                ? t('isup.mappings.disable')
                : t('isup.mappings.enable')}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              iconLeft={
                deletingId === row.original.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} className="text-red-500" />
                )
              }
              onClick={() => handleDelete(row.original.id)}
              disabled={deletingId === row.original.id}
            />
          </div>
        ),
      },
    ],
    [togglingId, deletingId, handleToggleSync, handleDelete],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('isup.mappings.title')}
        subtitle={t('isup.mappings.subtitle')}
        breadcrumbs={[
          { label: t('isup.mappings.breadcrumbHome'), href: '/' },
          { label: t('isup.mappings.breadcrumbSettings'), href: '/settings' },
          { label: t('isup.mappings.breadcrumbIsup'), href: '/settings/isup' },
          { label: t('isup.mappings.breadcrumbMappings') },
        ]}
        backTo="/settings/isup"
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => setShowAddModal(true)}
            disabled={!activeConfig}
          >
            {t('isup.mappings.addMapping')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<LinkIcon size={16} />}
          label={t('isup.mappings.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('isup.mappings.metricSyncing')}
          value={metrics.syncing}
        />
        <MetricCard
          icon={<XCircle size={16} />}
          label={t('isup.mappings.metricDisabled')}
          value={metrics.disabled}
        />
      </div>

      {/* No config warning */}
      {!activeConfig && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <XCircle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {t('isup.mappings.noConfigTitle')}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
              {t('isup.mappings.noConfigDescription')}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable<IsupProjectMapping>
        data={mappings}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('isup.mappings.emptyTitle')}
        emptyDescription={t('isup.mappings.emptyDescription')}
        enableExport
      />

      {/* Add mapping modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('isup.mappings.addMappingTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createMappingMutation.mutate()}
              loading={createMappingMutation.isPending}
              disabled={!newMapping.privodProjectId || !newMapping.isupProjectId}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('isup.mappings.fieldPrivodProject')} required>
            <select
              className="w-full h-9 px-3 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded-lg"
              value={newMapping.privodProjectId}
              onChange={(e) => setNewMapping({ ...newMapping, privodProjectId: e.target.value })}
            >
              <option value="">{t('isup.mappings.selectProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('isup.mappings.fieldIsupProjectId')} required>
            <Input
              placeholder={t('isup.mappings.isupProjectIdPlaceholder')}
              value={newMapping.isupProjectId}
              onChange={(e) => setNewMapping({ ...newMapping, isupProjectId: e.target.value })}
            />
          </FormField>
          <FormField label={t('isup.mappings.fieldIsupProjectName')}>
            <Input
              placeholder={t('isup.mappings.isupProjectNamePlaceholder')}
              value={newMapping.isupProjectName}
              onChange={(e) => setNewMapping({ ...newMapping, isupProjectName: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default IsupProjectMappingPage;
