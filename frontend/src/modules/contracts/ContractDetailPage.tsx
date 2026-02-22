import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from '@/i18n';
import {
  Edit3,
  ChevronDown,
  Calendar,
  Wallet,
  CreditCard,
  FileText,
  Building2,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  contractStatusColorMap,
  contractStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { contractsApi } from '@/api/contracts';
import { formatMoney, formatMoneyCompact, formatDate, formatDateLong, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Contract, ContractStatus, ContractApproval } from '@/types';
import ContractBudgetItemsTab from './ContractBudgetItemsTab';

type DetailTab = 'overview' | 'approval' | 'documents' | 'FINANCE' | 'fmItems';

type ContractDocument = {
  id: string;
  docType: string;
  number: string;
  date: string;
  status: string;
};

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const statusMutation = useMutation({
    mutationFn: ({ contractId, status }: { contractId: string; status: ContractStatus }) =>
      contractsApi.changeContractStatus(contractId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'CONTRACT', id] });
      queryClient.invalidateQueries({ queryKey: ['CONTRACTS'] });
    },
  });

  const { data: contract } = useQuery({
    queryKey: [ 'CONTRACT', id],
    queryFn: () => contractsApi.getContract(id!),
    enabled: !!id,
  });

  const { data: approvals } = useQuery({
    queryKey: ['contract-approvals', id],
    queryFn: () => contractsApi.getContractApprovals(id!),
    enabled: !!id && activeTab === 'approval',
  });

  const c = contract;
  const invoicedPercent = (c?.totalWithVat ?? 0) > 0 ? ((c?.totalInvoiced ?? 0) / (c?.totalWithVat ?? 1)) * 100 : 0;
  const paidPercent = (c?.totalWithVat ?? 0) > 0 ? ((c?.totalPaid ?? 0) / (c?.totalWithVat ?? 1)) * 100 : 0;

  const statusActions = useMemo(() => {
    switch (c?.status) {
      case 'DRAFT': return [{ label: t('contracts.detail.actionToApproval'), targetStatus: 'ON_APPROVAL' as ContractStatus }];
      case 'ON_APPROVAL': return [
        { label: t('contracts.detail.actionApprove'), targetStatus: 'APPROVED' as ContractStatus },
        { label: t('contracts.detail.actionReject'), targetStatus: 'REJECTED' as ContractStatus },
      ];
      case 'APPROVED': return [{ label: t('contracts.detail.actionSign'), targetStatus: 'SIGNED' as ContractStatus }];
      case 'SIGNED': return [{ label: t('contracts.detail.actionActivate'), targetStatus: 'ACTIVE' as ContractStatus }];
      case 'ACTIVE': return [{ label: t('contracts.detail.actionClose'), targetStatus: 'CLOSED' as ContractStatus }];
      default: return [];
    }
  }, [c?.status]);

  const allStatuses: ContractStatus[] = [ 'DRAFT', 'ON_APPROVAL', 'APPROVED', 'SIGNED', 'ACTIVE', 'CLOSED', 'REJECTED', 'CANCELLED'];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={c?.name ?? ''}
        subtitle={`${c?.number ?? ''} / ${c?.typeName ?? t('contracts.detail.defaultType')}`}
        backTo="/contracts"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('contracts.title'), href: '/contracts' },
          { label: c?.number ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={c?.status ?? ''}
              colorMap={contractStatusColorMap}
              label={contractStatusLabels[c?.status ?? ''] ?? c?.status ?? ''}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant={action.targetStatus === 'REJECTED' ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => {
                  statusMutation.mutate({ contractId: id!, status: action.targetStatus });
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconRight={<ChevronDown size={14} />}
              onClick={() => setStatusModalOpen(true)}
            >
              {t('contracts.detail.changeStatus')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit3 size={14} />}
              onClick={() => navigate(`/contracts/${id}/edit`)}
            >
              {t('contracts.detail.edit')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'overview', label: t('contracts.detail.tabOverview') },
          { id: 'approval', label: t('contracts.detail.tabApproval') },
          { id: 'documents', label: t('contracts.detail.tabDocuments') },
          { id: 'FINANCE', label: t('contracts.detail.tabFinance') },
          { id: 'fmItems', label: t('contracts.detail.tabFmItems') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('contracts.detail.contractAmount')}
              value={formatMoneyCompact(c?.totalWithVat ?? 0)}
              subtitle={t('contracts.detail.withVat')}
            />
            <MetricCard
              icon={<Receipt size={18} />}
              label={t('contracts.detail.invoiced')}
              value={formatMoneyCompact(c?.totalInvoiced ?? 0)}
              trend={{ direction: 'up', value: formatPercent(invoicedPercent) }}
            />
            <MetricCard
              icon={<CreditCard size={18} />}
              label={t('contracts.detail.paid')}
              value={formatMoneyCompact(c?.totalPaid ?? 0)}
              trend={{ direction: 'up', value: formatPercent(paidPercent) }}
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('contracts.detail.balance')}
              value={formatMoneyCompact(c?.balance ?? 0)}
              trend={{
                direction: (c?.balance ?? 0) > 0 ? 'up' : 'down',
                value: formatPercent(100 - paidPercent),
              }}
            />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('contracts.detail.contractInfo')}</h3>

              {c?.notes && (
                <p className="text-sm text-neutral-600 leading-relaxed mb-6 pb-6 border-b border-neutral-100">
                  {c.notes}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                <InfoItem icon={<Building2 size={15} />} label={t('contracts.detail.infoPartner')} value={c?.partnerName ?? ''} />
                <InfoItem icon={<FileText size={15} />} label={t('contracts.detail.infoProject')} value={c?.projectName ?? '---'} />
                <InfoItem icon={<FileText size={15} />} label={t('contracts.detail.infoType')} value={c?.typeName ?? '---'} />
                <InfoItem icon={<User size={15} />} label={t('contracts.detail.infoResponsible')} value={c?.responsibleName ?? '---'} />
                <InfoItem icon={<Calendar size={15} />} label={t('contracts.detail.infoContractDate')} value={formatDateLong(c?.contractDate ?? '')} />
                <InfoItem icon={<Calendar size={15} />} label={t('contracts.detail.infoPlannedStart')} value={formatDateLong(c?.plannedStartDate ?? '')} />
                <InfoItem icon={<Calendar size={15} />} label={t('contracts.detail.infoPlannedEnd')} value={formatDateLong(c?.plannedEndDate ?? '')} />
                {c?.actualStartDate && (
                  <InfoItem icon={<Calendar size={15} />} label={t('contracts.detail.infoActualStart')} value={formatDateLong(c.actualStartDate)} />
                )}
                <InfoItem icon={<CreditCard size={15} />} label={t('contracts.detail.infoPaymentTerms')} value={c?.paymentTerms ?? '---'} />
                <InfoItem icon={<FileText size={15} />} label={t('contracts.detail.infoVersion')} value={`v${c?.version ?? ''}`} />
              </div>
            </div>

            {/* Financial summary card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('contracts.detail.financialSummary')}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('contracts.detail.amountExVat')}</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(c?.amount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('contracts.detail.vatLabel', { rate: String(c?.vatRate ?? 0) })}</p>
                  <p className="text-base font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(c?.vatAmount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('contracts.detail.totalWithVat')}</p>
                  <p className="text-lg font-semibold text-primary-700 tabular-nums">{formatMoney(c?.totalWithVat ?? 0)}</p>
                </div>
                {(c?.retentionPercent ?? 0) > 0 && (
                  <div className="pt-4 border-t border-neutral-100">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('contracts.detail.retentionGuarantee')}</p>
                    <p className="text-sm font-medium text-warning-600 tabular-nums">
                      {c?.retentionPercent}% ({formatMoney((c?.totalWithVat ?? 0) * (c?.retentionPercent ?? 0) / 100)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('contracts.detail.approvalStages')}</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-8 bottom-8 w-px bg-neutral-200" />

            <div className="space-y-6">
              {(approvals ?? []).map((approval, idx) => (
                <div key={approval.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    approval.status === 'APPROVED' ? 'bg-success-100' :
                    approval.status === 'REJECTED' ? 'bg-danger-100' :
                    'bg-warning-100',
                  )}>
                    {approval.status === 'APPROVED' ? (
                      <CheckCircle2 size={16} className="text-success-600" />
                    ) : approval.status === 'REJECTED' ? (
                      <XCircle size={16} className="text-danger-600" />
                    ) : (
                      <AlertCircle size={16} className="text-warning-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{approval.stage}</h4>
                      <StatusBadge
                        status={approval.status}
                        colorMap={{
                          pending: 'yellow',
                          approved: 'green',
                          rejected: 'red',
                        }}
                        label={
                          approval.status === 'APPROVED' ? t('contracts.detail.approvalApproved') :
                          approval.status === 'REJECTED' ? t('contracts.detail.approvalRejected') :
                          t('contracts.detail.approvalPending')
                        }
                      />
                    </div>
                    <p className="text-sm text-neutral-600">{approval.approverName}</p>
                    {approval.comment && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 italic">"{approval.comment}"</p>
                    )}
                    {approval.approvedAt && (
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDateLong(approval.approvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<FileText size={18} />} label={t('contracts.detail.documentsCount')} value={String(0)} />
            <MetricCard icon={<Receipt size={18} />} label="КС-2" value="1" />
            <MetricCard icon={<Receipt size={18} />} label="КС-3" value="1" />
            <MetricCard icon={<Clock size={18} />} label={t('contracts.detail.lastChange')} value={formatDate(c?.updatedAt ?? '')} />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('contracts.detail.documentPackage')}</h3>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate('/russian-docs/list')}>
                  {t('contracts.detail.russianForms')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/cde/documents')}>
                  CDE
                </Button>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('contracts.detail.colDocType')}</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('contracts.detail.colDocNumber')}</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('contracts.detail.colDocDate')}</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('contracts.detail.colDocStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {([] as any[]).map((doc) => (
                  <tr key={doc.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="px-5 py-3 text-sm text-neutral-700 dark:text-neutral-300">{doc.docType}</td>
                    <td className="px-5 py-3 text-sm font-mono text-neutral-600">{doc.number}</td>
                    <td className="px-5 py-3 text-sm tabular-nums text-neutral-600">{formatDate(doc.date)}</td>
                    <td className="px-5 py-3 text-sm text-neutral-700 dark:text-neutral-300">{doc.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'FINANCE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('contracts.detail.contractAmount')}
              value={formatMoneyCompact(c?.totalWithVat ?? 0)}
            />
            <MetricCard
              icon={<Receipt size={18} />}
              label={t('contracts.detail.finInvoiced')}
              value={formatMoneyCompact(c?.totalInvoiced ?? 0)}
              trend={{ direction: 'up', value: formatPercent(invoicedPercent) }}
            />
            <MetricCard
              icon={<CreditCard size={18} />}
              label={t('contracts.detail.paid')}
              value={formatMoneyCompact(c?.totalPaid ?? 0)}
              trend={{ direction: 'up', value: formatPercent(paidPercent) }}
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('contracts.detail.balance')}
              value={formatMoneyCompact(c?.balance ?? 0)}
            />
          </div>

          {/* Budget progress */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('contracts.detail.budgetExecution')}</h3>

            <div className="space-y-4">
              {/* Invoiced bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.detail.invoicedProgress')}</p>
                  <p className="text-xs font-medium text-neutral-600 tabular-nums">
                    {formatMoney(c?.totalInvoiced ?? 0)} / {formatMoney(c?.totalWithVat ?? 0)}
                  </p>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Math.min(invoicedPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Paid bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.detail.paidProgress')}</p>
                  <p className="text-xs font-medium text-neutral-600 tabular-nums">
                    {formatMoney(c?.totalPaid ?? 0)} / {formatMoney(c?.totalWithVat ?? 0)}
                  </p>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      paidPercent > 90 ? 'bg-success-500' : 'bg-success-400',
                    )}
                    style={{ width: `${Math.min(paidPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Retention info */}
              {(c?.retentionPercent ?? 0) > 0 && (
                <div className="pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.detail.retentionGuarantee')} ({c?.retentionPercent}%)</p>
                      <p className="text-sm font-medium text-warning-600 tabular-nums mt-0.5">
                        {formatMoney((c?.totalWithVat ?? 0) * (c?.retentionPercent ?? 0) / 100)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('contracts.detail.payableAmount')}</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums mt-0.5">
                        {formatMoney((c?.totalWithVat ?? 0) * (1 - (c?.retentionPercent ?? 0) / 100))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fmItems' && id && (
        <ContractBudgetItemsTab
          contractId={id}
          projectId={c?.projectId}
          contractDirection={c?.contractDirection === 'CLIENT' ? 'CLIENT' : 'CONTRACTOR'}
        />
      )}

      {/* Status change modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={t('contracts.detail.changeStatusTitle')}
        description={t('contracts.detail.changeStatusDesc', { status: contractStatusLabels[c?.status ?? ''] ?? c?.status ?? '' })}
        size="sm"
      >
        <div className="space-y-2">
          {allStatuses.map((status) => (
            <button
              key={status}
              disabled={status === c?.status}
              onClick={() => {
                statusMutation.mutate({ contractId: id!, status: status });
                setStatusModalOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                status === c?.status
                  ? 'bg-primary-50 border border-primary-200 cursor-default'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent',
              )}
            >
              <StatusBadge
                status={status}
                colorMap={contractStatusColorMap}
                label={contractStatusLabels[status] ?? status}
              />
              {status === c?.status && (
                <span className="ml-auto text-xs text-primary-600 font-medium">{t('contracts.detail.currentStatus')}</span>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default ContractDetailPage;
