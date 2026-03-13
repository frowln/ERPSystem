import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Plus, Shield, TrendingDown, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { risksApi } from '@/api/risks';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ProjectRisk, RiskCategory, RiskStatus } from '@/types';

const STATUS_COLORS: Record<RiskStatus, string> = {
  IDENTIFIED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MITIGATING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ACCEPTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CLOSED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const MATRIX_CELL_COLOR = (score: number): string => {
  if (score >= 15) return 'bg-red-500 text-white';
  if (score >= 8) return 'bg-amber-400 text-neutral-900';
  return 'bg-green-400 text-neutral-900';
};

const CATEGORY_OPTIONS = (['FINANCIAL', 'TECHNICAL', 'LEGAL', 'ENVIRONMENTAL', 'SCHEDULE', 'SAFETY', 'OTHER'] as RiskCategory[]).map(c => ({
  value: c,
  label: t(`projects.risks.categories.${c}`),
}));

const PROBABILITY_OPTIONS = [1, 2, 3, 4, 5].map(v => ({ value: String(v), label: String(v) }));
const IMPACT_OPTIONS = [1, 2, 3, 4, 5].map(v => ({ value: String(v), label: String(v) }));

const STATUS_OPTIONS = (['IDENTIFIED', 'MITIGATING', 'ACCEPTED', 'CLOSED'] as RiskStatus[]).map(s => ({
  value: s,
  label: t(`projects.risks.statuses.${s}`),
}));

const RiskRegisterPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRisk | null>(null);
  const [form, setForm] = useState<Partial<ProjectRisk>>({
    category: 'TECHNICAL',
    status: 'IDENTIFIED',
    probability: 3,
    impact: 3,
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', projectId],
    queryFn: () => risksApi.getRisks(projectId!),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<ProjectRisk>) =>
      editing
        ? risksApi.updateRisk(projectId!, editing.id, data)
        : risksApi.createRisk(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (riskId: string) => risksApi.deleteRisk(projectId!, riskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['risks', projectId] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ category: 'TECHNICAL', status: 'IDENTIFIED', probability: 3, impact: 3 });
    setModalOpen(true);
  };

  const openEdit = (risk: ProjectRisk) => {
    setEditing(risk);
    setForm(risk);
    setModalOpen(true);
  };

  const metrics = useMemo(() => {
    const total = risks.length;
    const high = risks.filter(r => r.score >= 15).length;
    const mitigating = risks.filter(r => r.status === 'MITIGATING').length;
    const closed = risks.filter(r => r.status === 'CLOSED').length;
    return { total, high, mitigating, closed };
  }, [risks]);

  // Build 5x5 matrix
  const matrix = useMemo(() => {
    const cells: Record<string, number> = {};
    risks.forEach(r => {
      if (r.status !== 'CLOSED') {
        const key = `${r.probability}-${r.impact}`;
        cells[key] = (cells[key] ?? 0) + 1;
      }
    });
    return cells;
  }, [risks]);

  const columns: ColumnDef<ProjectRisk>[] = useMemo(() => [
    {
      accessorKey: 'category',
      header: t('projects.risks.category'),
      cell: ({ getValue }) => (
        <span className="text-xs font-medium">{t(`projects.risks.categories.${getValue<string>()}`)}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: t('common.description'),
      cell: ({ getValue }) => (
        <span className="text-sm max-w-[300px] truncate block">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'probability',
      header: t('projects.risks.probability'),
      cell: ({ getValue }) => <span className="text-sm text-center block">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'impact',
      header: t('projects.risks.impact'),
      cell: ({ getValue }) => <span className="text-sm text-center block">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'score',
      header: t('projects.risks.score'),
      cell: ({ getValue }) => {
        const score = getValue<number>();
        return (
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${MATRIX_CELL_COLOR(score)}`}>
            {score}
          </span>
        );
      },
    },
    {
      accessorKey: 'owner',
      header: t('projects.risks.owner'),
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>() ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ getValue }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[getValue<RiskStatus>()]}`}>
          {t(`projects.risks.statuses.${getValue<string>()}`)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
            {t('common.edit')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(row.original.id)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('projects.risks.title')}
        subtitle={t('projects.risks.subtitle')}
        actions={
          <Button onClick={openAdd}>
            <Plus size={16} className="mr-1.5" /> {t('projects.risks.addRisk')}
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t('projects.risks.totalRisks')} value={metrics.total} icon={<AlertTriangle size={20} />} />
        <MetricCard label={t('projects.risks.highRisks')} value={metrics.high} icon={<Shield size={20} />} />
        <MetricCard label={t('projects.risks.mitigating')} value={metrics.mitigating} icon={<TrendingDown size={20} />} />
        <MetricCard label={t('projects.risks.closedRisks')} value={metrics.closed} icon={<CheckCircle size={20} />} />
      </div>

      {/* Risk Matrix Heatmap */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          {t('projects.risks.matrix')}
        </h3>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-24 text-xs text-neutral-500 dark:text-neutral-400 pb-1 text-right pr-2">
                  {t('projects.risks.probability')} ↓ / {t('projects.risks.impact')} →
                </th>
                {[1, 2, 3, 4, 5].map(impact => (
                  <th key={impact} className="w-14 h-8 text-xs text-center text-neutral-500 dark:text-neutral-400">{impact}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(prob => (
                <tr key={prob}>
                  <td className="text-xs text-neutral-500 dark:text-neutral-400 text-right pr-2 font-medium">{prob}</td>
                  {[1, 2, 3, 4, 5].map(impact => {
                    const score = prob * impact;
                    const count = matrix[`${prob}-${impact}`] ?? 0;
                    return (
                      <td key={impact} className="p-0.5">
                        <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${MATRIX_CELL_COLOR(score)} ${count ? 'ring-2 ring-neutral-800 dark:ring-white' : 'opacity-60'}`}>
                          <span className="text-[10px] font-medium">{score}</span>
                          {count > 0 && <span className="text-xs font-bold">{count}</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DataTable */}
      <DataTable columns={columns} data={risks} enableExport />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('projects.risks.editRisk') : t('projects.risks.addRisk')}>
        <div className="space-y-4">
          <FormField label={t('projects.risks.category')}>
            <Select options={CATEGORY_OPTIONS} value={form.category ?? ''} onChange={e => setForm(f => ({ ...f, category: e.target.value as RiskCategory }))} />
          </FormField>
          <FormField label={t('common.description')}>
            <Input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('projects.risks.probability')}>
              <Select options={PROBABILITY_OPTIONS} value={String(form.probability ?? 3)} onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))} />
            </FormField>
            <FormField label={t('projects.risks.impact')}>
              <Select options={IMPACT_OPTIONS} value={String(form.impact ?? 3)} onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))} />
            </FormField>
          </div>
          <FormField label={t('projects.risks.mitigation')}>
            <Input value={form.mitigation ?? ''} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.risks.owner')}>
            <Input value={form.owner ?? ''} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={STATUS_OPTIONS} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as RiskStatus }))} />
          </FormField>
          <FormField label={t('projects.risks.dueDate')}>
            <Input type="date" value={form.dueDate ?? ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => saveMutation.mutate({
                ...form,
                score: (form.probability ?? 3) * (form.impact ?? 3),
              })}
              disabled={saveMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RiskRegisterPage;
