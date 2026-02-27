import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { ShieldCheck, Plus, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { VendorPrequalification, PrequalificationStatus } from '@/types';

const STATUS_COLORS: Record<PrequalificationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  QUALIFIED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DISQUALIFIED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

const INSURANCE_OPTIONS = [
  { value: 'true', label: t('common.yes') },
  { value: 'false', label: t('common.no') },
];

const STATUS_OPTIONS = (['PENDING', 'QUALIFIED', 'DISQUALIFIED', 'EXPIRED'] as PrequalificationStatus[]).map(s => ({
  value: s,
  label: t(`procurement.prequalification.statuses.${s}`),
}));

const ScoreBar: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500 dark:text-neutral-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-8 text-right">{value}</span>
    </div>
  );
};

const VendorPrequalificationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VendorPrequalification | null>(null);
  const [form, setForm] = useState<Partial<VendorPrequalification>>({
    status: 'PENDING',
    financialScore: 50,
    safetyScore: 50,
    experienceScore: 50,
    insuranceValid: true,
    bondCapacity: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: vendors = [] } = useQuery({
    queryKey: ['prequalifications'],
    queryFn: () => procurementApi.getPrequalifications(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<VendorPrequalification>) =>
      editing
        ? procurementApi.updatePrequalification(editing.id, data)
        : procurementApi.createPrequalification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prequalifications'] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ status: 'PENDING', financialScore: 50, safetyScore: 50, experienceScore: 50, insuranceValid: true, bondCapacity: 0 });
    setModalOpen(true);
  };

  const openEdit = (vendor: VendorPrequalification) => {
    setEditing(vendor);
    setForm(vendor);
    setModalOpen(true);
  };

  const metrics = useMemo(() => {
    const total = vendors.length;
    const qualified = vendors.filter(v => v.status === 'QUALIFIED').length;
    const pending = vendors.filter(v => v.status === 'PENDING').length;
    const disqualified = vendors.filter(v => v.status === 'DISQUALIFIED').length;
    return { total, qualified, pending, disqualified };
  }, [vendors]);

  const filtered = useMemo(
    () => statusFilter === 'ALL' ? vendors : vendors.filter(v => v.status === statusFilter),
    [vendors, statusFilter],
  );

  const columns: ColumnDef<VendorPrequalification>[] = useMemo(() => [
    {
      accessorKey: 'vendorName',
      header: t('procurement.prequalification.vendorName'),
      cell: ({ getValue }) => <span className="text-sm font-medium">{getValue<string>()}</span>,
    },
    {
      id: 'scores',
      header: t('procurement.prequalification.scores'),
      cell: ({ row }) => (
        <div className="space-y-1 min-w-[200px]">
          <ScoreBar value={row.original.financialScore} label={t('procurement.prequalification.financial')} />
          <ScoreBar value={row.original.safetyScore} label={t('procurement.prequalification.safety')} />
          <ScoreBar value={row.original.experienceScore} label={t('procurement.prequalification.experience')} />
        </div>
      ),
    },
    {
      accessorKey: 'overallScore',
      header: t('procurement.prequalification.overallScore'),
      cell: ({ getValue }) => {
        const score = getValue<number>();
        const color = score >= 70 ? 'text-green-600 dark:text-green-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
        return <span className={`text-lg font-bold ${color}`}>{score}</span>;
      },
    },
    {
      accessorKey: 'insuranceValid',
      header: t('procurement.prequalification.insurance'),
      cell: ({ getValue }) => (
        getValue<boolean>()
          ? <CheckCircle size={16} className="text-green-500" />
          : <AlertCircle size={16} className="text-red-500" />
      ),
    },
    {
      accessorKey: 'bondCapacity',
      header: t('procurement.prequalification.bondCapacity'),
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue<number>() ?? 0).toLocaleString('ru-RU')} ₽</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ getValue }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[getValue<PrequalificationStatus>()]}`}>
          {t(`procurement.prequalification.statuses.${getValue<string>()}`)}
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
    <div className="space-y-6">
      <PageHeader
        title={t('procurement.prequalification.title')}
        subtitle={t('procurement.prequalification.subtitle')}
        actions={
          <Button onClick={openAdd}>
            <Plus size={16} className="mr-1.5" /> {t('procurement.prequalification.addVendor')}
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t('procurement.prequalification.totalVendors')} value={metrics.total} icon={<Users size={20} />} />
        <MetricCard label={t('procurement.prequalification.qualified')} value={metrics.qualified} icon={<ShieldCheck size={20} />} />
        <MetricCard label={t('procurement.prequalification.pendingReview')} value={metrics.pending} icon={<AlertCircle size={20} />} />
        <MetricCard label={t('procurement.prequalification.disqualified')} value={metrics.disqualified} icon={<AlertCircle size={20} />} />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'QUALIFIED', 'DISQUALIFIED', 'EXPIRED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {s === 'ALL' ? t('common.all') : t(`procurement.prequalification.statuses.${s}`)}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('procurement.prequalification.editVendor') : t('procurement.prequalification.addVendor')}>
        <div className="space-y-4">
          <FormField label={t('procurement.prequalification.vendorName')}>
            <Input value={form.vendorName ?? ''} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label={t('procurement.prequalification.financial')}>
              <Input type="number" value={String(form.financialScore ?? 50)} onChange={e => setForm(f => ({ ...f, financialScore: Number(e.target.value) }))} />
            </FormField>
            <FormField label={t('procurement.prequalification.safety')}>
              <Input type="number" value={String(form.safetyScore ?? 50)} onChange={e => setForm(f => ({ ...f, safetyScore: Number(e.target.value) }))} />
            </FormField>
            <FormField label={t('procurement.prequalification.experience')}>
              <Input type="number" value={String(form.experienceScore ?? 50)} onChange={e => setForm(f => ({ ...f, experienceScore: Number(e.target.value) }))} />
            </FormField>
          </div>
          <FormField label={t('procurement.prequalification.bondCapacity')}>
            <Input type="number" value={String(form.bondCapacity ?? 0)} onChange={e => setForm(f => ({ ...f, bondCapacity: Number(e.target.value) }))} />
          </FormField>
          <FormField label={t('procurement.prequalification.insuranceValid')}>
            <Select options={INSURANCE_OPTIONS} value={form.insuranceValid ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, insuranceValid: e.target.value === 'true' }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={STATUS_OPTIONS} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as PrequalificationStatus }))} />
          </FormField>
          <FormField label={t('common.notes')}>
            <Input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => saveMutation.mutate({
                ...form,
                overallScore: Math.round(((form.financialScore ?? 0) + (form.safetyScore ?? 0) + (form.experienceScore ?? 0)) / 3),
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

export default VendorPrequalificationPage;
