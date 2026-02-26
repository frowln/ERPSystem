import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  ListChecks,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type {
  ChecklistTemplate,
  ChecklistWorkType,
  ChecklistTemplateItem,
  CreateChecklistTemplateRequest,
  UpdateChecklistTemplateRequest,
} from '@/modules/quality/types';

const workTypeColorMap: Record<string, 'blue' | 'green' | 'orange' | 'cyan' | 'purple' | 'gray'> = {
  concreting: 'blue',
  steel_installation: 'green',
  welding: 'orange',
  waterproofing: 'cyan',
  finishing: 'purple',
  other: 'gray',
};

const getWorkTypeLabels = (): Record<string, string> => ({
  concreting: t('quality.checklistTemplates.workTypeConcreting'),
  steel_installation: t('quality.checklistTemplates.workTypeSteelInstallation'),
  welding: t('quality.checklistTemplates.workTypeWelding'),
  waterproofing: t('quality.checklistTemplates.workTypeWaterproofing'),
  finishing: t('quality.checklistTemplates.workTypeFinishing'),
  other: t('quality.checklistTemplates.workTypeOther'),
});

interface FormItem {
  description: string;
  required: boolean;
  order: number;
}

const ChecklistTemplatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formWorkType, setFormWorkType] = useState<ChecklistWorkType>('concreting');
  const [formItems, setFormItems] = useState<FormItem[]>([]);

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => qualityApi.getChecklistTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateChecklistTemplateRequest) =>
      qualityApi.createChecklistTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success(t('quality.checklistTemplates.toastCreated'));
      closeModal();
    },
    onError: () => {
      toast.error(t('quality.checklistTemplates.toastCreateError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChecklistTemplateRequest }) =>
      qualityApi.updateChecklistTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success(t('quality.checklistTemplates.toastUpdated'));
      closeModal();
    },
    onError: () => {
      toast.error(t('quality.checklistTemplates.toastUpdateError'));
    },
  });

  const templates = templatesData?.content ?? [];

  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    if (workTypeFilter)
      filtered = filtered.filter((tpl) => tpl.workType === workTypeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((tpl) => tpl.name.toLowerCase().includes(lower));
    }
    return filtered;
  }, [templates, workTypeFilter, search]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormWorkType('concreting');
    setFormItems([]);
    setShowModal(true);
  };

  const openEditModal = (tpl: ChecklistTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormWorkType(tpl.workType);
    setFormItems(
      tpl.items.map((item) => ({
        description: item.description,
        required: item.required,
        order: item.order,
      })),
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const addItem = () => {
    setFormItems((prev) => [
      ...prev,
      { description: '', required: false, order: prev.length + 1 },
    ]);
  };

  const removeItem = (idx: number) => {
    setFormItems((prev) =>
      prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, order: i + 1 })),
    );
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    setFormItems((prev) => {
      const items = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= items.length) return items;
      [items[idx], items[targetIdx]] = [items[targetIdx], items[idx]];
      return items.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const updateItem = (idx: number, field: keyof FormItem, value: string | boolean | number) => {
    setFormItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const handleSave = () => {
    const items = formItems.map((fi) => ({
      order: fi.order,
      description: fi.description,
      required: fi.required,
    }));

    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: { name: formName, workType: formWorkType, items },
      });
    } else {
      createMutation.mutate({ name: formName, workType: formWorkType, items });
    }
  };

  const columns = useMemo<ColumnDef<ChecklistTemplate, unknown>[]>(() => {
    const workTypeLabels = getWorkTypeLabels();
    return [
      {
        accessorKey: 'name',
        header: t('quality.checklistTemplates.colName'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'workType',
        header: t('quality.checklistTemplates.colWorkType'),
        size: 200,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={workTypeColorMap}
            label={workTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'itemsCount',
        header: t('quality.checklistTemplates.colItemsCount'),
        size: 100,
        accessorFn: (row) => row.items.length,
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1 text-sm">
            <ListChecks size={14} className="text-neutral-400" />
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: t('quality.checklistTemplates.colUpdated'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-500 dark:text-neutral-400 text-sm">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: 'actions',
        size: 60,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => openEditModal(row.original)}
            aria-label={t('common.edit')}
          >
            <Edit size={14} />
          </Button>
        ),
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.checklistTemplates.title')}
        subtitle={t('quality.checklistTemplates.subtitle', {
          count: String(templates.length),
        })}
        breadcrumbs={[
          { label: t('quality.checklistTemplates.breadcrumbHome'), href: '/' },
          { label: t('quality.checklistTemplates.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.checklistTemplates.breadcrumbChecklists') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={openCreateModal}>
            {t('quality.checklistTemplates.btnNewTemplate')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.checklistTemplates.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('quality.checklistTemplates.filterAllWorkTypes') },
            ...Object.entries(getWorkTypeLabels()).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="w-52"
        />
      </div>

      {/* Table */}
      <DataTable<ChecklistTemplate>
        data={filteredTemplates}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('quality.checklistTemplates.emptyTitle')}
        emptyDescription={t('quality.checklistTemplates.emptyDescription')}
      />

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={
          editingTemplate
            ? t('quality.checklistTemplates.modalTitleEdit')
            : t('quality.checklistTemplates.modalTitleCreate')
        }
        description={t('quality.checklistTemplates.modalDescription')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              {t('quality.checklistTemplates.btnCancel')}
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTemplate
                ? t('quality.checklistTemplates.btnSave')
                : t('quality.checklistTemplates.btnCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('quality.checklistTemplates.labelName')} required>
            <Input
              placeholder={t('quality.checklistTemplates.placeholderName')}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </FormField>
          <FormField label={t('quality.checklistTemplates.labelWorkType')} required>
            <Select
              options={Object.entries(getWorkTypeLabels()).map(([v, l]) => ({
                value: v,
                label: l,
              }))}
              value={formWorkType}
              onChange={(e) => setFormWorkType(e.target.value as ChecklistWorkType)}
            />
          </FormField>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('quality.checklistTemplates.sectionItems')}
              </p>
              <Button variant="ghost" size="xs" onClick={addItem}>
                <Plus size={14} />
                {t('quality.checklistTemplates.addItem')}
              </Button>
            </div>
            <div className="space-y-2">
              {formItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2"
                >
                  <span className="text-xs font-mono text-neutral-400 w-6 text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    placeholder={t('quality.checklistTemplates.itemDescription')}
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1"
                  />
                  <Checkbox
                    label={t('quality.checklistTemplates.itemRequired')}
                    checked={item.required}
                    onChange={(e) => updateItem(idx, 'required', e.target.checked)}
                  />
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      aria-label={t('quality.checklistTemplates.moveUp')}
                    >
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === formItems.length - 1}
                      aria-label={t('quality.checklistTemplates.moveDown')}
                    >
                      <ChevronDown size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => removeItem(idx)}
                      aria-label={t('quality.checklistTemplates.removeItem')}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChecklistTemplatesPage;
