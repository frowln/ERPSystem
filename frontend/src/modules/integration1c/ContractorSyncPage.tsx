import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Users,
  Package,
  RefreshCw,
  Loader2,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { integration1cApi } from '@/api/integration1c';
import { t } from '@/i18n';
import type { ContractorSyncStatus, NomenclatureSyncStatus, SyncConflict } from './types';

type TabId = 'contractors' | 'nomenclature';

const ContractorSyncPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('contractors');

  // Contractor data
  const { data: contractorStatus } = useQuery({
    queryKey: ['1c-contractor-sync-status'],
    queryFn: async () => {
      try {
        return await integration1cApi.getContractorSyncStatus();
      } catch {
        return null;
      }
    },
  });

  const { data: contractorConflicts = [] } = useQuery({
    queryKey: ['1c-contractor-conflicts'],
    queryFn: async () => {
      try {
        return await integration1cApi.getContractorConflicts();
      } catch {
        return [];
      }
    },
  });

  // Nomenclature data
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

  const syncContractorsMutation = useMutation({
    mutationFn: () => integration1cApi.syncContractors(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['1c-contractor-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['1c-contractor-conflicts'] });
      toast.success(
        t('integration1c.syncComplete', {
          synced: String(result.synced),
          created: String(result.created),
          updated: String(result.updated),
        }),
      );
    },
    onError: () => toast.error(t('integration1c.syncError')),
  });

  const syncNomenclatureMutation = useMutation({
    mutationFn: () => integration1cApi.syncNomenclature(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['1c-nomenclature-conflicts'] });
      toast.success(
        t('integration1c.syncComplete', {
          synced: String(result.synced),
          created: String(result.created),
          updated: String(result.updated),
        }),
      );
    },
    onError: () => toast.error(t('integration1c.syncError')),
  });

  const currentStatus: ContractorSyncStatus | NomenclatureSyncStatus | null | undefined =
    activeTab === 'contractors' ? contractorStatus : nomenclatureStatus;
  const currentConflicts = activeTab === 'contractors' ? contractorConflicts : nomenclatureConflicts;
  const currentSyncing = activeTab === 'contractors'
    ? syncContractorsMutation.isPending
    : syncNomenclatureMutation.isPending;

  const handleSync = () => {
    if (activeTab === 'contractors') {
      syncContractorsMutation.mutate();
    } else {
      syncNomenclatureMutation.mutate();
    }
  };

  const conflictColumns = useMemo<ColumnDef<SyncConflict, unknown>[]>(
    () => [
      {
        accessorKey: 'entityType',
        header: t('integration1c.colEntityType'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'privodName',
        header: t('integration1c.colPrivodName'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'oneCName',
        header: t('integration1c.col1cName'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
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
        accessorKey: 'detectedAt',
        header: t('integration1c.colDetectedAt'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integration1c.syncTitle')}
        subtitle={t('integration1c.syncSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('integration1c.breadcrumbSettings'), href: '/settings' },
          { label: t('integration1c.dashboardTitle'), href: '/settings/1c' },
          { label: t('integration1c.syncTitle') },
        ]}
        backTo="/settings/1c"
        actions={
          <Button
            iconLeft={currentSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            onClick={handleSync}
            disabled={currentSyncing}
          >
            {t('integration1c.syncNow')}
          </Button>
        }
        tabs={[
          { id: 'contractors', label: t('integration1c.tabContractors'), count: currentStatus ? (currentStatus as ContractorSyncStatus).totalInPrivod : 0 },
          { id: 'nomenclature', label: t('integration1c.tabNomenclature'), count: currentStatus ? (currentStatus as NomenclatureSyncStatus).totalInPrivod : 0 },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Sync status metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<Database size={16} />}
          label={t('integration1c.metricInPrivod')}
          value={currentStatus?.totalInPrivod ?? 0}
        />
        <MetricCard
          icon={<Database size={16} />}
          label={t('integration1c.metricIn1c')}
          value={currentStatus?.totalIn1c ?? 0}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('integration1c.metricSynced')}
          value={currentStatus?.synced ?? 0}
        />
        <MetricCard
          icon={<AlertTriangle size={16} />}
          label={t('integration1c.metricConflicts')}
          value={currentStatus?.conflicts ?? 0}
        />
        <MetricCard
          icon={<Clock size={16} />}
          label={t('integration1c.metricLastSync')}
          value={currentStatus?.lastSync ? formatDateTime(currentStatus.lastSync) : '--'}
        />
      </div>

      {/* Sync result notification */}
      {(syncContractorsMutation.isSuccess || syncNomenclatureMutation.isSuccess) && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-300">
            {t('integration1c.syncCompleteMsg')}
          </span>
        </div>
      )}

      {/* Conflicts table */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('integration1c.conflictsTitle')}
          {currentConflicts.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
              ({currentConflicts.length})
            </span>
          )}
        </h3>
      </div>
      <DataTable<SyncConflict>
        data={currentConflicts}
        columns={conflictColumns}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('integration1c.emptyConflictsTitle')}
        emptyDescription={t('integration1c.emptyConflictsDescription')}
      />
    </div>
  );
};

export default ContractorSyncPage;
