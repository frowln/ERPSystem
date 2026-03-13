import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Edit3,
  User,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  Plus,
  CheckCircle,
  DollarSign,
  Briefcase,
  Calendar,
  Hash,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { selfEmployedApi } from './api';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type {
  SelfEmployedContractor,
  CompletionAct,
  CompletionActStatus,
  NpdStatus,
  ContractType,
  SelfEmployedPayment,
  PaymentStatus,
} from './types';

type DetailTab = 'info' | 'acts' | 'payments';

const npdStatusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  NOT_REGISTERED: 'red',
  UNKNOWN: 'yellow',
};

const getNpdStatusLabels = (): Record<NpdStatus, string> => ({
  ACTIVE: t('selfEmployed.detail.npdActive'),
  INACTIVE: t('selfEmployed.detail.npdInactive'),
  NOT_REGISTERED: t('selfEmployed.detail.npdNotRegistered'),
  UNKNOWN: t('selfEmployed.detail.npdUnknown'),
});

const getContractTypeLabels = (): Record<ContractType, string> => ({
  GPC: t('selfEmployed.detail.contractTypeGpc'),
  SERVICE: t('selfEmployed.detail.contractTypeService'),
  SUBCONTRACT: t('selfEmployed.detail.contractTypeSubcontract'),
});

const actStatusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  SIGNED: 'blue',
  PAID: 'green',
  CANCELLED: 'red',
};

const getActStatusLabels = (): Record<CompletionActStatus, string> => ({
  DRAFT: t('selfEmployed.detail.actStatusDraft'),
  SIGNED: t('selfEmployed.detail.actStatusSigned'),
  PAID: t('selfEmployed.detail.actStatusPaid'),
  CANCELLED: t('selfEmployed.detail.actStatusCancelled'),
});

const payStatusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  PAID: 'green',
  CANCELLED: 'red',
  RECEIPT_ISSUED: 'blue',
};

const getPayStatusLabels = (): Record<PaymentStatus, string> => ({
  DRAFT: t('selfEmployed.detail.payStatusDraft'),
  PENDING: t('selfEmployed.detail.payStatusPending'),
  PAID: t('selfEmployed.detail.payStatusPaid'),
  CANCELLED: t('selfEmployed.detail.payStatusCancelled'),
  RECEIPT_ISSUED: t('selfEmployed.detail.payStatusReceiptIssued'),
});

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <span className="text-neutral-400 mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 break-words">{value || '---'}</p>
    </div>
  </div>
);

const SelfEmployedDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  const { data: contractor } = useQuery({
    queryKey: ['self-employed-contractor', id],
    queryFn: () => selfEmployedApi.getContractor(id!),
    enabled: !!id,
  });

  const { data: actsData } = useQuery({
    queryKey: ['self-employed-acts', id],
    queryFn: () => selfEmployedApi.getActs({ workerId: id }),
    enabled: !!id && activeTab === 'acts',
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['self-employed-payments-worker', id],
    queryFn: () => selfEmployedApi.getPayments({ contractorId: id } as Record<string, unknown>),
    enabled: !!id && activeTab === 'payments',
  });

  const verifyNpdMutation = useMutation({
    mutationFn: () => selfEmployedApi.verifyNpd(contractor!.inn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractor', id] });
      toast.success(t('selfEmployed.detail.npdVerifySuccess'));
    },
    onError: () => toast.error(t('selfEmployed.detail.npdVerifyError')),
  });

  const signActMutation = useMutation({
    mutationFn: (actId: string) => selfEmployedApi.signAct(actId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-acts', id] });
      toast.success(t('selfEmployed.detail.actSignSuccess'));
    },
    onError: () => toast.error(t('selfEmployed.detail.actSignError')),
  });

  const payActMutation = useMutation({
    mutationFn: (actId: string) => selfEmployedApi.payAct(actId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-acts', id] });
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractor', id] });
      toast.success(t('selfEmployed.detail.actPaySuccess'));
    },
    onError: () => toast.error(t('selfEmployed.detail.actPayError')),
  });

  const acts = (actsData?.content && actsData.content.length > 0) ? actsData.content : [];
  const payments = (paymentsData?.content && paymentsData.content.length > 0) ? paymentsData.content : [];

  const c = contractor;

  const actColumns = useMemo<ColumnDef<CompletionAct, unknown>[]>(
    () => [
      {
        accessorKey: 'actNumber',
        header: t('selfEmployed.detail.colActNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('selfEmployed.detail.colProject'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('selfEmployed.detail.colDescription'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('selfEmployed.detail.colAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'period',
        header: t('selfEmployed.detail.colPeriod'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('selfEmployed.detail.colActStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={actStatusColorMap}
            label={getActStatusLabels()[getValue<CompletionActStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 160,
        cell: ({ row }) => {
          const act = row.original;
          return (
            <div className="flex items-center gap-1">
              {act.status === 'DRAFT' && (
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<CheckCircle size={14} />}
                  onClick={(e) => { e.stopPropagation(); signActMutation.mutate(act.id); }}
                  loading={signActMutation.isPending}
                >
                  {t('selfEmployed.detail.signBtn')}
                </Button>
              )}
              {act.status === 'SIGNED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<DollarSign size={14} />}
                  onClick={(e) => { e.stopPropagation(); payActMutation.mutate(act.id); }}
                  loading={payActMutation.isPending}
                >
                  {t('selfEmployed.detail.payBtn')}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [signActMutation, payActMutation],
  );

  const paymentColumns = useMemo<ColumnDef<SelfEmployedPayment, unknown>[]>(
    () => [
      {
        accessorKey: 'serviceDescription',
        header: t('selfEmployed.detail.colPayDescription'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('selfEmployed.detail.colPayAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'serviceDate',
        header: t('selfEmployed.detail.colPayDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('selfEmployed.detail.colPayStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={payStatusColorMap}
            label={getPayStatusLabels()[getValue<PaymentStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'receiptNumber',
        header: t('selfEmployed.detail.colPayReceipt'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>() ?? '---'}</span>
        ),
      },
    ],
    [],
  );

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'info', label: t('selfEmployed.detail.tabInfo') },
    { key: 'acts', label: t('selfEmployed.detail.tabActs') },
    { key: 'payments', label: t('selfEmployed.detail.tabPayments') },
  ];

  if (!c) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('selfEmployed.detail.loading')}
          backTo="/self-employed"
        />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={c.fullName}
        subtitle={`${t('selfEmployed.detail.inn')}: ${c.inn}`}
        backTo="/self-employed"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('selfEmployed.contractors.breadcrumbSelfEmployed'), href: '/self-employed' },
          { label: c.fullName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<ShieldCheck size={16} />}
              onClick={() => verifyNpdMutation.mutate()}
              loading={verifyNpdMutation.isPending}
            >
              {t('selfEmployed.detail.verifyNpd')}
            </Button>
            <Button
              iconLeft={<Edit3 size={16} />}
              onClick={() => navigate(`/self-employed/${id}/edit`)}
            >
              {t('common.edit')}
            </Button>
          </div>
        }
      />

      {/* Status badges row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <StatusBadge
          status={c.npdStatus ?? 'UNKNOWN'}
          colorMap={npdStatusColorMap}
          label={`${t('selfEmployed.detail.npdLabel')}: ${getNpdStatusLabels()[c.npdStatus ?? 'UNKNOWN']}`}
        />
        {c.contractType && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <FileText size={12} />
            {getContractTypeLabels()[c.contractType]}
            {c.contractNumber && ` ${c.contractNumber}`}
          </span>
        )}
        {c.npdVerifiedAt && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('selfEmployed.detail.lastVerified')}: {formatDate(c.npdVerifiedAt)}
          </span>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('selfEmployed.detail.kpiTotalPaid')}</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
            {formatMoney(c.totalPaid ?? 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('selfEmployed.detail.kpiActsPending')}</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
            {c.totalActsPending ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('selfEmployed.detail.kpiHourlyRate')}</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
            {c.hourlyRate != null ? formatMoney(c.hourlyRate) : '---'}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('selfEmployed.detail.kpiCreated')}</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
            {formatDate(c.createdAt)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('selfEmployed.detail.sectionPersonal')}
            </h3>
            <div className="space-y-1">
              <InfoRow icon={<User size={16} />} label={t('selfEmployed.detail.labelFullName')} value={c.fullName} />
              <InfoRow icon={<Hash size={16} />} label={t('selfEmployed.detail.labelInn')} value={c.inn} />
              <InfoRow icon={<Phone size={16} />} label={t('selfEmployed.detail.labelPhone')} value={c.phone} />
              <InfoRow icon={<Mail size={16} />} label={t('selfEmployed.detail.labelEmail')} value={c.email} />
              <InfoRow icon={<Briefcase size={16} />} label={t('selfEmployed.detail.labelSpecialization')} value={c.specialization} />
            </div>
          </div>

          {/* Contract Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('selfEmployed.detail.sectionContract')}
            </h3>
            <div className="space-y-1">
              <InfoRow
                icon={<FileText size={16} />}
                label={t('selfEmployed.detail.labelContractType')}
                value={c.contractType ? getContractTypeLabels()[c.contractType] : undefined}
              />
              <InfoRow icon={<Hash size={16} />} label={t('selfEmployed.detail.labelContractNumber')} value={c.contractNumber} />
              <InfoRow icon={<Calendar size={16} />} label={t('selfEmployed.detail.labelContractStart')} value={c.contractStartDate ? formatDate(c.contractStartDate) : undefined} />
              <InfoRow icon={<Calendar size={16} />} label={t('selfEmployed.detail.labelContractEnd')} value={c.contractEndDate ? formatDate(c.contractEndDate) : undefined} />
            </div>
          </div>

          {/* Bank Details */}
          {(c.bankAccount || c.bankName || c.bankBik) && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('selfEmployed.detail.sectionBank')}
              </h3>
              <div className="space-y-1">
                <InfoRow icon={<Hash size={16} />} label={t('selfEmployed.detail.labelBankAccount')} value={c.bankAccount} />
                <InfoRow icon={<Hash size={16} />} label={t('selfEmployed.detail.labelBik')} value={c.bankBik} />
                <InfoRow icon={<Briefcase size={16} />} label={t('selfEmployed.detail.labelBankName')} value={c.bankName} />
              </div>
            </div>
          )}

          {/* Notes */}
          {c.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('selfEmployed.detail.sectionNotes')}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'acts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('selfEmployed.detail.actsTitle')}
            </h3>
            <Button
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => navigate(`/self-employed/acts/new?workerId=${id}`)}
            >
              {t('selfEmployed.detail.newAct')}
            </Button>
          </div>
          <DataTable<CompletionAct>
            data={acts}
            columns={actColumns}
            enableColumnVisibility
            enableExport
            pageSize={15}
            emptyTitle={t('selfEmployed.detail.actsEmptyTitle')}
            emptyDescription={t('selfEmployed.detail.actsEmptyDescription')}
          />
        </div>
      )}

      {activeTab === 'payments' && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('selfEmployed.detail.paymentsTitle')}
          </h3>
          <DataTable<SelfEmployedPayment>
            data={payments}
            columns={paymentColumns}
            enableColumnVisibility
            enableExport
            pageSize={15}
            emptyTitle={t('selfEmployed.detail.paymentsEmptyTitle')}
            emptyDescription={t('selfEmployed.detail.paymentsEmptyDescription')}
          />
        </div>
      )}
    </div>
  );
};

export default SelfEmployedDetailPage;
