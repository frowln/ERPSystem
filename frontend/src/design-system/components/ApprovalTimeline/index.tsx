import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Plus, Send } from 'lucide-react';
import { approvalsApi, type ApprovalChain, type ApprovalStep } from '@/api/approvals';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Input } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/format';

// ─── Status badge ────────────────────────────────────────────────────────────

const chainStatusConfig: Record<string, { label: () => string; color: string }> = {
  PENDING: {
    label: () => t('approvals.pending'),
    color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  },
  IN_PROGRESS: {
    label: () => t('approvals.inProgress'),
    color: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  },
  APPROVED: {
    label: () => t('approvals.approved'),
    color: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  },
  REJECTED: {
    label: () => t('approvals.rejected'),
    color: 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
  },
};

// ─── Step icon ───────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: string }) {
  if (status === 'APPROVED') {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/40">
        <CheckCircle2 className="h-4 w-4 text-success-600 dark:text-success-400" />
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/40">
        <XCircle className="h-4 w-4 text-danger-600 dark:text-danger-400" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
      <Clock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
    </span>
  );
}

// ─── Create chain modal ──────────────────────────────────────────────────────

interface CreateChainModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  onCreated: () => void;
}

function CreateChainModal({ open, onClose, entityType, entityId, onCreated }: CreateChainModalProps) {
  const [chainName, setChainName] = useState('');
  const [steps, setSteps] = useState<Array<{ approverName: string; approverRole: string }>>([
    { approverName: '', approverRole: '' },
  ]);

  const createMutation = useMutation({
    mutationFn: () =>
      approvalsApi.createChain({
        name: chainName || undefined,
        entityType,
        entityId,
        steps: steps.filter((s) => s.approverName.trim()),
      }),
    onSuccess: () => {
      toast.success(t('approvals.chain') + ' — OK');
      onCreated();
      onClose();
      setChainName('');
      setSteps([{ approverName: '', approverRole: '' }]);
    },
    onError: () => {
      toast.error('Error');
    },
  });

  const addStep = () => setSteps((prev) => [...prev, { approverName: '', approverRole: '' }]);

  const updateStep = (index: number, field: 'approverName' | 'approverRole', value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = steps.some((s) => s.approverName.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('approvals.createChain')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!canSubmit}
          >
            {t('common.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('approvals.chainName')}
          </label>
          <Input
            value={chainName}
            onChange={(e) => setChainName(e.target.value)}
            placeholder={t('approvals.chainNamePlaceholder')}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 w-6 shrink-0">
                {idx + 1}.
              </span>
              <Input
                value={step.approverName}
                onChange={(e) => updateStep(idx, 'approverName', e.target.value)}
                placeholder={t('approvals.approverName')}
                className="flex-1"
              />
              <Input
                value={step.approverRole}
                onChange={(e) => updateStep(idx, 'approverRole', e.target.value)}
                placeholder={t('approvals.approverRole')}
                className="w-36"
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="text-neutral-400 hover:text-danger-500 dark:hover:text-danger-400 text-sm"
                  aria-label="Remove step"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={addStep}>
          {t('approvals.addStep')}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Decision modal ──────────────────────────────────────────────────────────

interface DecisionModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'approve' | 'reject';
  stepId: string;
  onDone: () => void;
}

function DecisionModal({ open, onClose, mode, stepId, onDone }: DecisionModalProps) {
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      mode === 'approve'
        ? approvalsApi.approveStep(stepId, comment || undefined)
        : approvalsApi.rejectStep(stepId, comment || undefined),
    onSuccess: () => {
      toast.success(mode === 'approve' ? t('approvals.approved') : t('approvals.rejected'));
      onDone();
      onClose();
      setComment('');
    },
    onError: () => {
      toast.error('Error');
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'approve' ? t('approvals.approve') : t('approvals.reject')}
      description={mode === 'approve' ? t('approvals.confirmApprove') : t('approvals.confirmReject')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={mode === 'approve' ? 'success' : 'danger'}
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            iconLeft={<Send className="h-3.5 w-3.5" />}
          >
            {mode === 'approve' ? t('approvals.approve') : t('approvals.reject')}
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {t('approvals.comment')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('approvals.commentPlaceholder')}
          rows={3}
          className={cn(
            'w-full rounded-lg border border-neutral-300 dark:border-neutral-600',
            'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
            'px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          )}
        />
      </div>
    </Modal>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface ApprovalTimelineProps {
  entityType: string;
  entityId: string;
  showCreateButton?: boolean;
  className?: string;
}

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
  entityType,
  entityId,
  showCreateButton = true,
  className,
}) => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject'>('approve');
  const [decisionStepId, setDecisionStepId] = useState<string | null>(null);

  const queryKey = ['approval-chain', entityType, entityId];

  const { data: chain, isLoading } = useQuery({
    queryKey,
    queryFn: () => approvalsApi.getChain(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const openDecision = (stepId: string, mode: 'approve' | 'reject') => {
    setDecisionStepId(stepId);
    setDecisionMode(mode);
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        <div className="h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-16 rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  // No chain yet (or chain has no id / is incomplete)
  if (!chain || !chain.id) {
    return (
      <div className={cn('rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-4', className)}>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{t('approvals.noChain')}</p>
        {showCreateButton && (
          <>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setCreateOpen(true)}
            >
              {t('approvals.createChain')}
            </Button>
            <CreateChainModal
              open={createOpen}
              onClose={() => setCreateOpen(false)}
              entityType={entityType}
              entityId={entityId}
              onCreated={invalidate}
            />
          </>
        )}
      </div>
    );
  }

  // Chain exists — render timeline
  const statusCfg = chainStatusConfig[chain.status] ?? chainStatusConfig.PENDING;

  const steps = chain.steps ?? [];

  // Find the first pending step (next step to approve)
  const nextPendingStep = steps.find((s) => s.status === 'PENDING');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('approvals.chainStatus')}
        </h3>
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.color)}>
          {statusCfg.label()}
        </span>
      </div>

      {chain.name && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{chain.name}</p>
      )}

      {/* Timeline */}
      <div className="relative ml-4">
        {/* Vertical line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isPending = step.status === 'PENDING';
            const isNext = nextPendingStep?.id === step.id;

            return (
              <div key={step.id} className="relative flex gap-3 pl-6">
                {/* Icon on the line */}
                <div className="absolute -left-4 top-0">
                  <StepIcon status={step.status} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {step.approverName}
                    </span>
                    {step.approverRole && (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                        {step.approverRole}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {t('approvals.stepN', { n: String(step.stepOrder) })}
                    </span>
                  </div>

                  {/* Comment */}
                  {step.comment && (
                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 italic">
                      &laquo;{step.comment}&raquo;
                    </p>
                  )}

                  {/* Decision date */}
                  {step.decidedAt && (
                    <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                      {t('approvals.decidedAt')}: {formatDate(step.decidedAt)}
                    </p>
                  )}

                  {/* Action buttons for next pending step */}
                  {isPending && isNext && chain.status !== 'REJECTED' && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="success"
                        size="xs"
                        onClick={() => openDecision(step.id, 'approve')}
                      >
                        {t('approvals.approve')}
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => openDecision(step.id, 'reject')}
                      >
                        {t('approvals.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision modal */}
      {decisionStepId && (
        <DecisionModal
          open={!!decisionStepId}
          onClose={() => setDecisionStepId(null)}
          mode={decisionMode}
          stepId={decisionStepId}
          onDone={invalidate}
        />
      )}
    </div>
  );
};

export { ApprovalTimeline };
export default ApprovalTimeline;
