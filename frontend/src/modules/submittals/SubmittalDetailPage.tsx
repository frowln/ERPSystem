import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  submittalStatusColorMap,
  submittalStatusLabels,
  submittalTypeColorMap,
  submittalTypeLabels,
} from '@/design-system/components/StatusBadge';
import { submittalsApi } from '@/api/submittals';
import { formatDateLong } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Submittal, SubmittalReview } from './types';

type DetailTab = 'overview' | 'reviews' | 'drawings';


const SubmittalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const { data: submittal } = useQuery<Submittal>({
    queryKey: ['submittal', id],
    queryFn: () => submittalsApi.getSubmittal(id!),
    enabled: !!id,
  });

  const { data: reviews } = useQuery<SubmittalReview[]>({
    queryKey: ['submittal-reviews', id],
    queryFn: () => submittalsApi.getSubmittalReviews(id!),
    enabled: !!id && activeTab === 'reviews',
  });

  if (!submittal) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  }

  const s = submittal;
  const submittalReviews = reviews ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={s.title}
        subtitle={`${s.number} / ${s.projectName}`}
        backTo="/submittals"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Субмиттелы', href: '/submittals' },
          { label: s.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={s.type}
              colorMap={submittalTypeColorMap}
              label={submittalTypeLabels[s.type] ?? s.type}
              size="md"
            />
            <StatusBadge
              status={s.status}
              colorMap={submittalStatusColorMap}
              label={submittalStatusLabels[s.status] ?? s.status}
              size="md"
            />
            {s.status === 'SUBMITTED' && (
              <Button variant="secondary" size="sm">Начать рассмотрение</Button>
            )}
            {s.status === 'UNDER_REVIEW' && (
              <>
                <Button variant="success" size="sm">Утвердить</Button>
                <Button variant="danger" size="sm">Отклонить</Button>
              </>
            )}
          </div>
        }
        tabs={[
          { id: 'overview', label: 'Обзор' },
          { id: 'reviews', label: 'История рассмотрения', count: submittalReviews.length },
          { id: 'drawings', label: 'Чертежи', count: s.linkedDrawingIds.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Описание</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {s.description ?? 'Описание не указано'}
              </p>
            </div>

            {/* Ball in court indicator */}
            {s.ballInCourt && (
              <div className="bg-primary-50 rounded-xl border border-primary-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">У кого мяч</p>
                  <p className="text-sm font-semibold text-primary-900">{s.ballInCourt}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar details */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Детали</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label="Подал" value={s.submittedByName} />
              <InfoItem icon={<User size={15} />} label="Рецензент" value={s.reviewerName ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label="Дата подачи" value={formatDateLong(s.submitDate)} />
              <InfoItem icon={<Clock size={15} />} label="Срок рассмотрения" value={formatDateLong(s.dueDate)} />
              <InfoItem icon={<Calendar size={15} />} label="Требуемая дата" value={formatDateLong(s.requiredDate)} />
              <InfoItem icon={<Clock size={15} />} label="Lead Time" value={s.leadTimeDays ? `${s.leadTimeDays} дн.` : '---'} />
              <InfoItem icon={<FileText size={15} />} label="Раздел" value={s.specSection ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label="Проект" value={s.projectName ?? '---'} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-6">История рассмотрения</h3>
          <div className="relative">
            <div className="absolute left-4 top-8 bottom-8 w-px bg-neutral-200" />
            <div className="space-y-6">
              {submittalReviews.map((review) => (
                <div key={review.id} className="relative flex gap-4">
                  <div className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    ['APPROVED', 'APPROVED_AS_NOTED'].includes(review.status) ? 'bg-success-100' :
                    ['REJECTED', 'REVISE_RESUBMIT'].includes(review.status) ? 'bg-danger-100' :
                    'bg-warning-100',
                  )}>
                    {['APPROVED', 'APPROVED_AS_NOTED'].includes(review.status) ? (
                      <CheckCircle2 size={16} className="text-success-600" />
                    ) : ['REJECTED', 'REVISE_RESUBMIT'].includes(review.status) ? (
                      <XCircle size={16} className="text-danger-600" />
                    ) : (
                      <AlertCircle size={16} className="text-warning-600" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{review.reviewerName}</h4>
                      <StatusBadge
                        status={review.status}
                        colorMap={submittalStatusColorMap}
                        label={submittalStatusLabels[review.status] ?? review.status}
                      />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-neutral-600 mt-1">{review.comment}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDateLong(review.reviewDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'drawings' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Связанные чертежи</h3>
            <Button variant="secondary" size="sm" onClick={() => navigate('/bim/models')}>
              BIM-модели
            </Button>
          </div>
          {s.linkedDrawingIds.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">Нет связанных чертежей</div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {s.linkedDrawingIds.map((drawingId) => (
                <div key={drawingId} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Image size={16} className="text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">Чертеж {drawingId.toUpperCase()}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Связан с субмитталом {s.number}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default SubmittalDetailPage;
