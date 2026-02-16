import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Plus,
  Key,
  Shield,
  Activity,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, formatNumber } from '@/lib/format';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  requestCount: number;
  createdBy: string;
}

interface CreatedKeyResponse {
  id: string;
  name: string;
  key: string; // Full key shown once
  prefix: string;
}

const keyStatusColorMap: Record<string, 'green' | 'red' | 'orange' | 'gray'> = {
  active: 'green',
  revoked: 'red',
  expired: 'orange',
};

const getKeyStatusLabels = (): Record<string, string> => ({
  active: t('integrations.apiKeys.statusActive'),
  revoked: t('integrations.apiKeys.statusRevoked'),
  expired: t('integrations.apiKeys.statusExpired'),
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type TabId = 'all' | 'ACTIVE' | 'REVOKED';

const ApiKeysPage: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedKeyResponse | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);

  // Create form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('365');

  // Fetch keys
  const { data, isLoading } = useQuery({
    queryKey: ['integration-api-keys'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api-keys');
        return res.data as ApiKeyItem[];
      } catch {
        return undefined;
      }
    },
  });

  const keys = data ?? [];

  // Create key mutation
  const createMutation = useMutation({
    mutationFn: async (params: { name: string; expiresInDays: number }) => {
      const expiresAt =
        params.expiresInDays > 0
          ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : null;
      const res = await apiClient.post('/api-keys', {
        name: params.name,
        userId: user?.id,
        expiresAt,
      });
      return res.data as CreatedKeyResponse;
    },
    onSuccess: (result) => {
      setCreatedKey(result);
      setShowCreateModal(false);
      setShowKeyModal(true);
      setNewKeyName('');
      setNewKeyExpiry('365');
      queryClient.invalidateQueries({ queryKey: ['integration-api-keys'] });
      toast.success(t('integrations.apiKeys.keyCreated'));
    },
    onError: () => {
      toast.error(t('integrations.apiKeys.createError'));
    },
  });

  // Revoke key mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      setShowRevokeModal(false);
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ['integration-api-keys'] });
      toast.success(t('integrations.apiKeys.keyRevoked'));
    },
    onError: () => {
      toast.error(t('integrations.apiKeys.revokeError'));
    },
  });

  const filtered = useMemo(() => {
    let result = keys;
    if (activeTab === 'ACTIVE') result = result.filter((k) => k.status === 'ACTIVE');
    else if (activeTab === 'REVOKED')
      result = result.filter((k) => k.status === 'REVOKED' || k.status === 'EXPIRED');
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (k) =>
          k.name.toLowerCase().includes(lower) ||
          k.prefix.toLowerCase().includes(lower) ||
          k.createdBy.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [keys, activeTab, search]);

  const tabCounts = useMemo(
    () => ({
      all: keys.length,
      active: keys.filter((k) => k.status === 'ACTIVE').length,
      revoked: keys.filter((k) => k.status === 'REVOKED' || k.status === 'EXPIRED').length,
    }),
    [keys],
  );

  const metrics = useMemo(() => {
    const totalRequests = keys.reduce((s, k) => s + k.requestCount, 0);
    const activeKeys = keys.filter((k) => k.status === 'ACTIVE');
    return { total: keys.length, active: activeKeys.length, totalRequests };
  }, [keys]);

  const handleCreate = useCallback(() => {
    if (!newKeyName.trim()) {
      toast.error(t('integrations.apiKeys.enterKeyName'));
      return;
    }
    createMutation.mutate({
      name: newKeyName.trim(),
      expiresInDays: parseInt(newKeyExpiry, 10),
    });
  }, [newKeyName, newKeyExpiry, createMutation]);

  const handleCopyKey = useCallback(() => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey.key);
      toast.success(t('integrations.apiKeys.keyCopied'));
    }
  }, [createdKey]);

  const handleRevokeClick = useCallback((key: ApiKeyItem) => {
    setRevokeTarget(key);
    setShowRevokeModal(true);
  }, []);

  const keyStatusLabels = getKeyStatusLabels();

  const columns = useMemo<ColumnDef<ApiKeyItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('integrations.apiKeys.colName'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
              {row.original.prefix}...
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integrations.apiKeys.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={keyStatusColorMap}
            label={keyStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'requestCount',
        header: t('integrations.apiKeys.colRequests'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('integrations.apiKeys.colCreated'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'lastUsedAt',
        header: t('integrations.apiKeys.colLastUsed'),
        size: 160,
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          return val ? (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
              {formatDateTime(val)}
            </span>
          ) : (
            <span className="text-neutral-400 text-xs">{t('integrations.apiKeys.notUsed')}</span>
          );
        },
      },
      {
        accessorKey: 'expiresAt',
        header: t('integrations.apiKeys.colExpires'),
        size: 140,
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val) return <span className="text-neutral-400 text-xs">{t('integrations.apiKeys.permanent')}</span>;
          const isExpiringSoon =
            new Date(val).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;
          return (
            <span
              className={`tabular-nums text-xs ${isExpiringSoon ? 'text-warning-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}
            >
              {formatDateTime(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdBy',
        header: t('integrations.apiKeys.colCreatedBy'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) =>
          row.original.status === 'ACTIVE' ? (
            <Button
              variant="ghost"
              size="xs"
              className="text-danger-600"
              iconLeft={<Trash2 size={13} />}
              onClick={() => handleRevokeClick(row.original)}
            >
              {t('integrations.apiKeys.revoke')}
            </Button>
          ) : null,
      },
    ],
    [handleRevokeClick],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.apiKeys.title')}
        subtitle={`${keys.length} ${t('integrations.apiKeys.keysCount')}`}
        breadcrumbs={[
          { label: t('integrations.apiKeys.breadcrumbHome'), href: '/' },
          { label: t('integrations.apiKeys.breadcrumbSettings'), href: '/settings' },
          { label: t('integrations.apiKeys.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.apiKeys.title') },
        ]}
        backTo="/integrations"
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
            {t('integrations.apiKeys.createKey')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('integrations.apiKeys.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('integrations.apiKeys.tabActive'), count: tabCounts.active },
          { id: 'REVOKED', label: t('integrations.apiKeys.tabRevoked'), count: tabCounts.revoked },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<Key size={18} />} label={t('integrations.apiKeys.metricTotalKeys')} value={metrics.total} />
        <MetricCard icon={<Shield size={18} />} label={t('integrations.apiKeys.metricActive')} value={metrics.active} />
        <MetricCard
          icon={<Activity size={18} />}
          label={t('integrations.apiKeys.metricTotalRequests')}
          value={formatNumber(metrics.totalRequests)}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('integrations.apiKeys.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<ApiKeyItem>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('integrations.apiKeys.emptyTitle')}
        emptyDescription={t('integrations.apiKeys.emptyDescription')}
      />

      {/* Create key modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('integrations.apiKeys.createKeyTitle')}
        description={t('integrations.apiKeys.createKeyDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              {t('integrations.apiKeys.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              iconLeft={<Plus size={16} />}
            >
              {t('integrations.apiKeys.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('integrations.apiKeys.fieldKeyName')} required>
            <Input
              placeholder={t('integrations.apiKeys.fieldKeyNamePlaceholder')}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </FormField>
          <FormField
            label={t('integrations.apiKeys.fieldExpiry')}
            hint={t('integrations.apiKeys.fieldExpiryHint')}
          >
            <Select
              options={[
                { value: '30', label: t('integrations.apiKeys.expiry30days') },
                { value: '90', label: t('integrations.apiKeys.expiry90days') },
                { value: '180', label: t('integrations.apiKeys.expiry180days') },
                { value: '365', label: t('integrations.apiKeys.expiry1year') },
                { value: '730', label: t('integrations.apiKeys.expiry2years') },
                { value: '0', label: t('integrations.apiKeys.expiryPermanent') },
              ]}
              value={newKeyExpiry}
              onChange={(e) => setNewKeyExpiry(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* Show created key modal */}
      <Modal
        open={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setCreatedKey(null);
          setKeyVisible(false);
        }}
        title={t('integrations.apiKeys.keyCreatedTitle')}
        description={t('integrations.apiKeys.keyCreatedDescription')}
        size="lg"
        footer={
          <Button
            onClick={() => {
              setShowKeyModal(false);
              setCreatedKey(null);
              setKeyVisible(false);
            }}
          >
            {t('integrations.apiKeys.done')}
          </Button>
        }
      >
        {createdKey && (
          <div className="space-y-4">
            <FormField label={t('integrations.apiKeys.fieldNameLabel')}>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{createdKey.name}</p>
            </FormField>
            <FormField label={t('integrations.apiKeys.fieldApiKey')}>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 font-mono text-sm text-neutral-900 dark:text-neutral-100 break-all">
                  {keyVisible ? createdKey.key : createdKey.key.replace(/./g, '*')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyVisible(!keyVisible)}
                >
                  {keyVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<Copy size={14} />}
                  onClick={handleCopyKey}
                >
                  {t('integrations.apiKeys.copy')}
                </Button>
              </div>
            </FormField>
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <p className="text-xs text-warning-800 font-medium">
                {t('integrations.apiKeys.saveKeyWarning')}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke confirmation modal */}
      <Modal
        open={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setRevokeTarget(null);
        }}
        title={t('integrations.apiKeys.revokeKeyTitle')}
        description={t('integrations.apiKeys.revokeKeyDescription')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRevokeModal(false);
                setRevokeTarget(null);
              }}
            >
              {t('integrations.apiKeys.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
              loading={revokeMutation.isPending}
              iconLeft={<Trash2 size={16} />}
            >
              {t('integrations.apiKeys.revoke')}
            </Button>
          </>
        }
      >
        {revokeTarget && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">{t('integrations.apiKeys.revokeFieldName')}:</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{revokeTarget.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">{t('integrations.apiKeys.revokeFieldPrefix')}:</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">{revokeTarget.prefix}...</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">{t('integrations.apiKeys.revokeFieldRequests')}:</span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {formatNumber(revokeTarget.requestCount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApiKeysPage;
