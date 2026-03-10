import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Plus,
  Receipt,
  Send,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { PortalInvoice, PortalInvoiceStatus, CreatePortalInvoiceRequest } from './types';

const statusColorMap: Record<PortalInvoiceStatus, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  APPROVED: 'yellow',
  PAID: 'green',
  REJECTED: 'red',
  PARTIALLY_PAID: 'orange',
};

const getStatusLabels = (): Record<PortalInvoiceStatus, string> => ({
  DRAFT: t('portal.invoices.statusDraft'),
  SUBMITTED: t('portal.invoices.statusSubmitted'),
  APPROVED: t('portal.invoices.statusApproved'),
  PAID: t('portal.invoices.statusPaid'),
  REJECTED: t('portal.invoices.statusRejected'),
  PARTIALLY_PAID: t('portal.invoices.statusPartiallyPaid'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('portal.invoices.statusAll') },
  { value: 'DRAFT', label: t('portal.invoices.statusDraft') },
  { value: 'SUBMITTED', label: t('portal.invoices.statusSubmitted') },
  { value: 'APPROVED', label: t('portal.invoices.statusApproved') },
  { value: 'PAID', label: t('portal.invoices.statusPaid') },
  { value: 'REJECTED', label: t('portal.invoices.statusRejected') },
];

const PortalInvoicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formContractId, setFormContractId] = useState('');
  const [formPeriodStart, setFormPeriodStart] = useState('');
  const [formPeriodEnd, setFormPeriodEnd] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const statusFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase() as PortalInvoiceStatus;

  const { data, isLoading } = useQuery({
    queryKey: ['portal-invoices', statusFilter],
    queryFn: () => portalApi.getInvoices({ status: statusFilter, size: 100 }),
  });

  const { data: contractData } = useQuery({
    queryKey: ['portal-contracts-for-invoice'],
    queryFn: () => portalApi.getContracts({ size: 200 }),
  });

  const invoices = data?.content ?? [];
  const contracts = contractData?.content ?? [];

  const filteredInvoices = useMemo(() => {
    if (!search) return invoices;
    const lower = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(lower) ||
        inv.contractNumber.toLowerCase().includes(lower) ||
        inv.projectName.toLowerCase().includes(lower),
    );
  }, [invoices, search]);

  const metrics = useMemo(() => ({
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'DRAFT').length,
    submitted: invoices.filter((i) => i.status === 'SUBMITTED' || i.status === 'APPROVED').length,
    paid: invoices.filter((i) => i.status === 'PAID' || i.status === 'PARTIALLY_PAID').length,
    totalAmount: invoices.reduce((s, i) => s + i.amount, 0),
    paidAmount: invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0),
  }), [invoices]);

  const tabs = [
    { id: 'all', label: t('portal.invoices.tabAll'), count: metrics.total },
    { id: 'draft', label: t('portal.invoices.tabDraft'), count: metrics.draft },
    { id: 'submitted', label: t('portal.invoices.tabSubmitted'), count: metrics.submitted },
    { id: 'paid', label: t('portal.invoices.tabPaid'), count: metrics.paid },
  ];

  const contractOptions = contracts
    .filter((c) => c.status === 'ACTIVE')
    .map((c) => ({ value: c.id, label: `${c.contractNumber} — ${c.projectName}` }));

  const createMutation = useMutation({
    mutationFn: (data: CreatePortalInvoiceRequest) => portalApi.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      toast.success(t('portal.invoices.createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(t('portal.invoices.createError')),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => portalApi.submitInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      toast.success(t('portal.invoices.submitSuccess'));
    },
    onError: () => toast.error(t('portal.invoices.submitError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      toast.success(t('portal.invoices.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resetForm = () => {
    setFormContractId('');
    setFormPeriodStart('');
    setFormPeriodEnd('');
    setFormAmount('');
    setFormDescription('');
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      contractId: formContractId,
      periodStart: formPeriodStart,
      periodEnd: formPeriodEnd,
      amount: parseFloat(formAmount),
      description: formDescription || undefined,
    });
  }, [formContractId, formPeriodStart, formPeriodEnd, formAmount, formDescription]);

  const columns = useMemo<ColumnDef<PortalInvoice, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    return [
      {
        accessorKey: 'invoiceNumber',
        header: t('portal.invoices.colNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-primary-600 dark:text-primary-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'contractNumber',
        header: t('portal.invoices.colContract'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('portal.invoices.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 truncate">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('portal.invoices.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<PortalInvoiceStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'amount',
        header: t('portal.invoices.colAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        id: 'period',
        header: t('portal.invoices.colPeriod'),
        size: 170,
        cell: ({ row }) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
            {formatDate(row.original.periodStart)} — {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('portal.invoices.colCreated'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 tabular-nums text-sm">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <div className="flex items-center gap-1">
              {inv.status === 'DRAFT' && (
                <>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); submitMutation.mutate(inv.id); }}
                    title={t('portal.invoices.submitAction')}
                  >
                    <Send size={12} />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(inv.id); }}
                    title={t('common.delete')}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portal.invoices.title')}
        subtitle={t('portal.invoices.subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: t('portal.invoices.breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1" /> {t('portal.invoices.createInvoice')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Receipt size={18} />} label={t('portal.invoices.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('portal.invoices.metricPending')} value={metrics.submitted} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('portal.invoices.metricPaid')} value={metrics.paid} />
        <MetricCard icon={<DollarSign size={18} />} label={t('portal.invoices.metricTotalAmount')} value={formatMoney(metrics.totalAmount)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('portal.invoices.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<PortalInvoice>
        data={filteredInvoices}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('portal.invoices.emptyTitle')}
        emptyDescription={t('portal.invoices.emptyDescription')}
      />

      {/* Create Invoice Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('portal.invoices.createModalTitle')}>
        <div className="space-y-4">
          <FormField label={t('portal.invoices.fieldContract')} required>
            <Select
              options={contractOptions}
              value={formContractId}
              onChange={(e) => setFormContractId(e.target.value)}
              placeholder={t('portal.invoices.contractPlaceholder')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('portal.invoices.fieldPeriodStart')} required>
              <Input type="date" value={formPeriodStart} onChange={(e) => setFormPeriodStart(e.target.value)} />
            </FormField>
            <FormField label={t('portal.invoices.fieldPeriodEnd')} required>
              <Input type="date" value={formPeriodEnd} onChange={(e) => setFormPeriodEnd(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('portal.invoices.fieldAmount')} required>
            <Input
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0.00"
            />
          </FormField>
          <FormField label={t('portal.invoices.fieldDescription')}>
            <Textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={t('portal.invoices.descriptionPlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formContractId || !formPeriodStart || !formPeriodEnd || !formAmount}
              loading={createMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalInvoicesPage;
