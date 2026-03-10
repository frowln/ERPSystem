import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { t } from '@/i18n';
import type { Submittal, SubmittalReview, SubmittalStatus } from './types';

type DetailTab = 'overview' | 'reviews' | 'drawings';


const SubmittalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const statusMutation = useMutation({
    mutationFn: ({ newStatus }: { newStatus: SubmittalStatus }) =>
      submittalsApi.changeStatus(id!, newStatus),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['submittal', id] });
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
      toast.success(t('submittals.detailStatusChanged'));
    },
    onError: () => {
      toast.error(t('submittals.detailStatusError'));
    },
  });

  if (!submittal) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('submittals.detailLoading')}</div>;
  }

  const s = submittal;
  const submittalReviews = reviews ?? [];

  const handleChangeStatus = (newStatus: SubmittalStatus) => {
    statusMutation.mutate({ newStatus });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={s.title}
        subtitle={`${s.number} / ${s.projectName ?? s.projectId}`}
        backTo="/pm/submittals"
        breadcrumbs={[
          { label: t('submittals.breadcrumbHome'), href: '/' },
          { label: t('submittals.breadcrumbSubmittals'), href: '/pm/submittals' },
          { label: s.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={s.submittalType}
              colorMap={submittalTypeColorMap}
              label={submittalTypeLabels[s.submittalType] ?? s.submittalTypeDisplayName ?? s.submittalType}
              size="md"
            />
            <StatusBadge
              status={s.status}
              colorMap={submittalStatusColorMap}
              label={submittalStatusLabels[s.status] ?? s.statusDisplayName ?? s.status}
              size="md"
            />
            {s.status === 'DRAFT' && (
              <Button variant="secondary" size="sm" loading={statusMutation.isPending}
                onClick={() => handleChangeStatus('SUBMITTED')}>
                {t('submittals.detailSubmit')}
              </Button>
            )}
            {s.status === 'SUBMITTED' && (
              <>
                <Button variant="success" size="sm" loading={statusMutation.isPending}
                  onClick={() => handleChangeStatus('APPROVED')}>
                  {t('submittals.detailApprove')}
                </Button>
                <Button variant="danger" size="sm" loading={statusMutation.isPending}
                  onClick={() => handleChangeStatus('REJECTED')}>
                  {t('submittals.detailReject')}
                </Button>
              </>
            )}
            {s.status === 'REJECTED' && (
              <Button variant="secondary" size="sm" loading={statusMutation.isPending}
                onClick={() => handleChangeStatus('REVISED')}>
                {t('submittals.detailRevise')}
              </Button>
            )}
            {s.status === 'REVISED' && (
              <Button variant="secondary" size="sm" loading={statusMutation.isPending}
                onClick={() => handleChangeStatus('SUBMITTED')}>
                {t('submittals.detailResubmit')}
              </Button>
            )}
          </div>
        }
        tabs={[
          { id: 'overview', label: t('submittals.detailTabOverview') },
          { id: 'reviews', label: t('submittals.detailTabReviews'), count: submittalReviews.length },
          { id: 'drawings', label: t('submittals.detailTabDrawings'), count: s.linkedDrawingIds.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('submittals.detailDescriptionTitle')}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {s.description ?? t('submittals.detailNoDescription')}
              </p>
            </div>

            {/* Ball in court indicator */}
            {s.ballInCourt && (
              <div className="bg-primary-50 dark:bg-primary-950 rounded-xl border border-primary-200 dark:border-primary-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <User size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">{t('submittals.detailBallInCourt')}</p>
                  <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">{s.ballInCourt}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar details */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('submittals.detailDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('submittals.detailSubmittedBy')} value={s.submittedByName ?? '---'} />
              <InfoItem icon={<User size={15} />} label={t('submittals.detailReviewer')} value={s.reviewerName ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label={t('submittals.detailSubmitDate')} value={formatDateLong(s.submitDate)} />
              <InfoItem icon={<Clock size={15} />} label={t('submittals.detailDueDate')} value={formatDateLong(s.dueDate)} />
              <InfoItem icon={<Calendar size={15} />} label={t('submittals.detailRequiredDate')} value={formatDateLong(s.requiredDate)} />
              <InfoItem icon={<Clock size={15} />} label={t('submittals.detailLeadTime')} value={s.leadTimeDays ? `${s.leadTimeDays} ${t('submittals.days')}` : '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('submittals.detailSection')} value={s.specSection ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('submittals.detailProject')} value={s.projectName ?? '---'} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('submittals.detailReviewHistoryTitle')}</h3>
          {submittalReviews.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">{t('submittals.detailNoReviews')}</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-8 bottom-8 w-px bg-neutral-200 dark:bg-neutral-700" />
              <div className="space-y-6">
                {submittalReviews.map((review) => (
                  <div key={review.id} className="relative flex gap-4">
                    <div className={cn(
                      'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      review.status === 'APPROVED' ? 'bg-success-100 dark:bg-success-900' :
                      review.status === 'REJECTED' ? 'bg-danger-100 dark:bg-danger-900' :
                      'bg-warning-100 dark:bg-warning-900',
                    )}>
                      {review.status === 'APPROVED' ? (
                        <CheckCircle2 size={16} className="text-success-600 dark:text-success-400" />
                      ) : review.status === 'REJECTED' ? (
                        <XCircle size={16} className="text-danger-600 dark:text-danger-400" />
                      ) : (
                        <AlertCircle size={16} className="text-warning-600 dark:text-warning-400" />
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
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{review.comment}</p>
                      )}
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDateLong(review.reviewDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'drawings' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('submittals.detailLinkedDrawingsTitle')}</h3>
            <Button variant="secondary" size="sm" onClick={() => navigate('/bim/models')}>
              {t('submittals.detailBimModels')}
            </Button>
          </div>
          {s.linkedDrawingIds.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('submittals.detailNoDrawings')}</div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {s.linkedDrawingIds.map((drawingId) => (
                <div key={drawingId} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                    <Image size={16} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{t('submittals.detailDrawingName', { id: drawingId.toUpperCase() })}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('submittals.detailDrawingLinked', { number: s.number })}</p>
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
    <span className="text-neutral-400 dark:text-neutral-500 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default SubmittalDetailPage;
