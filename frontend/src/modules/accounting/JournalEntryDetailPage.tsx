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
      toast.success('Проводка удалена');
      navigate('/accounting/journal');
    },
    onError: () => {
      toast.error('Не удалось удалить проводку');
    },
  });

  if (isError && !entry) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Проводка"
          subtitle="Детальный просмотр"
          backTo="/accounting/journal"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Бухгалтерия', href: '/accounting' },
            { label: 'Журнал проводок', href: '/accounting/journal' },
            { label: 'Проводка' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить проводку"
          description="Запись не найдена или временно недоступна"
          actionLabel="Повторить"
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
          title="Проводка"
          subtitle="Загрузка..."
          backTo="/accounting/journal"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Бухгалтерия', href: '/accounting' },
            { label: 'Журнал проводок', href: '/accounting/journal' },
            { label: 'Проводка' },
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
        subtitle="Бухгалтерская проводка"
        backTo="/accounting/journal"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Бухгалтерия', href: '/accounting' },
          { label: 'Журнал проводок', href: '/accounting/journal' },
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
              Редактировать
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              iconLeft={<Trash2 size={14} />}
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Удалить проводку?',
                  description: 'Операция необратима. Проводка будет удалена из журнала.',
                  confirmLabel: 'Удалить',
                  cancelLabel: 'Отмена',
                  items: [entry.number],
                });

                if (!confirmed) return;
                deleteMutation.mutate();
              }}
            >
              Удалить
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-primary-500" />
              Описание операции
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{entry.description}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-primary-500" />
              Корреспонденция счетов
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">Сторона</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">Счёт</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100">
                    <td className="py-3 pr-4 text-neutral-600">Дебет</td>
                    <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100">{debitLabel}</td>
                    <td className="py-3 pl-4 text-right font-medium">{formatMoney(entry.amount)}</td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-3 pr-4 text-neutral-600">Кредит</td>
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
              Документ-основание
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Тип документа</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.documentType ?? 'Не указан'}</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">UUID документа</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 break-all">{entry.documentId ?? 'Не указан'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Детали</h3>
            <div className="space-y-4">
              <InfoItem icon={<Hash size={15} />} label="Номер" value={entry.number} />
              <InfoItem icon={<Calendar size={15} />} label="Дата" value={formatDateLong(entry.entryDate)} />
              <InfoItem icon={<User size={15} />} label="Создал" value={entry.createdBy ?? 'Система'} />
              <InfoItem icon={<Clock size={15} />} label="Создано" value={formatDateTime(entry.createdAt)} />
              <InfoItem icon={<Hash size={15} />} label="UUID периода" value={entry.periodId} />
              <InfoItem icon={<Hash size={15} />} label="UUID журнала" value={entry.journalId} />
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl border border-primary-200 p-6">
            <h3 className="text-sm font-semibold text-primary-900 mb-3">Сумма</h3>
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
