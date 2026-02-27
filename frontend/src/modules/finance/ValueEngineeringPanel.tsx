import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { TrendingDown, Plus, CheckCircle, XCircle } from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ValueEngineeringItem, VeStatus, QualityImpact } from '@/types';

const STATUS_COLORS: Record<VeStatus, string> = {
  PROPOSED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  IMPLEMENTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const QUALITY_COLORS: Record<QualityImpact, string> = {
  NONE: 'text-green-600 dark:text-green-400',
  MINOR: 'text-amber-600 dark:text-amber-400',
  SIGNIFICANT: 'text-red-600 dark:text-red-400',
};

const QUALITY_OPTIONS = (['NONE', 'MINOR', 'SIGNIFICANT'] as QualityImpact[]).map(q => ({
  value: q,
  label: t(`finance.valueEngineering.impacts.${q}`),
}));

const VE_STATUS_OPTIONS = (['PROPOSED', 'APPROVED', 'REJECTED', 'IMPLEMENTED'] as VeStatus[]).map(s => ({
  value: s,
  label: t(`finance.valueEngineering.statuses.${s}`),
}));

const ValueEngineeringPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ValueEngineeringItem | null>(null);
  const [form, setForm] = useState<Partial<ValueEngineeringItem>>({
    status: 'PROPOSED',
    qualityImpact: 'NONE',
    costSaving: 0,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['value-engineering', projectId],
    queryFn: () => financeApi.getValueEngineering(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<ValueEngineeringItem>) =>
      editing
        ? financeApi.updateValueEngineering(projectId, editing.id, data)
        : financeApi.createValueEngineering(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['value-engineering', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ status: 'PROPOSED', qualityImpact: 'NONE', costSaving: 0 });
    setModalOpen(true);
  };

  const openEdit = (item: ValueEngineeringItem) => {
    setEditing(item);
    setForm(item);
    setModalOpen(true);
  };

  const metrics = useMemo(() => {
    const totalSavings = items.reduce((s, i) => s + i.costSaving, 0);
    const approvedSavings = items.filter(i => i.status === 'APPROVED' || i.status === 'IMPLEMENTED').reduce((s, i) => s + i.costSaving, 0);
    const implemented = items.filter(i => i.status === 'IMPLEMENTED').length;
    const total = items.length;
    const implementationRate = total > 0 ? Math.round((implemented / total) * 100) : 0;
    return { totalSavings, approvedSavings, implementationRate };
  }, [items]);

  const columns: ColumnDef<ValueEngineeringItem>[] = useMemo(() => [
    {
      accessorKey: 'budgetItemName',
      header: t('finance.valueEngineering.budgetItem'),
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>() ?? '—'}</span>,
    },
    {
      accessorKey: 'originalSolution',
      header: t('finance.valueEngineering.originalSolution'),
      cell: ({ getValue }) => <span className="text-sm max-w-[200px] truncate block">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'proposedSolution',
      header: t('finance.valueEngineering.proposedSolution'),
      cell: ({ getValue }) => <span className="text-sm max-w-[200px] truncate block">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'costSaving',
      header: t('finance.valueEngineering.costSaving'),
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          -{(getValue<number>()).toLocaleString('ru-RU')} ₽
        </span>
      ),
    },
    {
      accessorKey: 'qualityImpact',
      header: t('finance.valueEngineering.qualityImpact'),
      cell: ({ getValue }) => {
        const impact = getValue<QualityImpact>();
        return (
          <span className={`text-xs font-medium ${QUALITY_COLORS[impact]}`}>
            {t(`finance.valueEngineering.impacts.${impact}`)}
          </span>
        );
      },
    },
    {
      accessorKey: 'author',
      header: t('finance.valueEngineering.author'),
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>() ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ getValue }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[getValue<VeStatus>()]}`}>
          {t(`finance.valueEngineering.statuses.${getValue<string>()}`)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
          {t('common.edit')}
        </Button>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 p-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t('finance.valueEngineering.totalSavings')}
          value={`${metrics.totalSavings.toLocaleString('ru-RU')} ₽`}
          icon={<TrendingDown size={20} />}
        />
        <MetricCard
          label={t('finance.valueEngineering.approvedSavings')}
          value={`${metrics.approvedSavings.toLocaleString('ru-RU')} ₽`}
          icon={<CheckCircle size={20} />}
        />
        <MetricCard
          label={t('finance.valueEngineering.implementationRate')}
          value={`${metrics.implementationRate}%`}
          icon={<XCircle size={20} />}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus size={16} className="mr-1.5" /> {t('finance.valueEngineering.addItem')}
        </Button>
      </div>

      <DataTable columns={columns} data={items} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('finance.valueEngineering.editItem') : t('finance.valueEngineering.addItem')}>
        <div className="space-y-4">
          <FormField label={t('finance.valueEngineering.budgetItem')}>
            <Input value={form.budgetItemName ?? ''} onChange={e => setForm(f => ({ ...f, budgetItemName: e.target.value }))} />
          </FormField>
          <FormField label={t('finance.valueEngineering.originalSolution')}>
            <Input value={form.originalSolution ?? ''} onChange={e => setForm(f => ({ ...f, originalSolution: e.target.value }))} />
          </FormField>
          <FormField label={t('finance.valueEngineering.proposedSolution')}>
            <Input value={form.proposedSolution ?? ''} onChange={e => setForm(f => ({ ...f, proposedSolution: e.target.value }))} />
          </FormField>
          <FormField label={t('finance.valueEngineering.costSaving')}>
            <Input type="number" value={String(form.costSaving ?? 0)} onChange={e => setForm(f => ({ ...f, costSaving: Number(e.target.value) }))} />
          </FormField>
          <FormField label={t('finance.valueEngineering.qualityImpact')}>
            <Select options={QUALITY_OPTIONS} value={form.qualityImpact ?? 'NONE'} onChange={e => setForm(f => ({ ...f, qualityImpact: e.target.value as QualityImpact }))} />
          </FormField>
          <FormField label={t('finance.valueEngineering.author')}>
            <Input value={form.author ?? ''} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={VE_STATUS_OPTIONS} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as VeStatus }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ValueEngineeringPanel;
