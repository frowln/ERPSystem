import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type {
  ZosDocument,
  ZosStatus,
  ZosFormData,
  ZosComplianceSection,
  ZosSignature,
} from './types';
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

const DEFAULT_COMPLIANCE_SECTIONS: Omit<ZosComplianceSection, 'id'>[] = [
  { sectionName: '', compliant: true, notes: '' },
];

const DEFAULT_SIGNATURES: Omit<ZosSignature, 'id'>[] = [
  { role: '', fullName: '', organization: '', signed: false },
];

function generateId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface FormState {
  projectId: string;
  documentNumber: string;
  title: string;
  objectName: string;
  objectAddress: string;
  permitNumber: string;
  permitDate: string;
  designDocReferences: string;
  system: string;
  issuedDate: string;
  issuedByName: string;
  issuedByOrganization: string;
  conclusionText: string;
  remarks: string;
  complianceSections: ZosComplianceSection[];
  signatures: ZosSignature[];
}

const emptyForm: FormState = {
  projectId: '',
  documentNumber: '',
  title: '',
  objectName: '',
  objectAddress: '',
  permitNumber: '',
  permitDate: '',
  designDocReferences: '',
  system: '',
  issuedDate: '',
  issuedByName: '',
  issuedByOrganization: '',
  conclusionText: '',
  remarks: '',
  complianceSections: DEFAULT_COMPLIANCE_SECTIONS.map((s) => ({ ...s, id: generateId() })),
  signatures: DEFAULT_SIGNATURES.map((s) => ({ ...s, id: generateId() })),
};

const ZosFormPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ZosDocument | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['zos-form-documents'],
    queryFn: () => closeoutApi.getZosDocuments({ size: 200 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const documents = (data as PaginatedResponse<ZosDocument> | undefined)?.content ?? [];
  const projects = (projectsData as PaginatedResponse<{ id: string; name: string }> | undefined)?.content ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: ZosFormData) => closeoutApi.generateZosFromForm(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['zos-form-documents'] });
      setShowCreateModal(false);
      setForm(emptyForm);
      toast.success(t('closeout.zosFormCreated'));
    },
    onError: () => {
      toast.error(t('closeout.zosFormCreateError'));
    },
  });

  const filtered = useMemo(() => {
    if (activeTab === 'all') return documents;
    return documents.filter((d) => d.status === activeTab);
  }, [documents, activeTab]);

  const counts = useMemo(
    () => ({
      all: documents.length,
      draft: documents.filter((d) => d.status === 'DRAFT').length,
      review: documents.filter((d) => d.status === 'UNDER_REVIEW').length,
      approved: documents.filter((d) => d.status === 'APPROVED').length,
    }),
    [documents],
  );

  const statusLabels = getStatusLabels();

  const handleProjectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const projectId = e.target.value;
      const project = projects.find((p) => p.id === projectId);
      setForm((prev) => ({
        ...prev,
        projectId,
        title: project ? `${t('closeout.zosFormTitlePrefix')} - ${project.name}` : prev.title,
        objectName: project ? project.name : prev.objectName,
      }));
    },
    [projects],
  );

  const handleSubmit = useCallback(() => {
    const payload: ZosFormData = {
      projectId: form.projectId,
      documentNumber: form.documentNumber,
      title: form.title,
      objectName: form.objectName || undefined,
      objectAddress: form.objectAddress || undefined,
      permitNumber: form.permitNumber || undefined,
      permitDate: form.permitDate || undefined,
      designDocReferences: form.designDocReferences || undefined,
      system: form.system || undefined,
      issuedDate: form.issuedDate || undefined,
      issuedByName: form.issuedByName || undefined,
      issuedByOrganization: form.issuedByOrganization || undefined,
      conclusionText: form.conclusionText || undefined,
      complianceSections: form.complianceSections.filter((s) => s.sectionName.trim()),
      remarks: form.remarks || undefined,
      signatures: form.signatures.filter((s) => s.fullName.trim()),
    };
    createMutation.mutate(payload);
  }, [form, createMutation]);

  const handleExportPdf = useCallback(
    async (doc: ZosDocument) => {
      setExportingId(doc.id);
      try {
        const blob = await closeoutApi.exportZosPdf(doc.projectId, doc.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ZOS-${doc.documentNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(t('closeout.zosFormExportSuccess'));
      } catch {
        toast.error(t('closeout.zosFormExportError'));
      } finally {
        setExportingId(null);
      }
    },
    [],
  );

  // --- Compliance section helpers ---
  const addComplianceSection = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      complianceSections: [
        ...prev.complianceSections,
        { id: generateId(), sectionName: '', compliant: true, notes: '' },
      ],
    }));
  }, []);

  const removeComplianceSection = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      complianceSections: prev.complianceSections.filter((s) => s.id !== id),
    }));
  }, []);

  const updateComplianceSection = useCallback(
    (id: string, field: keyof ZosComplianceSection, value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        complianceSections: prev.complianceSections.map((s) =>
          s.id === id ? { ...s, [field]: value } : s,
        ),
      }));
    },
    [],
  );

  // --- Signature helpers ---
  const addSignature = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      signatures: [
        ...prev.signatures,
        { id: generateId(), role: '', fullName: '', organization: '', signed: false },
      ],
    }));
  }, []);

  const removeSignature = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      signatures: prev.signatures.filter((s) => s.id !== id),
    }));
  }, []);

  const updateSignature = useCallback(
    (id: string, field: keyof ZosSignature, value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        signatures: prev.signatures.map((s) =>
          s.id === id ? { ...s, [field]: value } : s,
        ),
      }));
    },
    [],
  );

  const columns = useMemo<ColumnDef<ZosDocument, unknown>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: t('closeout.zosFormColNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('closeout.zosFormColTitle'),
        size: 260,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px] block">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('closeout.zosFormColProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '\u2014'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('closeout.zosFormColStatus'),
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
        header: t('closeout.zosFormColIssuedDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            {getValue<string>() ? formatDate(getValue<string>()) : '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('closeout.zosFormColCreatedAt'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 180,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Eye size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewDoc(row.original);
              }}
            >
              {t('closeout.zosFormPreview')}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Download size={14} />}
              loading={exportingId === row.original.id}
              onClick={(e) => {
                e.stopPropagation();
                void handleExportPdf(row.original);
              }}
            >
              PDF
            </Button>
          </div>
        ),
      },
    ],
    [statusLabels, exportingId, handleExportPdf],
  );

  const projectOptions = useMemo(
    () => [
      { value: '', label: '\u2014' },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  const setField =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.zosFormTitle')}
        subtitle={t('closeout.zosFormSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.zosFormTitle') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              setForm(emptyForm);
              setShowCreateModal(true);
            }}
          >
            {t('closeout.zosFormGenerate')}
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
        emptyTitle={t('closeout.zosFormEmpty')}
        emptyDescription={t('closeout.zosFormEmptyDesc')}
      />

      {/* Create ZOS Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('closeout.zosFormModalTitle')}
        size="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Object Info Section */}
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            {t('closeout.zosFormSectionObjectInfo')}
          </h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFormFieldProject')} *
            </label>
            <Select options={projectOptions} value={form.projectId} onChange={handleProjectChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldObjectName')}
              </label>
              <Input value={form.objectName} onChange={setField('objectName')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldObjectAddress')}
              </label>
              <Input value={form.objectAddress} onChange={setField('objectAddress')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldPermitNumber')}
              </label>
              <Input value={form.permitNumber} onChange={setField('permitNumber')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldPermitDate')}
              </label>
              <Input type="date" value={form.permitDate} onChange={setField('permitDate')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldNumber')} *
              </label>
              <Input value={form.documentNumber} onChange={setField('documentNumber')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldSystem')}
              </label>
              <Input value={form.system} onChange={setField('system')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFormFieldTitle')} *
            </label>
            <Input value={form.title} onChange={setField('title')} />
          </div>

          {/* Design Documentation References */}
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 pt-2">
            {t('closeout.zosFormSectionDesignDocs')}
          </h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFormFieldDesignDocRefs')}
            </label>
            <Textarea
              value={form.designDocReferences}
              onChange={setField('designDocReferences')}
              rows={3}
              placeholder={t('closeout.zosFormDesignDocPlaceholder')}
            />
          </div>

          {/* Compliance Statements per Section */}
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 pt-2">
            {t('closeout.zosFormSectionCompliance')}
          </h3>
          <div className="space-y-3">
            {form.complianceSections.map((section, idx) => (
              <div
                key={section.id}
                className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {t('closeout.zosFormComplianceSection')} {idx + 1}
                  </span>
                  {form.complianceSections.length > 1 && (
                    <button
                      type="button"
                      className="ml-auto text-neutral-400 hover:text-red-500 transition-colors"
                      onClick={() => removeComplianceSection(section.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      value={section.sectionName}
                      onChange={(e) =>
                        updateComplianceSection(section.id, 'sectionName', e.target.value)
                      }
                      placeholder={t('closeout.zosFormComplianceSectionName')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateComplianceSection(section.id, 'compliant', !section.compliant)
                      }
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        section.compliant
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {section.compliant ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {section.compliant
                        ? t('closeout.zosFormCompliant')
                        : t('closeout.zosFormNonCompliant')}
                    </button>
                  </div>
                </div>
                {!section.compliant && (
                  <div className="mt-2">
                    <Input
                      value={section.notes ?? ''}
                      onChange={(e) =>
                        updateComplianceSection(section.id, 'notes', e.target.value)
                      }
                      placeholder={t('closeout.zosFormComplianceNotes')}
                    />
                  </div>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" iconLeft={<Plus size={14} />} onClick={addComplianceSection}>
              {t('closeout.zosFormAddComplianceSection')}
            </Button>
          </div>

          {/* Inspection Results Section */}
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 pt-2">
            {t('closeout.zosFormSectionInspection')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldIssuedDate')}
              </label>
              <Input type="date" value={form.issuedDate} onChange={setField('issuedDate')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.zosFormFieldIssuedBy')}
              </label>
              <Input value={form.issuedByName} onChange={setField('issuedByName')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFormFieldOrg')}
            </label>
            <Input value={form.issuedByOrganization} onChange={setField('issuedByOrganization')} />
          </div>

          {/* Conclusion */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFormFieldConclusion')}
            </label>
            <Textarea
              value={form.conclusionText}
              onChange={setField('conclusionText')}
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.zosFormFieldRemarks')}
            </label>
            <Textarea value={form.remarks} onChange={setField('remarks')} rows={3} />
          </div>

          {/* Signatures Block */}
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 pt-2">
            {t('closeout.zosFormSectionSignatures')}
          </h3>
          <div className="space-y-3">
            {form.signatures.map((sig, idx) => (
              <div
                key={sig.id}
                className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {t('closeout.zosFormSignature')} {idx + 1}
                  </span>
                  {form.signatures.length > 1 && (
                    <button
                      type="button"
                      className="ml-auto text-neutral-400 hover:text-red-500 transition-colors"
                      onClick={() => removeSignature(sig.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    value={sig.role}
                    onChange={(e) => updateSignature(sig.id, 'role', e.target.value)}
                    placeholder={t('closeout.zosFormSignatureRole')}
                  />
                  <Input
                    value={sig.fullName}
                    onChange={(e) => updateSignature(sig.id, 'fullName', e.target.value)}
                    placeholder={t('closeout.zosFormSignatureFullName')}
                  />
                  <Input
                    value={sig.organization ?? ''}
                    onChange={(e) => updateSignature(sig.id, 'organization', e.target.value)}
                    placeholder={t('closeout.zosFormSignatureOrg')}
                  />
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" iconLeft={<Plus size={14} />} onClick={addSignature}>
              {t('closeout.zosFormAddSignature')}
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              iconLeft={<FileText size={16} />}
              onClick={handleSubmit}
              disabled={!form.documentNumber || !form.title || !form.projectId}
              loading={createMutation.isPending}
            >
              {t('closeout.zosFormGenerate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={t('closeout.zosFormPreviewTitle')}
        size="lg"
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                {t('closeout.zosFormSectionObjectInfo')}
              </h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">{t('closeout.zosFormColNumber')}:</span>
                <span className="font-mono text-neutral-900 dark:text-neutral-100">{previewDoc.documentNumber}</span>
                <span className="text-neutral-500 dark:text-neutral-400">{t('closeout.zosFormColTitle')}:</span>
                <span className="text-neutral-900 dark:text-neutral-100">{previewDoc.title}</span>
                <span className="text-neutral-500 dark:text-neutral-400">{t('closeout.zosFormColProject')}:</span>
                <span className="text-neutral-900 dark:text-neutral-100">{previewDoc.projectName ?? '\u2014'}</span>
                {previewDoc.system && (
                  <>
                    <span className="text-neutral-500 dark:text-neutral-400">{t('closeout.zosFormFieldSystem')}:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{previewDoc.system}</span>
                  </>
                )}
              </div>
            </div>

            {previewDoc.conclusionText && (
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                  {t('closeout.zosFormSectionCompliance')}
                </h4>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                  {previewDoc.conclusionText}
                </p>
              </div>
            )}

            {previewDoc.remarks && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                  {t('closeout.zosFormFieldRemarks')}
                </h4>
                <p className="text-sm text-yellow-900 dark:text-yellow-200 whitespace-pre-wrap">
                  {previewDoc.remarks}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <StatusBadge
                status={previewDoc.status}
                colorMap={statusColorMap}
                label={statusLabels[previewDoc.status] ?? previewDoc.status}
              />
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                  {formatDate(previewDoc.createdAt)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<Download size={14} />}
                  loading={exportingId === previewDoc.id}
                  onClick={() => void handleExportPdf(previewDoc)}
                >
                  {t('closeout.zosFormExportPdf')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ZosFormPage;
