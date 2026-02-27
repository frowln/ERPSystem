import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { safetyChecklistApi } from '@/api/safetyChecklist';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { SafetyChecklistItem, SafetyChecklistCategory } from '@/types';

const CATEGORY_ORDER: SafetyChecklistCategory[] = ['PPE', 'SITE_SECURITY', 'EMERGENCY', 'TRAINING', 'HAZARD_ASSESSMENT', 'FIRE_PROTECTION'];

const PreConstructionSafetyPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['safety-checklist', projectId],
    queryFn: () => safetyChecklistApi.getChecklist(projectId),
  });

  const toggleMutation = useMutation({
    mutationFn: (item: SafetyChecklistItem) =>
      safetyChecklistApi.updateItem(projectId, item.id, { completed: !item.completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety-checklist', projectId] }),
  });

  const initMutation = useMutation({
    mutationFn: () => safetyChecklistApi.initializeChecklist(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-checklist', projectId] });
      toast.success(t('common.saved'));
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
        {total > 0 && (
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {completed}/{total} ({pct}%)
          </span>
        )}
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
                <button
                  key={item.id}
                  onClick={() => toggleMutation.mutate(item)}
                  className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
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
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreConstructionSafetyPanel;
