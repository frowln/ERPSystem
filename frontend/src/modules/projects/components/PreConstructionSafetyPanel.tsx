import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, CheckSquare, Square, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { safetyChecklistApi } from '@/api/safetyChecklist';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { SafetyChecklistItem, SafetyChecklistCategory } from '@/types';

const CATEGORY_ORDER: SafetyChecklistCategory[] = ['PPE', 'SITE_SECURITY', 'EMERGENCY', 'TRAINING', 'HAZARD_ASSESSMENT', 'FIRE_PROTECTION'];

const PreConstructionSafetyPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<SafetyChecklistCategory>('PPE');
  const [newDescription, setNewDescription] = useState('');
  const [newRequired, setNewRequired] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['safety-checklist', projectId],
    queryFn: () => safetyChecklistApi.getChecklist(projectId),
  });

  const toggleMutation = useMutation({
    mutationFn: (item: SafetyChecklistItem) =>
      safetyChecklistApi.updateItem(projectId, item.id, { completed: !item.completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety-checklist', projectId] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const initMutation = useMutation({
    mutationFn: () => safetyChecklistApi.initializeChecklist(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-checklist', projectId] });
      toast.success(t('common.saved'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: { category: SafetyChecklistCategory; description: string; required: boolean }) =>
      safetyChecklistApi.addItem(projectId, { ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-checklist', projectId] });
      setShowAddModal(false);
      setNewDescription('');
      setNewRequired(false);
      toast.success(t('common.saved'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => safetyChecklistApi.deleteItem(projectId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-checklist', projectId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    items: items.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);

  const total = items.length;
  const completed = items.filter(i => i.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {t('projects.safetyChecklist.title')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {completed}/{total} ({pct}%)
            </span>
          )}
          {total > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-primary-500 transition-colors"
              title={t('projects.safetyChecklist.addItem')}
            >
              <Plus size={15} />
            </button>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
            {t('projects.safetyChecklist.empty')}
          </p>
          <Button size="sm" onClick={() => initMutation.mutate()} disabled={initMutation.isPending}>
            <RefreshCw size={14} className="mr-1" /> {t('projects.safetyChecklist.initialize')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {grouped.map(({ category, items: catItems }) => (
            <div key={category}>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 mt-2">
                {t(`projects.safetyChecklist.categories.${category}`)}
              </p>
              {catItems.map(item => (
                <div key={item.id} className="group flex items-center">
                <button
                  onClick={() => toggleMutation.mutate(item)}
                  className="flex items-center gap-2 flex-1 text-left p-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  {item.completed ? (
                    <CheckSquare size={15} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <Square size={15} className="text-neutral-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${item.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    {item.description}
                  </span>
                  {item.required && (
                    <span className="text-[10px] text-red-500 font-medium ml-auto flex-shrink-0">
                      {t('projects.safetyChecklist.required')}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-300 hover:text-red-500 transition-all flex-shrink-0"
                  title={t('common.delete')}
                >
                  <Trash2 size={13} />
                </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Modal open={showAddModal} title={t('projects.safetyChecklist.addItem')} onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <FormField label={t('projects.safetyChecklist.categoryLabel')}>
              <Select
                options={CATEGORY_ORDER.map(c => ({
                  value: c,
                  label: t(`projects.safetyChecklist.categories.${c}`),
                }))}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as SafetyChecklistCategory)}
              />
            </FormField>
            <FormField label={t('projects.safetyChecklist.descriptionLabel')}>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('projects.safetyChecklist.descriptionPlaceholder')}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="rounded border-neutral-300"
              />
              {t('projects.safetyChecklist.markRequired')}
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                disabled={!newDescription.trim() || addMutation.isPending}
                onClick={() => addMutation.mutate({ category: newCategory, description: newDescription.trim(), required: newRequired })}
              >
                {t('common.add')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PreConstructionSafetyPanel;
