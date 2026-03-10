import React, { lazy, Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { mobilizationApi } from '@/api/mobilization';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { MobilizationItem, MobilizationItemType, MobilizationItemStatus } from '@/types';

const FileAttachmentPanel = lazy(() => import('@/design-system/components/FileAttachmentPanel'));

const STATUS_COLORS: Record<MobilizationItemStatus, string> = {
  PLANNED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const MobilizationPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MobilizationItem | null>(null);
  const [form, setForm] = useState<Partial<MobilizationItem>>({ type: 'TEMP_BUILDINGS', status: 'PLANNED' });
  const [deleteTarget, setDeleteTarget] = useState<MobilizationItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['mobilization', projectId],
    queryFn: () => mobilizationApi.getByProject(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<MobilizationItem>) =>
      editing
        ? mobilizationApi.update(projectId, editing.id, data)
        : mobilizationApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobilization', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mobilizationApi.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobilization', projectId] });
      setDeleteTarget(null);
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ type: 'TEMP_BUILDINGS', status: 'PLANNED' });
    setModalOpen(true);
  };

  const openEdit = (item: MobilizationItem) => {
    setEditing(item);
    setForm(item);
    setModalOpen(true);
  };

  const typeOptions = (['TEMP_BUILDINGS', 'FENCING', 'ACCESS_ROADS', 'UTILITIES', 'EQUIPMENT', 'LABOR', 'MATERIALS_STAGING', 'SIGNAGE', 'FIRE_SAFETY', 'COMMUNICATION', 'OTHER'] as const).map(v => ({
    value: v, label: t(`projects.mobilization.types.${v}`),
  }));

  const statusOptions = (['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'] as const).map(v => ({
    value: v, label: t(`projects.mobilization.statuses.${v}`),
  }));

  const completedCount = items.filter(i => i.status === 'COMPLETED').length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {t('projects.mobilization.title')}
          </h3>
          {items.length > 0 && (
            <span className={cn(
              'text-xs font-bold px-1.5 py-0.5 rounded-full',
              pct === 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
            )}>
              {completedCount}/{items.length}
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> {t('common.add')}
        </Button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-3">
          <div
            className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-500' : 'bg-blue-500')}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <Truck size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{t('projects.mobilization.empty')}</p>
            <Button size="sm" variant="secondary" onClick={openAdd}>{t('projects.mobilization.addBtn')}</Button>
          </div>
        ) : (
          items.map(item => (
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
                {item.status === 'COMPLETED' ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <Truck size={16} className="text-neutral-500 dark:text-neutral-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t(`projects.mobilization.types.${item.type}`)}
                    {item.responsible && ` — ${item.responsible}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? STATUS_COLORS.PLANNED}`}>
                  {t(`projects.mobilization.statuses.${item.status}`)}
                </span>
                <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} aria-label={t('common.edit')} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><Pencil size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }} aria-label={t('common.delete')} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedId && (
        <div className="mt-4">
          <Suspense fallback={<div className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
            <FileAttachmentPanel entityType="MOBILIZATION" entityId={selectedId} />
          </Suspense>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('projects.mobilization.editTitle') : t('projects.mobilization.addTitle')}>
        <div className="space-y-4">
          <FormField label={t('projects.mobilization.itemType')}>
            <Select options={typeOptions} value={form.type ?? ''} onChange={e => setForm(f => ({ ...f, type: e.target.value as MobilizationItemType }))} />
          </FormField>
          <FormField label={t('projects.mobilization.itemName')}>
            <Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={statusOptions} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as MobilizationItemStatus }))} />
          </FormField>
          <FormField label={t('projects.mobilization.responsible')}>
            <Input value={form.responsible ?? ''} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.mobilization.contractor')}>
            <Input value={form.contractor ?? ''} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('projects.mobilization.plannedDate')}>
              <Input type="date" value={form.plannedDate ?? ''} onChange={e => setForm(f => ({ ...f, plannedDate: e.target.value }))} />
            </FormField>
            <FormField label={t('projects.mobilization.actualDate')}>
              <Input type="date" value={form.actualDate ?? ''} onChange={e => setForm(f => ({ ...f, actualDate: e.target.value }))} />
            </FormField>
          </div>
          <FormField label={t('projects.mobilization.cost')}>
            <Input type="number" value={form.cost ?? ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
          </FormField>
          <FormField label={t('common.notes')}>
            <Input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>{t('common.save')}</Button>
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

export default MobilizationPanel;
