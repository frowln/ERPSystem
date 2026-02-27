import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, Plus, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { permitsApi } from '@/api/permits';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ConstructionPermit, PermitType, PermitStatus } from '@/types';

const STATUS_COLORS: Record<PermitStatus, string> = {
  NOT_STARTED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const MANDATORY_PERMITS: PermitType[] = ['GPZU', 'EXPERTISE_PD', 'BUILDING_PERMIT', 'ENVIRONMENTAL', 'FIRE_SAFETY'];

const PERMIT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'GPZU', label: t('projects.permits.types.GPZU') },
  { value: 'EXPERTISE_PD', label: t('projects.permits.types.EXPERTISE_PD') },
  { value: 'BUILDING_PERMIT', label: t('projects.permits.types.BUILDING_PERMIT') },
  { value: 'ENVIRONMENTAL', label: t('projects.permits.types.ENVIRONMENTAL') },
  { value: 'FIRE_SAFETY', label: t('projects.permits.types.FIRE_SAFETY') },
  { value: 'OTHER', label: t('projects.permits.types.OTHER') },
];

const PERMIT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'NOT_STARTED', label: t('projects.permits.statuses.NOT_STARTED') },
  { value: 'IN_PROGRESS', label: t('projects.permits.statuses.IN_PROGRESS') },
  { value: 'SUBMITTED', label: t('projects.permits.statuses.SUBMITTED') },
  { value: 'APPROVED', label: t('projects.permits.statuses.APPROVED') },
  { value: 'REJECTED', label: t('projects.permits.statuses.REJECTED') },
  { value: 'EXPIRED', label: t('projects.permits.statuses.EXPIRED') },
];

const PermitsPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConstructionPermit | null>(null);
  const [form, setForm] = useState<Partial<ConstructionPermit>>({ permitType: 'GPZU', status: 'NOT_STARTED' });

  const { data: permits = [] } = useQuery({
    queryKey: ['permits', projectId],
    queryFn: () => permitsApi.getPermits(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<ConstructionPermit>) =>
      editing
        ? permitsApi.updatePermit(projectId, editing.id, data)
        : permitsApi.createPermit(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ permitType: 'GPZU', status: 'NOT_STARTED' });
    setModalOpen(true);
  };

  const openEdit = (permit: ConstructionPermit) => {
    setEditing(permit);
    setForm(permit);
    setModalOpen(true);
  };

  const permitByType = new Map(permits.map(p => [p.permitType, p]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('projects.permits.title')}
        </h3>
        <Button size="sm" variant="ghost" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> {t('common.add')}
        </Button>
      </div>

      <div className="space-y-2">
        {MANDATORY_PERMITS.map(type => {
          const permit = permitByType.get(type);
          const status = permit?.status ?? 'NOT_STARTED';
          const isOverdue = permit?.expiryDate && permit.expiryDate < today && status !== 'APPROVED';
          return (
            <div
              key={type}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isOverdue
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                  : 'border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCheck size={16} className={isOverdue ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'} />
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {t(`projects.permits.types.${type}`)}
                  </p>
                  {permit?.issuingAuthority && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{permit.issuingAuthority}</p>
                  )}
                  {permit?.expiryDate && (
                    <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-neutral-400 dark:text-neutral-500'}`}>
                      {isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                      {t('projects.permits.expiryDate')}: {permit.expiryDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                  {t(`projects.permits.statuses.${status}`)}
                </span>
                {permit && (
                  <button
                    onClick={() => openEdit(permit)}
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {permits.filter(p => !MANDATORY_PERMITS.includes(p.permitType)).map(permit => (
          <div
            key={permit.id}
            className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <FileCheck size={16} className="text-neutral-500 dark:text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {permit.notes ?? t(`projects.permits.types.${permit.permitType}`)}
                </p>
                {permit.number && <p className="text-xs text-neutral-500 dark:text-neutral-400">#{permit.number}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[permit.status]}`}>
                {t(`projects.permits.statuses.${permit.status}`)}
              </span>
              <button
                onClick={() => openEdit(permit)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
              >
                <Pencil size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('projects.permits.editTitle') : t('projects.permits.addTitle')}>
        <div className="space-y-4">
          <FormField label={t('projects.permits.permitType')}>
            <Select options={PERMIT_TYPE_OPTIONS} value={form.permitType ?? ''} onChange={e => setForm(f => ({ ...f, permitType: e.target.value as PermitType }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={PERMIT_STATUS_OPTIONS} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as PermitStatus }))} />
          </FormField>
          <FormField label={t('projects.permits.number')}>
            <Input value={form.number ?? ''} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.permits.issuingAuthority')}>
            <Input value={form.issuingAuthority ?? ''} onChange={e => setForm(f => ({ ...f, issuingAuthority: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('projects.permits.issueDate')}>
              <Input type="date" value={form.issueDate ?? ''} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
            </FormField>
            <FormField label={t('projects.permits.expiryDate')}>
              <Input type="date" value={form.expiryDate ?? ''} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </FormField>
          </div>
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
    </div>
  );
};

export default PermitsPanel;
