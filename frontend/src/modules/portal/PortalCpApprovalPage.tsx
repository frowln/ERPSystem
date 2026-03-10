import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Building2,
  Hash,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { EmptyState } from '@/design-system/components/EmptyState';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { portalApi } from '@/api/portal';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { PortalCpStatus } from './types';

const tp = (k: string) => t(`portal.cpApproval.${k}`);

const statusColorMap: Record<PortalCpStatus, string> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CHANGES_REQUESTED: 'orange',
};

const statusLabelMap: Record<PortalCpStatus, string> = {
  PENDING: 'statusPending',
  APPROVED: 'statusApproved',
  REJECTED: 'statusRejected',
  CHANGES_REQUESTED: 'statusChangesRequested',
};

const PortalCpApprovalPage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'changes' | null>(null);

  const {
    data: proposal,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['portal-proposal', proposalId],
    queryFn: () => portalApi.getProposal(proposalId!),
    enabled: !!proposalId,
  });

  const decisionMutation = useMutation({
    mutationFn: (decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') =>
      portalApi.submitProposalDecision(proposalId!, {
        decision,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['portal-proposal', proposalId] });
      const toastMap: Record<string, string> = {
        APPROVED: tp('toastApproved'),
        REJECTED: tp('toastRejected'),
        CHANGES_REQUESTED: tp('toastChangesRequested'),
      };
      toast.success(toastMap[updated.status] ?? updated.status);
      setConfirmAction(null);
      setComment('');
    },
    onError: () => {
      toast.error(t('common.operationError'));
      setConfirmAction(null);
    },
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    const decisionMap: Record<string, 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'> = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      changes: 'CHANGES_REQUESTED',
    };
    decisionMutation.mutate(decisionMap[confirmAction]);
  };

  const confirmMessages: Record<string, string> = {
    approve: tp('confirmApprove'),
    reject: tp('confirmReject'),
    changes: tp('confirmRequestChanges'),
  };

  if (!proposalId) {
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

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageSkeleton variant="detail" />
      </div>
    );
  }

  if (isError || !proposal) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={tp('title')}
          backTo="/portal"
          breadcrumbs={[
            { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
            { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
            { label: tp('breadcrumbProposals') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('errors.noConnection')}
          description={t('errors.serverErrorRetry')}
          actionLabel={t('common.retry')}
          onAction={() => void refetch()}
        />
      </div>
    );
  }

  const isPending = proposal.status === 'PENDING';
  const items = proposal.items ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        backTo="/portal"
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: tp('breadcrumbProposals') },
          { label: proposal.name },
        ]}
        actions={
          <StatusBadge
            status={proposal.status}
            colorMap={statusColorMap}
            label={tp(statusLabelMap[proposal.status])}
            size="md"
          />
        }
      />

      {/* Proposal Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InfoCard
          icon={<Hash size={16} />}
          label={tp('proposalNumber')}
          value={proposal.name}
        />
        {proposal.projectName && (
          <InfoCard
            icon={<Building2 size={16} />}
            label={tp('projectName')}
            value={proposal.projectName}
          />
        )}
        <InfoCard
          icon={<FileText size={16} />}
          label={tp('totalAmount')}
          value={formatMoney(proposal.totalAmount)}
          accent
        />
        <InfoCard
          icon={<Calendar size={16} />}
          label={tp('createdAt')}
          value={formatDate(proposal.createdAt)}
        />
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {tp('items')} ({items.length})
          </h3>
        </div>
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {tp('noItems')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                    {tp('colName')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                    {tp('colQuantity')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                    {tp('colUnit')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                    {tp('colUnitPrice')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                    {tp('colTotal')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100 font-medium">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      {item.unit || '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100"
                  >
                    {tp('totalAmount')}:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                    {formatMoney(proposal.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Customer Comment */}
      {proposal.customerComment && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {tp('notes')}
          </h3>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{proposal.customerComment}</p>
        </div>
      )}

      {/* Notes & Action Buttons (only for PENDING status) */}
      {isPending && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {tp('notes')}
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={tp('notesPlaceholder')}
            rows={4}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600',
              'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
            )}
          />

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<CheckCircle2 size={14} />}
              onClick={() => setConfirmAction('approve')}
              disabled={decisionMutation.isPending}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            >
              {tp('approve')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<AlertTriangle size={14} />}
              onClick={() => setConfirmAction('changes')}
              disabled={decisionMutation.isPending}
              className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
            >
              {tp('requestChanges')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<XCircle size={14} />}
              onClick={() => setConfirmAction('reject')}
              disabled={decisionMutation.isPending}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
            >
              {tp('reject')}
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction === 'approve'
            ? tp('approve')
            : confirmAction === 'reject'
              ? tp('reject')
              : tp('requestChanges')
        }
        description={confirmAction ? confirmMessages[confirmAction] : ''}
        confirmLabel={t('common.confirm')}
        confirmVariant={confirmAction === 'reject' ? 'danger' : 'primary'}
        loading={decisionMutation.isPending}
      />
    </div>
  );
};

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}> = ({ icon, label, value, accent }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
    <p
      className={cn(
        'text-sm font-semibold truncate',
        accent
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-neutral-900 dark:text-neutral-100',
      )}
    >
      {value}
    </p>
  </div>
);

export default PortalCpApprovalPage;
