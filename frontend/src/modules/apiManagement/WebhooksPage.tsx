import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import {
  Search, Plus, Webhook, CheckCircle, XCircle, Activity, Zap,
  Pencil, Trash2, Power, X, Eye, EyeOff, Copy, RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { apiManagementApi } from '@/api/apiManagement';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { WebhookConfig } from './types';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVAILABLE_EVENTS = [
  'task.created', 'task.updated', 'task.completed', 'task.deleted',
  'project.created', 'project.updated', 'project.status_changed',
  'budget.created', 'budget.updated', 'budget.alert',
  'invoice.created', 'invoice.approved', 'invoice.paid',
  'contract.created', 'contract.signed',
  'document.uploaded', 'document.approved',
  'safety.incident', 'safety.alert',
  'user.created', 'user.updated',
];

const webhookStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  ACTIVE: 'green',
  active: 'green',
  INACTIVE: 'gray',
  inactive: 'gray',
  FAILED: 'red',
  failed: 'red',
};

const getWebhookStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('apiManagement.webhooks.statusActive'),
  active: t('apiManagement.webhooks.statusActive'),
  INACTIVE: t('apiManagement.webhooks.statusInactive'),
  inactive: t('apiManagement.webhooks.statusInactive'),
  FAILED: t('apiManagement.webhooks.statusFailed'),
  failed: t('apiManagement.webhooks.statusFailed'),
});

type TabId = 'all' | 'ACTIVE' | 'FAILED' | 'INACTIVE';

// ---------------------------------------------------------------------------
// Create/Edit modal form state
// ---------------------------------------------------------------------------

interface WebhookFormData {
  name: string;
  url: string;
  secret: string;
  events: string[];
}

const defaultForm: WebhookFormData = {
  name: '',
  url: '',
  secret: '',
  events: [],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WebhooksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [form, setForm] = useState<WebhookFormData>(defaultForm);
  const [showSecret, setShowSecret] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Data
  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => apiManagementApi.getWebhooks(),
  });

  const webhooks = data?.content ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<WebhookConfig>) => apiManagementApi.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(t('apiManagement.webhooks.toastCreated'));
      closeModal();
    },
    onError: () => toast.error(t('apiManagement.webhooks.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WebhookConfig> }) =>
      apiManagementApi.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(t('apiManagement.webhooks.toastUpdated'));
      closeModal();
    },
    onError: () => toast.error(t('apiManagement.webhooks.toastUpdateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiManagementApi.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(t('apiManagement.webhooks.toastDeleted'));
      setDeleteConfirmId(null);
    },
    onError: () => toast.error(t('apiManagement.webhooks.toastDeleteError')),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => apiManagementApi.testWebhook(id),
    onSuccess: () => toast.success(t('apiManagement.webhooks.toastTestSuccess')),
    onError: () => toast.error(t('apiManagement.webhooks.toastTestError')),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiManagementApi.updateWebhook(id, { status: isActive ? 'ACTIVE' : 'INACTIVE' } as Partial<WebhookConfig>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(t('apiManagement.webhooks.toastToggled'));
    },
    onError: () => toast.error(t('apiManagement.webhooks.toastToggleError')),
  });

  // Filter
  const filtered = useMemo(() => {
    let result = webhooks;
    if (activeTab !== 'all') result = result.filter((w) => w.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (w) => w.name.toLowerCase().includes(lower) || w.url.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [webhooks, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: webhooks.length,
    active: webhooks.filter((w) => w.status === 'ACTIVE').length,
    failed: webhooks.filter((w) => w.status === 'FAILED').length,
    inactive: webhooks.filter((w) => w.status === 'INACTIVE').length,
  }), [webhooks]);

  const metrics = useMemo(() => {
    const totalSuccess = webhooks.reduce((s, w) => s + w.successCount, 0);
    const totalFailure = webhooks.reduce((s, w) => s + w.failureCount, 0);
    const successRate = (totalSuccess + totalFailure) > 0
      ? (totalSuccess / (totalSuccess + totalFailure) * 100)
      : 100;
    return {
      total: webhooks.length,
      active: webhooks.filter((w) => w.status === 'ACTIVE').length,
      totalDeliveries: totalSuccess + totalFailure,
      successRate,
    };
  }, [webhooks]);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    setEditingWebhook(null);
    setForm(defaultForm);
    setShowSecret(false);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setForm({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret ?? '',
      events: webhook.events ?? [],
    });
    setShowSecret(false);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingWebhook(null);
    setForm(defaultForm);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error(t('apiManagement.webhooks.validationRequired'));
      return;
    }
    const payload: Partial<WebhookConfig> = {
      name: form.name.trim(),
      url: form.url.trim(),
      secret: form.secret || undefined,
      events: form.events,
    };
    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingWebhook, createMutation, updateMutation]);

  const toggleEvent = useCallback((event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  }, []);

  const generateSecret = useCallback(() => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    setForm((prev) => ({ ...prev, secret }));
    setShowSecret(true);
  }, []);

  const webhookStatusLabels = getWebhookStatusLabels();

  const columns = useMemo<ColumnDef<WebhookConfig, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('apiManagement.webhooks.colWebhook'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono truncate max-w-[200px]">{row.original.url}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('apiManagement.webhooks.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={webhookStatusColorMap}
            label={webhookStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'events',
        header: t('apiManagement.webhooks.colEvents'),
        size: 220,
        cell: ({ getValue }) => {
          const events = getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {events.slice(0, 3).map((e) => (
                <span key={e} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                  {e}
                </span>
              ))}
              {events.length > 3 && (
                <span className="text-[10px] text-neutral-400">+{events.length - 3}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'successCount',
        header: t('apiManagement.webhooks.colSuccess'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-success-600">{formatNumber(getValue<number>())}</span>,
      },
      {
        accessorKey: 'failureCount',
        header: t('apiManagement.webhooks.colErrors'),
        size: 80,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums ${val > 0 ? 'text-danger-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'lastDeliveryStatus',
        header: t('apiManagement.webhooks.colHttpCode'),
        size: 90,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          if (!val) return <span className="text-neutral-400">---</span>;
          const color = val >= 200 && val < 300 ? 'text-success-600' : 'text-danger-600';
          return <span className={`tabular-nums font-mono ${color}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'lastDeliveryAt',
        header: t('apiManagement.webhooks.colLastDelivery'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">{formatDate(val)}</span> : <span className="text-neutral-400">---</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 180,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Zap size={14} />}
              disabled={row.original.status === 'INACTIVE' || testMutation.isPending}
              onClick={() => testMutation.mutate(row.original.id)}
            >
              {t('apiManagement.webhooks.testButton')}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Pencil size={14} />}
              onClick={() => openEditModal(row.original)}
            />
            <Button
              variant="ghost"
              size="xs"
              iconLeft={row.original.status === 'INACTIVE' ? <Power size={14} /> : <Power size={14} className="text-danger-500" />}
              onClick={() => toggleMutation.mutate({ id: row.original.id, isActive: row.original.status === 'INACTIVE' })}
            />
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Trash2 size={14} className="text-danger-500" />}
              onClick={() => setDeleteConfirmId(row.original.id)}
            />
          </div>
        ),
      },
    ],
    [testMutation, toggleMutation, openEditModal],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('apiManagement.webhooks.title')}
        subtitle={t('apiManagement.webhooks.subtitle', { count: String(webhooks.length) })}
        breadcrumbs={[
          { label: t('apiManagement.webhooks.breadcrumbHome'), href: '/' },
          { label: t('apiManagement.webhooks.breadcrumbApiManagement') },
          { label: t('apiManagement.webhooks.breadcrumbWebhooks') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={openCreateModal}>
            {t('apiManagement.webhooks.createWebhook')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('apiManagement.webhooks.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('apiManagement.webhooks.tabActive'), count: tabCounts.active },
          { id: 'FAILED', label: t('apiManagement.webhooks.tabFailed'), count: tabCounts.failed },
          { id: 'INACTIVE', label: t('apiManagement.webhooks.tabInactive'), count: tabCounts.inactive },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Webhook size={18} />} label={t('apiManagement.webhooks.metricTotal')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('apiManagement.webhooks.metricActive')} value={metrics.active} />
        <MetricCard icon={<Activity size={18} />} label={t('apiManagement.webhooks.metricDeliveries')} value={formatNumber(metrics.totalDeliveries)} />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('apiManagement.webhooks.metricSuccessRate')}
          value={`${metrics.successRate.toFixed(1)}%`}
          trend={{ direction: metrics.successRate >= 99 ? 'up' : 'down', value: `${metrics.successRate.toFixed(1)}%` }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('apiManagement.webhooks.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<WebhookConfig>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('apiManagement.webhooks.emptyTitle')}
        emptyDescription={t('apiManagement.webhooks.emptyDescription')}
      />

      {/* ======= Create / Edit modal ======= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {editingWebhook
                  ? t('apiManagement.webhooks.editTitle')
                  : t('apiManagement.webhooks.createTitle')}
              </h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <FormField label={t('apiManagement.webhooks.fieldName')} required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Slack Notifications"
                />
              </FormField>

              <FormField label={t('apiManagement.webhooks.fieldUrl')} required>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://example.com/webhook"
                />
              </FormField>

              <FormField label={t('apiManagement.webhooks.fieldSecret')} hint={t('apiManagement.webhooks.fieldSecretHint')}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      value={form.secret}
                      onChange={(e) => setForm((p) => ({ ...p, secret: e.target.value }))}
                      placeholder={t('apiManagement.webhooks.fieldSecretPlaceholder')}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <Button variant="secondary" size="sm" iconLeft={<RotateCcw size={14} />} onClick={generateSecret}>
                    {t('apiManagement.webhooks.generateSecret')}
                  </Button>
                </div>
              </FormField>

              <FormField label={t('apiManagement.webhooks.fieldEvents')}>
                <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 space-y-1">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors',
                        form.events.includes(event)
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-mono text-xs">{event}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t('apiManagement.webhooks.selectedEvents', { count: String(form.events.length) })}
                </p>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="secondary" onClick={closeModal}>
                {t('apiManagement.webhooks.btnCancel')}
              </Button>
              <Button
                loading={createMutation.isPending || updateMutation.isPending}
                onClick={handleSubmit}
              >
                {editingWebhook
                  ? t('apiManagement.webhooks.btnSave')
                  : t('apiManagement.webhooks.btnCreate')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======= Delete confirmation ======= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-sm m-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t('apiManagement.webhooks.deleteTitle')}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              {t('apiManagement.webhooks.deleteConfirm')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                {t('apiManagement.webhooks.btnCancel')}
              </Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                {t('apiManagement.webhooks.btnDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksPage;
