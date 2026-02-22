import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { t } from '@/i18n';
import type { CommissioningChecklistTemplate } from './types';

const activeColorMap: Record<string, 'green' | 'gray'> = {
  active: 'green',
  inactive: 'gray',
};

const systemOptions = [
  { value: 'HVAC', labelKey: 'closeout.templateSystemHvac' },
  { value: 'Electrical', labelKey: 'closeout.templateSystemElectrical' },
  { value: 'Plumbing', labelKey: 'closeout.templateSystemPlumbing' },
  { value: 'Fire Protection', labelKey: 'closeout.templateSystemFire' },
  { value: 'Elevators', labelKey: 'closeout.templateSystemElevator' },
  { value: 'Structural', labelKey: 'closeout.templateSystemStructural' },
];

interface FormData {
  name: string;
  system: string;
  description: string;
  checkItemDefinitions: string;
  sortOrder: number;
}

const emptyForm: FormData = {
  name: '',
  system: '',
  description: '',
  checkItemDefinitions: '[]',
  sortOrder: 0,
};

const CommissioningTemplateListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['commissioning-templates'],
    queryFn: () => closeoutApi.getCommissioningTemplates({ size: 200 }),
  });

  const templates = data?.content ?? [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<CommissioningChecklistTemplate>) => closeoutApi.createCommissioningTemplate(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['commissioning-templates'] });
      setShowModal(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommissioningChecklistTemplate> }) =>
      closeoutApi.updateCommissioningTemplate(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['commissioning-templates'] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => closeoutApi.deleteCommissioningTemplate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['commissioning-templates'] });
    },
  });

  const handleEdit = useCallback((tmpl: CommissioningChecklistTemplate) => {
    setEditingId(tmpl.id);
    setForm({
      name: tmpl.name,
      system: tmpl.system ?? '',
      description: tmpl.description ?? '',
      checkItemDefinitions: tmpl.checkItemDefinitions ?? '[]',
      sortOrder: tmpl.sortOrder,
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const payload: Partial<CommissioningChecklistTemplate> = {
      name: form.name,
      system: form.system || undefined,
      description: form.description || undefined,
      checkItemDefinitions: form.checkItemDefinitions,
      sortOrder: form.sortOrder,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingId, createMutation, updateMutation]);

  const handleDelete = useCallback((tmpl: CommissioningChecklistTemplate) => {
    if (confirm(t('closeout.templateDeleteConfirm').replace('{name}', tmpl.name))) {
      deleteMutation.mutate(tmpl.id);
    }
  }, [deleteMutation]);

  const getItemCount = (definitions?: string): number => {
    if (!definitions) return 0;
    try {
      const parsed = JSON.parse(definitions);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const columns = useMemo<ColumnDef<CommissioningChecklistTemplate, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('closeout.templateColName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[260px]">{row.original.description}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'system',
        header: t('closeout.templateColSystem'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '—'}</span>
        ),
      },
      {
        id: 'itemCount',
        header: t('closeout.templateColItems'),
        size: 100,
        cell: ({ row }) => (
          <span className="tabular-nums">{getItemCount(row.original.checkItemDefinitions)}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('closeout.templateColActive'),
        size: 100,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.isActive ? 'active' : 'inactive'}
            colorMap={activeColorMap}
            label={row.original.isActive ? '✓' : '✗'}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 140,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }}>
              {t('common.edit')}
            </Button>
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }}>
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete],
  );

  const systemSelectOptions = useMemo(() => [
    { value: '', label: '—' },
    ...systemOptions.map((s) => ({ value: s.value, label: t(s.labelKey) })),
  ], []);

  const setField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: field === 'sortOrder' ? Number(e.target.value) : e.target.value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.templateTitle')}
        subtitle={t('closeout.templateSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.templateTitle') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => { setEditingId(null); setForm(emptyForm); setShowModal(true); }}>
            {t('closeout.templateCreate')}
          </Button>
        }
      />

      <DataTable<CommissioningChecklistTemplate>
        data={templates}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('closeout.templateEmpty')}
        emptyDescription={t('closeout.templateEmptyDesc')}
      />

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? t('closeout.templateFormTitleEdit') : t('closeout.templateFormTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.templateFieldName')} *
            </label>
            <Input value={form.name} onChange={setField('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.templateFieldSystem')}
            </label>
            <Select options={systemSelectOptions} value={form.system} onChange={setField('system')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.templateFieldDescription')}
            </label>
            <Input value={form.description} onChange={setField('description')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.templateFieldItems')}
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={form.checkItemDefinitions}
              onChange={(e) => setForm((prev) => ({ ...prev, checkItemDefinitions: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingId(null); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommissioningTemplateListPage;
