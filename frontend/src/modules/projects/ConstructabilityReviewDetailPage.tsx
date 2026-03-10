import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, CheckCircle, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import {
  constructabilityReviewStatusColorMap,
  constructabilityReviewStatusLabels,
  constructabilityRatingColorMap,
  constructabilityRatingLabels,
  constructabilitySeverityColorMap,
  constructabilitySeverityLabels,
  constructabilityItemStatusColorMap,
  constructabilityItemStatusLabels,
  constructabilityCategoryColorMap,
  constructabilityCategoryLabels,
} from '@/design-system/components/StatusBadge/statusConfig';
import {
  constructabilityApi,
  type ConstructabilityItem,
  type CreateItemRequest,
  type UpdateItemRequest,
  type UpdateReviewRequest,
} from '@/api/constructability';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';

const CATEGORIES = ['STRUCTURAL', 'MEP', 'SITE_ACCESS', 'LOGISTICS', 'SEQUENCING', 'SAFETY', 'COORDINATION'] as const;
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const ITEM_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DEFERRED'] as const;
const RATINGS = ['PASS', 'CONDITIONAL_PASS', 'FAIL'] as const;
const REVIEW_STATUSES = ['DRAFT', 'IN_REVIEW', 'COMPLETED'] as const;

const SEVERITY_BORDER: Record<string, string> = {
  LOW: 'border-l-green-500',
  MEDIUM: 'border-l-yellow-500',
  HIGH: 'border-l-orange-500',
  CRITICAL: 'border-l-red-500',
};

const RATING_ICONS: Record<string, React.ReactNode> = {
  PASS: <CheckCircle className="text-green-600 dark:text-green-400" size={20} />,
  CONDITIONAL_PASS: <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />,
  FAIL: <XCircle className="text-red-600 dark:text-red-400" size={20} />,
};

interface ItemFormState {
  category: string;
  description: string;
  severity: string;
  status: string;
  resolution: string;
  assignedTo: string;
}

const emptyItemForm: ItemFormState = {
  category: 'STRUCTURAL',
  description: '',
  severity: 'MEDIUM',
  status: 'OPEN',
  resolution: '',
  assignedTo: '',
};

const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: constructabilityCategoryLabels[c] ?? c }));
const severityOptions = SEVERITIES.map((s) => ({ value: s, label: constructabilitySeverityLabels[s] ?? s }));
const itemStatusOptions = ITEM_STATUSES.map((s) => ({ value: s, label: constructabilityItemStatusLabels[s] ?? s }));
const ratingOptions = [{ value: '', label: '—' }, ...RATINGS.map((r) => ({ value: r, label: constructabilityRatingLabels[r] ?? r }))];
const reviewStatusOptions = REVIEW_STATUSES.map((s) => ({ value: s, label: constructabilityReviewStatusLabels[s] ?? s }));

export default function ConstructabilityReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ConstructabilityItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [showEditReview, setShowEditReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ overallRating: '', status: '', notes: '' });

  const { data: review, isLoading: reviewLoading } = useQuery({
    queryKey: ['constructability-review', id],
    queryFn: () => constructabilityApi.getReview(id!),
    enabled: !!id,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['constructability-items', id],
    queryFn: () => constructabilityApi.listItems(id!),
    enabled: !!id,
  });

  const addItemMutation = useMutation({
    mutationFn: (req: CreateItemRequest) => constructabilityApi.addItem(id!, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructability-items', id] });
      queryClient.invalidateQueries({ queryKey: ['constructability-review', id] });
      setShowAddItem(false);
      setItemForm(emptyItemForm);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateItemRequest }) =>
      constructabilityApi.updateItem(id!, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructability-items', id] });
      setEditingItem(null);
      setItemForm(emptyItemForm);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => constructabilityApi.deleteItem(id!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructability-items', id] });
      queryClient.invalidateQueries({ queryKey: ['constructability-review', id] });
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const updateReviewMutation = useMutation({
    mutationFn: (data: UpdateReviewRequest) => constructabilityApi.updateReview(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructability-review', id] });
      setShowEditReview(false);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const handleAddItem = () => {
    if (!itemForm.description) return;
    addItemMutation.mutate({
      category: itemForm.category,
      description: itemForm.description,
      severity: itemForm.severity,
      status: itemForm.status,
      resolution: itemForm.resolution || undefined,
      assignedTo: itemForm.assignedTo || undefined,
    });
  };

  const handleUpdateItem = () => {
    if (!editingItem || !itemForm.description) return;
    updateItemMutation.mutate({
      itemId: editingItem.id,
      data: {
        category: itemForm.category,
        description: itemForm.description,
        severity: itemForm.severity,
        status: itemForm.status,
        resolution: itemForm.resolution || undefined,
        assignedTo: itemForm.assignedTo || undefined,
      },
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm(t('constructability.deleteItemConfirm'))) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const openEditItem = (item: ConstructabilityItem) => {
    setEditingItem(item);
    setItemForm({
      category: item.category,
      description: item.description,
      severity: item.severity,
      status: item.status,
      resolution: item.resolution ?? '',
      assignedTo: item.assignedTo ?? '',
    });
  };

  const openEditReview = () => {
    setReviewForm({
      overallRating: review?.overallRating ?? '',
      status: review?.status ?? 'DRAFT',
      notes: review?.notes ?? '',
    });
    setShowEditReview(true);
  };

  const handleUpdateReview = () => {
    updateReviewMutation.mutate({
      overallRating: reviewForm.overallRating || undefined,
      status: reviewForm.status || undefined,
      notes: reviewForm.notes || undefined,
    });
  };

  // Summary stats
  const totalItems = items.length;
  const bySeverity = useMemo(
    () => SEVERITIES.map((s) => ({ severity: s, count: items.filter((i) => i.severity === s).length })),
    [items],
  );

  if (reviewLoading) {
    return (
      <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
        {t('common.loading')}
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
        {t('common.notFound')}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={review.title}
        subtitle={`${review.reviewerName} — ${review.reviewDate}`}
        backTo={review.projectId ? `/projects/${review.projectId}/constructability` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={openEditReview}>
              <Edit2 size={16} className="mr-1" />
              {t('common.edit')}
            </Button>
            <Button onClick={() => setShowAddItem(true)}>
              <Plus size={16} className="mr-1" />
              {t('constructability.addItem')}
            </Button>
          </div>
        }
      />

      {/* Review Info Bar */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('common.status')}:</span>
          <StatusBadge
            status={review.status}
            colorMap={constructabilityReviewStatusColorMap}
            label={constructabilityReviewStatusLabels[review.status] ?? review.status}
          />
        </div>
        {review.overallRating && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('constructability.overallRating')}:</span>
            {RATING_ICONS[review.overallRating]}
            <StatusBadge
              status={review.overallRating}
              colorMap={constructabilityRatingColorMap}
              label={constructabilityRatingLabels[review.overallRating] ?? review.overallRating}
            />
          </div>
        )}
        {review.notes && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('constructability.notes')}:</span>
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{review.notes}</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-primary-500" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">{t('constructability.totalItems')}</span>
          </div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{totalItems}</div>
        </div>
        {bySeverity.filter((s) => s.count > 0).map((s) => (
          <div key={s.severity} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge
                status={s.severity}
                colorMap={constructabilitySeverityColorMap}
                label={constructabilitySeverityLabels[s.severity] ?? s.severity}
              />
            </div>
            <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{s.count}</div>
          </div>
        ))}
      </div>

      {/* Items */}
      {itemsLoading && (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">{t('common.loading')}</div>
      )}

      {!itemsLoading && items.length === 0 && (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">{t('constructability.noItems')}</div>
      )}

      {!itemsLoading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 border-l-4',
                SEVERITY_BORDER[item.severity] ?? 'border-l-neutral-300',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <StatusBadge
                      status={item.category}
                      colorMap={constructabilityCategoryColorMap}
                      label={constructabilityCategoryLabels[item.category] ?? item.category}
                    />
                    <StatusBadge
                      status={item.severity}
                      colorMap={constructabilitySeverityColorMap}
                      label={constructabilitySeverityLabels[item.severity] ?? item.severity}
                    />
                    <StatusBadge
                      status={item.status}
                      colorMap={constructabilityItemStatusColorMap}
                      label={constructabilityItemStatusLabels[item.status] ?? item.status}
                    />
                  </div>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 mb-1">{item.description}</p>
                  {item.assignedTo && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('constructability.assignedTo')}: {item.assignedTo}
                    </p>
                  )}
                  {item.resolution && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {t('constructability.resolution')}: {item.resolution}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditItem(item)}
                    className="p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        open={showAddItem}
        onClose={() => { setShowAddItem(false); setItemForm(emptyItemForm); }}
        title={t('constructability.addItem')}
      >
        <div className="space-y-4">
          <FormField label={t('constructability.category')} required>
            <Select
              value={itemForm.category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm({ ...itemForm, category: e.target.value })}
              options={categoryOptions}
            />
          </FormField>
          <FormField label={t('constructability.description')} required>
            <Textarea
              value={itemForm.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemForm({ ...itemForm, description: e.target.value })}
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('constructability.severity')}>
              <Select
                value={itemForm.severity}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm({ ...itemForm, severity: e.target.value })}
                options={severityOptions}
              />
            </FormField>
            <FormField label={t('constructability.itemStatus')}>
              <Select
                value={itemForm.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm({ ...itemForm, status: e.target.value })}
                options={itemStatusOptions}
              />
            </FormField>
          </div>
          <FormField label={t('constructability.assignedTo')}>
            <Input
              value={itemForm.assignedTo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm({ ...itemForm, assignedTo: e.target.value })}
            />
          </FormField>
          <FormField label={t('constructability.resolution')}>
            <Textarea
              value={itemForm.resolution}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemForm({ ...itemForm, resolution: e.target.value })}
              rows={2}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowAddItem(false); setItemForm(emptyItemForm); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddItem} disabled={!itemForm.description || addItemMutation.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        open={!!editingItem}
        onClose={() => { setEditingItem(null); setItemForm(emptyItemForm); }}
        title={t('constructability.editItem')}
      >
        <div className="space-y-4">
          <FormField label={t('constructability.category')} required>
            <Select
              value={itemForm.category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm({ ...itemForm, category: e.target.value })}
              options={categoryOptions}
            />
          </FormField>
          <FormField label={t('constructability.description')} required>
            <Textarea
              value={itemForm.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemForm({ ...itemForm, description: e.target.value })}
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('constructability.severity')}>
              <Select
                value={itemForm.severity}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm({ ...itemForm, severity: e.target.value })}
                options={severityOptions}
              />
            </FormField>
            <FormField label={t('constructability.itemStatus')}>
              <Select
                value={itemForm.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setItemForm({ ...itemForm, status: e.target.value })}
                options={itemStatusOptions}
              />
            </FormField>
          </div>
          <FormField label={t('constructability.assignedTo')}>
            <Input
              value={itemForm.assignedTo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemForm({ ...itemForm, assignedTo: e.target.value })}
            />
          </FormField>
          <FormField label={t('constructability.resolution')}>
            <Textarea
              value={itemForm.resolution}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemForm({ ...itemForm, resolution: e.target.value })}
              rows={2}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setEditingItem(null); setItemForm(emptyItemForm); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateItem} disabled={!itemForm.description || updateItemMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Review Modal */}
      <Modal
        open={showEditReview}
        onClose={() => setShowEditReview(false)}
        title={t('constructability.editReview')}
      >
        <div className="space-y-4">
          <FormField label={t('constructability.overallRating')}>
            <Select
              value={reviewForm.overallRating}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReviewForm({ ...reviewForm, overallRating: e.target.value })}
              options={ratingOptions}
            />
          </FormField>
          <FormField label={t('common.status')}>
            <Select
              value={reviewForm.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReviewForm({ ...reviewForm, status: e.target.value })}
              options={reviewStatusOptions}
            />
          </FormField>
          <FormField label={t('constructability.notes')}>
            <Textarea
              value={reviewForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewForm({ ...reviewForm, notes: e.target.value })}
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEditReview(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateReview} disabled={updateReviewMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
