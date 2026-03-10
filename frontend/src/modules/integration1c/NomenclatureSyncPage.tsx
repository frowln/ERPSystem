import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Package,
  RefreshCw,
  Loader2,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle2,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  Link2,
  RotateCcw,
  Zap,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { integration1cApi } from '@/api/integration1c';
import { t } from '@/i18n';
import type {
  NomenclatureSyncStatus,
  SyncConflict,
  NomenclatureMapping,
  SyncDirection,
  ConflictResolution,
  SyncProgress,
  SyncErrorLog,
} from './types';

type TabId = 'overview' | 'mappings' | 'conflicts' | 'errors';

const syncStatusColorMap: Record<string, 'green' | 'yellow' | 'orange' | 'red'> = {
  synced: 'green',
  pending: 'yellow',
  conflict: 'orange',
  error: 'red',
};

const NomenclatureSyncPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [syncDirection, setSyncDirection] = useState<SyncDirection>('from_1c');
  const [filterGroup, setFilterGroup] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Nomenclature status
  const { data: nomenclatureStatus } = useQuery({
    queryKey: ['1c-nomenclature-sync-status'],
    queryFn: async () => {
      try {
        return await integration1cApi.getNomenclatureSyncStatus();
      } catch {
        return null;
      }
    },
  });

  // Conflicts
  const { data: nomenclatureConflicts = [] } = useQuery({
    queryKey: ['1c-nomenclature-conflicts'],
    queryFn: async () => {
      try {
        return await integration1cApi.getNomenclatureConflicts();
      } catch {
        return [];
      }
    },
  });

  // Mappings
  const { data: mappings = [] } = useQuery({
    queryKey: ['1c-nomenclature-mappings'],
    queryFn: async () => {
      try {
        return await integration1cApi.getNomenclatureMappings();
      } catch {
        return [];
      }
    },
  });

  // Material groups
  const { data: materialGroups = [] } = useQuery({
    queryKey: ['1c-nomenclature-groups'],
    queryFn: async () => {
      try {
        return await integration1cApi.getNomenclatureGroups();
      } catch {
        return [];
      }
    },
  });

  // Sync errors
  const { data: syncErrors = [] } = useQuery({
    queryKey: ['1c-nomenclature-sync-errors'],
    queryFn: async () => {
      try {
        return await integration1cApi.getSyncErrors('nomenclature');
      } catch {
        return [];
      }
    },
  });

  // Sync progress
  const { data: syncProgress } = useQuery({
    queryKey: ['1c-nomenclature-sync-progress'],
    queryFn: async () => {
      try {
        return await integration1cApi.getSyncProgress('nomenclature');
      } catch {
        return null;
      }
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 2000 : false,
  });

  // Mutations
  const syncMutation = useMutation({
    mutationFn: () =>
      integration1cApi.syncNomenclatureWithDirection(syncDirection, {
        group: filterGroup || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-sync-errors'] });
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-sync-progress'] });
      toast.success(t('integration1c.syncStarted'));
    },
    onError: () => toast.error(t('integration1c.syncError')),
  });

  const autoMatchMutation = useMutation({
    mutationFn: () => integration1cApi.autoMatchNomenclature(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-mappings'] });
      toast.success(t('integration1c.autoMatchResult', {
        matched: String(result.matched),
        total: String(result.total),
      }));
    },
    onError: () => toast.error(t('integration1c.autoMatchError')),
  });

  const resolveConflictMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: ConflictResolution }) =>
      integration1cApi.resolveConflict(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-mappings'] });
      setResolvingId(null);
      toast.success(t('integration1c.conflictResolved'));
    },
    onError: () => toast.error(t('integration1c.conflictResolveError')),
  });

  const retryErrorMutation = useMutation({
    mutationFn: (errorId: string) => integration1cApi.retrySyncError(errorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-sync-errors'] });
      toast.success(t('integration1c.retryStarted'));
    },
    onError: () => toast.error(t('integration1c.retryError')),
  });

  // Computed values
  const syncedCount = mappings.filter((m) => m.syncStatus === 'synced').length;
  const newCount = mappings.filter((m) => m.syncStatus === 'pending').length;
  const isSyncing = syncProgress?.status === 'running' || syncMutation.isPending;

  // Filtered mappings by group
  const filteredMappings = filterGroup
    ? mappings.filter((m) => m.privodGroup === filterGroup || m.oneCGroup === filterGroup)
    : mappings;

  // Mapping columns
  const mappingColumns = useMemo<ColumnDef<NomenclatureMapping, unknown>[]>(
    () => [
      {
        accessorKey: 'privodName',
        header: t('integration1c.colPrivodMaterial'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.privodName}
            </span>
            {row.original.privodArticle && (
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                {t('integration1c.article')}: {row.original.privodArticle}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'privodGroup',
        header: t('integration1c.colGroup'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>() || '--'}
          </span>
        ),
      },
      {
        id: 'link',
        header: '',
        size: 40,
        cell: () => (
          <Link2 size={14} className="text-neutral-300 dark:text-neutral-600 mx-auto" />
        ),
      },
      {
        accessorKey: 'oneCName',
        header: t('integration1c.col1cMaterial'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.oneCName || '--'}
            </span>
            {row.original.oneCArticle && (
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                {t('integration1c.article')}: {row.original.oneCArticle}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'syncStatus',
        header: t('integration1c.colSyncStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          const labelMap: Record<string, string> = {
            synced: t('integration1c.statusSynced'),
            pending: t('integration1c.statusPending'),
            conflict: t('integration1c.statusConflict'),
            error: t('integration1c.statusError'),
          };
          return (
            <StatusBadge
              status={status}
              colorMap={syncStatusColorMap}
              label={labelMap[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'autoMatched',
        header: t('integration1c.colAutoMatched'),
        size: 80,
        cell: ({ getValue }) => (
          <span className={cn(
            'text-xs font-medium',
            getValue<boolean>()
              ? 'text-green-600 dark:text-green-400'
              : 'text-neutral-400 dark:text-neutral-500',
          )}>
            {getValue<boolean>() ? t('integration1c.autoMatchedYes') : t('integration1c.autoMatchedNo')}
          </span>
        ),
      },
      {
        accessorKey: 'lastSyncAt',
        header: t('integration1c.colLastSync'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              {val ? formatDateTime(val) : '--'}
            </span>
          );
        },
      },
    ],
    [],
  );

  // Conflict columns
  const conflictColumns = useMemo<ColumnDef<SyncConflict, unknown>[]>(
    () => [
      {
        accessorKey: 'privodName',
        header: t('integration1c.colPrivodName'),
        size: 180,
      },
      {
        accessorKey: 'oneCName',
        header: t('integration1c.col1cName'),
        size: 180,
      },
      {
        accessorKey: 'field',
        header: t('integration1c.colField'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'privodValue',
        header: t('integration1c.colPrivodValue'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm text-primary-600 dark:text-primary-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'oneCValue',
        header: t('integration1c.col1cValue'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm text-orange-600 dark:text-orange-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('integration1c.colResolution'),
        size: 220,
        cell: ({ row }) => {
          const isResolving = resolvingId === row.original.id && resolveConflictMutation.isPending;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResolvingId(row.original.id);
                  resolveConflictMutation.mutate({ id: row.original.id, resolution: 'use_privod' });
                }}
                disabled={isResolving}
              >
                {t('integration1c.usePrivod')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResolvingId(row.original.id);
                  resolveConflictMutation.mutate({ id: row.original.id, resolution: 'use_1c' });
                }}
                disabled={isResolving}
              >
                {t('integration1c.use1c')}
              </Button>
              {isResolving && <Loader2 size={14} className="animate-spin text-neutral-400" />}
            </div>
          );
        },
      },
    ],
    [resolvingId, resolveConflictMutation],
  );

  // Error columns
  const errorColumns = useMemo<ColumnDef<SyncErrorLog, unknown>[]>(
    () => [
      {
        accessorKey: 'entityName',
        header: t('integration1c.colEntityName'),
        size: 200,
      },
      {
        accessorKey: 'errorMessage',
        header: t('integration1c.colErrorMessage'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="text-sm text-red-600 dark:text-red-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'timestamp',
        header: t('integration1c.colTimestamp'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          row.original.retryable ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<RotateCcw size={12} />}
              onClick={() => retryErrorMutation.mutate(row.original.id)}
              disabled={retryErrorMutation.isPending}
            >
              {t('integration1c.retry')}
            </Button>
          ) : null
        ),
      },
    ],
    [retryErrorMutation],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integration1c.nomenclatureSyncTitle')}
        subtitle={t('integration1c.nomenclatureSyncSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('integration1c.breadcrumbSettings'), href: '/settings' },
          { label: t('integration1c.dashboardTitle'), href: '/settings/1c' },
          { label: t('integration1c.nomenclatureSyncTitle') },
        ]}
        backTo="/settings/1c"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Zap size={14} />}
              onClick={() => autoMatchMutation.mutate()}
              disabled={autoMatchMutation.isPending}
            >
              {t('integration1c.autoMatchByArticle')}
            </Button>
            <Button
              iconLeft={isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              onClick={() => syncMutation.mutate()}
              disabled={isSyncing}
            >
              {t('integration1c.syncNow')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'overview', label: t('integration1c.tabOverview') },
          { id: 'mappings', label: t('integration1c.tabMappings'), count: mappings.length },
          { id: 'conflicts', label: t('integration1c.tabConflicts'), count: nomenclatureConflicts.length },
          { id: 'errors', label: t('integration1c.tabErrors'), count: syncErrors.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Sync controls */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('integration1c.syncDirection')}:
          </span>
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            {(
              [
                { value: 'from_1c' as SyncDirection, label: t('integration1c.dirFrom1c'), icon: <ArrowLeft size={14} /> },
                { value: 'to_1c' as SyncDirection, label: t('integration1c.dirTo1c'), icon: <ArrowRight size={14} /> },
                { value: 'bidirectional' as SyncDirection, label: t('integration1c.dirBidirectional'), icon: <ArrowLeftRight size={14} /> },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSyncDirection(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  syncDirection === opt.value
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Group filter */}
          {materialGroups.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <Filter size={14} className="text-neutral-400" />
              <Select
                options={[
                  { value: '', label: t('integration1c.allGroups') },
                  ...materialGroups.map((g) => ({ value: g.id, label: g.name })),
                ]}
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              />
            </div>
          )}

          {/* Progress indicator */}
          {syncProgress?.status === 'running' && (
            <div className="flex items-center gap-3">
              <div className="w-48 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${syncProgress.total > 0 ? (syncProgress.processed / syncProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                {syncProgress.processed}/{syncProgress.total}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<Database size={16} />}
          label={t('integration1c.metricInPrivod')}
          value={nomenclatureStatus?.totalInPrivod ?? 0}
        />
        <MetricCard
          icon={<Database size={16} />}
          label={t('integration1c.metricIn1c')}
          value={nomenclatureStatus?.totalIn1c ?? 0}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('integration1c.metricSynced')}
          value={syncedCount}
        />
        <MetricCard
          icon={<Package size={16} />}
          label={t('integration1c.metricNew')}
          value={newCount}
        />
        <MetricCard
          icon={<AlertTriangle size={16} />}
          label={t('integration1c.metricConflicts')}
          value={nomenclatureConflicts.length}
        />
      </div>

      {/* Sync completed notification */}
      {syncProgress?.status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-300">
            {t('integration1c.syncCompleteDetailed', {
              processed: String(syncProgress.processed),
              created: String(syncProgress.created),
              updated: String(syncProgress.updated),
              errors: String(syncProgress.errors),
            })}
          </span>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
            {t('integration1c.nomenclatureOverview')}
          </h3>

          {/* Statistics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{syncedCount}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{t('integration1c.statusSynced')}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{newCount}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">{t('integration1c.statusPending')}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{nomenclatureConflicts.length}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">{t('integration1c.statusConflict')}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{syncErrors.length}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{t('integration1c.statusError')}</p>
            </div>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <Clock size={12} />
            {nomenclatureStatus?.lastSync
              ? `${t('integration1c.metricLastSync')}: ${formatDateTime(nomenclatureStatus.lastSync)}`
              : t('integration1c.neverSynced')}
          </div>
        </div>
      )}

      {/* Tab: Mappings */}
      {activeTab === 'mappings' && (
        <DataTable<NomenclatureMapping>
          data={filteredMappings}
          columns={mappingColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integration1c.emptyNomenclatureMappingsTitle')}
          emptyDescription={t('integration1c.emptyNomenclatureMappingsDescription')}
        />
      )}

      {/* Tab: Conflicts */}
      {activeTab === 'conflicts' && (
        <DataTable<SyncConflict>
          data={nomenclatureConflicts}
          columns={conflictColumns}
          enableColumnVisibility
          enableDensityToggle
          pageSize={20}
          emptyTitle={t('integration1c.emptyConflictsTitle')}
          emptyDescription={t('integration1c.emptyConflictsDescription')}
        />
      )}

      {/* Tab: Errors */}
      {activeTab === 'errors' && (
        <DataTable<SyncErrorLog>
          data={syncErrors}
          columns={errorColumns}
          enableColumnVisibility
          enableDensityToggle
          pageSize={20}
          emptyTitle={t('integration1c.emptyErrorsTitle')}
          emptyDescription={t('integration1c.emptyErrorsDescription')}
        />
      )}
    </div>
  );
};

export default NomenclatureSyncPage;
