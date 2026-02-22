import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar, User, CheckCircle2, Wallet, ArrowUpRight, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
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

const proposalStatusLabels: Record<string, string> = {
  DRAFT: t('commercialProposal.statusDraft'),
  IN_REVIEW: t('commercialProposal.statusInReview'),
  APPROVED: t('commercialProposal.statusApproved'),
  ACTIVE: t('commercialProposal.statusActive'),
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

  const { data: proposal } = useQuery({
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

  const confirmedItems = useMemo(
    () => allItems.filter((item) =>
      item.status === 'IN_FINANCIAL_MODEL'
      || item.status === 'APPROVED'
      || item.status === 'CONFIRMED'
      || item.status === 'APPROVED_PROJECT',
    ),
    [allItems],
  );

  const statusMutation = useMutation({
    mutationFn: (targetStatus: string) => financeApi.changeProposalStatus(id!, targetStatus),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSAL', id] });
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSALS'] });
      toast.success(
        t('commercialProposal.toastStatusChanged', {
          status: proposalStatusLabels[updated.status] ?? updated.status,
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

  if (!proposal) return null;

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
            <StatusBadge
              status={proposal.status}
              colorMap={proposalStatusColorMap}
              label={proposalStatusLabels[proposal.status] ?? proposal.status}
              size="md"
            />
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
            <CpMaterialsTab proposalId={id!} items={materialItems} />
          )}
          {activeTab === 'works' && (
            <CpWorksTab proposalId={id!} items={workItems} />
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
