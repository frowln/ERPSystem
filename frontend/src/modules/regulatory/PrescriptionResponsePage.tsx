import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  Send,
  Search,
  Eye,
  CheckCircle,
  Clock,
  FilePlus,
  Plus,
  Trash2,
  Paperclip,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate } from '@/lib/format';
import type {
  Prescription,
  PrescriptionResponse,
  ResponseTemplate,
  CorrectiveAction,
} from './types';
import type { PaginatedResponse } from '@/types';
import { t } from '@/i18n';

const responseStatusColorMap: Record<string, string> = {
  draft: 'yellow',
  sent: 'blue',
  accepted: 'green',
};

const PrescriptionResponsePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<ResponseTemplate | null>(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [details, setDetails] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState<
    { description: string; responsibleName: string; dueDate: string }[]
  >([]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const { data: prescriptionData } = useQuery<
    PaginatedResponse<Prescription>
  >({
    queryKey: ['prescriptions-for-response'],
    queryFn: () => regulatoryApi.getPrescriptions({ size: 200 }),
  });

  const { data: responses = [], isLoading } = useQuery<PrescriptionResponse[]>({
    queryKey: ['prescription-responses'],
    queryFn: () => regulatoryApi.getPrescriptionResponses(),
  });

  const { data: templates = [] } = useQuery<ResponseTemplate[]>({
    queryKey: ['response-templates'],
    queryFn: () => regulatoryApi.getResponseTemplates(),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      regulatoryApi.generateResponse(
        selectedPrescriptionId,
        selectedTemplateId,
        details,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription-responses'] });
      toast.success(t('regulatory.prGenerateSuccess'));
      setGenerateOpen(false);
      setSelectedPrescriptionId('');
      setSelectedTemplateId('');
      setDetails('');
      setCorrectiveActions([]);
      setEvidenceFiles([]);
    },
    onError: () => toast.error(t('regulatory.prGenerateError')),
  });

  const prescriptions = prescriptionData?.content ?? [];

  const filteredResponses = useMemo(() => {
    if (!search) return responses;
    const lower = search.toLowerCase();
    return responses.filter(
      (r) =>
        r.prescriptionNumber.toLowerCase().includes(lower) ||
        r.templateName.toLowerCase().includes(lower) ||
        r.responseText.toLowerCase().includes(lower),
    );
  }, [responses, search]);

  const metrics = useMemo(() => {
    const total = responses.length;
    const drafts = responses.filter((r) => r.status === 'draft').length;
    const sent = responses.filter((r) => r.status === 'sent').length;
    const accepted = responses.filter((r) => r.status === 'accepted').length;
    return { total, drafts, sent, accepted };
  }, [responses]);

  const getResponseStatusLabel = useCallback(
    (status: string): string => {
      const map: Record<string, string> = {
        draft: t('regulatory.prStatusDraft'),
        sent: t('regulatory.prStatusSent'),
        accepted: t('regulatory.prStatusAccepted'),
      };
      return map[status] ?? status;
    },
    [],
  );

  const columns = useMemo<ColumnDef<PrescriptionResponse, unknown>[]>(
    () => [
      {
        accessorKey: 'prescriptionNumber',
        header: t('regulatory.prColPrescription'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'templateName',
        header: t('regulatory.prColTemplate'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'responseText',
        header: t('regulatory.prColResponseText'),
        size: 300,
        cell: ({ getValue }) => (
          <p className="text-neutral-700 dark:text-neutral-300 text-xs truncate max-w-[280px]">
            {getValue<string>()}
          </p>
        ),
      },
      {
        accessorKey: 'status',
        header: t('regulatory.prColStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={responseStatusColorMap}
            label={getResponseStatusLabel(getValue<string>())}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('regulatory.prColCreatedAt'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
    ],
    [getResponseStatusLabel],
  );

  const handlePreview = useCallback((tpl: ResponseTemplate) => {
    setPreviewTemplate(tpl);
    setPreviewOpen(true);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.prTitle')}
        subtitle={t('regulatory.prSubtitle', {
          count: String(responses.length),
        })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          {
            label: t('regulatory.breadcrumbRegulatory'),
            href: '/regulatory/dashboard',
          },
          { label: t('regulatory.prBreadcrumb') },
        ]}
        actions={
          <Button
            iconLeft={<FilePlus size={16} />}
            onClick={() => setGenerateOpen(true)}
          >
            {t('regulatory.prBtnGenerate')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FileText size={18} />}
          label={t('regulatory.prMetricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('regulatory.prMetricDrafts')}
          value={metrics.drafts}
        />
        <MetricCard
          icon={<Send size={18} />}
          label={t('regulatory.prMetricSent')}
          value={metrics.sent}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('regulatory.prMetricAccepted')}
          value={metrics.accepted}
        />
      </div>

      {/* Templates section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          {t('regulatory.prTemplatesTitle')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">
                    {tpl.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {tpl.category}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  iconLeft={<Eye size={14} />}
                  onClick={() => handlePreview(tpl)}
                >
                  {t('regulatory.prBtnPreview')}
                </Button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 col-span-full py-4 text-center">
              {t('regulatory.prNoTemplates')}
            </p>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
        {t('regulatory.prHistoryTitle')}
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('regulatory.prSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<PrescriptionResponse>
        data={filteredResponses}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('regulatory.prEmptyTitle')}
        emptyDescription={t('regulatory.prEmptyDesc')}
      />

      {/* Generate Response Modal */}
      <Modal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title={t('regulatory.prGenerateTitle')}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setGenerateOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              disabled={!selectedPrescriptionId || !selectedTemplateId}
            >
              {t('regulatory.prBtnGenerateAction')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('regulatory.prFieldPrescription')} required>
            <Select
              options={prescriptions.map((p) => ({
                value: p.id,
                label: `${p.number} - ${p.description.substring(0, 50)}`,
              }))}
              value={selectedPrescriptionId}
              onChange={(e) => setSelectedPrescriptionId(e.target.value)}
              placeholder={t('regulatory.prSelectPrescription')}
            />
          </FormField>
          <FormField label={t('regulatory.prFieldTemplate')} required>
            <Select
              options={templates.map((tpl) => ({
                value: tpl.id,
                label: tpl.name,
              }))}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              placeholder={t('regulatory.prSelectTemplate')}
            />
          </FormField>
          <FormField label={t('regulatory.prFieldDetails')}>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder={t('regulatory.prDetailsPlaceholder')}
            />
          </FormField>

          {/* Corrective Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('regulatory.prCorrectiveActions')}
              </label>
              <Button
                variant="ghost"
                size="xs"
                iconLeft={<Plus size={14} />}
                onClick={() =>
                  setCorrectiveActions((prev) => [
                    ...prev,
                    { description: '', responsibleName: '', dueDate: '' },
                  ])
                }
              >
                {t('regulatory.prAddAction')}
              </Button>
            </div>
            {correctiveActions.length === 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 py-2">
                {t('regulatory.prNoActions')}
              </p>
            )}
            <div className="space-y-3">
              {correctiveActions.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Input
                      placeholder={t('regulatory.prActionDescription')}
                      value={action.description}
                      onChange={(e) =>
                        setCorrectiveActions((prev) =>
                          prev.map((a, i) =>
                            i === idx
                              ? { ...a, description: e.target.value }
                              : a,
                          ),
                        )
                      }
                      className="flex-1"
                    />
                    <button
                      onClick={() =>
                        setCorrectiveActions((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-400 hover:text-danger-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('regulatory.prActionResponsible')}
                      value={action.responsibleName}
                      onChange={(e) =>
                        setCorrectiveActions((prev) =>
                          prev.map((a, i) =>
                            i === idx
                              ? { ...a, responsibleName: e.target.value }
                              : a,
                          ),
                        )
                      }
                    />
                    <Input
                      type="date"
                      value={action.dueDate}
                      onChange={(e) =>
                        setCorrectiveActions((prev) =>
                          prev.map((a, i) =>
                            i === idx
                              ? { ...a, dueDate: e.target.value }
                              : a,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Files */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('regulatory.prEvidenceFiles')}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm text-neutral-700 dark:text-neutral-300">
                <Paperclip size={14} />
                {t('regulatory.prAttachFiles')}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setEvidenceFiles((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!),
                      ]);
                    }
                  }}
                />
              </label>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {evidenceFiles.length > 0
                  ? t('regulatory.prFilesCount', {
                      count: String(evidenceFiles.length),
                    })
                  : t('regulatory.prNoFiles')}
              </span>
            </div>
            {evidenceFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {evidenceFiles.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300"
                  >
                    <Paperclip size={12} className="text-neutral-400" />
                    <span className="truncate">{file.name}</span>
                    <button
                      onClick={() =>
                        setEvidenceFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-neutral-400 hover:text-danger-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      {/* Template Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTemplate?.name ?? ''}
        size="lg"
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
              {t('regulatory.prPreviewCategory')}
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {previewTemplate?.category}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase mb-1">
              {t('regulatory.prPreviewText')}
            </p>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {previewTemplate?.templateText}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PrescriptionResponsePage;
