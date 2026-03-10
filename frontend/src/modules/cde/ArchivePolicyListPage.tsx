import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Play, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { cdeApi } from '@/api/cde';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { ArchivePolicy, Classification } from './types';
import type { PaginatedResponse } from '@/types';

const classificationLabels: Record<string, string> = {
  PROJECT: t('cde.classification.project'),
  DESIGN: t('cde.classification.design'),
  CONSTRUCTION: t('cde.classification.construction'),
  OPERATIONS: t('cde.classification.operations'),
  SAFETY: t('cde.classification.safety'),
  QUALITY: t('cde.classification.quality'),
  FINANCIAL: t('cde.classification.financial'),
};

const classificationOptions: { value: string; label: string }[] = [
  { value: '', label: t('cde.classification.all') },
  { value: 'PROJECT', label: t('cde.classification.project') },
  { value: 'DESIGN', label: t('cde.classification.design') },
  { value: 'CONSTRUCTION', label: t('cde.classification.construction') },
  { value: 'OPERATIONS', label: t('cde.classification.operations') },
  { value: 'SAFETY', label: t('cde.classification.safety') },
  { value: 'QUALITY', label: t('cde.classification.quality') },
  { value: 'FINANCIAL', label: t('cde.classification.financial') },
];

interface PolicyFormData {
  name: string;
  description: string;
  classification: string;
  retentionDays: number;
  autoArchive: boolean;
  enabled: boolean;
}

const emptyForm: PolicyFormData = {
  name: '',
  description: '',
  classification: '',
  retentionDays: 365,
  autoArchive: false,
  enabled: true,
};

const ArchivePolicyListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ArchivePolicy | null>(null);
  const [form, setForm] = useState<PolicyFormData>(emptyForm);
  const [runResult, setRunResult] = useState<string | null>(null);

  const { data: policiesData, isLoading } = useQuery<PaginatedResponse<ArchivePolicy>>({
    queryKey: ['cde-archive-policies'],
    queryFn: () => cdeApi.getArchivePolicies(),
  });

  const policies = policiesData?.content ?? [];

  const createMut = useMutation({
    mutationFn: (data: PolicyFormData) => cdeApi.createArchivePolicy({
      name: data.name,
      description: data.description || undefined,
      classification: (data.classification || undefined) as Classification | undefined,
      retentionDays: data.retentionDays,
      autoArchive: data.autoArchive,
      enabled: data.enabled,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cde-archive-policies'] });
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PolicyFormData }) => cdeApi.updateArchivePolicy(id, {
      name: data.name,
      description: data.description || undefined,
      classification: (data.classification || undefined) as Classification | undefined,
      retentionDays: data.retentionDays,
      autoArchive: data.autoArchive,
      enabled: data.enabled,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cde-archive-policies'] });
      setShowModal(false);
      setEditingPolicy(null);
      setForm(emptyForm);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => cdeApi.deleteArchivePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cde-archive-policies'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const runNowMut = useMutation({
    mutationFn: () => cdeApi.runArchiveNow(),
    onSuccess: (data) => {
      setRunResult(t('cde.archivePolicies.runNowSuccess').replace('{count}', String(data.archivedCount)));
      queryClient.invalidateQueries({ queryKey: ['cde-archive-policies'] });
      setTimeout(() => setRunResult(null), 5000);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const openCreate = useCallback(() => {
    setEditingPolicy(null);
    setForm(emptyForm);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((policy: ArchivePolicy) => {
    setEditingPolicy(policy);
    setForm({
      name: policy.name,
      description: policy.description ?? '',
      classification: policy.classification ?? '',
      retentionDays: policy.retentionDays,
      autoArchive: policy.autoArchive,
      enabled: policy.enabled,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (editingPolicy) {
      updateMut.mutate({ id: editingPolicy.id, data: form });
    } else {
      createMut.mutate(form);
    }
  }, [editingPolicy, form, createMut, updateMut]);

  const handleDelete = useCallback((policy: ArchivePolicy) => {
    if (window.confirm(t('cde.archivePolicies.deleteConfirm').replace('{name}', policy.name))) {
      deleteMut.mutate(policy.id);
    }
  }, [deleteMut]);

  const columns = useMemo<ColumnDef<ArchivePolicy, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('cde.archivePolicies.colName'),
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{row.original.description}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'classification',
        header: t('cde.archivePolicies.colClassification'),
        size: 160,
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          return <span className="text-neutral-600 dark:text-neutral-300">{val ? (classificationLabels[val] ?? val) : t('cde.archivePolicies.allClassifications')}</span>;
        },
      },
      {
        accessorKey: 'retentionDays',
        header: t('cde.archivePolicies.colRetentionDays'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-mono text-sm">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'autoArchive',
        header: t('cde.archivePolicies.colAutoArchive'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<boolean>() ? 'on' : 'off'}
            colorMap={{ on: 'green', off: 'gray' }}
            label={getValue<boolean>() ? t('cde.archivePolicies.autoArchiveOn') : t('cde.archivePolicies.autoArchiveOff')}
          />
        ),
      },
      {
        accessorKey: 'enabled',
        header: t('cde.archivePolicies.colEnabled'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<boolean>() ? 'enabled' : 'disabled'}
            colorMap={{ enabled: 'green', disabled: 'red' }}
            label={getValue<boolean>() ? t('cde.archivePolicies.enabled') : t('cde.archivePolicies.disabled')}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('cde.archivePolicies.colCreatedAt'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<Trash2 size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original);
            }}
          />
        ),
      },
    ],
    [handleDelete],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('cde.archivePolicies.title')}
        subtitle={t('cde.archivePolicies.subtitle')}
        breadcrumbs={[
          { label: t('cde.breadcrumbHome'), href: '/' },
          { label: t('cde.breadcrumbCDE'), href: '/cde/documents' },
          { label: t('cde.archivePolicies.title') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              iconLeft={<Play size={16} />}
              onClick={() => runNowMut.mutate()}
              disabled={runNowMut.isPending}
            >
              {t('cde.archivePolicies.runNow')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={openCreate}>
              {t('cde.archivePolicies.createPolicy')}
            </Button>
          </div>
        }
      />

      {runResult && (
        <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {runResult}
        </div>
      )}

      <DataTable<ArchivePolicy>
        data={policies}
        columns={columns}
        loading={isLoading}
        onRowClick={openEdit}
        pageSize={20}
        emptyTitle={t('cde.archivePolicies.emptyTitle')}
        emptyDescription={t('cde.archivePolicies.emptyDescription')}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingPolicy(null); setForm(emptyForm); }}
        title={editingPolicy ? t('cde.archivePolicies.formTitleEdit') : t('cde.archivePolicies.formTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowModal(false); setEditingPolicy(null); setForm(emptyForm); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || createMut.isPending || updateMut.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('cde.archivePolicies.fieldName')} *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('cde.archivePolicies.fieldName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('cde.archivePolicies.fieldDescription')}
            </label>
            <Input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('cde.archivePolicies.fieldDescription')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('cde.archivePolicies.fieldClassification')}
            </label>
            <Select
              options={classificationOptions}
              value={form.classification}
              onChange={(e) => setForm((prev) => ({ ...prev, classification: e.target.value }))}
            />
            <p className="text-xs text-neutral-500 mt-1">{t('cde.archivePolicies.fieldClassificationHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('cde.archivePolicies.fieldRetentionDays')}
            </label>
            <Input
              type="number"
              min={1}
              value={String(form.retentionDays)}
              onChange={(e) => setForm((prev) => ({ ...prev, retentionDays: parseInt(e.target.value, 10) || 1 }))}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={form.autoArchive}
                onChange={(e) => setForm((prev) => ({ ...prev, autoArchive: e.target.checked }))}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              {t('cde.archivePolicies.fieldAutoArchive')}
            </label>

            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              {t('cde.archivePolicies.fieldEnabled')}
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ArchivePolicyListPage;
