import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { financeApi } from '@/api/finance';
import { Settings, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProjectSection } from '@/types';

interface BudgetSectionConfigProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

const BudgetSectionConfig: React.FC<BudgetSectionConfigProps> = ({ projectId, open, onClose }) => {
  const queryClient = useQueryClient();

  const { data: sectionsData } = useQuery({
    queryKey: ['project-sections', projectId],
    queryFn: () => financeApi.getProjectSections(projectId),
    enabled: open,
  });

  const [toggles, setToggles] = useState<Map<string, boolean>>(new Map());
  const [orderedSections, setOrderedSections] = useState<ProjectSection[]>([]);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!sectionsData) {
      return;
    }
    setOrderedSections(
      [...sectionsData].sort((a: ProjectSection, b: ProjectSection) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    );
    const map = new Map<string, boolean>();
    sectionsData.forEach((s: ProjectSection) => map.set(s.id, s.enabled));
    setToggles(map);
  }, [sectionsData]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; enabled: boolean; sequence?: number }[]) =>
      financeApi.updateProjectSections(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections', projectId] });
      toast.success(t('finance.sections.updated'));
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: { code: string; name: string }) =>
      financeApi.addCustomSection(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections', projectId] });
      setNewCode('');
      setNewName('');
      toast.success(t('finance.sections.added'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sectionId: string) => financeApi.deleteCustomSection(projectId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections', projectId] });
      toast.success(t('finance.sections.deleted'));
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => financeApi.seedProjectSections(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-sections', projectId] });
      toast.success(t('finance.sections.seeded'));
    },
  });

  const handleToggle = (id: string) => {
    const newToggles = new Map(toggles);
    newToggles.set(id, !newToggles.get(id));
    setToggles(newToggles);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedSectionId || draggedSectionId === targetId) {
      return;
    }
    setOrderedSections((prev) => {
      const sourceIndex = prev.findIndex((s) => s.id === draggedSectionId);
      const targetIndex = prev.findIndex((s) => s.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedSectionId(null);
  };

  const handleSave = () => {
    const data = orderedSections.map((section, index) => ({
      id: section.id,
      enabled: toggles.get(section.id) ?? section.enabled,
      sequence: (index + 1) * 10,
    }));
    updateMutation.mutate(data);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('finance.sections.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {orderedSections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                {t('finance.sections.empty')}
              </p>
              <button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className={cn(
                  'px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {t('finance.sections.seedDefaults')}
              </button>
            </div>
          ) : (
            orderedSections.map((section: ProjectSection) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDraggedSectionId(section.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(section.id)}
                onDragEnd={() => setDraggedSectionId(null)}
                className={cn(
                  'flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
                  draggedSectionId === section.id && 'opacity-50',
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={toggles.get(section.id) ?? section.enabled}
                    onChange={() => handleToggle(section.id)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400 mr-2">
                      {section.code}
                    </span>
                    <span className="text-sm text-neutral-900 dark:text-neutral-100">
                      {section.name}
                    </span>
                  </div>
                </div>
                {section.custom && (
                  <button
                    onClick={() => deleteMutation.mutate(section.id)}
                    className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {orderedSections.length > 0 && (
          <>
            {/* Add custom section */}
            <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                {t('finance.sections.addCustom')}
              </p>
              <div className="flex gap-2">
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder={t('finance.sections.code')}
                  className={cn(
                    'w-20 px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg',
                    'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  )}
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('finance.sections.name')}
                  className={cn(
                    'flex-1 px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg',
                    'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  )}
                />
                <button
                  onClick={() => addMutation.mutate({ code: newCode, name: newName })}
                  disabled={!newCode || !newName || addMutation.isPending}
                  className={cn(
                    'px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className={cn(
                  'px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {t('common.save')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetSectionConfig;
