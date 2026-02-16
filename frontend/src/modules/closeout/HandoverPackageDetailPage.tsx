import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Calendar, User, Building2, FileText } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { closeoutApi } from '@/api/closeout';
import { formatDate, formatDateTime } from '@/lib/format';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  DRAFT: 'gray',
  PREPARED: 'yellow',
  SUBMITTED: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PREPARED: 'Подготовлен',
  SUBMITTED: 'Передан',
  ACCEPTED: 'Принят',
  REJECTED: 'Отклонён',
};

const HandoverPackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: handoverPackage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['handover-package', id],
    queryFn: () => closeoutApi.getHandoverPackage(id!),
    enabled: Boolean(id),
  });

  if (!id) {
    return <EmptyState variant="ERROR" title="Некорректный идентификатор пакета" />;
  }

  if (isError && !handoverPackage) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Пакет передачи"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Передача', href: '/closeout/handover' },
          ]}
          actions={(
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/handover')}>
              Назад к списку
            </Button>
          )}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить пакет передачи"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
          onAction={() => { void refetch(); }}
        />
      </div>
    );
  }

  if (isLoading && !handoverPackage) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-sm text-neutral-500 dark:text-neutral-400">
        Загрузка пакета передачи...
      </div>
    );
  }

  if (!handoverPackage) {
    return <EmptyState variant="ERROR" title="Пакет передачи не найден" />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={handoverPackage.packageNumber}
        subtitle={handoverPackage.title}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Передача', href: '/closeout/handover' },
          { label: handoverPackage.packageNumber },
        ]}
        actions={(
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/handover')}>
            Назад к списку
          </Button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Статус передачи</h3>
              <StatusBadge
                status={handoverPackage.status}
                colorMap={statusColorMap}
                label={statusLabels[handoverPackage.status] ?? handoverPackage.status}
              />
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Документов в пакете: <span className="font-semibold">{handoverPackage.documentCount}</span>
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Описание пакета</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{handoverPackage.description ?? 'Описание не указано'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-3">
            <InfoRow icon={<Package size={14} />} label="Пакет" value={handoverPackage.title} />
            <InfoRow icon={<Building2 size={14} />} label="Проект" value={handoverPackage.projectName} />
            <InfoRow icon={<User size={14} />} label="Получатель" value={handoverPackage.recipientName} />
            <InfoRow icon={<Building2 size={14} />} label="Организация" value={handoverPackage.recipientOrg} />
            <InfoRow icon={<Calendar size={14} />} label="Дата передачи" value={formatDate(handoverPackage.handoverDate)} />
            <InfoRow icon={<Calendar size={14} />} label="Дата приёмки" value={formatDate(handoverPackage.acceptedDate)} />
            <InfoRow icon={<User size={14} />} label="Принял" value={handoverPackage.acceptedByName ?? '—'} />
            <InfoRow icon={<FileText size={14} />} label="Создан" value={formatDateTime(handoverPackage.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-neutral-400 mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-sm text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  </div>
);

export default HandoverPackageDetailPage;
