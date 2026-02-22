import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField } from '@/design-system/components/FormField';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  contractExtApi,
  type ContractClaim,
  type ClaimStatus,
  type ClaimType,
  type CreateClaimPayload,
} from '@/api/contractExt';
import { t } from '@/i18n';

// ─── Status badge ─────────────────────────────────────────────────────────────

const CLAIM_STATUS_CFG: Record<ClaimStatus, { label: string; cls: string }> = {
  FILED:        { label: t('contracts.claims.statusFiled'),          cls: 'bg-blue-50 text-blue-700' },
  UNDER_REVIEW: { label: t('contracts.claims.statusUnderReview'), cls: 'bg-amber-50 text-amber-700' },
  ACCEPTED:     { label: t('contracts.claims.statusAccepted'),        cls: 'bg-success-50 text-success-700' },
  REJECTED:     { label: t('contracts.claims.statusRejected'),       cls: 'bg-danger-50 text-danger-600' },
  RESOLVED:     { label: t('contracts.claims.statusResolved'),   cls: 'bg-neutral-100 text-neutral-600' },
  WITHDRAWN:    { label: t('contracts.claims.statusWithdrawn'),        cls: 'bg-neutral-100 text-neutral-400' },
};

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  DELAY:           t('contracts.claims.typeDelay'),
  QUALITY_DEFECT:  t('contracts.claims.typeQualityDefect'),
  PAYMENT_DEFAULT: t('contracts.claims.typePaymentDefault'),
  SCOPE_CHANGE:    t('contracts.claims.typeScopeChange'),
  OTHER:           t('contracts.claims.typeOther'),
};

const ClaimStatusBadge: React.FC<{ status: ClaimStatus }> = ({ status }) => {
  const cfg = CLAIM_STATUS_CFG[status] ?? CLAIM_STATUS_CFG.FILED;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', cfg.cls)}>
      {cfg.label}
    </span>
  );
};

// ─── Form state ────────────────────────────────────────────────────────────────

interface ClaimForm {
  claimType: ClaimType;
  subject: string;
  description: string;
  amount: string;
}

const DEFAULT_FORM: ClaimForm = {
  claimType: 'DELAY',
  subject: '',
  description: '',
  amount: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  contractId: string;
  readOnly?: boolean;
}

const ContractClaimsTab: React.FC<Props> = ({ contractId, readOnly }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<ClaimForm>(DEFAULT_FORM);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['contract-claims', contractId],
    queryFn: () => contractExtApi.listClaims(contractId),
    enabled: !!contractId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClaimPayload) => contractExtApi.createClaim(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-claims', contractId] });
      toast.success(t('contracts.claims.toastCreated'));
      setModalOpen(false);
      setForm(DEFAULT_FORM);
    },
    onError: () => toast.error(t('contracts.claims.toastCreateError')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClaimStatus }) =>
      contractExtApi.updateClaimStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-claims', contractId] });
      toast.success(t('contracts.claims.toastStatusUpdated'));
    },
    onError: () => toast.error(t('contracts.claims.toastStatusError')),
  });

  const setF = (key: keyof ClaimForm, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!form.subject.trim()) { toast.error(t('contracts.claims.errorNoSubject')); return; }
    createMutation.mutate({
      contractId,
      claimType: form.claimType,
      subject: form.subject,
      description: form.description || undefined,
      amount: parseFloat(form.amount) || undefined,
    });
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  // Totals
  const openAmount = claims
    .filter((c) => c.status === 'FILED' || c.status === 'UNDER_REVIEW')
    .reduce((s, c) => s + (c.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("contracts.claims.title")} ({claims.length})
          </p>
          {openAmount > 0 && (
            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
              <AlertTriangle size={11} />
              {t("contracts.claims.openClaims")}: {formatMoney(openAmount)}
            </p>
          )}
        </div>
        {!readOnly && (
          <Button variant="secondary" size="sm" iconLeft={<Plus size={13} />} onClick={() => setModalOpen(true)}>
            {t("contracts.claims.addClaim")}
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
        </div>
      ) : claims.length === 0 ? (
        <div className="py-10 text-center">
          <AlertTriangle size={32} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-400">{t("contracts.claims.empty")}</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          {claims.map((claim) => (
            <div key={claim.id}>
              <button
                onClick={() => setExpandedId(expandedId === claim.id ? null : claim.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left"
              >
                {expandedId === claim.id
                  ? <ChevronDown size={14} className="shrink-0 text-neutral-400" />
                  : <ChevronRight size={14} className="shrink-0 text-neutral-400" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{claim.subject}</p>
                  <p className="text-xs text-neutral-400">
                    {CLAIM_TYPE_LABELS[claim.claimType]}
                    {claim.filedAt ? ` · ${formatDate(claim.filedAt as unknown as string)}` : ''}
                    {claim.code ? ` · #${claim.code}` : ''}
                  </p>
                </div>
                {claim.amount != null && (
                  <span className="text-sm font-semibold tabular-nums text-amber-700 shrink-0">
                    {formatMoney(claim.amount)}
                  </span>
                )}
                <ClaimStatusBadge status={claim.status} />
              </button>

              {expandedId === claim.id && (
                <div className="px-6 pb-4 pt-2 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-700">
                  {claim.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{claim.description}</p>
                  )}
                  {claim.responseText && (
                    <div className="mb-3 p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs font-semibold text-neutral-500 mb-1">{t("contracts.claims.response")}:</p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{claim.responseText}</p>
                    </div>
                  )}
                  {claim.resolutionNotes && (
                    <div className="mb-3 p-2 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-100">
                      <p className="text-xs font-semibold text-success-700 mb-1">{t("contracts.claims.resolution")}:</p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{claim.resolutionNotes}</p>
                    </div>
                  )}
                  {!readOnly && claim.status === 'FILED' && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary" size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'UNDER_REVIEW' })}
                        loading={updateStatusMutation.isPending}
                      >{t('contracts.claims.actionReview')}
                      </Button>
                    </div>
                  )}
                  {!readOnly && claim.status === 'UNDER_REVIEW' && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary" size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'ACCEPTED' })}
                        loading={updateStatusMutation.isPending}
                      >{t('contracts.claims.actionAccept')}
                      </Button>
                      <Button
                        variant="danger" size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'REJECTED' })}
                        loading={updateStatusMutation.isPending}
                      >{t('contracts.claims.actionReject')}
                      </Button>
                      <Button
                        variant="secondary" size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: claim.id, status: 'RESOLVED' })}
                        loading={updateStatusMutation.isPending}
                      >{t('contracts.claims.actionResolve')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(DEFAULT_FORM); }} title={t("contracts.claims.modalTitle")} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("contracts.claims.fieldType")} required>
              <select value={form.claimType} onChange={(e) => setF('claimType', e.target.value as ClaimType)}
                className={inputCls}>
                {(Object.entries(CLAIM_TYPE_LABELS) as [ClaimType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </FormField>
            <FormField label={t("contracts.claims.fieldAmount")}>
              <input type="number" value={form.amount} onChange={(e) => setF('amount', e.target.value)}
                placeholder="0" step="0.01" min="0" className={inputCls} />
            </FormField>
          </div>

          <FormField label={t("contracts.claims.fieldSubject")} required>
            <input value={form.subject} onChange={(e) => setF('subject', e.target.value)}
              placeholder={t("contracts.claims.fieldSubjectPlaceholder")} className={inputCls} />
          </FormField>

          <FormField label={t("contracts.claims.fieldDescription")}>
            <textarea value={form.description} onChange={(e) => setF('description', e.target.value)}
              rows={4} className={`${inputCls} resize-none`}
              placeholder={t("contracts.claims.fieldDescriptionPlaceholder")} />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setModalOpen(false); setForm(DEFAULT_FORM); }}>{t("common.cancel")}</Button>
            <Button
              variant="primary" size="sm"
              onClick={handleSubmit}
              loading={createMutation.isPending}
              iconLeft={<AlertTriangle size={13} />}
            >{t('contracts.claims.submitClaim')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContractClaimsTab;
