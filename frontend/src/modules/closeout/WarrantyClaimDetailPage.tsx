import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldAlert, Calendar, User, Building2, MapPin, Wrench } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { closeoutApi } from '@/api/closeout';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'cyan'> = {
  OPEN: 'yellow',
  IN_REVIEW: 'blue',
  APPROVED: 'cyan',
  IN_REPAIR: 'orange',
  RESOLVED: 'green',
  REJECTED: 'red',
  CLOSED: 'gray',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Открыта',
  IN_REVIEW: 'На рассмотрении',
  APPROVED: 'Одобрена',
  IN_REPAIR: 'В ремонте',
  RESOLVED: 'Устранена',
  REJECTED: 'Отклонена',
  CLOSED: 'Закрыта',
};

const defectTypeLabels: Record<string, string> = {
  STRUCTURAL: 'Конструктивный',
  MECHANICAL: 'Механический',
  ELECTRICAL: 'Электрический',
  PLUMBING: 'Сантехника',
  FINISHING: 'Отделка',
  WATERPROOFING: 'Гидроизоляция',
  OTHER: 'Прочее',
};

const WarrantyClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: claim,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['warranty-claim', id],
    queryFn: () => closeoutApi.getWarrantyClaim(id!),
    enabled: Boolean(id),
  });

  if (!id) {
    return <EmptyState variant="ERROR" title="Некорректный идентификатор обращения" />;
  }

  if (isError && !claim) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Гарантийное обращение"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Гарантия', href: '/closeout/warranty' },
          ]}
          actions={(
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/warranty')}>
              Назад к списку
            </Button>
          )}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить обращение"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
          onAction={() => { void refetch(); }}
        />
      </div>
    );
  }

  if (isLoading && !claim) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-sm text-neutral-500 dark:text-neutral-400">
        Загрузка гарантийного обращения...
      </div>
    );
  }

  if (!claim) {
    return <EmptyState variant="ERROR" title="Гарантийное обращение не найдено" />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={claim.claimNumber}
        subtitle={claim.title}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Гарантия', href: '/closeout/warranty' },
          { label: claim.claimNumber },
        ]}
        actions={(
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/warranty')}>
            Назад к списку
          </Button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Статус обращения</h3>
              <StatusBadge
                status={claim.status}
                colorMap={statusColorMap}
                label={statusLabels[claim.status] ?? claim.status}
              />
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{claim.description}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Финансовая оценка</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Оценка ремонта</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(claim.estimatedCost)}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Фактическая стоимость</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(claim.actualCost)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-3">
            <InfoRow icon={<ShieldAlert size={14} />} label="Тип дефекта" value={defectTypeLabels[claim.defectType] ?? claim.defectType} />
            <InfoRow icon={<Building2 size={14} />} label="Проект" value={claim.projectName} />
            <InfoRow icon={<MapPin size={14} />} label="Локация" value={claim.location ?? '—'} />
            <InfoRow icon={<User size={14} />} label="Заявитель" value={claim.reportedByName} />
            <InfoRow icon={<Wrench size={14} />} label="Исполнитель" value={claim.assignedToName ?? '—'} />
            <InfoRow icon={<Calendar size={14} />} label="Дата обращения" value={formatDate(claim.reportedDate)} />
            <InfoRow icon={<Calendar size={14} />} label="Гарантия до" value={formatDate(claim.warrantyExpiryDate)} />
            <InfoRow icon={<Calendar size={14} />} label="Дата решения" value={formatDate(claim.resolvedDate)} />
            <InfoRow icon={<Calendar size={14} />} label="Создано" value={formatDateTime(claim.createdAt)} />
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

export default WarrantyClaimDetailPage;
