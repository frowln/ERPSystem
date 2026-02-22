import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  PenLine,
  CheckCheck,
  Plus,
  X,
  FileText,
  Calendar,
  TrendingDown,
  Banknote,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import {
  StatusBadge,
  closingDocStatusColorMap,
  closingDocStatusLabels,
} from '@/design-system/components/StatusBadge';
import { closingApi } from '@/api/closing';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Ks2Document, Ks3Document, PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------
interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, highlight }) => (
  <div
    className={cn(
      'rounded-xl border p-4 flex items-start gap-3',
      highlight
        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
    )}
  >
    <span
      className={cn(
        'mt-0.5 flex-shrink-0',
        highlight ? 'text-success-600 dark:text-success-400' : 'text-neutral-400 dark:text-neutral-500',
      )}
    >
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 truncate">{label}</p>
      <p
        className={cn(
          'text-base font-semibold tabular-nums truncate',
          highlight
            ? 'text-success-700 dark:text-success-300'
            : 'text-neutral-900 dark:text-neutral-100',
        )}
      >
        {value}
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// KS-2 Picker Modal
// ---------------------------------------------------------------------------
interface Ks2PickerModalProps {
  open: boolean;
  onClose: () => void;
  ks3: Ks3Document;
  onLink: (ks2Id: string) => void;
  isLinking: boolean;
}

const Ks2PickerModal: React.FC<Ks2PickerModalProps> = ({
  open,
  onClose,
  ks3,
  onLink,
  isLinking,
}) => {
  const { data: ks2Data, isLoading } = useQuery<PaginatedResponse<Ks2Document>>({
    queryKey: ['ks2-for-picker', ks3.contractId],
    queryFn: () => closingApi.getKs2Documents({ contractId: ks3.contractId, size: 100 }),
    enabled: open,
  });

  const linkedIds = new Set(ks3.ks2DocumentIds ?? []);
  const availableKs2s = useMemo(
    () => (ks2Data?.content ?? []).filter((doc) => !linkedIds.has(doc.id)),
    [ks2Data, linkedIds],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('closing.ks3.pickerTitle')}
      description={t('closing.ks3.pickerDescription')}
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin text-primary-500" />
        </div>
      ) : availableKs2s.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText size={32} className="text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('closing.ks3.pickerEmpty')}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {availableKs2s.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {doc.number} — {doc.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {formatDate(doc.documentDate)} &middot; {formatMoney(doc.totalAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge
                  status={doc.status}
                  colorMap={closingDocStatusColorMap}
                  label={closingDocStatusLabels[doc.status] ?? doc.status}
                />
                <Button
                  variant="secondary"
                  size="xs"
                  loading={isLinking}
                  onClick={() => onLink(doc.id)}
                >
                  {t('closing.ks3.pickerLink')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const Ks3DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    data: ks3,
    isLoading,
    isError,
  } = useQuery<Ks3Document>({
    queryKey: ['ks3', id],
    queryFn: () => closingApi.getKs3(id!),
    enabled: !!id,
  });

  // Fetch full KS-2 details for linked documents
  const linkedIds = ks3?.ks2DocumentIds ?? [];
  const { data: allKs2Data } = useQuery<PaginatedResponse<Ks2Document>>({
    queryKey: ['ks2-linked', id, linkedIds.join(',')],
    queryFn: () =>
      closingApi.getKs2Documents({
        contractId: ks3!.contractId,
        size: 500,
      }),
    enabled: !!ks3 && linkedIds.length > 0,
  });

  const linkedKs2Docs = useMemo(() => {
    if (!allKs2Data) return [];
    const idSet = new Set(linkedIds);
    return (allKs2Data.content ?? []).filter((doc) => idSet.has(doc.id));
  }, [allKs2Data, linkedIds]);

  // ---- Mutations ----
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ks3', id] });
    queryClient.invalidateQueries({ queryKey: ['ks3-documents'] });
  };

  const submitMutation = useMutation({
    mutationFn: () => closingApi.submitKs3(id!),
    onSuccess: () => {
      toast.success(t('closing.ks3.toastSubmitted'));
      invalidate();
    },
    onError: () => toast.error(t('closing.ks3.toastError')),
  });

  const signMutation = useMutation({
    mutationFn: () => closingApi.signKs3(id!),
    onSuccess: () => {
      toast.success(t('closing.ks3.toastSigned'));
      invalidate();
    },
    onError: () => toast.error(t('closing.ks3.toastError')),
  });

  const closeMutation = useMutation({
    mutationFn: () => closingApi.closeKs3(id!),
    onSuccess: () => {
      toast.success(t('closing.ks3.toastClosed'));
      invalidate();
    },
    onError: () => toast.error(t('closing.ks3.toastError')),
  });

  const linkMutation = useMutation({
    mutationFn: (ks2Id: string) => closingApi.linkKs2ToKs3(id!, ks2Id),
    onSuccess: () => {
      toast.success(t('closing.ks3.toastLinked'));
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['ks2-linked', id] });
      setPickerOpen(false);
    },
    onError: () => toast.error(t('closing.ks3.toastError')),
  });

  const unlinkMutation = useMutation({
    mutationFn: (ks2Id: string) => closingApi.unlinkKs2FromKs3(id!, ks2Id),
    onSuccess: () => {
      toast.success(t('closing.ks3.toastUnlinked'));
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['ks2-linked', id] });
    },
    onError: () => toast.error(t('closing.ks3.toastError')),
  });

  // ---- Loading / error states ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError || !ks3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('closing.ks3.loadError')}
        </p>
        <Button variant="secondary" onClick={() => navigate('/ks3')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const isDraft = ks3.status === 'DRAFT';
  const isSubmitted = ks3.status === 'SUBMITTED';
  const isSigned = ks3.status === 'SIGNED';

  const actionBusy =
    submitMutation.isPending || signMutation.isPending || closeMutation.isPending;

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge
        status={ks3.status}
        colorMap={closingDocStatusColorMap}
        label={closingDocStatusLabels[ks3.status] ?? ks3.status}
        size="md"
      />
      {ks3.oneCPostingStatus && ks3.oneCPostingStatus !== 'NOT_SENT' && (
        <StatusBadge
          status={ks3.oneCPostingStatus}
          colorMap={{ SENT: 'blue', POSTED: 'green', ERROR: 'red' }}
          label={ks3.oneCPostingStatusDisplayName ?? ks3.oneCPostingStatus}
          size="md"
        />
      )}
      {isDraft && (
        <Button
          size="sm"
          iconLeft={<Send size={14} />}
          loading={submitMutation.isPending}
          disabled={actionBusy}
          onClick={() => submitMutation.mutate()}
        >
          {t('closing.ks3.actionSubmit')}
        </Button>
      )}
      {isSubmitted && (
        <Button
          size="sm"
          variant="success"
          iconLeft={<PenLine size={14} />}
          loading={signMutation.isPending}
          disabled={actionBusy}
          onClick={() => signMutation.mutate()}
        >
          {t('closing.ks3.actionSign')}
        </Button>
      )}
      {isSigned && (
        <Button
          size="sm"
          variant="secondary"
          iconLeft={<CheckCheck size={14} />}
          loading={closeMutation.isPending}
          disabled={actionBusy}
          onClick={() => closeMutation.mutate()}
        >
          {t('closing.ks3.actionClose')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${t('closing.ks3.detailTitlePrefix')} №${ks3.number}`}
        subtitle={ks3.name}
        backTo="/ks3"
        breadcrumbs={[
          { label: t('closing.ks3.breadcrumbHome'), href: '/' },
          { label: t('closing.ks3.breadcrumbKs3'), href: '/ks3' },
          { label: ks3.number },
        ]}
        actions={headerActions}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<Calendar size={18} />}
          label={t('closing.ks3.cardPeriod')}
          value={`${formatDate(ks3.periodFrom)} — ${formatDate(ks3.periodTo)}`}
        />
        <SummaryCard
          icon={<FileText size={18} />}
          label={t('closing.ks3.cardTotalAmount')}
          value={formatMoney(ks3.totalAmount)}
        />
        <SummaryCard
          icon={<TrendingDown size={18} />}
          label={`${t('closing.ks3.cardRetention')} (${ks3.retentionPercent}%)`}
          value={formatMoney(ks3.retentionAmount)}
        />
        <SummaryCard
          icon={<Banknote size={18} />}
          label={t('closing.ks3.cardNetAmount')}
          value={formatMoney(ks3.netAmount)}
          highlight
        />
      </div>

      {/* Linked KS-2 acts */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('closing.ks3.sectionKs2')}{' '}
            <span className="ml-1 text-xs font-normal text-neutral-500 dark:text-neutral-400">
              ({linkedKs2Docs.length})
            </span>
          </h2>
          {isDraft && (
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => setPickerOpen(true)}
            >
              {t('closing.ks3.addKs2')}
            </Button>
          )}
        </div>

        {linkedKs2Docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={32} className="text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('closing.ks3.emptyKs2')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {t('closing.ks3.colKs2Number')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {t('closing.ks3.colKs2Name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {t('closing.ks3.colKs2Date')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {t('closing.ks3.colKs2Amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {t('closing.ks3.colKs2Status')}
                  </th>
                  {isDraft && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      {t('closing.ks3.colKs2Actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
                {linkedKs2Docs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {doc.number}
                    </td>
                    <td className="px-6 py-3 font-medium text-neutral-900 dark:text-neutral-100 max-w-xs truncate">
                      {doc.name}
                    </td>
                    <td className="px-6 py-3 tabular-nums text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {formatDate(doc.documentDate)}
                    </td>
                    <td className="px-6 py-3 tabular-nums text-right font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {formatMoney(doc.totalAmount)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <StatusBadge
                        status={doc.status}
                        colorMap={closingDocStatusColorMap}
                        label={closingDocStatusLabels[doc.status] ?? doc.status}
                      />
                    </td>
                    {isDraft && (
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          aria-label={t('closing.ks3.unlinkKs2')}
                          disabled={unlinkMutation.isPending}
                          onClick={() => unlinkMutation.mutate(doc.id)}
                          className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                            'text-neutral-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20',
                            'disabled:opacity-40 disabled:pointer-events-none',
                          )}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KS-2 picker modal */}
      {ks3 && (
        <Ks2PickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          ks3={ks3}
          onLink={(ks2Id) => linkMutation.mutate(ks2Id)}
          isLinking={linkMutation.isPending}
        />
      )}
    </div>
  );
};

export default Ks3DetailPage;
