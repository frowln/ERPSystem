import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { ptoApi } from '@/api/pto';
import { t } from '@/i18n';

const ptoDocumentSchema = z.object({
  title: z.string().min(1, t('forms.ptoDocument.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  documentType: z.enum([ 'ACT', 'PROTOCOL', 'CERTIFICATE', 'TEST_REPORT'], {
    required_error: t('forms.ptoDocument.validation.documentTypeRequired'),
  }),
  projectId: z.string().min(1, t('forms.ptoDocument.validation.projectRequired')),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  contractorId: z.string().optional(),
  inspectionDate: z.string().optional(),
  result: z.enum([ 'PASS', 'FAIL', 'CONDITIONAL'], {
    required_error: t('forms.ptoDocument.validation.resultRequired'),
  }),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type PtoDocumentFormData = z.input<typeof ptoDocumentSchema>;

const documentTypeOptions = [
  { value: 'act', label: t('forms.ptoDocument.documentTypes.act') },
  { value: 'protocol', label: t('forms.ptoDocument.documentTypes.protocol') },
  { value: 'CERTIFICATE', label: t('forms.ptoDocument.documentTypes.certificate') },
  { value: 'TEST_REPORT', label: t('forms.ptoDocument.documentTypes.testReport') },
];

const resultOptions = [
  { value: 'pass', label: t('forms.ptoDocument.results.pass') },
  { value: 'fail', label: t('forms.ptoDocument.results.fail') },
  { value: 'conditional', label: t('forms.ptoDocument.results.conditional') },
];

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '2', label: 'БЦ "Горизонт"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const contractorOptions = [
  { value: '', label: t('forms.ptoDocument.noContractor') },
  { value: 'c1', label: 'ООО "СтройМонтаж"' },
  { value: 'c2', label: 'ООО "ЭлектроСвязь"' },
  { value: 'c3', label: 'ИП Сергеев' },
  { value: 'c4', label: 'ООО "ТеплоСервис"' },
];

const PtoDocumentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingDocumentData } = useQuery({
    queryKey: ['ptoDocument', id],
    queryFn: () => ptoApi.getDocument(id!),
    enabled: isEdit,
  });

  const existingDocument = existingDocumentData as Record<string, any> | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PtoDocumentFormData>({
    resolver: zodResolver(ptoDocumentSchema),
    defaultValues: existingDocument
      ? {
          title: existingDocument.title ?? '',
          documentType: existingDocument.documentType,
          projectId: existingDocument.projectId,
          description: existingDocument.description ?? '',
          contractorId: existingDocument.contractorId ?? '',
          inspectionDate: existingDocument.inspectionDate ?? '',
          result: existingDocument.result,
          notes: existingDocument.notes ?? '',
        }
      : {
          title: '',
          documentType: '' as any,
          projectId: '',
          description: '',
          contractorId: '',
          inspectionDate: '',
          result: '' as any,
          notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: PtoDocumentFormData) => {
      return ptoApi.createDocument({
        title: data.title,
        documentType: data.documentType,
        projectId: data.projectId,
        description: data.description || undefined,
        contractorId: data.contractorId || undefined,
        inspectionDate: data.inspectionDate || undefined,
        result: data.result,
        notes: data.notes || undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptoDocuments'] });
      toast.success(t('forms.ptoDocument.createSuccess'));
      navigate('/pto');
    },
    onError: () => {
      toast.error(t('forms.ptoDocument.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PtoDocumentFormData) => {
      return ptoApi.updateDocument(id!, {
        title: data.title,
        documentType: data.documentType,
        projectId: data.projectId,
        description: data.description || undefined,
        contractorId: data.contractorId || undefined,
        inspectionDate: data.inspectionDate || undefined,
        result: data.result,
        notes: data.notes || undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptoDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['ptoDocument', id] });
      toast.success(t('forms.ptoDocument.updateSuccess'));
      navigate(`/pto/${id}`);
    },
    onError: () => {
      toast.error(t('forms.ptoDocument.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: PtoDocumentFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.ptoDocument.editTitle') : t('forms.ptoDocument.createTitle')}
        subtitle={isEdit ? existingDocument?.title : t('forms.ptoDocument.createSubtitle')}
        backTo={isEdit ? `/pto/${id}` : '/pto'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.ptoDocument.breadcrumbPto'), href: '/pto' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.ptoDocument.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.ptoDocument.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.ptoDocument.labelDocumentType')} error={errors.documentType?.message} required>
              <Select
                options={documentTypeOptions}
                placeholder={t('forms.ptoDocument.placeholderDocumentType')}
                hasError={!!errors.documentType}
                {...register('documentType')}
              />
            </FormField>
            <FormField label={t('forms.ptoDocument.labelResult')} error={errors.result?.message} required>
              <Select
                options={resultOptions}
                placeholder={t('forms.ptoDocument.placeholderResult')}
                hasError={!!errors.result}
                {...register('result')}
              />
            </FormField>
            <FormField label={t('forms.ptoDocument.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.ptoDocument.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.ptoDocument.labelContractor')} error={errors.contractorId?.message}>
              <Select
                options={contractorOptions}
                placeholder={t('forms.ptoDocument.placeholderContractor')}
                hasError={!!errors.contractorId}
                {...register('contractorId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.ptoDocument.sectionDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.ptoDocument.labelInspectionDate')} error={errors.inspectionDate?.message}>
              <Input type="date" hasError={!!errors.inspectionDate} {...register('inspectionDate')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.ptoDocument.labelDescription')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.ptoDocument.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.ptoDocument.labelNotes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.ptoDocument.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.ptoDocument.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/pto/${id}` : '/pto')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PtoDocumentFormPage;
