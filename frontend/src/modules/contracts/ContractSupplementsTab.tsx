import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, PenLine, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField } from '@/design-system/components/FormField';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  contractExtApi,
  type ContractSupplement,
  type SupplementStatus,
  type CreateSupplementPayload,
} from '@/api/contractExt';
import { t } from '@/i18n';

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SupplementStatus, { label: string; cls: string }> = {
  DRAFT:        { label: t('contracts.supplements.statusDraft'),       cls: 'bg-neutral-100 text-neutral-600' },
  UNDER_REVIEW: { label: t('contracts.supplements.statusUnderReview'),    cls: 'bg-blue-50 text-blue-700' },
  APPROVED:     { label: t('contracts.supplements.statusApproved'),     cls: 'bg-primary-50 text-primary-700' },
  SIGNED:       { label: t('contracts.supplements.statusSigned'),      cls: 'bg-success-50 text-success-700' },
  REJECTED:     { label: t('contracts.supplements.statusRejected'),      cls: 'bg-danger-50 text-danger-600' },
};

const SupplementBadge: React.FC<{ status: SupplementStatus }> = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', cfg.cls)}>
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Create form state
// ─────────────────────────────────────────────────────────────────────────────

interface SupplForm {
  number: string;
  supplementDate: string;
  reason: string;
  description: string;
  amountChange: string;
  deadlineChange: string;
  newDeadline: string;
}

const DEFAULT_FORM: SupplForm = {
  number: '',
  supplementDate: new Date().toISOString().slice(0, 10),
  reason: '',
  description: '',
  amountChange: '0',
  deadlineChange: '0',
  newDeadline: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  contractId: string;
  contractAmount?: number;
  readOnly?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ContractSupplementsTab: React.FC<Props> = ({ contractId, contractAmount, readOnly }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplForm>(DEFAULT_FORM);

  const { data: supplements = [], isLoading } = useQuery({
    queryKey: ['contract-supplements', contractId],
    queryFn: () => contractExtApi.listSupplements(contractId),
    enabled: !!contractId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplementPayload) => contractExtApi.createSupplement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-supplements', contractId] });
      toast.success(t('contracts.supplements.toastCreated'));
      setModalOpen(false);
      setForm(DEFAULT_FORM);
    },
    onError: () => toast.error(t('contracts.supplements.toastCreateError')),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => contractExtApi.approveSupplement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-supplements', contractId] });
      toast.success(t('contracts.supplements.toastApproved'));
    },
    onError: () => toast.error(t('contracts.supplements.toastApproveError')),
  });

  const signMutation = useMutation({
    mutationFn: (id: string) => contractExtApi.signSupplement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-supplements', contractId] });
      toast.success(t('contracts.supplements.toastSigned'));
    },
    onError: () => toast.error(t('contracts.supplements.toastSignError')),
  });

  const setF = (key: keyof SupplForm, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!form.number.trim()) { toast.error(t('contracts.supplements.errorNoNumber')); return; }
    if (!form.supplementDate) { toast.error(t('contracts.supplements.errorNoDate')); return; }
    createMutation.mutate({
      contractId,
      number: form.number,
      supplementDate: form.supplementDate,
      reason: form.reason || undefined,
      description: form.description || undefined,
      amountChange: parseFloat(form.amountChange) || undefined,
      deadlineChange: parseInt(form.deadlineChange) || undefined,
      newDeadline: form.newDeadline || undefined,
    } as CreateSupplementPayload);
  };

  // Cumulative amount change
  const cumulativeDelta = supplements
    .filter((s) => s.status === 'SIGNED')
    .reduce((sum, s) => sum + (s.amountChange ?? 0), 0);

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("contracts.supplements.title")} ({supplements.length})
          </p>
          {contractAmount != null && cumulativeDelta !== 0 && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {t('contracts.supplements.totalAmountChange')}
              <span className={cn('ml-1 font-semibold', cumulativeDelta > 0 ? 'text-success-700' : 'text-danger-600')}>
                {cumulativeDelta > 0 ? '+' : ''}{formatMoney(cumulativeDelta)}
              </span>
              {' '}→ {formatMoney((contractAmount ?? 0) + cumulativeDelta)}
            </p>
          )}
        </div>
        {!readOnly && (
          <Button variant="primary" size="sm" iconLeft={<Plus size={13} />} onClick={() => setModalOpen(true)}>
            {t("contracts.supplements.addSupplement")}
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
        </div>
      ) : supplements.length === 0 ? (
        <div className="py-10 text-center">
          <FileText size={32} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-400">{t("contracts.supplements.empty")}</p>
          {!readOnly && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setModalOpen(true)}>
              {t("contracts.supplements.createFirst")}
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          {supplements.map((s) => (
            <div key={s.id}>
              <button
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left"
              >
                {expandedId === s.id ? <ChevronDown size={14} className="shrink-0 text-neutral-400" /> : <ChevronRight size={14} className="shrink-0 text-neutral-400" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {t("contracts.supplements.supplementNumber", { number: s.number })}
                  </p>
                  <p className="text-xs text-neutral-400">{formatDate(s.supplementDate)}{s.reason ? ` · ${s.reason}` : ''}</p>
                </div>
                {s.amountChange != null && s.amountChange !== 0 && (
                  <span className={cn('text-sm font-semibold tabular-nums shrink-0', s.amountChange > 0 ? 'text-success-700' : 'text-danger-600')}>
                    {s.amountChange > 0 ? '+' : ''}{formatMoney(s.amountChange)}
                  </span>
                )}
                <SupplementBadge status={s.status} />
              </button>

              {expandedId === s.id && (
                <div className="px-6 pb-4 pt-2 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-700">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-3">
                    {s.description && (
                      <>
                        <span className="text-neutral-500">{t('contracts.supplements.descriptionChanges')}:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{s.description}</span>
                      </>
                    )}
                    {s.deadlineChange != null && s.deadlineChange !== 0 && (
                      <>
                        <span className="text-neutral-500">{t('contracts.supplements.deadlineChange')}:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {s.deadlineChange > 0 ? '+' : ''}{s.deadlineChange} {t('contracts.supplements.days')}
                          {s.newDeadline && ` → ${formatDate(s.newDeadline)}`}
                        </span>
                      </>
                    )}
                    {s.newTotalAmount != null && (
                      <>
                        <span className="text-neutral-500">{t('contracts.supplements.newTotalAmount')}:</span>
                        <span className="font-semibold text-primary-700">{formatMoney(s.newTotalAmount)}</span>
                      </>
                    )}
                    {s.signedAt && (
                      <>
                        <span className="text-neutral-500">{t('contracts.supplements.signedAt')}:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{formatDate(s.signedAt as unknown as string)}</span>
                      </>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex gap-2">
                      {s.status === 'DRAFT' && (
                        <Button
                          variant="secondary" size="sm"
                          onClick={() => approveMutation.mutate(s.id)}
                          loading={approveMutation.isPending}
                        >{t('contracts.supplements.approve')}
                        </Button>
                      )}
                      {s.status === 'APPROVED' && (
                        <Button
                          variant="primary" size="sm"
                          iconLeft={<Check size={12} />}
                          onClick={() => signMutation.mutate(s.id)}
                          loading={signMutation.isPending}
                        >{t('contracts.supplements.sign')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(DEFAULT_FORM); }} title={t("contracts.supplements.modalTitle")} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("contracts.supplements.fieldNumber")} required>
              <input value={form.number} onChange={(e) => setF('number', e.target.value)}
                placeholder={t("contracts.supplements.fieldNumberPlaceholder")} className={inputCls} />
            </FormField>
            <FormField label={t("contracts.supplements.fieldDate")} required>
              <input type="date" value={form.supplementDate} onChange={(e) => setF('supplementDate', e.target.value)} className={inputCls} />
            </FormField>
          </div>

          <FormField label={t("contracts.supplements.fieldReason")}>
            <input value={form.reason} onChange={(e) => setF('reason', e.target.value)}
              placeholder={t("contracts.supplements.fieldReasonPlaceholder")} className={inputCls} />
          </FormField>

          <FormField label={t("contracts.supplements.fieldDescription")}>
            <textarea value={form.description} onChange={(e) => setF('description', e.target.value)}
              rows={3} className={`${inputCls} resize-none`}
              placeholder={t("contracts.supplements.fieldDescriptionPlaceholder")} />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label={t("contracts.supplements.fieldAmountChange")} hint={t("contracts.supplements.fieldAmountChangeHint")}>
              <input type="number" value={form.amountChange} onChange={(e) => setF('amountChange', e.target.value)}
                step="0.01" className={inputCls} />
            </FormField>
            <FormField label={t("contracts.supplements.fieldDeadlineChange")} hint={t("contracts.supplements.fieldDeadlineChangeHint")}>
              <input type="number" value={form.deadlineChange} onChange={(e) => setF('deadlineChange', e.target.value)}
                step="1" className={inputCls} />
            </FormField>
            <FormField label={t("contracts.supplements.fieldNewDeadline")}>
              <input type="date" value={form.newDeadline} onChange={(e) => setF('newDeadline', e.target.value)} className={inputCls} />
            </FormField>
          </div>

          {/* Preview */}
          {(parseFloat(form.amountChange) !== 0 || parseInt(form.deadlineChange) !== 0) && contractAmount != null && (
            <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 p-3 text-xs space-y-1">
              <p className="font-semibold text-primary-700">{t("contracts.supplements.previewAfterSigning")}:</p>
              {parseFloat(form.amountChange) !== 0 && (
                <p className="text-neutral-600">
                  {t('contracts.supplements.previewAmount')}: {formatMoney(contractAmount)} {parseFloat(form.amountChange) > 0 ? '+' : ''}{formatMoney(parseFloat(form.amountChange))} = <span className="font-semibold text-primary-700">{formatMoney(contractAmount + (parseFloat(form.amountChange) || 0))}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setModalOpen(false); setForm(DEFAULT_FORM); }}>{t("common.cancel")}</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} loading={createMutation.isPending}
              iconLeft={<PenLine size={13} />}>{t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContractSupplementsTab;
