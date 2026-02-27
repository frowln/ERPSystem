import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar, User, CheckCircle2, Wallet, ArrowUpRight, TrendingUp, FileDown, Copy, Building2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { EmptyState } from '@/design-system/components/EmptyState';
import { financeApi } from '@/api/finance';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { CommercialProposal, CommercialProposalItem, ProposalStatus } from '@/types';
import CpMaterialsTab from './components/CpMaterialsTab';
import CpWorksTab from './components/CpWorksTab';
import CpStatusPipeline from './components/CpStatusPipeline';

const CpPushToFmDialog = lazy(() => import('./components/CpPushToFmDialog'));

const proposalStatusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  IN_REVIEW: 'yellow',
  APPROVED: 'green',
  ACTIVE: 'blue',
};

const proposalStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: t('commercialProposal.statusDraft'),
    IN_REVIEW: t('commercialProposal.statusInReview'),
    APPROVED: t('commercialProposal.statusApproved'),
    ACTIVE: t('commercialProposal.statusActive'),
  };
  return labels[status] ?? status;
};

const statusTransitions: Record<string, { label: string; target: ProposalStatus }[]> = {
  DRAFT: [{ label: t('commercialProposal.actionSubmitReview'), target: 'IN_REVIEW' }],
  IN_REVIEW: [
    { label: t('commercialProposal.actionApprove'), target: 'APPROVED' },
    { label: t('commercialProposal.actionReturnDraft'), target: 'DRAFT' },
  ],
  APPROVED: [{ label: t('commercialProposal.actionActivate'), target: 'ACTIVE' }],
};

type TabId = 'materials' | 'works';

const CommercialProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('materials');
  const [pushToFmOpen, setPushToFmOpen] = useState(false);
  const [companyDetailsOpen, setCompanyDetailsOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    companyInn: '',
    companyKpp: '',
    companyAddress: '',
    signatoryName: '',
    signatoryPosition: '',
  });

  const {
    data: proposal,
    isLoading: isProposalLoading,
    isError: isProposalError,
    refetch: refetchProposal,
  } = useQuery({
    queryKey: ['COMMERCIAL_PROPOSAL', id],
    queryFn: () => financeApi.getCommercialProposal(id!),
    enabled: !!id,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', id],
    queryFn: () => financeApi.getProposalItems(id!),
    enabled: !!id,
  });

  const materialItems = useMemo(
    () => allItems.filter((item) => item.itemType === 'MATERIAL'),
    [allItems],
  );

  const workItems = useMemo(
    () => allItems.filter((item) => item.itemType === 'WORK'),
    [allItems],
  );

  const checklist = useMemo(() => {
    const needsInvoice = materialItems.filter((item) => !item.selectedInvoiceLineId).length;
    const needsEstimate = workItems.filter((item) => !item.estimateItemId && !(item.costPrice > 0)).length;
    const unapproved = allItems.filter((item) =>
      item.status !== 'IN_FINANCIAL_MODEL'
      && item.status !== 'APPROVED'
      && item.status !== 'CONFIRMED'
      && item.status !== 'APPROVED_PROJECT',
    ).length;
    return { needsInvoice, needsEstimate, unapproved };
  }, [materialItems, workItems, allItems]);

  const confirmedItems = useMemo(
    () => allItems.filter((item) =>
      item.status === 'IN_FINANCIAL_MODEL'
      || item.status === 'APPROVED'
      || item.status === 'CONFIRMED'
      || item.status === 'APPROVED_PROJECT',
    ),
    [allItems],
  );
  const firstCompetitiveListId = useMemo(
    () => allItems.find((item) => item.competitiveListId)?.competitiveListId,
    [allItems],
  );

  const statusMutation = useMutation({
    mutationFn: (targetStatus: string) => financeApi.changeProposalStatus(id!, targetStatus),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL', id] });
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSALS'] });
      toast.success(
        t('commercialProposal.toastStatusChanged', {
          status: proposalStatusLabel(updated.status),
        }),
      );
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  const confirmAllMutation = useMutation({
    mutationFn: () => financeApi.confirmAllCpItems(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL_ITEMS', id] });
      toast.success(t('commercialProposal.toastAllConfirmed'));
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  const handleExportPdf = async () => {
    try {
      const blob = await financeApi.exportCpPdf(id!);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cp_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('errors.unexpectedError'));
    }
  };

  const createVersionMutation = useMutation({
    mutationFn: () => financeApi.createCpVersion(id!),
    onSuccess: (newCp) => {
      toast.success(t('commercialProposal.version.created'));
      navigate(`/commercial-proposals/${newCp.id}`);
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (details: typeof companyForm) => financeApi.updateCpCompanyDetails(id!, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL', id] });
      toast.success(t('commercialProposal.companyDetails.saved'));
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

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

  if (isProposalLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-16 text-neutral-500 dark:text-neutral-400">
        {t('common.loading')}
      </div>
    );
  }

  if (isProposalError || !proposal) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('commercialProposal.listTitle')}
          backTo="/commercial-proposals"
          breadcrumbs={[
            { label: t('common.home'), href: '/' },
            { label: t('commercialProposal.listTitle'), href: '/commercial-proposals' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('errors.noConnection')}
          description={t('errors.serverErrorRetry')}
          actionLabel={t('common.retry')}
          onAction={() => void refetchProposal()}
        />
      </div>
    );
  }

  const actions = statusTransitions[proposal.status] ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={proposal.name}
        backTo="/commercial-proposals"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('commercialProposal.listTitle'), href: '/commercial-proposals' },
          { label: proposal.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {proposal.docVersion != null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                v{proposal.docVersion}
              </span>
            )}
            <StatusBadge
              status={proposal.status}
              colorMap={proposalStatusColorMap}
              label={proposalStatusLabel(proposal.status)}
              size="md"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<FileDown size={14} />}
              onClick={handleExportPdf}
            >
              {t('commercialProposal.export.pdf')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Copy size={14} />}
              onClick={() => createVersionMutation.mutate()}
              disabled={createVersionMutation.isPending}
            >
              {t('commercialProposal.version.create')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Building2 size={14} />}
              onClick={() => {
                setCompanyForm({
                  companyName: proposal.companyName ?? '',
                  companyInn: proposal.companyInn ?? '',
                  companyKpp: proposal.companyKpp ?? '',
                  companyAddress: proposal.companyAddress ?? '',
                  signatoryName: proposal.signatoryName ?? '',
                  signatoryPosition: proposal.signatoryPosition ?? '',
                });
                setCompanyDetailsOpen((v) => !v);
              }}
            >
              {t('commercialProposal.companyDetails.btn')}
            </Button>
            {actions.map((a) => (
              <Button
                key={a.target}
                variant="secondary"
                size="sm"
                onClick={() => statusMutation.mutate(a.target)}
                disabled={statusMutation.isPending}
              >
                {a.label}
              </Button>
            ))}
            {proposal.status === 'IN_REVIEW' && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<CheckCircle2 size={14} />}
                onClick={() => confirmAllMutation.mutate()}
                disabled={confirmAllMutation.isPending}
              >
                {t('commercialProposal.confirmAll')}
              </Button>
            )}
            {(proposal.status === 'APPROVED' || proposal.status === 'ACTIVE') && confirmedItems.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<ArrowUpRight size={14} />}
                onClick={() => setPushToFmOpen(true)}
              >
                {t('commercialProposal.pushToFm.button')}
              </Button>
            )}
          </div>
        }
        tabs={[
          { id: 'materials', label: t('commercialProposal.tabMaterials'), count: materialItems.length },
          { id: 'works', label: t('commercialProposal.tabWorks'), count: workItems.length },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
      />

      {/* Status pipeline */}
      <div className="mb-6 overflow-x-auto">
        <CpStatusPipeline status={proposal.status} />
      </div>

      {/* Company details inline form */}
      {companyDetailsOpen && (
        <div className="mb-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {t('commercialProposal.companyDetails.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              ['companyName', t('commercialProposal.companyDetails.companyName')] as const,
              ['companyInn', t('commercialProposal.companyDetails.companyInn')] as const,
              ['companyKpp', t('commercialProposal.companyDetails.companyKpp')] as const,
              ['companyAddress', t('commercialProposal.companyDetails.companyAddress')] as const,
              ['signatoryName', t('commercialProposal.companyDetails.signatoryName')] as const,
              ['signatoryPosition', t('commercialProposal.companyDetails.signatoryPosition')] as const,
            ]).map(([field, label]) => (
              <div key={field}>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
                <input
                  type="text"
                  value={companyForm[field]}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => updateCompanyMutation.mutate(companyForm)}
              disabled={updateCompanyMutation.isPending}
            >
              {updateCompanyMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {checklist.needsInvoice === 0 && checklist.needsEstimate === 0 && checklist.unapproved === 0 ? (
        <div className="mb-6 rounded-xl border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-success-100 dark:bg-success-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-success-700 dark:text-success-400">
              {t('commercialProposal.pushToFm.allReady', { defaultValue: 'Всё готово к переносу в ФМ' })}
            </p>
            <p className="text-xs text-success-600 dark:text-success-500 mt-0.5">
              {t('commercialProposal.pushToFm.allReadyDesc', { defaultValue: 'Все позиции заполнены и утверждены' })}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {t('commercialProposal.pushToFm.readinessTitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <span className={checklist.needsInvoice === 0 ? 'text-green-600' : 'text-amber-600'}>
              {t('commercialProposal.pushToFm.checkInvoices', { count: String(checklist.needsInvoice) })}
            </span>
            <span className={checklist.needsEstimate === 0 ? 'text-green-600' : 'text-amber-600'}>
              {t('commercialProposal.pushToFm.checkEstimates', { count: String(checklist.needsEstimate) })}
            </span>
            <span className={checklist.unapproved === 0 ? 'text-green-600' : 'text-amber-600'}>
              {t('commercialProposal.pushToFm.checkStatuses', { count: String(checklist.unapproved) })}
            </span>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('commercialProposal.flowTitle')}
        </p>
        <div className="flex flex-wrap gap-2">
          {proposal.specificationId && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/specifications/${proposal.specificationId}`)}>
              {t('commercialProposal.flowSpec')}
            </Button>
          )}
          {proposal.specificationId && firstCompetitiveListId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/specifications/${proposal.specificationId}/competitive-list/${firstCompetitiveListId}`)}
            >
              {t('commercialProposal.flowCl')}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/commercial-proposals/${proposal.id}`)}>
            {t('commercialProposal.flowCp')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/budgets/${proposal.budgetId}/fm`)}>
            {t('commercialProposal.flowFm')}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <SummaryCard
          label={t('commercialProposal.totalCostPrice')}
          value={formatMoney(proposal.totalCostPrice)}
          accent
        />
        {proposal.totalCustomerPrice != null && proposal.totalCustomerPrice > 0 && (
          <SummaryCard
            label={t('commercialProposal.totalCustomerPrice')}
            value={formatMoney(proposal.totalCustomerPrice)}
          />
        )}
        {proposal.totalMargin != null && (
          <SummaryCard
            label={t('commercialProposal.margin')}
            value={formatMoney(proposal.totalMargin)}
            accent={proposal.totalMargin > 0}
          />
        )}
        {proposal.marginPercent != null && proposal.marginPercent > 0 && (
          <SummaryCard
            label={t('commercialProposal.marginPercent')}
            value={`${proposal.marginPercent.toFixed(1)}%`}
          />
        )}
        <SummaryCard
          label={t('commercialProposal.materialCount')}
          value={String(materialItems.length)}
        />
        <SummaryCard
          label={t('commercialProposal.workCount')}
          value={String(workItems.length)}
        />
      </div>

      {/* Info sidebar & tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab content */}
        <div className="lg:col-span-3">
          {activeTab === 'materials' && (
            <CpMaterialsTab proposalId={id!} items={materialItems} projectId={proposal.projectId} />
          )}
          {activeTab === 'works' && (
            <CpWorksTab proposalId={id!} items={workItems} projectId={proposal.projectId} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('commercialProposal.details')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-neutral-400 mt-0.5 flex-shrink-0"><Wallet size={15} /></span>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('commercialProposal.budgetId')}</p>
                  <button
                    onClick={() => navigate(`/budgets/${proposal.budgetId}`)}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('commercialProposal.goToBudget')}
                  </button>
                </div>
              </div>
              <InfoItem
                icon={<Calendar size={15} />}
                label={t('commercialProposal.createdAt')}
                value={formatDate(proposal.createdAt)}
              />
              {proposal.approvedAt && (
                <InfoItem
                  icon={<User size={15} />}
                  label={t('commercialProposal.approvedAt')}
                  value={formatDate(proposal.approvedAt)}
                />
              )}
              {proposal.notes && (
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    {t('commercialProposal.notes')}
                  </p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{proposal.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {pushToFmOpen && (
        <Suspense fallback={null}>
          <CpPushToFmDialog
            open={pushToFmOpen}
            onClose={() => setPushToFmOpen(false)}
            proposal={proposal}
            confirmedItems={confirmedItems}
          />
        </Suspense>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
    <p
      className={cn(
        'text-lg font-bold',
        accent ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-100',
      )}
    >
      {value}
    </p>
  </div>
);

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

export default CommercialProposalDetailPage;
