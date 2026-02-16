import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentApi } from '@/api/recruitment';
import {
  User,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Star,
  Clock,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  applicantStatusColorMap,
  applicantStatusLabels,
  applicantPriorityColorMap,
  applicantPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatDateLong, formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Applicant, Interview } from './types';

const statusFlow = [
  { status: 'NEW', label: t('recruitment.detail.statusNew') },
  { status: 'SCREENING', label: t('recruitment.detail.statusScreening') },
  { status: 'INTERVIEW', label: t('recruitment.detail.statusInterview') },
  { status: 'OFFER', label: t('recruitment.detail.statusOffer') },
  { status: 'HIRED', label: t('recruitment.detail.statusHired') },
];

const interviewTypeLabels: Record<string, string> = {
  phone: 'Телефонное', video: 'Видео', onsite: 'Очное', technical: 'Техническое', hr: 'HR',
};

const interviewStatusLabels: Record<string, string> = {
  scheduled: 'Запланировано', in_progress: 'Проходит', completed: 'Завершено', cancelled: 'Отменено', no_show: 'Неявка',
};


const ApplicantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ applicantId, status }: { applicantId: string; status: string }) =>
      recruitmentApi.updateApplicant(applicantId, { status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });

  const { data: applicant, isLoading } = useQuery<Applicant>({
    queryKey: ['applicant', id],
    queryFn: () => recruitmentApi.getApplicant(id!),
    enabled: !!id,
  });

  const { data: interviews } = useQuery<Interview[]>({
    queryKey: ['applicant-interviews', id],
    queryFn: () => recruitmentApi.getInterviews(id!),
    enabled: !!id,
  });

  if (isLoading || !applicant) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  }

  const a = applicant;
  const interviewList = interviews ?? [];

  const statusActions = useMemo(() => {
    switch (a.status) {
      case 'NEW': return [{ label: 'Начать скрининг', targetStatus: 'SCREENING' }];
      case 'SCREENING': return [
        { label: 'Пригласить на собеседование', targetStatus: 'INTERVIEW' },
        { label: 'Отклонить', targetStatus: 'REJECTED' },
      ];
      case 'INTERVIEW': return [
        { label: 'Сделать оффер', targetStatus: 'OFFER' },
        { label: 'Отклонить', targetStatus: 'REJECTED' },
      ];
      case 'OFFER': return [
        { label: 'Принять на работу', targetStatus: 'HIRED' },
        { label: 'Кандидат отказался', targetStatus: 'WITHDRAWN' },
      ];
      default: return [];
    }
  }, [a.status]);

  const currentStepIndex = statusFlow.findIndex((s) => s.status === a.status);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={a.fullName}
        subtitle={`${a.number} / ${a.positionName}`}
        backTo="/recruitment/applicants"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Рекрутинг', href: '/recruitment/applicants' },
          { label: a.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={a.status}
              colorMap={applicantStatusColorMap}
              label={applicantStatusLabels[a.status] ?? a.status}
              size="md"
            />
            <StatusBadge
              status={a.priority}
              colorMap={applicantPriorityColorMap}
              label={applicantPriorityLabels[a.priority] ?? a.priority}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant="secondary"
                size="sm"
                onClick={() => statusMutation.mutate({ applicantId: id!, status: action.targetStatus })}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Status flow */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Процесс подбора</h3>
        <div className="flex items-center gap-2">
          {statusFlow.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <React.Fragment key={step.status}>
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                    isCompleted && 'bg-success-50 text-success-700',
                    isCurrent && 'bg-primary-50 text-primary-700 ring-2 ring-primary-200',
                    !isCompleted && !isCurrent && 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400',
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    isCompleted && 'bg-success-500 text-white',
                    isCurrent && 'bg-primary-500 text-white',
                    !isCompleted && !isCurrent && 'bg-neutral-200 text-neutral-400',
                  )}>
                    {idx + 1}
                  </span>
                  {step.label}
                </div>
                {idx < statusFlow.length - 1 && (
                  <ArrowRight size={16} className="text-neutral-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Star size={18} />} label="Опыт работы" value={`${a.experienceYears ?? 0} лет`} />
        <MetricCard icon={<Briefcase size={18} />} label="Ожидаемая ЗП" value={a.expectedSalary ? formatMoney(a.expectedSalary) : '---'} />
        <MetricCard icon={<Clock size={18} />} label="Собеседований" value={a.interviewCount} />
        <MetricCard icon={<Calendar size={18} />} label="Дата заявки" value={formatDateLong(a.appliedAt)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes / Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              Заметки
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {a.notes ?? 'Заметки не заполнены'}
            </div>
          </div>

          {/* Interviews */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Собеседования</h3>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/recruitment/applicants/${id}/interviews/new`)}>
                Запланировать
              </Button>
            </div>
            {interviewList.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Собеседований пока нет</p>
            ) : (
              <div className="space-y-3">
                {interviewList.map((interview) => (
                  <div key={interview.id} className="p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {interviewTypeLabels[interview.type] ?? interview.type}
                        </span>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          interview.status === 'COMPLETED' ? 'bg-success-50 text-success-700' :
                          interview.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' :
                          'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
                        )}>
                          {interviewStatusLabels[interview.status] ?? interview.status}
                        </span>
                      </div>
                      {interview.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < interview.rating! ? 'text-warning-500 fill-warning-500' : 'text-neutral-200'}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Интервьюер: {interview.interviewerName} | {formatDateLong(interview.scheduledAt)} | {interview.duration} мин.
                    </p>
                    {interview.feedback && (
                      <p className="text-sm text-neutral-600 mt-2 italic">"{interview.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Контакты</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label="ФИО" value={a.fullName} />
              <InfoItem icon={<Mail size={15} />} label="Email" value={a.email} />
              <InfoItem icon={<Phone size={15} />} label="Телефон" value={a.phone ?? '---'} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Детали</h3>
            <div className="space-y-4">
              <InfoItem icon={<Briefcase size={15} />} label="Должность" value={a.positionName} />
              <InfoItem icon={<Briefcase size={15} />} label="Отдел" value={a.departmentName ?? '---'} />
              <InfoItem icon={<User size={15} />} label="Рекрутер" value={a.recruiterName ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label="Источник" value={a.source ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label="Подана" value={formatDateLong(a.appliedAt)} />
              <InfoItem icon={<Calendar size={15} />} label="Обновлено" value={formatDateLong(a.updatedAt)} />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Действия</h3>
            <div className="space-y-2">
              {a.resumeUrl && (
                <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => window.open(a.resumeUrl, '_blank')}>
                  Скачать резюме
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.open(`/api/recruitment/applicants/${id}/export?format=pdf`, '_blank')}>
                Экспорт в PDF
              </Button>
            </div>
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
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default ApplicantDetailPage;
