import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CreditCard,
  User,
  FileText,
  Building2,
  Clock,
  Link2,
  Banknote,
  Edit,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { EmptyState } from '@/design-system/components/EmptyState';
import {
  StatusBadge,
  paymentStatusLowerColorMap,
  paymentStatusLowerLabels,
  paymentTypeColorMap,
  paymentTypeLabels,
} from '@/design-system/components/StatusBadge';
import { financeApi } from '@/api/finance';
import { formatMoney, formatDateLong, formatDateTime } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

interface Payment {
  id: string;
  number: string;
  amount: number;
  date: string;
  status: string;
  type: string;
  method: string;
  contractId: string;
  contractName: string;
  invoiceId: string;
  invoiceNumber: string;
  projectName: string;
  counterparty: string;
  description: string;
  createdById: string;
  createdByName: string;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  userName: string;
  date: string;
}

const statusActions: Record<string, { label: string; target: string }[]> = {
  draft: [{ label: t('finance.paymentDetail.actionSendForApproval'), target: 'PENDING' }],
  pending: [
    { label: t('finance.paymentDetail.actionApprove'), target: 'APPROVED' },
    { label: t('finance.paymentDetail.actionReject'), target: 'DRAFT' },
  ],
  approved: [{ label: t('finance.paymentDetail.actionMarkPaid'), target: 'PAID' }],
};

const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: payment,
    isLoading: isPaymentLoading,
    isError: isPaymentError,
    refetch: refetchPayment,
  } = useQuery<Payment>({
    queryKey: ['PAYMENT', id],
    queryFn: async () => {
      const data = await financeApi.getPayment(id!);
      return data as unknown as Payment;
    },
    enabled: !!id,
  });

  const p = payment;
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const effectiveStatus = statusOverride ?? p?.status ?? '';
  const actions = useMemo(() => statusActions[effectiveStatus] ?? [], [effectiveStatus]);
  const auditTrail: AuditEntry[] = (p as any)?.auditTrail ?? [];

  if (!id) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          variant="ERROR"
          title={t('errors.badRequest')}
          description={t('errors.invalidIdFormat')}
        />
      </div>
    );
  }

  if (isPaymentLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-16 text-neutral-500 dark:text-neutral-400">
        {t('common.loading')}
      </div>
    );
  }

  if (isPaymentError || !p) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('finance.paymentList.title')}
          backTo="/payments"
          breadcrumbs={[
            { label: t('common.home'), href: '/' },
            { label: t('finance.paymentList.title'), href: '/payments' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('errors.noConnection')}
          description={t('errors.serverErrorRetry')}
          actionLabel={t('common.retry')}
          onAction={() => void refetchPayment()}
        />
      </div>
    );
  }

  const handleStatusChange = (targetStatus: string) => {
    if (guardDemoModeAction(t('finance.paymentDetail.demoChangeStatus'))) return;
    setStatusOverride(targetStatus);
    toast.success(t('finance.paymentDetail.toastStatusUpdated', { status: paymentStatusLowerLabels[targetStatus] ?? targetStatus }));
  };

  const handleDelete = () => {
    if (guardDemoModeAction(t('finance.paymentDetail.demoDeletePayment'))) {
      setDeleteDialogOpen(false);
      return;
    }
    setDeleteDialogOpen(false);
    toast.success(t('finance.paymentDetail.toastDeleted'));
    navigate('/payments');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={p.number}
        subtitle={`${p.projectName} / ${p.counterparty}`}
        backTo="/payments"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.paymentList.title'), href: '/payments' },
          { label: p.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={paymentStatusLowerColorMap} label={paymentStatusLowerLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            <StatusBadge status={p.type} colorMap={paymentTypeColorMap} label={paymentTypeLabels[p.type] ?? p.type} size="md" />
            {actions.map((a) => (
              <Button key={a.target} variant="secondary" size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                if (guardDemoModeAction(t('finance.paymentDetail.demoEditPayment'))) return;
                toast(t('finance.paymentDetail.toastEditHint'));
                navigate('/payments/new');
              }}
            >
              {t('finance.paymentDetail.edit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => setDeleteDialogOpen(true)}>
              {t('finance.paymentDetail.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Banknote size={16} className="text-primary-500" />
              {t('finance.paymentDetail.paymentInfo')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.paymentDetail.amount')}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(p.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.paymentDetail.paymentMethod')}</p>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{p.method}</p>
              </div>
            </div>
            {p.description && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.paymentDetail.paymentPurpose')}</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{p.description}</p>
              </div>
            )}
          </div>

          {/* Audit trail */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.paymentDetail.auditTrail')}</h3>
            <div className="space-y-3">
              {auditTrail.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-semibold text-primary-700">
                    {entry.userName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.action}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{entry.userName}</p>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatDateTime(entry.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.paymentDetail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('finance.paymentDetail.paymentDate')} value={formatDateLong(p.date)} />
              <InfoItem icon={<User size={15} />} label={t('finance.paymentDetail.createdBy')} value={p.createdByName} />
              <InfoItem icon={<User size={15} />} label={t('finance.paymentDetail.approvedBy')} value={p.approvedByName ?? '---'} />
              <InfoItem icon={<Building2 size={15} />} label={t('finance.paymentDetail.partner')} value={p.counterparty} />
              <InfoItem icon={<Clock size={15} />} label={t('finance.paymentDetail.createdAt')} value={formatDateLong(p.createdAt)} />
            </div>
          </div>

          {/* Linked entities */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('finance.paymentDetail.linkedDocuments')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/contracts/${p.contractId}`)}>
                <FileText size={15} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentDetail.linkedContract')}</p>
                  <p className="text-sm text-primary-600 hover:text-primary-700">{p.contractName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/invoices/${p.invoiceId}`)}>
                <CreditCard size={15} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentDetail.linkedInvoice')}</p>
                  <p className="text-sm text-primary-600 hover:text-primary-700">{p.invoiceNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('finance.paymentDetail.deleteTitle')}
        description={t('finance.paymentDetail.deleteDescription')}
        confirmLabel={t('finance.paymentDetail.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        items={[p.number]}
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

export default PaymentDetailPage;
