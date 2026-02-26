import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  User,
  MessageSquare,
  ShieldCheck,
  Calculator,
  Building2,
  HardHat,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Textarea } from '@/design-system/components/FormField';
import { MetricCard } from '@/design-system/components/MetricCard';
import { closingApi } from '@/api/closing';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { Ks2Approval, ApprovalStage, ApprovalStageStatus } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STAGE_ORDER: ApprovalStage[] = ['contractor', 'technical', 'accounting', 'client'];

const stageIcon = (stage: ApprovalStage) => {
  switch (stage) {
    case 'contractor':
      return <HardHat size={16} />;
    case 'technical':
      return <ShieldCheck size={16} />;
    case 'accounting':
      return <Calculator size={16} />;
    case 'client':
      return <Building2 size={16} />;
  }
};

const statusColor = (status: ApprovalStageStatus) => {
  switch (status) {
    case 'approved':
      return 'text-green-600 dark:text-green-400';
    case 'rejected':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-neutral-400 dark:text-neutral-500';
  }
};

const statusBg = (status: ApprovalStageStatus) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    case 'rejected':
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    default:
      return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600';
  }
};

const statusIcon = (status: ApprovalStageStatus) => {
  switch (status) {
    case 'approved':
      return <CheckCircle size={18} className="text-green-600 dark:text-green-400" />;
    case 'rejected':
      return <XCircle size={18} className="text-red-600 dark:text-red-400" />;
    default:
      return <Clock size={18} className="text-neutral-400 dark:text-neutral-500" />;
  }
};

// ---------------------------------------------------------------------------
// Workflow Stepper
// ---------------------------------------------------------------------------

const WorkflowStepper: React.FC<{ approval: Ks2Approval }> = ({ approval }) => (
  <div className="flex items-center gap-1 overflow-x-auto">
    {STAGE_ORDER.map((stage, idx) => {
      const entry = approval.stages.find((s) => s.stage === stage);
      const status: ApprovalStageStatus = entry?.status ?? 'pending';
      const isCurrent = approval.currentStage === stage;

      return (
        <React.Fragment key={stage}>
          {idx > 0 && (
            <ArrowRight
              size={14}
              className="text-neutral-300 dark:text-neutral-600 flex-shrink-0"
            />
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium flex-shrink-0',
              statusBg(status),
              isCurrent && 'ring-2 ring-primary-400 dark:ring-primary-500',
            )}
          >
            {statusIcon(status)}
            <span className={statusColor(status)}>
              {t(`closing.approval.stage_${stage}`)}
            </span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const Ks2ApprovalWorkflowPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState<Ks2Approval | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  const { data: approvals, isLoading } = useQuery<Ks2Approval[]>({
    queryKey: ['ks2-approvals'],
    queryFn: () => closingApi.getKs2Approvals(),
  });

  const items = approvals ?? [];

  const metrics = useMemo(() => {
    const pending = items.filter((a) =>
      a.stages.some((s) => s.status === 'pending'),
    ).length;
    const approved = items.filter((a) =>
      a.stages.every((s) => s.status === 'approved'),
    ).length;
    const rejected = items.filter((a) =>
      a.stages.some((s) => s.status === 'rejected'),
    ).length;
    const inProgress = items.length - approved - rejected;
    return { pending, approved, rejected, inProgress };
  }, [items]);

  const approveMutation = useMutation({
    mutationFn: (params: { id: string; comment?: string }) =>
      closingApi.approveKs2(params.id, params.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2-approvals'] });
      toast.success(t('closing.approval.toastApproved'));
      closeModal();
    },
    onError: () => toast.error(t('closing.approval.toastApproveError')),
  });

  const rejectMutation = useMutation({
    mutationFn: (params: { id: string; comment: string }) =>
      closingApi.rejectKs2(params.id, params.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2-approvals'] });
      toast.success(t('closing.approval.toastRejected'));
      closeModal();
    },
    onError: () => toast.error(t('closing.approval.toastRejectError')),
  });

  const openModal = (approval: Ks2Approval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(action);
    setComment('');
  };

  const closeModal = () => {
    setSelectedApproval(null);
    setActionType(null);
    setComment('');
  };

  const handleSubmit = () => {
    if (!selectedApproval || !actionType) return;
    if (actionType === 'reject' && !comment.trim()) {
      toast.error(t('closing.approval.commentRequired'));
      return;
    }
    if (actionType === 'approve') {
      approveMutation.mutate({ id: selectedApproval.id, comment: comment.trim() || undefined });
    } else {
      rejectMutation.mutate({ id: selectedApproval.id, comment: comment.trim() });
    }
  };

  const columns = useMemo<ColumnDef<Ks2Approval, unknown>[]>(
    () => [
      {
        accessorKey: 'actNumber',
        header: t('closing.approval.colActNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('closing.approval.colProject'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('closing.approval.colAmount'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        id: 'workflow',
        header: t('closing.approval.colWorkflow'),
        size: 400,
        cell: ({ row }) => <WorkflowStepper approval={row.original} />,
      },
      {
        accessorKey: 'currentStage',
        header: t('closing.approval.colCurrentStage'),
        size: 140,
        cell: ({ row }) => {
          const stage = row.original.currentStage;
          return (
            <div className="flex items-center gap-1.5">
              {stageIcon(stage)}
              <span className="text-sm">{t(`closing.approval.stage_${stage}`)}</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 200,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={(e) => {
                e.stopPropagation();
                openModal(row.original, 'approve');
              }}
            >
              <CheckCircle size={14} className="mr-1" />
              {t('closing.approval.actionApprove')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                openModal(row.original, 'reject');
              }}
            >
              <XCircle size={14} className="mr-1" />
              {t('closing.approval.actionReject')}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closing.approval.title')}
        subtitle={t('closing.approval.subtitle')}
        breadcrumbs={[
          { label: t('closing.ks2.breadcrumbHome'), href: '/' },
          { label: t('closing.ks2.breadcrumbKs2'), href: '/ks2' },
          { label: t('closing.approval.breadcrumb') },
        ]}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Clock size={18} />}
          label={t('closing.approval.metricPending')}
          value={metrics.pending}
        />
        <MetricCard
          icon={<ArrowRight size={18} />}
          label={t('closing.approval.metricInProgress')}
          value={metrics.inProgress}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('closing.approval.metricApproved')}
          value={metrics.approved}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('closing.approval.metricRejected')}
          value={metrics.rejected}
        />
      </div>

      {/* Table */}
      <DataTable<Ks2Approval>
        data={items}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('closing.approval.emptyTitle')}
        emptyDescription={t('closing.approval.emptyDescription')}
      />

      {/* Approve / Reject Modal */}
      <Modal
        open={!!selectedApproval && !!actionType}
        onClose={closeModal}
        title={
          actionType === 'approve'
            ? t('closing.approval.modalApproveTitle')
            : t('closing.approval.modalRejectTitle')
        }
      >
        {selectedApproval && (
          <div className="space-y-4">
            {/* Act info */}
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                {t('closing.approval.colActNumber')}
              </p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {selectedApproval.actNumber} &mdash; {selectedApproval.projectName}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {formatMoney(selectedApproval.amount)}
              </p>
            </div>

            {/* Current workflow */}
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                {t('closing.approval.colWorkflow')}
              </p>
              <WorkflowStepper approval={selectedApproval} />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <MessageSquare size={14} className="inline mr-1" />
                {t('closing.approval.labelComment')}
                {actionType === 'reject' && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('closing.approval.commentPlaceholder')}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                {t('common.cancel')}
              </Button>
              {actionType === 'approve' ? (
                <Button
                  variant="success"
                  loading={approveMutation.isPending}
                  onClick={handleSubmit}
                >
                  <CheckCircle size={14} className="mr-1" />
                  {t('closing.approval.actionApprove')}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  loading={rejectMutation.isPending}
                  onClick={handleSubmit}
                >
                  <XCircle size={14} className="mr-1" />
                  {t('closing.approval.actionReject')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Ks2ApprovalWorkflowPage;
