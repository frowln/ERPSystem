import React, { lazy, Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileStack, Plus, Pencil, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { projectDesignApi } from '@/api/projectDesign';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ProjectDesign, ProjectDesignSection, DesignSectionCode, DesignSectionStatus, ProjectDesignStatus } from '@/types';

const ApprovalTimeline = lazy(() => import('@/design-system/components/ApprovalTimeline'));

const SECTION_STATUS_COLORS: Record<DesignSectionStatus, string> = {
  NOT_STARTED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INTERNAL_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REVISION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SENT_TO_EXPERTISE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const PP87_SECTION_CODES: DesignSectionCode[] = [
  'PZ', 'SPZU', 'AR', 'KR', 'IOS_VS', 'IOS_OV', 'IOS_EO', 'IOS_SS',
  'IOS_GS', 'IOS_ST', 'POS', 'PODB', 'IDEV', 'MOOP', 'EE', 'SM',
];

const getPp87Sections = (): { code: DesignSectionCode; name: string }[] =>
  PP87_SECTION_CODES.map(code => ({
    code,
    name: t(`projects.design.pp87Sections.${code}`),
  }));

const DesignManagementPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<ProjectDesign>>({ name: t('projects.design.defaultFolder'), status: 'DRAFT' });
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ProjectDesignSection | null>(null);
  const [sectionForm, setSectionForm] = useState<Partial<ProjectDesignSection>>({});
  const [expandedDesignId, setExpandedDesignId] = useState<string | null>(null);

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ['project-designs', projectId],
    queryFn: () => projectDesignApi.getByProject(projectId),
  });

  const createDesignMutation = useMutation({
    mutationFn: (data: Partial<ProjectDesign>) => projectDesignApi.create(projectId, data),
    onSuccess: (newDesign) => {
      queryClient.invalidateQueries({ queryKey: ['project-designs', projectId] });
      setCreateModalOpen(false);
      setExpandedDesignId(newDesign.id);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const addSectionsMutation = useMutation({
    mutationFn: async (designId: string) => {
      const existing = designs.find(d => d.id === designId);
      const existingCodes = new Set((existing?.sections || []).map(s => s.code));
      for (const sec of getPp87Sections()) {
        if (!existingCodes.has(sec.code)) {
          await projectDesignApi.addSection(projectId, designId, {
            code: sec.code,
            name: sec.name,
            status: 'NOT_STARTED',
            completionPercent: 0,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-designs', projectId] });
      toast.success(t('projects.design.sectionsAdded'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const updateSectionMutation = useMutation({
    mutationFn: (params: { designId: string; sectionId: string; data: Partial<ProjectDesignSection> }) =>
      projectDesignApi.updateSection(projectId, params.designId, params.sectionId, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-designs', projectId] });
      setSectionModalOpen(false);
      setEditingSection(null);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const sectionStatusOptions = (['NOT_STARTED', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'REVISION', 'APPROVED', 'SENT_TO_EXPERTISE'] as const).map(v => ({
    value: v, label: t(`projects.design.sectionStatuses.${v}`),
  }));

  const designStatusOptions = (['DRAFT', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'SENT_TO_EXPERTISE', 'APPROVED', 'ARCHIVED'] as const).map(v => ({
    value: v, label: t(`projects.design.statuses.${v}`),
  }));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('projects.design.title')}
        </h3>
        {designs.length === 0 && (
          <Button size="sm" variant="ghost" onClick={() => setCreateModalOpen(true)}>
            <Plus size={14} className="mr-1" /> {t('projects.design.create')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="h-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      ) : designs.length === 0 ? (
        <div className="text-center py-6">
          <FileStack size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{t('projects.design.empty')}</p>
          <Button size="sm" variant="secondary" onClick={() => setCreateModalOpen(true)}>
            {t('projects.design.createBtn')}
          </Button>
        </div>
      ) : (
        designs.map(design => {
          const sections = design.sections || [];
          const approvedSections = sections.filter(s => s.status === 'APPROVED' || s.status === 'SENT_TO_EXPERTISE').length;
          const overallPct = sections.length > 0 ? Math.round(sections.reduce((s, sec) => s + sec.completionPercent, 0) / sections.length) : 0;
          const isExpanded = expandedDesignId === design.id;

          return (
            <div key={design.id} className="mb-3 last:mb-0">
              {/* Design header */}
              <button
                type="button"
                onClick={() => setExpandedDesignId(prev => prev === design.id ? null : design.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                  isExpanded
                    ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <FileStack size={16} className="text-neutral-500 dark:text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{design.name}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {approvedSections}/{sections.length} {t('projects.design.sectionsApproved')}
                      {design.designOrganization && ` — ${design.designOrganization}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', overallPct >= 80 ? 'bg-green-500' : overallPct >= 40 ? 'bg-blue-500' : 'bg-amber-400')}
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums font-medium text-neutral-500 dark:text-neutral-400">{overallPct}%</span>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                </div>
              </button>

              {/* Expanded sections grid */}
              {isExpanded && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button size="xs" variant="secondary" onClick={() => addSectionsMutation.mutate(design.id)} disabled={addSectionsMutation.isPending}>
                      {t('projects.design.addPp87Sections')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sections.map(section => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                          setEditingSection(section);
                          setSectionForm(section);
                          setSectionModalOpen(true);
                        }}
                        className={cn(
                          'flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors hover:shadow-sm',
                          section.status === 'APPROVED' || section.status === 'SENT_TO_EXPERTISE'
                            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/5'
                            : 'border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                        )}
                      >
                        {section.status === 'APPROVED' ? (
                          <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <div className={cn(
                            'w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 border-2',
                            section.status === 'IN_PROGRESS' || section.status === 'INTERNAL_REVIEW' ? 'border-blue-400 bg-blue-100' : 'border-neutral-300 dark:border-neutral-600',
                          )} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{section.code}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{section.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${SECTION_STATUS_COLORS[section.status]}`}>
                              {t(`projects.design.sectionStatuses.${section.status}`)}
                            </span>
                            {section.completionPercent > 0 && (
                              <span className="text-[9px] tabular-nums text-neutral-400">{section.completionPercent}%</span>
                            )}
                          </div>
                        </div>
                        <Pencil size={11} className="text-neutral-300 dark:text-neutral-600 mt-0.5" />
                      </button>
                    ))}
                  </div>

                  {design.approvalChainId && (
                    <Suspense fallback={<div className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
                      <ApprovalTimeline entityType="DESIGN" entityId={design.id} />
                    </Suspense>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Create design modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t('projects.design.createTitle')}>
        <div className="space-y-4">
          <FormField label={t('projects.design.designName')}>
            <Input value={createForm.name ?? ''} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={designStatusOptions} value={createForm.status ?? ''} onChange={e => setCreateForm(f => ({ ...f, status: e.target.value as ProjectDesignStatus }))} />
          </FormField>
          <FormField label={t('projects.design.designOrganization')}>
            <Input value={createForm.designOrganization ?? ''} onChange={e => setCreateForm(f => ({ ...f, designOrganization: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.design.chiefDesigner')}>
            <Input value={createForm.chiefDesigner ?? ''} onChange={e => setCreateForm(f => ({ ...f, chiefDesigner: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => createDesignMutation.mutate(createForm)} disabled={createDesignMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit section modal */}
      <Modal open={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title={editingSection ? `${editingSection.code} — ${editingSection.name}` : ''}>
        <div className="space-y-4">
          <FormField label={t('common.status')}>
            <Select options={sectionStatusOptions} value={sectionForm.status ?? ''} onChange={e => setSectionForm(f => ({ ...f, status: e.target.value as DesignSectionStatus }))} />
          </FormField>
          <FormField label={t('projects.design.completionPercent')}>
            <Input type="number" min={0} max={100} value={sectionForm.completionPercent ?? 0} onChange={e => setSectionForm(f => ({ ...f, completionPercent: Math.min(100, Math.max(0, Number(e.target.value))) }))} />
          </FormField>
          <FormField label={t('projects.design.designerName')}>
            <Input value={sectionForm.designerName ?? ''} onChange={e => setSectionForm(f => ({ ...f, designerName: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.design.designerOrg')}>
            <Input value={sectionForm.designerOrg ?? ''} onChange={e => setSectionForm(f => ({ ...f, designerOrg: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.design.reviewComments')}>
            <Input value={sectionForm.reviewComments ?? ''} onChange={e => setSectionForm(f => ({ ...f, reviewComments: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSectionModalOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => {
                if (editingSection && expandedDesignId) {
                  updateSectionMutation.mutate({
                    designId: expandedDesignId,
                    sectionId: editingSection.id,
                    data: sectionForm,
                  });
                }
              }}
              disabled={updateSectionMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DesignManagementPanel;
