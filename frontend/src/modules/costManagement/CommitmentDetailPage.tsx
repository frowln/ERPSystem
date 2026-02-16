import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  Link2,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  commitmentStatusColorMap,
  commitmentStatusLabels,
  commitmentTypeColorMap,
  commitmentTypeLabels,
} from '@/design-system/components/StatusBadge';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney, formatPercent, formatDateLong, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface CommitmentLineItem {
  id: string;
  description: string;
  costCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface ChangeOrder {
  id: string;
  number: string;
  description: string;
  amount: number;
  status: string;
  date: string;
}

interface Commitment {
  id: string;
  number: string;
  type: string;
  status: string;
  vendorName: string;
  contractId: string;
  contractName: string;
  projectName: string;
  originalAmount: number;
  approvedChanges: number;
  revisedAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  progressPercent: number;
  startDate: string;
  endDate: string;
  description: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

const getStatusActions = (): Record<string, { label: string; target: string }[]> => ({
  draft: [{ label: t('costManagement.commitmentDetail.actionSubmitForApproval'), target: 'PENDING' }],
  pending: [
    { label: t('costManagement.commitmentDetail.actionApprove'), target: 'APPROVED' },
    { label: t('costManagement.commitmentDetail.actionReject'), target: 'DRAFT' },
  ],
  approved: [{ label: t('costManagement.commitmentDetail.actionConfirm'), target: 'COMMITTED' }],
  committed: [{ label: t('costManagement.commitmentDetail.actionClose'), target: 'CLOSED' }],
});

const CommitmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();

  const { data: commitment } = useQuery({
    queryKey: ['commitment', id],
    queryFn: () => costManagementApi.getCommitment(id!),
    enabled: !!id,
  });

  if (!commitment) return null;

  const cmt: Commitment = {
    id: commitment.id,
    number: commitment.number,
    type: commitment.type ?? '',
    status: commitment.status,
    vendorName: commitment.vendorName ?? '',
    contractId: (commitment as any).contractId ?? '',
    contractName: (commitment as any).contractName ?? '',
    projectName: commitment.projectName ?? '',
    originalAmount: commitment.originalAmount ?? 0,
    approvedChanges: (commitment as any).approvedChanges ?? 0,
    revisedAmount: commitment.revisedAmount ?? 0,
    invoicedAmount: commitment.invoicedAmount ?? 0,
    paidAmount: commitment.paidAmount ?? 0,
    progressPercent: (commitment as any).progressPercent ?? 0,
    startDate: commitment.startDate ?? '',
    endDate: commitment.endDate ?? '',
    description: (commitment as any).description ?? '',
    createdByName: (commitment as any).createdByName ?? '',
    createdAt: commitment.createdAt ?? '',
    updatedAt: commitment.updatedAt ?? '',
  };
  const lineItems: CommitmentLineItem[] = (commitment as any)?.lineItems ?? [];
  const changeOrders: ChangeOrder[] = (commitment as any)?.changeOrders ?? [];
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? cmt.status;
  const actions = useMemo(() => getStatusActions()[effectiveStatus] ?? [], [effectiveStatus]);

  const handleStatusChange = (targetStatus: string) => {
    setStatusOverride(targetStatus);
    toast.success(`${t('costManagement.commitmentDetail.statusChanged')}: ${commitmentStatusLabels[targetStatus] ?? targetStatus}`);
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('costManagement.commitmentDetail.deleteTitle'),
      description: t('costManagement.commitmentDetail.deleteDescription'),
      confirmLabel: t('costManagement.commitmentDetail.deleteConfirm'),
      cancelLabel: t('costManagement.commitmentDetail.deleteCancel'),
      items: [cmt.number],
    });
    if (!isConfirmed) {
      return;
    }
    toast.success(t('costManagement.commitmentDetail.deleteSuccess'));
    navigate('/cost-management/commitments');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={cmt.number}
        subtitle={`${cmt.projectName} / ${cmt.vendorName}`}
        backTo="/cost-management/commitments"
        breadcrumbs={[
          { label: t('costManagement.commitmentDetail.breadcrumbHome'), href: '/' },
          { label: t('costManagement.commitmentDetail.breadcrumbCommitments'), href: '/cost-management/commitments' },
          { label: cmt.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={commitmentStatusColorMap} label={commitmentStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            <StatusBadge status={cmt.type} colorMap={commitmentTypeColorMap} label={commitmentTypeLabels[cmt.type] ?? cmt.type} size="md" />
            {actions.map((a) => (
              <Button key={a.target} variant="secondary" size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('costManagement.commitmentDetail.editAvailableInList'));
                navigate('/cost-management/commitments');
              }}
            >
              {t('costManagement.commitmentDetail.edit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={handleDelete}>{t('costManagement.commitmentDetail.delete')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Amounts summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-primary-500" />
              {t('costManagement.commitmentDetail.amounts')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.commitmentDetail.originalAmount')}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(cmt.originalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.commitmentDetail.approvedChanges')}</p>
                <p className="text-lg font-bold text-warning-600">+{formatMoney(cmt.approvedChanges)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.commitmentDetail.revisedAmount')}</p>
                <p className="text-lg font-bold text-primary-600">{formatMoney(cmt.revisedAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.commitmentDetail.invoiced')}</p>
                <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{formatMoney(cmt.invoicedAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.commitmentDetail.paid')}</p>
                <p className="text-lg font-bold text-success-600">{formatMoney(cmt.paidAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.commitmentDetail.remaining')}</p>
                <p className="text-lg font-bold text-danger-600">{formatMoney(cmt.revisedAmount - cmt.paidAmount)}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1"><TrendingUp size={12} /> {t('costManagement.commitmentDetail.executionProgress')}</span>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{formatPercent(cmt.progressPercent)}</span>
              </div>
              <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${cmt.progressPercent}%` }} />
              </div>
            </div>

            {cmt.description && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.commitmentDetail.description')}</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{cmt.description}</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.commitmentDetail.lineItems')} ({lineItems.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('costManagement.commitmentDetail.columnDescription')}</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('costManagement.commitmentDetail.columnCostCode')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('costManagement.commitmentDetail.columnQuantity')}</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('costManagement.commitmentDetail.columnUnit')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('costManagement.commitmentDetail.columnPrice')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('costManagement.commitmentDetail.columnTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100">
                      <td className="py-3 pr-4 text-neutral-800 dark:text-neutral-200">{item.description}</td>
                      <td className="py-3 px-4 text-primary-600 cursor-pointer hover:underline">{item.costCode}</td>
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

          {/* Change orders */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('costManagement.commitmentDetail.changeOrders')} ({changeOrders.length})
            </h3>
            <div className="space-y-2">
              {changeOrders.map((co) => (
                <div key={co.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/change-management/orders/${co.id}`)}>
                  <div>
                    <p className="text-sm font-medium text-primary-600">{co.number}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{co.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-warning-600">+{formatMoney(co.amount)}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(co.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.commitmentDetail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Building2 size={15} />} label={t('costManagement.commitmentDetail.vendor')} value={cmt.vendorName} />
              <InfoItem icon={<Calendar size={15} />} label={t('costManagement.commitmentDetail.startDate')} value={formatDateLong(cmt.startDate)} />
              <InfoItem icon={<Calendar size={15} />} label={t('costManagement.commitmentDetail.endDate')} value={formatDateLong(cmt.endDate)} />
              <InfoItem icon={<User size={15} />} label={t('costManagement.commitmentDetail.createdBy')} value={cmt.createdByName} />
              <InfoItem icon={<Clock size={15} />} label={t('costManagement.commitmentDetail.createdAt')} value={formatDateLong(cmt.createdAt)} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('costManagement.commitmentDetail.linkedContract')}
            </h3>
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/contracts/${cmt.contractId}`)}>
              <FileText size={15} className="text-neutral-400" />
              <span className="text-sm text-primary-600">{cmt.contractName}</span>
            </div>
          </div>
        </div>
      </div>
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

export default CommitmentDetailPage;
