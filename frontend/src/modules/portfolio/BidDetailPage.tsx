import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  User,
  AlertTriangle,
  Shield,
  Users,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { portfolioApi } from '@/api/portfolio';
import { formatMoney, formatMoneyCompact, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { BidPackage, BidStatus } from './types';

const bidStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  DRAFT: 'gray',
  IN_PREPARATION: 'purple',
  SUBMITTED: 'blue',
  UNDER_EVALUATION: 'yellow',
  WON: 'green',
  LOST: 'red',
  NO_BID: 'gray',
};

const getBidStatusLabels = (): Record<string, string> => ({
  DRAFT: t('portfolio.tenders.statusDraft'),
  IN_PREPARATION: t('portfolio.tenders.statusInPreparation'),
  SUBMITTED: t('portfolio.tenders.statusSubmitted'),
  UNDER_EVALUATION: t('portfolio.tenders.statusUnderEvaluation'),
  WON: t('portfolio.tenders.statusWon'),
  LOST: t('portfolio.tenders.statusLost'),
  NO_BID: t('portfolio.tenders.statusNoBid'),
});

const statusFlow: BidStatus[] = ['DRAFT', 'IN_PREPARATION', 'SUBMITTED', 'UNDER_EVALUATION', 'WON'];

const BidDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const { data: bid, isLoading } = useQuery<BidPackage>({
    queryKey: ['bid-package', id],
    queryFn: () => portfolioApi.getBidPackage(id!),
    enabled: !!id,
  });

  const statusLabels = getBidStatusLabels();

  const statusMutation = useMutation({
    mutationFn: (status: BidStatus) =>
      portfolioApi.updateBidPackage(id!, { status } as Partial<BidPackage>),
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['bid-package', id] });
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      toast.success(t('portfolio.bidDetail.statusChanged', { status: statusLabels[status] ?? status }));
      setStatusMenuOpen(false);
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => portfolioApi.deleteBidPackage(id!),
    onSuccess: () => {
      toast.success(t('portfolio.bidDetail.deleted'));
      navigate('/portfolio/tenders');
    },
    onError: () => toast.error(t('common.error')),
  });

  if (isLoading || !bid) {
    return (
      <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">
        {t('common.loading')}
      </div>
    );
  }

  const b = bid;
  const marginPercent = b.bidAmount && b.estimatedCost
    ? (((b.bidAmount - b.estimatedCost) / b.bidAmount) * 100).toFixed(1)
    : b.estimatedMargin != null
      ? b.estimatedMargin.toFixed(1)
      : null;

  const isOverdue =
    new Date(b.submissionDeadline) < new Date() &&
    !['WON', 'LOST', 'NO_BID'].includes(b.status) &&
    !b.submittedDate;

  const currentStageIdx = statusFlow.indexOf(b.status);

  const nextStatuses: BidStatus[] = (() => {
    const s: BidStatus = b.status;
    if (s === 'WON' || s === 'LOST' || s === 'NO_BID') return [];
    const idx = statusFlow.indexOf(s);
    const result: BidStatus[] = [];
    if (idx >= 0 && idx < statusFlow.length - 1) {
      result.push(statusFlow[idx + 1]);
    }
    result.push('LOST');
    if (s !== 'SUBMITTED') result.push('NO_BID');
    return result;
  })();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={b.projectName}
        subtitle={`${b.bidNumber} \u2022 ${b.clientName}`}
        backTo="/portfolio/tenders"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('nav.portfolio'), href: '/portfolio/opportunities' },
          { label: t('portfolio.tenders.title'), href: '/portfolio/tenders' },
          { label: b.bidNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={b.status}
              colorMap={bidStatusColorMap}
              label={statusLabels[b.status] ?? b.status}
              size="md"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => navigate(`/portfolio/tenders/${id}/edit`)}
            >
              {t('common.edit')}
            </Button>
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                iconRight={<ChevronDown size={14} />}
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                disabled={nextStatuses.length === 0}
              >
                {t('portfolio.bidDetail.changeStatus')}
              </Button>
              {statusMenuOpen && nextStatuses.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-[200px]">
                    {nextStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        onClick={() => statusMutation.mutate(status)}
                        disabled={statusMutation.isPending}
                      >
                        <StatusBadge
                          status={status}
                          colorMap={bidStatusColorMap}
                          label={statusLabels[status] ?? status}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              loading={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm(t('portfolio.bidDetail.confirmDelete'))) {
                  deleteMutation.mutate();
                }
              }}
            >
              {t('common.delete')}
            </Button>
          </div>
        }
      />

      {/* Status pipeline */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center gap-2">
          {statusFlow.map((status, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <React.Fragment key={status}>
                <div
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-center text-xs font-medium',
                    isCompleted && 'bg-success-50 text-success-700',
                    isCurrent && 'bg-primary-50 text-primary-700 ring-2 ring-primary-200',
                    !isCompleted && !isCurrent && 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400',
                  )}
                >
                  {statusLabels[status]}
                </div>
                {idx < statusFlow.length - 1 && (
                  <ArrowRight size={14} className="text-neutral-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {(b.status === 'LOST' || b.status === 'NO_BID') && (
          <div className="mt-3 flex items-center gap-2 text-sm text-danger-600">
            <AlertTriangle size={14} />
            <span>{statusLabels[b.status]}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                {t('portfolio.bidDetail.bidAmount')}
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatMoneyCompact(b.bidAmount ?? b.amount)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                {t('portfolio.bidDetail.estimatedCost')}
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {b.estimatedCost != null ? formatMoneyCompact(b.estimatedCost) : '---'}
              </p>
            </div>
            <div className={cn(
              'rounded-xl border p-4',
              marginPercent != null && Number(marginPercent) > 0
                ? 'bg-success-50 border-success-100'
                : marginPercent != null && Number(marginPercent) < 0
                  ? 'bg-danger-50 border-danger-100'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
            )}>
              <p className={cn(
                'text-xs mb-1',
                marginPercent != null && Number(marginPercent) > 0
                  ? 'text-success-600'
                  : marginPercent != null && Number(marginPercent) < 0
                    ? 'text-danger-600'
                    : 'text-neutral-500 dark:text-neutral-400',
              )}>
                {t('portfolio.bidDetail.margin')}
              </p>
              <p className={cn(
                'text-lg font-bold tabular-nums',
                marginPercent != null && Number(marginPercent) > 0
                  ? 'text-success-700'
                  : marginPercent != null && Number(marginPercent) < 0
                    ? 'text-danger-700'
                    : 'text-neutral-900 dark:text-neutral-100',
              )}>
                {marginPercent != null ? `${marginPercent}%` : '---'}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                {t('portfolio.bidDetail.bondAmount')}
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {b.bondAmount != null ? formatMoneyCompact(b.bondAmount) : '---'}
              </p>
            </div>
          </div>

          {/* Project info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('portfolio.bidDetail.projectInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label={t('portfolio.bidDetail.projectName')} value={b.projectName} />
              <InfoRow label={t('portfolio.bidDetail.bidNumber')} value={b.bidNumber} />
              <InfoRow label={t('portfolio.bidDetail.clientName')} value={b.clientName || b.clientOrganization || '---'} />
              {b.evaluationScore != null && (
                <InfoRow
                  label={t('portfolio.bidDetail.evaluationScore')}
                  value={
                    <span className={cn(
                      'font-semibold tabular-nums',
                      b.evaluationScore >= 80 ? 'text-success-600' :
                      b.evaluationScore >= 60 ? 'text-warning-600' :
                      'text-danger-600',
                    )}>
                      {b.evaluationScore}
                    </span>
                  }
                />
              )}
            </div>
          </div>

          {/* Financial section */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-primary-500" />
              {t('portfolio.bidDetail.financialInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                label={t('portfolio.bidDetail.bidAmount')}
                value={formatMoney(b.bidAmount ?? b.amount)}
              />
              <InfoRow
                label={t('portfolio.bidDetail.estimatedCost')}
                value={b.estimatedCost != null ? formatMoney(b.estimatedCost) : '---'}
              />
              <InfoRow
                label={t('portfolio.bidDetail.estimatedMargin')}
                value={marginPercent != null ? `${marginPercent}%` : '---'}
              />
              <InfoRow
                label={t('portfolio.bidDetail.bondRequired')}
                value={
                  b.bondRequired
                    ? t('common.yes')
                    : t('common.no')
                }
              />
              {b.bondRequired && b.bondAmount != null && (
                <InfoRow
                  label={t('portfolio.bidDetail.bondAmount')}
                  value={formatMoney(b.bondAmount)}
                />
              )}
            </div>
          </div>

          {/* Deadline section */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-primary-500" />
              {t('portfolio.bidDetail.deadlines')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('portfolio.bidDetail.submissionDeadline')}
                </p>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-sm font-medium tabular-nums',
                    isOverdue
                      ? 'text-danger-600'
                      : 'text-neutral-800 dark:text-neutral-200',
                  )}>
                    {formatDate(b.submissionDeadline)}
                  </p>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-50 text-danger-600 text-xs font-medium">
                      <AlertTriangle size={12} />
                      {t('portfolio.bidDetail.overdue')}
                    </span>
                  )}
                </div>
              </div>
              <InfoRow
                label={t('portfolio.bidDetail.submittedDate')}
                value={b.submittedDate ? formatDate(b.submittedDate) : '---'}
              />
              <InfoRow
                label={t('portfolio.bidDetail.createdAt')}
                value={formatDate(b.createdAt)}
              />
              {b.updatedAt && (
                <InfoRow
                  label={t('portfolio.bidDetail.updatedAt')}
                  value={formatDate(b.updatedAt)}
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('portfolio.bidDetail.notes')}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {b.notes ?? t('portfolio.bidDetail.noNotes')}
            </div>
          </div>

          {/* Competitor info */}
          {b.competitorInfo && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Users size={16} className="text-primary-500" />
                {t('portfolio.bidDetail.competitorInfo')}
              </h3>
              <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {(() => {
                  try {
                    const parsed = typeof b.competitorInfo === 'string' ? JSON.parse(b.competitorInfo) : b.competitorInfo;
                    return parsed?.notes ?? JSON.stringify(parsed, null, 2);
                  } catch {
                    return b.competitorInfo;
                  }
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('common.details')}
            </h3>
            <div className="space-y-4">
              <SidebarItem
                icon={<User size={15} />}
                label={t('portfolio.bidDetail.responsible')}
                value={b.responsibleName}
              />
              <SidebarItem
                icon={<User size={15} />}
                label={t('portfolio.bidDetail.clientName')}
                value={b.clientName || b.clientOrganization || '---'}
              />
              <SidebarItem
                icon={<DollarSign size={15} />}
                label={t('portfolio.bidDetail.bidAmount')}
                value={formatMoney(b.bidAmount ?? b.amount)}
              />
              <SidebarItem
                icon={<Calendar size={15} />}
                label={t('portfolio.bidDetail.submissionDeadline')}
                value={
                  <span className={cn(isOverdue && 'text-danger-600 font-medium')}>
                    {formatDate(b.submissionDeadline)}
                  </span>
                }
              />
              {b.bondRequired && (
                <SidebarItem
                  icon={<Shield size={15} />}
                  label={t('portfolio.bidDetail.bondRequired')}
                  value={t('common.yes')}
                />
              )}
              <SidebarItem
                icon={<Calendar size={15} />}
                label={t('portfolio.bidDetail.createdAt')}
                value={formatDate(b.createdAt)}
              />
            </div>
          </div>

          {/* Actions card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('common.actions')}
            </h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                iconLeft={<Edit size={14} />}
                onClick={() => navigate(`/portfolio/tenders/${id}/edit`)}
              >
                {t('common.edit')}
              </Button>
              {b.opportunityId && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate(`/portfolio/opportunities/${b.opportunityId}`)}
                >
                  {t('portfolio.bidDetail.viewOpportunity')}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => navigate(`/portfolio/bid-comparison?bidPackageId=${id}`)}
              >
                {t('portfolio.bidDetail.viewComparison')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => toast.success(t('portfolio.bidDetail.exportStarted'))}
              >
                {t('portfolio.bidDetail.exportPdf')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
      {typeof value === 'string' ? value : value}
    </p>
  </div>
);

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {typeof value === 'string' ? value : value}
      </p>
    </div>
  </div>
);

export default BidDetailPage;
