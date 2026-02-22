import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { ZosDocument, ZosStatus } from './types';
import type { PaginatedResponse } from '@/types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
  DRAFT: 'gray',
  UNDER_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

const getStatusLabels = (): Record<ZosStatus, string> => ({
  DRAFT: t('closeout.zosStatusDraft'),
  UNDER_REVIEW: t('closeout.zosStatusUnderReview'),
  APPROVED: t('closeout.zosStatusApproved'),
  REJECTED: t('closeout.zosStatusRejected'),
});

type TabId = 'all' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED';

interface FormData {
  projectId: string;
  documentNumber: string;
  title: string;
  system: string;
  issuedDate: string;
  issuedByName: string;
  issuedByOrganization: string;
  conclusionText: string;
  remarks: string;
}

const emptyForm: FormData = {
  projectId: '',
  documentNumber: '',
  title: '',
  system: '',
  issuedDate: '',
  issuedByName: '',
  issuedByOrganization: '',
  conclusionText: '',
  remarks: '',
};

const ZosDocumentListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['zos-documents'],
    queryFn: () => closeoutApi.getZosDocuments({ size: 200 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const documents = (data as PaginatedResponse<ZosDocument> | undefined)?.content ?? [];
  const projects = (projectsData as PaginatedResponse<{ id: string; name: string }> | undefined)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<ZosDocument>) => closeoutApi.createZosDocument(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['zos-documents'] });
      setShowModal(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ZosDocument> }) =>
      closeoutApi.updateZosDocument(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['zos-documents'] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => closeoutApi.deleteZosDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['zos-documents'] });
    },
  });

  const filtered = useMemo(() => {
    if (activeTab === 'all') return documents;
    return documents.filter((d) => d.status === activeTab);
  }, [documents, activeTab]);

  const counts = useMemo(() => ({
    all: documents.length,
    draft: documents.filter((d) => d.status === 'DRAFT').length,
    review: documents.filter((d) => d.status === 'UNDER_REVIEW').length,
    approved: documents.filter((d) => d.status === 'APPROVED').length,
  }), [documents]);

  const statusLabels = getStatusLabels();

  const handleEdit = useCallback((doc: ZosDocument) => {
    setEditingId(doc.id);
    setForm({
      projectId: doc.projectId,
      documentNumber: doc.documentNumber,
      title: doc.title,
      system: doc.system ?? '',
      issuedDate: doc.issuedDate ?? '',
      issuedByName: doc.issuedByName ?? '',
      issuedByOrganization: doc.issuedByOrganization ?? '',
      conclusionText: doc.conclusionText ?? '',
      remarks: doc.remarks ?? '',
    });
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const payload: Partial<ZosDocument> = {
      projectId: form.projectId,
      documentNumber: form.documentNumber,
      title: form.title,
      system: form.system || undefined,
      issuedDate: form.issuedDate || undefined,
      issuedByName: form.issuedByName || undefined,
      issuedByOrganization: form.issuedByOrganization || undefined,
      conclusionText: form.conclusionText || undefined,
      remarks: form.remarks || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [form, editingId, createMutation, updateMutation]);

  const handleDelete = useCallback((doc: ZosDocument) => {
    if (confirm(t('closeout.zosDeleteConfirm').replace('{name}', doc.documentNumber))) {
      deleteMutation.mutate(doc.id);
    }
  }, [deleteMutation]);

  const columns = useMemo<ColumnDef<ZosDocument, unknown>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: t('closeout.zosColNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('closeout.zosColTitle'),
        size: 260,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px] block">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'system',
        header: t('closeout.zosColSystem'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('closeout.zosColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<ZosStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'issuedDate',
        header: t('closeout.zosColIssuedDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<string>() ? formatDate(getValue<string>()) : '—'}</span>
        ),
      },
      {
        accessorKey: 'issuedByName',
        header: t('closeout.zosColIssuedBy'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '—'}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 140,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }}>
              {t('common.edit')}
            </Button>
            <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }}>
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [statusLabels, handleEdit, handleDelete],
  );

  const projectOptions = useMemo(() => [
    { value: '', label: '—' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ], [projects]);

  const setField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.zosTitle')}
        subtitle={t('closeout.zosSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.zosTitle') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => { setEditingId(null); setForm(emptyForm); setShowModal(true); }}>
            {t('closeout.zosCreate')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'DRAFT', label: t('closeout.zosStatusDraft'), count: counts.draft },
          { id: 'UNDER_REVIEW', label: t('closeout.zosStatusUnderReview'), count: counts.review },
          { id: 'APPROVED', label: t('closeout.zosStatusApproved'), count: counts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <DataTable<ZosDocument>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('closeout.zosEmpty')}
        emptyDescription={t('closeout.zosEmptyDesc')}
      />

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? t('closeout.zosFormTitleEdit') : t('closeout.zosFormTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFieldNumber')} *
            </label>
            <Input value={form.documentNumber} onChange={setField('documentNumber')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFieldTitle')} *
            </label>
            <Input value={form.title} onChange={setField('title')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.warrantyOblFieldProject')} *
            </label>
            <Select options={projectOptions} value={form.projectId} onChange={setField('projectId')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFieldSystem')}
            </label>
            <Input value={form.system} onChange={setField('system')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFieldIssuedDate')}
              </label>
              <Input type="date" value={form.issuedDate} onChange={setField('issuedDate')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFieldIssuedBy')}
              </label>
              <Input value={form.issuedByName} onChange={setField('issuedByName')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFieldIssuedByOrg')}
            </label>
            <Input value={form.issuedByOrganization} onChange={setField('issuedByOrganization')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFieldConclusion')}
            </label>
            <textarea
              className="w-full h-24 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={form.conclusionText}
              onChange={(e) => setForm((prev) => ({ ...prev, conclusionText: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFieldRemarks')}
            </label>
            <Input value={form.remarks} onChange={setField('remarks')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingId(null); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.documentNumber || !form.title || !form.projectId}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ZosDocumentListPage;
