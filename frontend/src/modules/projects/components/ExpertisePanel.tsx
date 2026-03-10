import React, { lazy, Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, Pencil, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { expertiseApi } from '@/api/expertise';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ExpertiseReview, ExpertiseRemark, ExpertiseType, ExpertiseStatus } from '@/types';

const FileAttachmentPanel = lazy(() => import('@/design-system/components/FileAttachmentPanel'));
const ApprovalTimeline = lazy(() => import('@/design-system/components/ApprovalTimeline'));

const STATUS_COLORS: Record<ExpertiseStatus, string> = {
  NOT_STARTED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  DOCUMENTS_PREP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_REVIEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  REMARKS_RECEIVED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  REMARKS_RESOLVED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  POSITIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  NEGATIVE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CONDITIONAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const ExpertisePanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpertiseReview | null>(null);
  const [form, setForm] = useState<Partial<ExpertiseReview>>({ type: 'STATE', status: 'NOT_STARTED' });
  const [deleteTarget, setDeleteTarget] = useState<ExpertiseReview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [remarkForm, setRemarkForm] = useState<Partial<ExpertiseRemark>>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['expertise', projectId],
    queryFn: () => expertiseApi.getByProject(projectId),
  });

  const { data: remarks = [] } = useQuery({
    queryKey: ['expertise-remarks', projectId, selectedId],
    queryFn: () => expertiseApi.getRemarks(projectId, selectedId!),
    enabled: !!selectedId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<ExpertiseReview>) =>
      editing ? expertiseApi.update(projectId, editing.id, data) : expertiseApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expertise', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expertiseApi.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expertise', projectId] });
      setDeleteTarget(null);
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const addRemarkMutation = useMutation({
    mutationFn: (data: Partial<ExpertiseRemark>) => expertiseApi.addRemark(projectId, selectedId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expertise-remarks', projectId, selectedId] });
      setRemarkModalOpen(false);
      setRemarkForm({});
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ type: 'STATE', status: 'NOT_STARTED' });
    setModalOpen(true);
  };

  const openEdit = (item: ExpertiseReview) => {
    setEditing(item);
    setForm(item);
    setModalOpen(true);
  };

  const typeOptions = (['STATE', 'NON_STATE', 'ENVIRONMENTAL', 'FIRE_SAFETY', 'INDUSTRIAL_SAFETY'] as const).map(v => ({
    value: v, label: t(`projects.expertise.types.${v}`),
  }));

  const statusOptions = (['NOT_STARTED', 'DOCUMENTS_PREP', 'SUBMITTED', 'IN_REVIEW', 'REMARKS_RECEIVED', 'REMARKS_RESOLVED', 'POSITIVE', 'NEGATIVE', 'CONDITIONAL'] as const).map(v => ({
    value: v, label: t(`projects.expertise.statuses.${v}`),
  }));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('projects.expertise.title')}
        </h3>
        <Button size="sm" variant="ghost" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> {t('common.add')}
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <ShieldCheck size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{t('projects.expertise.empty')}</p>
            <Button size="sm" variant="secondary" onClick={openAdd}>{t('projects.expertise.addBtn')}</Button>
          </div>
        ) : (
          items.map(item => {
            const hasRemarks = (item.remarksCount ?? 0) > 0;
            const unresolvedRemarks = (item.remarksCount ?? 0) - (item.resolvedRemarksCount ?? 0);
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer',
                  selectedId === item.id
                    ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                )}
                onClick={() => setSelectedId(prev => prev === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className={item.status === 'POSITIVE' ? 'text-green-500' : item.status === 'NEGATIVE' ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'} />
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {t(`projects.expertise.types.${item.type}`)}
                    </p>
                    {item.expertiseOrganization && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.expertiseOrganization}</p>
                    )}
                    {hasRemarks && (
                      <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                        <MessageSquare size={10} />
                        {t('projects.expertise.remarks')}: {item.resolvedRemarksCount}/{item.remarksCount}
                        {unresolvedRemarks > 0 && (
                          <span className="text-red-500 font-semibold"> ({unresolvedRemarks} {t('projects.expertise.open')})</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? STATUS_COLORS.NOT_STARTED}`}>
                    {t(`projects.expertise.statuses.${item.status}`)}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} aria-label={t('common.edit')} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><Pencil size={13} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }} aria-label={t('common.delete')} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expanded section: Remarks + Attachments + Approval */}
      {selectedId && (
        <div className="mt-4 space-y-3">
          {/* Remarks */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {t('projects.expertise.remarksTitle')}
              </span>
              <Button size="xs" variant="ghost" onClick={() => { setRemarkForm({}); setRemarkModalOpen(true); }}>
                <Plus size={12} className="mr-1" /> {t('common.add')}
              </Button>
            </div>
            {remarks.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('projects.expertise.noRemarks')}</p>
            ) : (
              <div className="space-y-1.5">
                {remarks.map((r, idx) => (
                  <div key={r.id} className="flex items-start gap-2 text-xs">
                    <AlertCircle size={12} className={cn(
                      'mt-0.5 flex-shrink-0',
                      r.status === 'RESOLVED' ? 'text-green-500' : 'text-orange-500',
                    )} />
                    <div className="flex-1">
                      <p className="text-neutral-700 dark:text-neutral-300">{idx + 1}. {r.description}</p>
                      {r.responsible && <p className="text-neutral-400">{r.responsible}</p>}
                    </div>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap',
                      r.status === 'RESOLVED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : r.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                    )}>
                      {t(`projects.expertise.remarkStatuses.${r.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Suspense fallback={<div className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
            <FileAttachmentPanel entityType="EXPERTISE" entityId={selectedId} />
          </Suspense>
          {items.find(i => i.id === selectedId)?.approvalChainId && (
            <Suspense fallback={<div className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
              <ApprovalTimeline entityType="EXPERTISE" entityId={selectedId} />
            </Suspense>
          )}
        </div>
      )}

      {/* Main modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('projects.expertise.editTitle') : t('projects.expertise.addTitle')}>
        <div className="space-y-4">
          <FormField label={t('projects.expertise.type')}>
            <Select options={typeOptions} value={form.type ?? ''} onChange={e => setForm(f => ({ ...f, type: e.target.value as ExpertiseType }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={statusOptions} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as ExpertiseStatus }))} />
          </FormField>
          <FormField label={t('projects.expertise.expertiseOrg')}>
            <Input value={form.expertiseOrganization ?? ''} onChange={e => setForm(f => ({ ...f, expertiseOrganization: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.expertise.applicationNumber')}>
            <Input value={form.applicationNumber ?? ''} onChange={e => setForm(f => ({ ...f, applicationNumber: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('projects.expertise.submissionDate')}>
              <Input type="date" value={form.submissionDate ?? ''} onChange={e => setForm(f => ({ ...f, submissionDate: e.target.value }))} />
            </FormField>
            <FormField label={t('projects.expertise.plannedCompletionDate')}>
              <Input type="date" value={form.plannedCompletionDate ?? ''} onChange={e => setForm(f => ({ ...f, plannedCompletionDate: e.target.value }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('projects.expertise.conclusionNumber')}>
              <Input value={form.conclusionNumber ?? ''} onChange={e => setForm(f => ({ ...f, conclusionNumber: e.target.value }))} />
            </FormField>
            <FormField label={t('projects.expertise.cost')}>
              <Input type="number" value={form.cost ?? ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
            </FormField>
          </div>
          <FormField label={t('common.notes')}>
            <Input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Remark modal */}
      <Modal open={remarkModalOpen} onClose={() => setRemarkModalOpen(false)} title={t('projects.expertise.addRemark')} size="sm">
        <div className="space-y-4">
          <FormField label={t('projects.expertise.remarkDescription')}>
            <Input value={remarkForm.description ?? ''} onChange={e => setRemarkForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.expertise.remarkResponsible')}>
            <Input value={remarkForm.responsible ?? ''} onChange={e => setRemarkForm(f => ({ ...f, responsible: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.expertise.remarkDueDate')}>
            <Input type="date" value={remarkForm.dueDate ?? ''} onChange={e => setRemarkForm(f => ({ ...f, dueDate: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRemarkModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => addRemarkMutation.mutate(remarkForm)} disabled={addRemarkMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t('common.confirmDelete')}
        description={t('common.confirmDeleteDesc')}
        confirmVariant="danger"
        confirmLabel={t('common.delete')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ExpertisePanel;
