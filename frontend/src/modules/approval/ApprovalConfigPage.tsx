import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Settings2,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Pencil,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { workflowApi, type AutoApprovalRule } from '@/modules/workflow/api';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const statusColorMap: Record<string, string> = {
  true: 'green',
  false: 'gray',
};

const getEntityTypeOptions = () => [
  { value: 'CONTRACT', label: t('approvals.entityContract') },
  { value: 'DOCUMENT', label: t('approvals.entityDocument') },
  { value: 'PURCHASE_REQUEST', label: t('approvals.entityPurchaseRequest') },
  { value: 'INVOICE', label: t('approvals.entityInvoice') },
  { value: 'BUDGET', label: t('approvals.entityBudget') },
  { value: 'CHANGE_ORDER', label: t('approvals.entityChangeOrder') },
];

const getEntityTypeLabel = (entityType: string): string => {
  const labels: Record<string, string> = {
    CONTRACT: t('approvals.entityContract'),
    DOCUMENT: t('approvals.entityDocument'),
    PURCHASE_REQUEST: t('approvals.entityPurchaseRequest'),
    INVOICE: t('approvals.entityInvoice'),
    BUDGET: t('approvals.entityBudget'),
    CHANGE_ORDER: t('approvals.entityChangeOrder'),
  };
  return labels[entityType] ?? entityType;
};

interface RuleFormState {
  name: string;
  description: string;
  entityType: string;
  conditions: string;
  approverRole: string;
}

const emptyForm: RuleFormState = {
  name: '',
  description: '',
  entityType: 'CONTRACT',
  conditions: '',
  approverRole: '',
};

export default function ApprovalConfigPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoApprovalRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormState>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['approval-rules'],
    queryFn: () => workflowApi.getApprovalRules({ page: 0, size: 200 }),
  });

  const rules = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = rules;
    if (entityFilter) {
      result = result.filter((r) => r.entityType === entityFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          (r.description ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [rules, entityFilter, search]);

  const activeCount = rules.filter((r) => r.isActive).length;
  const inactiveCount = rules.filter((r) => !r.isActive).length;

  const createMutation = useMutation({
    mutationFn: (payload: Partial<AutoApprovalRule>) =>
      workflowApi.createApprovalRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      toast.success(t('approvals.config.toastCreated'));
      closeForm();
    },
    onError: () => toast.error(t('approvals.config.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: payload }: { id: string; data: Partial<AutoApprovalRule> }) =>
      workflowApi.updateApprovalRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      toast.success(t('approvals.config.toastUpdated'));
      closeForm();
    },
    onError: () => toast.error(t('approvals.config.toastUpdateError')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => workflowApi.toggleApprovalRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      toast.success(t('approvals.config.toastToggled'));
    },
    onError: () => toast.error(t('approvals.config.toastToggleError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowApi.deleteApprovalRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      toast.success(t('approvals.config.toastDeleted'));
      setDeleteConfirmId(null);
    },
    onError: () => toast.error(t('approvals.config.toastDeleteError')),
  });

  const closeForm = useCallback(() => {
    setCreateOpen(false);
    setEditingRule(null);
    setForm(emptyForm);
  }, []);

  const openEdit = useCallback((rule: AutoApprovalRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description ?? '',
      entityType: rule.entityType,
      conditions: rule.conditions,
      approverRole: rule.approverRole ?? '',
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const payload: Partial<AutoApprovalRule> = {
      name: form.name,
      description: form.description || undefined,
      entityType: form.entityType as AutoApprovalRule['entityType'],
      conditions: form.conditions,
      approverRole: form.approverRole || undefined,
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingRule, createMutation, updateMutation]);

  const updateField = (field: keyof RuleFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = form.name.trim().length > 0 && form.entityType.trim().length > 0;

  const isFormOpen = createOpen || !!editingRule;

  const columns = useMemo<ColumnDef<AutoApprovalRule>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('approvals.config.colName'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.name}
            </p>
            {row.original.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[240px]">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'entityType',
        header: t('approvals.config.colEntityType'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            {getEntityTypeLabel(getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('approvals.config.colStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const active = getValue() as boolean;
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                active
                  ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
              )}
            >
              {active ? t('approvals.config.statusActive') : t('approvals.config.statusInactive')}
            </span>
          );
        },
      },
      {
        accessorKey: 'approverRole',
        header: t('approvals.config.colApproverRole'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {(getValue() as string) || '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('approvals.config.colCreated'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDate(getValue() as string)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 180,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                toggleMutation.mutate(row.original.id);
              }}
              title={
                row.original.isActive
                  ? t('approvals.config.deactivate')
                  : t('approvals.config.activate')
              }
            >
              {row.original.isActive ? (
                <ToggleRight size={16} className="text-success-500" />
              ) : (
                <ToggleLeft size={16} className="text-neutral-400" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row.original);
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(row.original.id);
              }}
            >
              <Trash2 size={14} className="text-danger-500" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, toggleMutation],
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={t('approvals.config.title')}
        subtitle={t('approvals.config.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('approvals.breadcrumbSettings'), href: '/settings' },
          { label: t('approvals.config.breadcrumb') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              setForm(emptyForm);
              setCreateOpen(true);
            }}
          >
            {t('approvals.config.createRule')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Settings2 size={18} />}
          label={t('approvals.config.metricTotal')}
          value={rules.length}
          loading={isLoading}
        />
        <MetricCard
          icon={<ToggleRight size={18} />}
          label={t('approvals.config.metricActive')}
          value={activeCount}
          loading={isLoading}
        />
        <MetricCard
          icon={<ToggleLeft size={18} />}
          label={t('approvals.config.metricInactive')}
          value={inactiveCount}
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('approvals.config.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          options={[
            { value: '', label: t('approvals.filterAllTypes') },
            ...getEntityTypeOptions(),
          ]}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Settings2
            size={48}
            className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4"
          />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('approvals.config.emptyTitle')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-6">
            {t('approvals.config.emptyDescription')}
          </p>
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              setForm(emptyForm);
              setCreateOpen(true);
            }}
          >
            {t('approvals.config.createRule')}
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={
          editingRule
            ? t('approvals.config.editRuleTitle')
            : t('approvals.config.createRuleTitle')
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!canSubmit}
            >
              {editingRule ? t('common.save') : t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('approvals.config.labelName')} *
            </label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={t('approvals.config.placeholderName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('approvals.config.labelDescription')}
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={t('approvals.config.placeholderDescription')}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('approvals.config.labelEntityType')} *
            </label>
            <Select
              value={form.entityType}
              onChange={(e) => updateField('entityType', e.target.value)}
              options={getEntityTypeOptions()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('approvals.config.labelApproverRole')}
            </label>
            <Input
              value={form.approverRole}
              onChange={(e) => updateField('approverRole', e.target.value)}
              placeholder={t('approvals.config.placeholderApproverRole')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('approvals.config.labelConditions')}
            </label>
            <Textarea
              value={form.conditions}
              onChange={(e) => updateField('conditions', e.target.value)}
              placeholder={t('approvals.config.placeholderConditions')}
              rows={3}
            />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {t('approvals.config.conditionsHint')}
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title={t('approvals.config.deleteTitle')}
        description={t('approvals.config.deleteDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              loading={deleteMutation.isPending}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      />
    </div>
  );
}
