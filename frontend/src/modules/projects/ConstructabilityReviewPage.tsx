import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import {
  constructabilityReviewStatusColorMap,
  constructabilityReviewStatusLabels,
  constructabilityRatingColorMap,
  constructabilityRatingLabels,
} from '@/design-system/components/StatusBadge/statusConfig';
import { constructabilityApi, type CreateReviewRequest } from '@/api/constructability';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

type TabFilter = 'ALL' | 'DRAFT' | 'IN_REVIEW' | 'COMPLETED';

export default function ConstructabilityReviewPage() {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const projectId = paramProjectId || searchParams.get('projectId') || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', reviewerName: '', reviewDate: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['constructability-reviews', projectId],
    queryFn: () => constructabilityApi.listReviews(projectId || undefined),
    enabled: true,
  });

  const reviews = data?.content ?? [];

  const filteredReviews = useMemo(() => {
    if (activeTab === 'ALL') return reviews;
    return reviews.filter((r) => r.status === activeTab);
  }, [reviews, activeTab]);

  const createMutation = useMutation({
    mutationFn: (req: CreateReviewRequest) => constructabilityApi.createReview(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructability-reviews'] });
      setShowCreate(false);
      setForm({ title: '', reviewerName: '', reviewDate: '' });
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => constructabilityApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructability-reviews'] });
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const handleCreate = () => {
    if (!form.title || !form.reviewerName || !form.reviewDate) return;
    createMutation.mutate({
      projectId,
      title: form.title,
      reviewerName: form.reviewerName,
      reviewDate: form.reviewDate,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('constructability.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const tabs = [
    { id: 'ALL' as const, label: t('common.all'), count: reviews.length },
    { id: 'DRAFT' as const, label: t('statusLabels.constructabilityReviewStatus.DRAFT'), count: reviews.filter((r) => r.status === 'DRAFT').length },
    { id: 'IN_REVIEW' as const, label: t('statusLabels.constructabilityReviewStatus.IN_REVIEW'), count: reviews.filter((r) => r.status === 'IN_REVIEW').length },
    { id: 'COMPLETED' as const, label: t('statusLabels.constructabilityReviewStatus.COMPLETED'), count: reviews.filter((r) => r.status === 'COMPLETED').length },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={t('constructability.title')}
        backTo={projectId ? `/projects/${projectId}` : undefined}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-1" />
            {t('constructability.createReview')}
          </Button>
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabFilter)}
      />

      {isLoading && (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          {t('common.loading')}
        </div>
      )}

      {!isLoading && filteredReviews.length === 0 && (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          {t('constructability.noReviews')}
        </div>
      )}

      {!isLoading && filteredReviews.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('constructability.reviewTitle')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('constructability.reviewer')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('constructability.reviewDate')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('constructability.overallRating')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('constructability.items')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('common.status')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  onClick={() => navigate(`/constructability-reviews/${review.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {review.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {review.reviewerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {review.reviewDate}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {review.overallRating ? (
                      <StatusBadge
                        status={review.overallRating}
                        colorMap={constructabilityRatingColorMap}
                        label={constructabilityRatingLabels[review.overallRating] ?? review.overallRating}
                      />
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {review.itemCount}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge
                      status={review.status}
                      colorMap={constructabilityReviewStatusColorMap}
                      label={constructabilityReviewStatusLabels[review.status] ?? review.status}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/constructability-reviews/${review.id}`)}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
                        title={t('common.view')}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('constructability.createReview')}
      >
        <div className="space-y-4">
          <FormField label={t('constructability.reviewTitle')} required>
            <Input
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
              placeholder={t('constructability.reviewTitle')}
            />
          </FormField>
          <FormField label={t('constructability.reviewer')} required>
            <Input
              value={form.reviewerName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, reviewerName: e.target.value })}
              placeholder={t('constructability.reviewer')}
            />
          </FormField>
          <FormField label={t('constructability.reviewDate')} required>
            <Input
              type="date"
              value={form.reviewDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, reviewDate: e.target.value })}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.title || !form.reviewerName || !form.reviewDate || createMutation.isPending}
            >
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
