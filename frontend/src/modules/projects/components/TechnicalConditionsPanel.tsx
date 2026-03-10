import React, { lazy, Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plug, Plus, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { technicalConditionsApi } from '@/api/technicalConditions';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { TechnicalCondition, TechnicalConditionType, TechnicalConditionStatus } from '@/types';

const FileAttachmentPanel = lazy(() => import('@/design-system/components/FileAttachmentPanel'));
const ApprovalTimeline = lazy(() => import('@/design-system/components/ApprovalTimeline'));

const STATUS_COLORS: Record<TechnicalConditionStatus, string> = {
  NOT_STARTED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ISSUED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CONNECTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_ICONS: Record<TechnicalConditionType, string> = {
  WATER: '💧',
  SEWER: '🚰',
  ELECTRICITY: '⚡',
  GAS: '🔥',
  HEAT: '🌡️',
  TELECOM: '📡',
  STORMWATER: '🌧️',
  OTHER: '📋',
};

const TechnicalConditionsPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TechnicalCondition | null>(null);
  const [form, setForm] = useState<Partial<TechnicalCondition>>({ type: 'WATER', status: 'NOT_STARTED' });
  const [deleteTarget, setDeleteTarget] = useState<TechnicalCondition | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['technical-conditions', projectId],
    queryFn: () => technicalConditionsApi.getByProject(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<TechnicalCondition>) =>
      editing
        ? technicalConditionsApi.update(projectId, editing.id, data)
        : technicalConditionsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-conditions', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => technicalConditionsApi.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-conditions', projectId] });
      setDeleteTarget(null);
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ type: 'WATER', status: 'NOT_STARTED' });
    setModalOpen(true);
  };

  const openEdit = (item: TechnicalCondition) => {
    setEditing(item);
    setForm(item);
    setModalOpen(true);
  };

  const typeOptions = (['WATER', 'SEWER', 'ELECTRICITY', 'GAS', 'HEAT', 'TELECOM', 'STORMWATER', 'OTHER'] as const).map(v => ({
    value: v,
    label: t(`projects.technicalConditions.types.${v}`),
  }));

  const statusOptions = (['NOT_STARTED', 'REQUESTED', 'IN_REVIEW', 'ISSUED', 'CONNECTED', 'EXPIRED'] as const).map(v => ({
    value: v,
    label: t(`projects.technicalConditions.statuses.${v}`),
  }));

  const issuedCount = items.filter(i => i.status === 'ISSUED' || i.status === 'CONNECTED').length;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {t('projects.technicalConditions.title')}
          </h3>
          {items.length > 0 && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {issuedCount}/{items.length}
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> {t('common.add')}
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <Plug size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              {t('projects.technicalConditions.empty')}
            </p>
            <Button size="sm" variant="secondary" onClick={openAdd}>
              {t('projects.technicalConditions.addBtn')}
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
                <span className="text-base" role="img" aria-label={item.type}>
                  {TYPE_ICONS[item.type] || TYPE_ICONS.OTHER}
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {t(`projects.technicalConditions.types.${item.type}`)}
                  </p>
                  {item.provider && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.provider}</p>
                  )}
                  {item.maxLoad && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {t('projects.technicalConditions.maxLoad')}: {item.maxLoad}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? STATUS_COLORS.NOT_STARTED}`}>
                  {t(`projects.technicalConditions.statuses.${item.status}`)}
                </span>
                <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} aria-label={t('common.edit')} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><Pencil size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }} aria-label={t('common.delete')} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedId && (
        <div className="mt-4 space-y-3">
          <Suspense fallback={<div className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
            <FileAttachmentPanel entityType="TECHNICAL_CONDITION" entityId={selectedId} />
          </Suspense>
          {items.find(i => i.id === selectedId)?.approvalChainId && (
            <Suspense fallback={<div className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />}>
              <ApprovalTimeline entityType="TECHNICAL_CONDITION" entityId={selectedId} />
            </Suspense>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('projects.technicalConditions.editTitle') : t('projects.technicalConditions.addTitle')}>
        <div className="space-y-4">
          <FormField label={t('projects.technicalConditions.type')}>
            <Select options={typeOptions} value={form.type ?? ''} onChange={e => setForm(f => ({ ...f, type: e.target.value as TechnicalConditionType }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={statusOptions} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as TechnicalConditionStatus }))} />
          </FormField>
          <FormField label={t('projects.technicalConditions.provider')}>
            <Input value={form.provider ?? ''} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.technicalConditions.requestNumber')}>
            <Input value={form.requestNumber ?? ''} onChange={e => setForm(f => ({ ...f, requestNumber: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t('projects.technicalConditions.requestDate')}>
              <Input type="date" value={form.requestDate ?? ''} onChange={e => setForm(f => ({ ...f, requestDate: e.target.value }))} />
            </FormField>
            <FormField label={t('projects.technicalConditions.issueDate')}>
              <Input type="date" value={form.issueDate ?? ''} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
            </FormField>
          </div>
          <FormField label={t('projects.technicalConditions.validUntil')}>
            <Input type="date" value={form.validUntil ?? ''} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.technicalConditions.maxLoad')}>
            <Input value={form.maxLoad ?? ''} onChange={e => setForm(f => ({ ...f, maxLoad: e.target.value }))} placeholder={t('projects.technicalConditions.maxLoadPlaceholder')} />
          </FormField>
          <FormField label={t('projects.technicalConditions.connectionPoint')}>
            <Input value={form.connectionPoint ?? ''} onChange={e => setForm(f => ({ ...f, connectionPoint: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.technicalConditions.connectionFee')}>
            <Input type="number" value={form.connectionFee ?? ''} onChange={e => setForm(f => ({ ...f, connectionFee: Number(e.target.value) }))} />
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

export default TechnicalConditionsPanel;
