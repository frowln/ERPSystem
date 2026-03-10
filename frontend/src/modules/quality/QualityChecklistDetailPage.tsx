import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Camera,
  ClipboardCheck,
  ArrowLeft,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { qualityApi } from '@/api/quality';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type {
  QualityChecklistEntry,
  ChecklistExecutionItem,
  ChecklistItemResultType,
} from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow'> = {
  DRAFT: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'yellow',
};

const getStatusLabels = (): Record<string, string> => ({
  DRAFT: t('quality.checklists.statusDraft'),
  IN_PROGRESS: t('quality.checklists.statusInProgress'),
  COMPLETED: t('quality.checklists.statusCompleted'),
  CANCELLED: t('quality.checklists.statusCancelled'),
});

const resultConfig: Record<ChecklistItemResultType, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  PENDING: { icon: Clock, color: 'text-neutral-400', bgColor: 'bg-neutral-50 dark:bg-neutral-800/50', borderColor: 'border-neutral-200 dark:border-neutral-700' },
  PASS: { icon: CheckCircle2, color: 'text-success-600 dark:text-success-400', bgColor: 'bg-success-50 dark:bg-success-900/20', borderColor: 'border-success-200 dark:border-success-800' },
  FAIL: { icon: XCircle, color: 'text-danger-600 dark:text-danger-400', bgColor: 'bg-danger-50 dark:bg-danger-900/20', borderColor: 'border-danger-200 dark:border-danger-800' },
  NA: { icon: MinusCircle, color: 'text-neutral-500', bgColor: 'bg-neutral-100 dark:bg-neutral-800', borderColor: 'border-neutral-300 dark:border-neutral-600' },
};

const getResultLabels = (): Record<string, string> => ({
  PENDING: t('quality.checklists.resultPending'),
  PASS: t('quality.checklists.resultPass'),
  FAIL: t('quality.checklists.resultFail'),
  NA: t('quality.checklists.resultNa'),
});

const QualityChecklistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ['quality-checklist', id],
    queryFn: () => qualityApi.getChecklist(id!),
    enabled: !!id,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['quality-checklist-items', id],
    queryFn: () => qualityApi.getChecklistItems(id!),
    enabled: !!id,
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, result }: { itemId: string; result: ChecklistItemResultType }) =>
      qualityApi.updateChecklistItem(id!, itemId, { result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checklist', id] });
      queryClient.invalidateQueries({ queryKey: ['quality-checklist-items', id] });
    },
    onError: () => toast.error(t('quality.checklists.toastItemUpdateError')),
  });

  const completeMutation = useMutation({
    mutationFn: () => qualityApi.completeChecklist(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checklist', id] });
      queryClient.invalidateQueries({ queryKey: ['quality-checklists'] });
      toast.success(t('quality.checklists.toastCompleted'));
    },
    onError: () => toast.error(t('quality.checklists.toastCompleteError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => qualityApi.deleteChecklist(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checklists'] });
      toast.success(t('quality.checklists.toastDeleted'));
      navigate('/quality/checklists');
    },
    onError: () => toast.error(t('quality.checklists.toastDeleteError')),
  });

  const progress = useMemo(() => {
    if (!checklist) return { checked: 0, total: 0, pct: 0, allDone: false, hasFailed: false };
    const totalItems = checklist.totalItems ?? 0;
    const passedItems = checklist.passedItems ?? 0;
    const failedItems = checklist.failedItems ?? 0;
    const naItems = checklist.naItems ?? 0;
    const checked = passedItems + failedItems + naItems;
    const pct = totalItems > 0 ? Math.round((checked / totalItems) * 100) : 0;
    const allDone = checked === totalItems && totalItems > 0;
    return { checked, total: totalItems, pct, allDone, hasFailed: failedItems > 0 };
  }, [checklist]);

  const categorizedItems = useMemo(() => {
    const groups: Record<string, ChecklistExecutionItem[]> = {};
    for (const item of items) {
      const cat = item.category || t('quality.checklists.categoryGeneral');
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [items]);

  const handleSetResult = (itemId: string, result: ChecklistItemResultType) => {
    if (checklist?.status === 'COMPLETED') return;
    updateItemMutation.mutate({ itemId, result });
  };

  const handleComplete = async () => {
    const ok = await confirm({
      title: t('quality.checklists.confirmCompleteTitle'),
      description: t('quality.checklists.confirmCompleteDescription'),
      confirmLabel: t('quality.checklists.confirmCompleteBtn'),
      cancelLabel: t('common.cancel'),
    });
    if (ok) completeMutation.mutate();
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('quality.checklists.confirmDeleteTitle', { count: '1' }),
      description: t('quality.checklists.confirmDeleteDescription'),
      confirmLabel: t('quality.checklists.confirmDeleteBtn'),
      cancelLabel: t('common.cancel'),
    });
    if (ok) deleteMutation.mutate();
  };

  if (checklistLoading || !checklist) {
    return (
      <div className="animate-pulse p-8 space-y-4">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  const statusLabels = getStatusLabels();
  const resultLabels = getResultLabels();
  const isEditable = checklist.status !== 'COMPLETED' && checklist.status !== 'CANCELLED';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={checklist.code ?? checklist.name}
        subtitle={checklist.name}
        backTo="/quality/checklists"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('quality.list.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.checklists.breadcrumbChecklists'), href: '/quality/checklists' },
          { label: checklist.code ?? checklist.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={checklist.status}
              colorMap={statusColorMap}
              label={statusLabels[checklist.status]}
              size="md"
            />
            {isEditable && progress.allDone && (
              <Button
                variant="success"
                size="sm"
                iconLeft={<CheckCheck size={14} />}
                onClick={handleComplete}
                loading={completeMutation.isPending}
              >
                {t('quality.checklists.btnComplete')}
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              {t('common.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - checklist items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress bar */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('quality.checklists.sectionProgress')}
              </h3>
              <span className="text-sm font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
                {progress.checked}/{progress.total} ({progress.pct}%)
              </span>
            </div>
            <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress.hasFailed ? 'bg-danger-500' : 'bg-success-500'
                }`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1 text-success-600 dark:text-success-400">
                <CheckCircle2 size={12} /> {checklist.passedItems} {t('quality.checklists.resultPass')}
              </span>
              <span className="flex items-center gap-1 text-danger-600 dark:text-danger-400">
                <XCircle size={12} /> {checklist.failedItems} {t('quality.checklists.resultFail')}
              </span>
              <span className="flex items-center gap-1 text-neutral-500">
                <MinusCircle size={12} /> {checklist.naItems} {t('quality.checklists.resultNa')}
              </span>
              <span className="flex items-center gap-1 text-neutral-400">
                <Clock size={12} /> {(checklist.totalItems ?? 0) - progress.checked} {t('quality.checklists.resultPending')}
              </span>
            </div>
          </section>

          {/* Checklist items by category */}
          {Object.entries(categorizedItems).map(([category, catItems]) => (
            <section key={category} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-primary-500" />
                  {category}
                  <span className="text-xs font-normal text-neutral-500">({catItems.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {catItems.map((item) => {
                  const cfg = resultConfig[item.result];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={item.id}
                      className={`px-6 py-4 ${cfg.bgColor} transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon size={18} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {item.description}
                              </p>
                              {item.required && (
                                <span className="text-xs text-danger-600 dark:text-danger-400">
                                  {t('quality.checklists.itemRequired')}
                                </span>
                              )}
                              {item.photoRequired && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ml-2">
                                  <Camera size={10} /> {t('quality.checklists.photoRequired')}
                                </span>
                              )}
                            </div>
                            {isEditable && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleSetResult(item.id, 'PASS')}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    item.result === 'PASS'
                                      ? 'bg-success-100 dark:bg-success-900/40 text-success-600'
                                      : 'hover:bg-success-50 dark:hover:bg-success-900/20 text-neutral-400 hover:text-success-600'
                                  }`}
                                  title={t('quality.checklists.resultPass')}
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleSetResult(item.id, 'FAIL')}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    item.result === 'FAIL'
                                      ? 'bg-danger-100 dark:bg-danger-900/40 text-danger-600'
                                      : 'hover:bg-danger-50 dark:hover:bg-danger-900/20 text-neutral-400 hover:text-danger-600'
                                  }`}
                                  title={t('quality.checklists.resultFail')}
                                >
                                  <XCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleSetResult(item.id, 'NA')}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    item.result === 'NA'
                                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600'
                                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600'
                                  }`}
                                  title={t('quality.checklists.resultNa')}
                                >
                                  <MinusCircle size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {item.notes}
                            </p>
                          )}
                          {(item.photoUrls ?? []).length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {(item.photoUrls ?? []).map((url, i) => (
                                <div key={i} className="w-10 h-10 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                  <Camera size={14} className="text-neutral-400" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {itemsLoading && (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('quality.checklists.sectionDetails')}
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailCode')}</dt>
                <dd className="font-mono text-neutral-900 dark:text-neutral-100">{checklist.code}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailWorkType')}</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{checklist.workTypeDisplayName}</dd>
              </div>
              {checklist.wbsStage && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailStage')}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">{checklist.wbsStage}</dd>
                </div>
              )}
              {checklist.location && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailLocation')}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">{checklist.location}</dd>
                </div>
              )}
              {checklist.inspectorName && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailInspector')}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">{checklist.inspectorName}</dd>
                </div>
              )}
              {checklist.scheduledDate && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailScheduledDate')}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">{formatDate(checklist.scheduledDate)}</dd>
                </div>
              )}
              {checklist.completedDate && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailCompletedDate')}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">{formatDate(checklist.completedDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('quality.checklists.detailCreated')}</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{formatDate(checklist.createdAt)}</dd>
              </div>
            </dl>
          </section>

          {checklist.notes && (
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {t('quality.checklists.sectionNotes')}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                {checklist.notes}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityChecklistDetailPage;
