import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  User,
  Calendar,
  Clock,
  Hash,
  Edit,
  Trash2,
  FileText,
  ArrowRightLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { accountingApi } from '@/api/accounting';
import { formatMoney, formatDateLong, formatDateTime } from '@/lib/format';
import { t } from '@/i18n';

const JournalEntryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const {
    data: entry,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['journal-entry', id],
    queryFn: () => accountingApi.getJournalEntry(id!),
    enabled: Boolean(id),
  });

  const { data: accountsPage } = useQuery({
    queryKey: ['accounting-accounts', 'journal-detail'],
    queryFn: () => accountingApi.getAccounts({ page: 0, size: 500, sort: 'code,asc' }),
  });

  const accountById = useMemo(() => {
    const map = new Map<string, string>();
    (accountsPage?.content ?? []).forEach((account) => {
      map.set(account.id, `${account.code} - ${account.name}`);
    });
    return map;
  }, [accountsPage?.content]);

  const deleteMutation = useMutation({
    mutationFn: () => accountingApi.deleteJournalEntry(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success(t('accounting.detailDeleteSuccess'));
      navigate('/accounting/journal');
    },
    onError: () => {
      toast.error(t('accounting.detailDeleteError'));
    },
  });

  if (isError && !entry) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('accounting.breadcrumbJournalEntry')}
          subtitle={t('accounting.detailViewSubtitle')}
          backTo="/accounting/journal"
          breadcrumbs={[
            { label: t('accounting.breadcrumbHome'), href: '/' },
            { label: t('accounting.breadcrumbAccounting'), href: '/accounting' },
            { label: t('accounting.breadcrumbJournalEntries'), href: '/accounting/journal' },
            { label: t('accounting.breadcrumbJournalEntry') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('accounting.detailErrorTitle')}
          description={t('accounting.detailErrorDescription')}
          actionLabel={t('accounting.retry')}
          onAction={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!entry && isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('accounting.breadcrumbJournalEntry')}
          subtitle={t('accounting.detailLoadingSubtitle')}
          backTo="/accounting/journal"
          breadcrumbs={[
            { label: t('accounting.breadcrumbHome'), href: '/' },
            { label: t('accounting.breadcrumbAccounting'), href: '/accounting' },
            { label: t('accounting.breadcrumbJournalEntries'), href: '/accounting/journal' },
            { label: t('accounting.breadcrumbJournalEntry') },
          ]}
        />
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  const debitLabel = accountById.get(entry.debitAccountId) ?? entry.debitAccountId;
  const creditLabel = accountById.get(entry.creditAccountId) ?? entry.creditAccountId;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={entry.number}
        subtitle={t('accounting.detailSubtitle')}
        backTo="/accounting/journal"
        breadcrumbs={[
          { label: t('accounting.breadcrumbHome'), href: '/' },
          { label: t('accounting.breadcrumbAccounting'), href: '/accounting' },
          { label: t('accounting.breadcrumbJournalEntries'), href: '/accounting/journal' },
          { label: entry.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => navigate(`/accounting/journal/${entry.id}/edit`)}
            >
              {t('accounting.detailEditButton')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              iconLeft={<Trash2 size={14} />}
              onClick={async () => {
                const confirmed = await confirm({
                  title: t('accounting.detailDeleteTitle'),
                  description: t('accounting.detailDeleteDescription'),
                  confirmLabel: t('accounting.detailDeleteConfirm'),
                  cancelLabel: t('accounting.detailDeleteCancel'),
                  items: [entry.number],
                });

                if (!confirmed) return;
                deleteMutation.mutate();
              }}
            >
              {t('accounting.detailDeleteButton')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-primary-500" />
              {t('accounting.detailOperationTitle')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{entry.description}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-primary-500" />
              {t('accounting.detailCorrespondenceTitle')}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('accounting.detailCorrespondenceSide')}</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('accounting.detailCorrespondenceAccount')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('accounting.detailCorrespondenceAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100">
                    <td className="py-3 pr-4 text-neutral-600">{t('accounting.detailCorrespondenceDebit')}</td>
                    <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100">{debitLabel}</td>
                    <td className="py-3 pl-4 text-right font-medium">{formatMoney(entry.amount)}</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-3 pr-4 text-neutral-600">{t('accounting.detailCorrespondenceCredit')}</td>
                    <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100">{creditLabel}</td>
                    <td className="py-3 pl-4 text-right font-medium">{formatMoney(entry.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('accounting.detailDocumentTitle')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('accounting.detailDocumentType')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.documentType ?? t('accounting.notSpecified')}</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('accounting.detailDocumentUuid')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 break-all">{entry.documentId ?? t('accounting.notSpecified')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('accounting.detailSidebarTitle')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Hash size={15} />} label={t('accounting.detailLabelNumber')} value={entry.number} />
              <InfoItem icon={<Calendar size={15} />} label={t('accounting.detailLabelDate')} value={formatDateLong(entry.entryDate)} />
              <InfoItem icon={<User size={15} />} label={t('accounting.detailLabelCreatedBy')} value={entry.createdBy ?? t('accounting.system')} />
              <InfoItem icon={<Clock size={15} />} label={t('accounting.detailLabelCreatedAt')} value={formatDateTime(entry.createdAt)} />
              <InfoItem icon={<Hash size={15} />} label={t('accounting.detailLabelPeriodUuid')} value={entry.periodId} />
              <InfoItem icon={<Hash size={15} />} label={t('accounting.detailLabelJournalUuid')} value={entry.journalId} />
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl border border-primary-200 p-6">
            <h3 className="text-sm font-semibold text-primary-900 mb-3">{t('accounting.detailAmountTitle')}</h3>
            <p className="text-lg font-bold text-primary-900 tabular-nums">{formatMoney(entry.amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 break-all">{value}</p>
    </div>
  </div>
);

export default JournalEntryDetailPage;
