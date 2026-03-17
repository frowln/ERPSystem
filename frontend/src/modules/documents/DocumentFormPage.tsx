import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { documentsApi, type UpsertDocumentRequest } from '@/api/documents';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';

const PD_SECTIONS = ['AR', 'KR', 'OViK', 'VK', 'EOM', 'SS', 'TH', 'GP', 'POS', 'EN', 'OTHER'] as const;

const ALL_CATEGORIES = [
  'CONTRACT', 'APPENDIX', 'ESTIMATE', 'LOCAL_ESTIMATE', 'SPECIFICATION',
  'DRAWING', 'DESIGN_DOC', 'PERMIT', 'ACT', 'INVOICE', 'COMMERCIAL_PROPOSAL',
  'PROTOCOL', 'CORRESPONDENCE', 'CERTIFICATE', 'SCHEDULE', 'PHOTO', 'REPORT',
  'TECHNICAL', 'OTHER',
] as const;

const documentSchema = z.object({
  title: z.string().min(1, t('forms.document.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  category: z.string().min(1, t('forms.document.validation.documentTypeRequired')),
  projectId: z.string().min(1, t('forms.document.validation.projectRequired')),
  documentNumber: z.string().max(200, t('forms.common.maxChars', { count: '200' })).optional(),
  tags: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  pdSection: z.string().optional(),
});

type DocumentFormData = z.input<typeof documentSchema>;

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: 'Договор',
  APPENDIX: 'Приложение',
  ESTIMATE: 'Смета',
  LOCAL_ESTIMATE: 'ЛСР',
  SPECIFICATION: 'Спецификация',
  DRAWING: 'Чертёж',
  DESIGN_DOC: 'Проектная документация',
  PERMIT: 'Разрешение',
  ACT: 'Акт',
  INVOICE: 'Счёт',
  COMMERCIAL_PROPOSAL: 'Коммерческое предложение',
  PROTOCOL: 'Протокол',
  CORRESPONDENCE: 'Переписка',
  CERTIFICATE: 'Сертификат',
  SCHEDULE: 'График',
  PHOTO: 'Фото',
  REPORT: 'Отчёт',
  TECHNICAL: 'Тех. документация',
  OTHER: 'Прочее',
};

const DocumentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const { data: existingDocument } = useQuery({
    queryKey: ['DOCUMENT', id],
    queryFn: () => documentsApi.getDocument(id!),
    enabled: isEdit,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'document-form-options'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('forms.document.placeholderDocumentType') },
      ...ALL_CATEGORIES.map((cat) => ({
        value: cat,
        label: CATEGORY_LABELS[cat] ?? cat,
      })),
    ],
    [],
  );

  const projectOptions = useMemo(
    () => [
      { value: '', label: t('forms.document.placeholderProject') },
      ...(projectsData?.content ?? []).map((project) => ({
        value: project.id,
        label: `${project.code} · ${project.name}`,
      })),
    ],
    [projectsData],
  );

  const pdSectionOptions = useMemo(
    () => [
      { value: '', label: t('documents.pdSection.placeholder') },
      ...PD_SECTIONS.map((s) => ({
        value: s,
        label: t(`documents.pdSection.${s.toLowerCase()}` as 'documents.pdSection.ar'),
      })),
    ],
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      projectId: '',
      documentNumber: '',
      tags: '',
      notes: '',
      pdSection: '',
    },
  });

  const watchedCategory = watch('category');

  useEffect(() => {
    if (!existingDocument) return;

    reset({
      title: existingDocument.title ?? '',
      description: existingDocument.description ?? '',
      category: existingDocument.category ?? 'OTHER',
      projectId: existingDocument.projectId ?? '',
      documentNumber: existingDocument.documentNumber ?? '',
      tags: Array.isArray(existingDocument.tags)
        ? existingDocument.tags.join(', ')
        : (existingDocument.tags ?? ''),
      notes: existingDocument.notes ?? '',
      pdSection: (existingDocument as unknown as Record<string, unknown>).pdSection as string ?? '',
    });
    setSelectedFile(null);
  }, [existingDocument, reset]);

  const createMutation = useMutation({
    mutationFn: (payload: UpsertDocumentRequest) => documentsApi.createDocument(payload),
    onError: () => {
      toast.error(t('forms.document.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpsertDocumentRequest) => documentsApi.updateDocument(id!, payload),
    onError: () => {
      toast.error(t('forms.document.updateError'));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; file: File }) =>
      documentsApi.uploadDocumentFile(documentId, file),
    onError: () => {
      toast.error(t('forms.document.uploadError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.deleteDocument(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['DOCUMENTS'] });
      toast.success(t('forms.document.deleteSuccess'));
      navigate('/documents');
    },
    onError: () => {
      toast.error(t('forms.document.deleteError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  const onSubmit = async (data: DocumentFormData) => {
    // Send empty string for documentNumber so backend clears it (not undefined which is skipped)
    const docNumber = data.documentNumber?.trim();
    const payload: UpsertDocumentRequest = {
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      category: data.category,
      projectId: data.projectId,
      documentNumber: isEdit ? (docNumber || '') : (docNumber || undefined),
      tags: data.tags?.trim() || undefined,
      fileName: selectedFile?.name || existingDocument?.fileName,
      fileSize: selectedFile?.size || existingDocument?.fileSize,
      mimeType: selectedFile?.type || existingDocument?.mimeType,
      notes: data.notes?.trim() || undefined,
      pdSection: data.pdSection?.trim() || undefined,
    } as UpsertDocumentRequest;

    if (isEdit) {
      try {
        const updated = await updateMutation.mutateAsync(payload);
        if (selectedFile) {
          await uploadMutation.mutateAsync({ documentId: updated.id, file: selectedFile });
        }
        queryClient.invalidateQueries({ queryKey: ['DOCUMENTS'] });
        queryClient.invalidateQueries({ queryKey: ['DOCUMENT', updated.id] });
        toast.success(t('forms.document.updateSuccess'));
        navigate('/documents');
      } catch {
        // toast handled by mutations
      }
      return;
    }

    try {
      const created = await createMutation.mutateAsync(payload);
      if (selectedFile) {
        await uploadMutation.mutateAsync({ documentId: created.id, file: selectedFile });
      }
      queryClient.invalidateQueries({ queryKey: ['DOCUMENTS'] });
      toast.success(t('forms.document.createSuccess'));
      navigate('/documents');
    } catch {
      // toast handled by mutations
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.document.editTitle') : t('forms.document.createTitle')}
        subtitle={isEdit ? existingDocument?.title : t('forms.document.createSubtitle')}
        backTo="/documents"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.document.breadcrumbDocuments'), href: '/documents' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.document.sectionBasicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.document.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.document.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.document.labelDocumentType')} error={errors.category?.message} required>
              <Select
                options={categoryOptions}
                placeholder={t('forms.document.placeholderDocumentType')}
                hasError={!!errors.category}
                {...register('category')}
              />
            </FormField>
            <FormField label={t('forms.document.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.document.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.document.labelDocumentNumber')} error={errors.documentNumber?.message}>
              <Input
                placeholder={t('forms.document.placeholderDocumentNumber')}
                hasError={!!errors.documentNumber}
                {...register('documentNumber')}
              />
            </FormField>
            <FormField label={t('forms.document.labelVersion')}>
              <Input value={String(existingDocument?.docVersion ?? 1)} disabled />
            </FormField>
            {(watchedCategory === 'DRAWING' || watchedCategory === 'SPECIFICATION' || watchedCategory === 'DESIGN_DOC') && (
              <FormField label={t('documents.pdSection.label')} error={errors.pdSection?.message}>
                <Select
                  options={pdSectionOptions}
                  hasError={!!errors.pdSection}
                  {...register('pdSection')}
                />
              </FormField>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.document.sectionFileTags')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.document.labelFile')} className="sm:col-span-2">
              <Input
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {selectedFile
                  ? `${t('forms.document.fileSelected')}: ${selectedFile.name}`
                  : existingDocument?.fileName
                    ? `${t('forms.document.currentFile')}: ${existingDocument.fileName}`
                    : t('forms.document.fileUploadHint')}
              </p>
            </FormField>
            <FormField label={t('forms.document.labelTags')} error={errors.tags?.message} className="sm:col-span-2">
              <Input
                placeholder={t('forms.document.placeholderTags')}
                hasError={!!errors.tags}
                {...register('tags')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.document.sectionDetails')}</h2>
          <div className="mt-0">
            <FormField label={t('forms.document.labelDescription')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.document.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.document.labelNotes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.document.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.document.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/documents')}
          >
            {t('common.back')}
          </Button>
          {isEdit && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-danger-600 dark:text-danger-400">{t('forms.document.deleteConfirm')}</span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                  >
                    {t('common.delete')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="ml-auto text-danger-600 hover:text-danger-700 dark:text-danger-400"
                  iconLeft={<Trash2 size={16} />}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t('forms.document.deleteBtn')}
                </Button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default DocumentFormPage;
