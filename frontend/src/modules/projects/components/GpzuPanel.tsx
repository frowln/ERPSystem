import React, { lazy, Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { gpzuApi } from '@/api/gpzu';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { GpzuDocument, GpzuStatus } from '@/types';

const FileAttachmentPanel = lazy(() => import('@/design-system/components/FileAttachmentPanel'));
const ApprovalTimeline = lazy(() => import('@/design-system/components/ApprovalTimeline'));

const STATUS_COLORS: Record<GpzuStatus, string> = {
  NOT_STARTED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ISSUED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: '' },
  { value: 'REQUESTED', label: '' },
  { value: 'IN_REVIEW', label: '' },
  { value: 'ISSUED', label: '' },
  { value: 'EXPIRED', label: '' },
];

const GpzuPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GpzuDocument | null>(null);
  const [form, setForm] = useState<Partial<GpzuDocument>>({ status: 'NOT_STARTED' });
  const [deleteTarget, setDeleteTarget] = useState<GpzuDocument | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['gpzu', projectId],
    queryFn: () => gpzuApi.getByProject(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<GpzuDocument>) =>
      editing
        ? gpzuApi.update(projectId, editing.id, data)
        : gpzuApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpzu', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gpzuApi.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gpzu', projectId] });
      setDeleteTarget(null);
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ status: 'NOT_STARTED' });
    setModalOpen(true);
  };

  const openEdit = (item: GpzuDocument) => {
    setEditing(item);
    setForm(item);
    setModalOpen(true);
  };

  // Generate status options with i18n labels
  const statusOptions = STATUS_OPTIONS.map(o => ({
    ...o,
    label: t(`projects.gpzu.statuses.${o.value}`),
  }));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('projects.gpzu.title')}
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
            <MapPin size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              {t('projects.gpzu.empty')}
            </p>
            <Button size="sm" variant="secondary" onClick={openAdd}>
              {t('projects.gpzu.addBtn')}
            </Button>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedId === item.id
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
              onClick={() => setSelectedId(prev => prev === item.id ? null : item.id)}
            >
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-neutral-500 dark:text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {item.number || t('projects.gpzu.title')}
                  </p>
                  {item.cadastralNumber && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('projects.gpzu.cadastralNumber')}: {item.cadastralNumber}
                    </p>
                  )}
                  {item.issueDate && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {t('projects.gpzu.issueDate')}: {format(parseISO(item.issueDate), 'd MMM yyyy', { locale: ru })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? STATUS_COLORS.NOT_STARTED}`}>
                  {t(`projects.gpzu.statuses.${item.status}`)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                  aria-label={t('common.edit')}
                  className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                  aria-label={t('common.delete')}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedId && (
        <div className="mt-4 space-y-3">
          <Suspense fallback={<div className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
            <FileAttachmentPanel entityType="GPZU" entityId={selectedId} />
          </Suspense>
          {items.find(i => i.id === selectedId)?.approvalChainId && (
            <Suspense fallback={<div className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
              <ApprovalTimeline entityType="GPZU" entityId={selectedId} />
            </Suspense>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('projects.gpzu.editTitle') : t('projects.gpzu.addTitle')}>
        <div className="space-y-4">
          <FormField label={t('common.status')}>
            <Select options={statusOptions} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as GpzuStatus }))} />
          </FormField>
          <FormField label={t('projects.gpzu.number')}>
            <Input value={form.number ?? ''} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.gpzu.cadastralNumber')}>
            <Input value={form.cadastralNumber ?? ''} onChange={e => setForm(f => ({ ...f, cadastralNumber: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.gpzu.issuingAuthority')}>
            <Input value={form.issuingAuthority ?? ''} onChange={e => setForm(f => ({ ...f, issuingAuthority: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('projects.gpzu.requestDate')}>
              <Input type="date" value={form.requestDate ?? ''} onChange={e => setForm(f => ({ ...f, requestDate: e.target.value }))} />
            </FormField>
            <FormField label={t('projects.gpzu.issueDate')}>
              <Input type="date" value={form.issueDate ?? ''} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('projects.gpzu.landArea')}>
              <Input type="number" value={form.landArea ?? ''} onChange={e => setForm(f => ({ ...f, landArea: Number(e.target.value) }))} />
            </FormField>
            <FormField label={t('projects.gpzu.buildingArea')}>
              <Input type="number" value={form.buildingArea ?? ''} onChange={e => setForm(f => ({ ...f, buildingArea: Number(e.target.value) }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('projects.gpzu.maxFloors')}>
              <Input type="number" value={form.maxFloors ?? ''} onChange={e => setForm(f => ({ ...f, maxFloors: Number(e.target.value) }))} />
            </FormField>
            <FormField label={t('projects.gpzu.maxHeight')}>
              <Input type="number" value={form.maxHeight ?? ''} onChange={e => setForm(f => ({ ...f, maxHeight: Number(e.target.value) }))} />
            </FormField>
          </div>
          <FormField label={t('projects.gpzu.landUseType')}>
            <Input value={form.landUseType ?? ''} onChange={e => setForm(f => ({ ...f, landUseType: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.gpzu.encumbrances')}>
            <Input value={form.encumbrances ?? ''} onChange={e => setForm(f => ({ ...f, encumbrances: e.target.value }))} />
          </FormField>
          <FormField label={t('common.notes')}>
            <Input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {t('common.save')}
            </Button>
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

export default GpzuPanel;
