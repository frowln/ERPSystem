import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import {
  getFieldDefinitions,
  createFieldDefinition,
  updateFieldDefinition,
  deleteFieldDefinition,
  type CustomFieldDefinition,
  type CreateCustomFieldRequest,
  type UpdateCustomFieldRequest,
} from '@/api/customFields';

const ENTITY_TYPES = [
  'TASK',
  'CONTRACT',
  'PROJECT',
  'SAFETY_INCIDENT',
  'DEFECT',
  'DOCUMENT',
  'COUNTERPARTY',
  'INVOICE',
] as const;

const FIELD_TYPES = [
  'TEXT',
  'NUMBER',
  'DATE',
  'SELECT',
  'MULTISELECT',
  'BOOLEAN',
  'URL',
  'EMAIL',
] as const;

type EntityType = (typeof ENTITY_TYPES)[number];
type FieldType = (typeof FIELD_TYPES)[number];

interface FormState {
  entityType: EntityType;
  fieldName: string;
  fieldType: FieldType;
  description: string;
  required: boolean;
  searchable: boolean;
  options: string;
  defaultValue: string;
  validationRegex: string;
  sortOrder: number;
}

const emptyForm: FormState = {
  entityType: 'TASK',
  fieldName: '',
  fieldType: 'TEXT',
  description: '',
  required: false,
  searchable: false,
  options: '',
  defaultValue: '',
  validationRegex: '',
  sortOrder: 0,
};

const CustomFieldsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeEntityType, setActiveEntityType] = useState<EntityType | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const queryEntityType = activeEntityType === 'ALL' ? undefined : activeEntityType;

  const { data: definitions = [], isLoading } = useQuery<CustomFieldDefinition[]>({
    queryKey: ['custom-field-definitions', queryEntityType],
    queryFn: () => getFieldDefinitions(queryEntityType),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomFieldRequest) => createFieldDefinition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success(t('admin.customFields.created'));
      closeModal();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomFieldRequest }) =>
      updateFieldDefinition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success(t('admin.customFields.updated'));
      closeModal();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFieldDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      toast.success(t('admin.customFields.deleted'));
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm({
      ...emptyForm,
      entityType: activeEntityType === 'ALL' ? 'TASK' : activeEntityType,
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (def: CustomFieldDefinition) => {
    setForm({
      entityType: def.entityType as EntityType,
      fieldName: def.fieldName,
      fieldType: def.fieldType,
      description: def.description ?? '',
      required: def.required,
      searchable: def.searchable,
      options: def.options?.join(', ') ?? '',
      defaultValue: def.defaultValue ?? '',
      validationRegex: def.validationRegex ?? '',
      sortOrder: def.sortOrder,
    });
    setEditingId(def.id);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const options =
      form.fieldType === 'SELECT' || form.fieldType === 'MULTISELECT'
        ? form.options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

    if (editingId) {
      const data: UpdateCustomFieldRequest = {
        fieldName: form.fieldName,
        description: form.description || undefined,
        required: form.required,
        searchable: form.searchable,
        sortOrder: form.sortOrder,
        options,
        defaultValue: form.defaultValue || undefined,
        validationRegex: form.validationRegex || undefined,
      };
      updateMutation.mutate({ id: editingId, data });
    } else {
      const data: CreateCustomFieldRequest = {
        entityType: form.entityType,
        fieldName: form.fieldName,
        fieldType: form.fieldType,
        description: form.description || undefined,
        required: form.required,
        searchable: form.searchable,
        options,
        defaultValue: form.defaultValue || undefined,
        validationRegex: form.validationRegex || undefined,
      };
      createMutation.mutate(data);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const entityTypeLabel = (et: string): string => {
    const key = `admin.customFields.entityTypes.${et}` as const;
    return t(key as Parameters<typeof t>[0]) || et;
  };

  const fieldTypeLabel = (ft: string): string => {
    const key = `admin.customFields.fieldTypes.${ft}` as const;
    return t(key as Parameters<typeof t>[0]) || ft;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.customFields.title')}
        subtitle={t('admin.customFields.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('admin.customFields.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={openCreate}>
            {t('admin.customFields.create')}
          </Button>
        }
      />

      {/* Entity type tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveEntityType('ALL')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg transition-colors',
            activeEntityType === 'ALL'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
          )}
        >
          {t('common.all')}
        </button>
        {ENTITY_TYPES.map((et) => (
          <button
            key={et}
            onClick={() => setActiveEntityType(et)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              activeEntityType === et
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
            )}
          >
            {entityTypeLabel(et)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full" />
        </div>
      ) : definitions.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t('admin.customFields.noFields')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin.customFields.fieldName')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin.customFields.fieldKey')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin.customFields.entityType')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin.customFields.fieldType')}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin.customFields.required')}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin.customFields.searchable')}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin.customFields.sortOrder')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {definitions.map((def) => (
                  <tr key={def.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {def.fieldName}
                      {def.description && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {def.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                      {def.fieldKey}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {entityTypeLabel(def.entityType)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {fieldTypeLabel(def.fieldType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {def.required ? (
                        <span className="text-green-600 dark:text-green-400">&#10003;</span>
                      ) : (
                        <span className="text-neutral-300 dark:text-neutral-600">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {def.searchable ? (
                        <span className="text-green-600 dark:text-green-400">&#10003;</span>
                      ) : (
                        <span className="text-neutral-300 dark:text-neutral-600">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">
                      {def.sortOrder}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(def)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors"
                          title={t('admin.customFields.edit')}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(def.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 dark:hover:text-danger-400 transition-colors"
                          title={t('admin.customFields.delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
              {t('admin.customFields.confirmDelete')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmId(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                {t('admin.customFields.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {editingId ? t('admin.customFields.edit') : t('admin.customFields.create')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <FormField label={t('admin.customFields.entityType')} htmlFor="cf-entity-type" required>
                  <Select
                    id="cf-entity-type"
                    options={ENTITY_TYPES.map((et) => ({
                      value: et,
                      label: entityTypeLabel(et),
                    }))}
                    value={form.entityType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, entityType: e.target.value as EntityType }))
                    }
                  />
                </FormField>
              )}

              <FormField label={t('admin.customFields.fieldName')} htmlFor="cf-field-name" required>
                <Input
                  id="cf-field-name"
                  value={form.fieldName}
                  onChange={(e) => setForm((f) => ({ ...f, fieldName: e.target.value }))}
                  required
                />
              </FormField>

              {!editingId && (
                <FormField label={t('admin.customFields.fieldType')} htmlFor="cf-field-type" required>
                  <Select
                    id="cf-field-type"
                    options={FIELD_TYPES.map((ft) => ({
                      value: ft,
                      label: fieldTypeLabel(ft),
                    }))}
                    value={form.fieldType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fieldType: e.target.value as FieldType }))
                    }
                  />
                </FormField>
              )}

              <FormField label={t('admin.customFields.description')} htmlFor="cf-description">
                <Input
                  id="cf-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </FormField>

              {(form.fieldType === 'SELECT' || form.fieldType === 'MULTISELECT') && (
                <FormField label={t('admin.customFields.options')} htmlFor="cf-options">
                  <Input
                    id="cf-options"
                    value={form.options}
                    onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                    placeholder={t('admin.customFields.options')}
                  />
                </FormField>
              )}

              <FormField label={t('admin.customFields.defaultValue')} htmlFor="cf-default">
                <Input
                  id="cf-default"
                  value={form.defaultValue}
                  onChange={(e) => setForm((f) => ({ ...f, defaultValue: e.target.value }))}
                />
              </FormField>

              <FormField label={t('admin.customFields.validationRegex')} htmlFor="cf-regex">
                <Input
                  id="cf-regex"
                  value={form.validationRegex}
                  onChange={(e) => setForm((f) => ({ ...f, validationRegex: e.target.value }))}
                />
              </FormField>

              {editingId && (
                <FormField label={t('admin.customFields.sortOrder')} htmlFor="cf-sort-order">
                  <Input
                    id="cf-sort-order"
                    type="number"
                    value={String(form.sortOrder)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </FormField>
              )}

              <div className="flex items-center gap-6">
                <Checkbox
                  id="cf-required"
                  label={t('admin.customFields.required')}
                  checked={form.required}
                  onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
                />
                <Checkbox
                  id="cf-searchable"
                  label={t('admin.customFields.searchable')}
                  checked={form.searchable}
                  onChange={(e) => setForm((f) => ({ ...f, searchable: e.target.checked }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={closeModal}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={isMutating}>
                  {editingId ? t('common.save') : t('admin.customFields.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsPage;
