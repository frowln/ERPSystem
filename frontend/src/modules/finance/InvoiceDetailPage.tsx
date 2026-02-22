import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  User,
  FileText,
  Building2,
  Clock,
  Link2,
  Receipt,
  Edit,
  Trash2,
  GitCompareArrows,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import {
  StatusBadge,
  invoiceStatusColorMap,
  invoiceStatusLabels,
  invoiceTypeColorMap,
  invoiceTypeLabels,
} from '@/design-system/components/StatusBadge';
import { financeApi } from '@/api/finance';
import { formatMoney, formatDateLong, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { guardDemoModeAction } from '@/lib/demoMode';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

const InvoiceMatchingPanel = lazy(() => import('./InvoiceMatchingPanel'));

type InvoiceTab = 'details' | 'matching';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface LinkedPayment {
  id: string;
  number: string;
  amount: number;
  date: string;
  status: string;
}

interface Invoice {
  id: string;
  number: string;
  type: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paidAmount: number;
  contractId: string;
  contractName: string;
  projectName: string;
  counterparty: string;
  description: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lineItems: InvoiceLineItem[];
  linkedPayments: LinkedPayment[];
}

const statusActions: Record<string, { label: string; target: string }[]> = {
  NEW: [{ label: 'Отправить на рассмотрение', target: 'UNDER_REVIEW' }],
  UNDER_REVIEW: [{ label: 'Привязать к позиции', target: 'LINKED_TO_POSITION' }],
  LINKED_TO_POSITION: [{ label: 'На согласование', target: 'ON_APPROVAL' }],
  ON_APPROVAL: [
    { label: 'Согласовать', target: 'APPROVED' },
    { label: 'Отклонить', target: 'REJECTED' },
  ],
  APPROVED: [{ label: 'Закрыть', target: 'CLOSED' }],
  DRAFT: [{ label: t('finance.invoiceDetail.actionSend'), target: 'UNDER_REVIEW' }],
  SENT: [{ label: 'Согласовать', target: 'APPROVED' }],
  PARTIALLY_PAID: [{ label: t('finance.invoiceDetail.actionFullyPaid'), target: 'PAID' }],
};

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoice } = useQuery<Invoice>({
    queryKey: ['INVOICE', id],
    queryFn: async () => {
      const data = await financeApi.getInvoice(id!);
      return data as unknown as Invoice;
    },
    enabled: !!id,
  });

  const inv = invoice;
  const [activeTab, setActiveTab] = useState<InvoiceTab>('details');
  const [statusOverride, setStatusOverride] = useState<Invoice['status'] | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const effectiveStatus = statusOverride ?? inv?.status ?? '';
  const actions = useMemo(() => statusActions[effectiveStatus] ?? [], [effectiveStatus]);
  const remainingAmount = (inv?.total ?? 0) - (inv?.paidAmount ?? 0);
  const lineItems: InvoiceLineItem[] = inv?.lineItems ?? [];
  const linkedPayments: LinkedPayment[] = inv?.linkedPayments ?? [];

  const statusMutation = useMutation({
    mutationFn: (targetStatus: string) => financeApi.changeInvoiceStatus(id!, targetStatus),
    onSuccess: (updated) => {
      setStatusOverride(null);
      queryClient.invalidateQueries({ queryKey: ['INVOICE', id] });
      queryClient.invalidateQueries({ queryKey: ['INVOICES'] });
      toast.success(
        t('finance.invoiceDetail.toastStatusUpdated', {
          status: invoiceStatusLabels[updated.status] ?? updated.status,
        }),
      );
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  if (!inv) return null;

  const handleStatusChange = (targetStatus: string) => {
    if (guardDemoModeAction(t('finance.invoiceDetail.demoChangeStatus'))) return;
    statusMutation.mutate(targetStatus);
  };

  const handleDelete = () => {
    if (guardDemoModeAction(t('finance.invoiceDetail.demoDeleteInvoice'))) {
      setDeleteDialogOpen(false);
      return;
    }
    setDeleteDialogOpen(false);
    toast.success(t('finance.invoiceDetail.toastDeleted'));
    navigate('/invoices');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={inv.number}
        subtitle={`${inv.projectName} / ${inv.counterparty}`}
        backTo="/invoices"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.invoiceList.title'), href: '/invoices' },
          { label: inv.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={invoiceStatusColorMap} label={invoiceStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            <StatusBadge status={inv.type} colorMap={invoiceTypeColorMap} label={invoiceTypeLabels[inv.type] ?? inv.type} size="md" />
            {actions.map((a) => (
              <Button key={a.target} variant="secondary" size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                if (guardDemoModeAction(t('finance.invoiceDetail.demoEditInvoice'))) return;
                toast(t('finance.invoiceDetail.toastEditHint'));
                navigate('/invoices/new');
              }}
            >
              {t('finance.invoiceDetail.edit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => setDeleteDialogOpen(true)}>
              {t('finance.invoiceDetail.delete')}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700">
        {([
          { key: 'details' as InvoiceTab, label: t('finance.invoiceDetail.tabDetails'), icon: <Receipt size={14} /> },
          { key: 'matching' as InvoiceTab, label: t('invoiceMatching.tab'), icon: <GitCompareArrows size={14} /> },
        ]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'matching' && id && (
        <Suspense fallback={<div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto mt-8" />}>
          <InvoiceMatchingPanel invoiceId={id} />
        </Suspense>
      )}

      {activeTab === 'details' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Receipt size={16} className="text-primary-500" />
              {t('finance.invoiceDetail.amounts')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.invoiceDetail.subtotal')}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(inv.subtotal)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.invoiceDetail.vatLabel', { rate: String(inv.vatRate) })}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(inv.vatAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.invoiceDetail.totalWithVat')}</p>
                <p className="text-lg font-bold text-primary-600">{formatMoney(inv.total)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.invoiceDetail.remainingToPay')}</p>
                <p className="text-lg font-bold text-danger-600">{formatMoney(remainingAmount)}</p>
              </div>
            </div>
            {inv.description && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.invoiceDetail.description')}</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{inv.description}</p>
              </div>
            )}
          </div>

          {/* Line items table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.invoiceDetail.lineItems', { count: String(lineItems.length) })}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.invoiceDetail.colDescription')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.invoiceDetail.colQuantity')}</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.invoiceDetail.colUnit')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.invoiceDetail.colPrice')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.invoiceDetail.colTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100">
                      <td className="py-3 pr-4 text-neutral-800 dark:text-neutral-200">{item.description}</td>
                      <td className="py-3 px-4 text-right text-neutral-700 dark:text-neutral-300">{item.quantity}</td>
                      <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">{item.unit}</td>
                      <td className="py-3 px-4 text-right text-neutral-700 dark:text-neutral-300">{formatMoney(item.unitPrice)}</td>
                      <td className="py-3 pl-4 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatMoney(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Linked payments */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('finance.invoiceDetail.linkedPayments', { count: String(linkedPayments.length) })}
            </h3>
            <div className="space-y-2">
              {linkedPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/payments/${pay.id}`)}>
                  <div>
                    <p className="text-sm font-medium text-primary-600">{pay.number}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(pay.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(pay.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.invoiceDetail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('finance.invoiceDetail.issueDate')} value={formatDateLong(inv.issueDate)} />
              <InfoItem icon={<Clock size={15} />} label={t('finance.invoiceDetail.dueDate')} value={formatDateLong(inv.dueDate)} />
              <InfoItem icon={<Building2 size={15} />} label={t('finance.invoiceDetail.partner')} value={inv.counterparty} />
              <InfoItem icon={<User size={15} />} label={t('finance.invoiceDetail.createdBy')} value={inv.createdByName} />
              <InfoItem icon={<FileText size={15} />} label={t('finance.invoiceDetail.project')} value={inv.projectName} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('finance.invoiceDetail.linkedContract')}
            </h3>
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/contracts/${inv.contractId}`)}>
              <FileText size={15} className="text-neutral-400" />
              <span className="text-sm text-primary-600 hover:text-primary-700">{inv.contractName}</span>
            </div>
          </div>
        </div>
      </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('finance.invoiceDetail.deleteTitle')}
        description={t('finance.invoiceDetail.deleteDescription')}
        confirmLabel={t('finance.invoiceDetail.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        items={[inv.number]}
      />
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default InvoiceDetailPage;
