import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { closingApi } from '@/api/closing';
import { t } from '@/i18n';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useProjectOptions, useContractOptions } from '@/hooks/useSelectOptions';
import type { Ks3Document } from '@/types';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const ks3Schema = z.object({
  number: z.string().min(1, t('forms.ks3.validation.numberRequired')),
  name: z.string().min(1, t('forms.ks3.validation.nameRequired')),
  documentDate: z.string().min(1, t('forms.ks3.validation.documentDateRequired')),
  periodFrom: z.string().min(1, t('forms.ks3.validation.periodFromRequired')),
  periodTo: z.string().min(1, t('forms.ks3.validation.periodToRequired')),
  projectId: z.string().min(1, t('forms.ks3.validation.projectRequired')),
  contractId: z.string().min(1, t('forms.ks3.validation.contractRequired')),
  retentionPercent: z
    .string()
    .transform((v) => Number(v)),
  notes: z.string().optional(),
});

type Ks3FormData = z.input<typeof ks3Schema>;
type Ks3FormParsed = z.output<typeof ks3Schema>;

// ---------------------------------------------------------------------------
// Helper: map Ks3Document → form default values
// ---------------------------------------------------------------------------
function ks3ToDefaults(doc: Ks3Document): Ks3FormData {
  return {
    number: doc.number,
    name: doc.name,
    documentDate: doc.documentDate,
    periodFrom: doc.periodFrom,
    periodTo: doc.periodTo,
    projectId: doc.projectId,
    contractId: doc.contractId,
    retentionPercent: String(doc.retentionPercent),
    notes: '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Ks3FormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const draftKey = isEdit ? `ks3-edit-${id}` : 'ks3-new';

  const emptyDefaults: Ks3FormData = {
    number: '',
    name: '',
    documentDate: '',
    periodFrom: '',
    periodTo: '',
    projectId: '',
    contractId: '',
    retentionPercent: '5',
    notes: '',
  };

  const { draft, saveDraft, clearDraft, draftAge } = useFormDraft<Ks3FormData>(
    draftKey,
    emptyDefaults,
  );

  // Fetch existing KS-3 for edit mode
  const { data: existingKs3 } = useQuery<Ks3Document>({
    queryKey: ['ks3', id],
    queryFn: () => closingApi.getKs3(id!),
    enabled: isEdit,
  });

  // Select options
  const { options: projectOptions, isLoading: projectsLoading } = useProjectOptions();
  const { options: contractOptions, isLoading: contractsLoading } = useContractOptions();

  // ---- Form ----
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Ks3FormData>({
    resolver: zodResolver(ks3Schema),
    defaultValues: isEdit ? emptyDefaults : (draft ?? emptyDefaults),
  });

  // Once existingKs3 is loaded in edit mode, populate the form
  useEffect(() => {
    if (isEdit && existingKs3) {
      reset(ks3ToDefaults(existingKs3));
    }
  }, [isEdit, existingKs3, reset]);

  // Notify user when draft is restored (create mode)
  useEffect(() => {
    if (!isEdit && draft) {
      toast(t('forms.draftRestored'), { icon: '📝' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save in create mode
  const formValues = watch();
  useEffect(() => {
    if (!isEdit) {
      saveDraft(formValues);
    }
  }, [formValues, isEdit, saveDraft]);

  // ---- Mutations ----
  const createMutation = useMutation({
    mutationFn: (data: Ks3FormParsed) =>
      closingApi.createKs3({
        number: data.number,
        name: data.name,
        documentDate: data.documentDate,
        periodFrom: data.periodFrom,
        periodTo: data.periodTo,
        projectId: data.projectId,
        contractId: data.contractId,
        retentionPercent: data.retentionPercent,
        notes: data.notes || undefined,
      }),
    onSuccess: (res) => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['ks3-documents'] });
      toast.success(t('forms.ks3.createSuccess'));
      navigate(`/ks3/${res.data.id}`);
    },
    onError: () => {
      toast.error(t('forms.ks3.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Ks3FormParsed) =>
      closingApi.updateKs3(id!, {
        number: data.number,
        name: data.name,
        documentDate: data.documentDate,
        periodFrom: data.periodFrom,
        periodTo: data.periodTo,
        projectId: data.projectId,
        contractId: data.contractId,
        retentionPercent: data.retentionPercent,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks3', id] });
      queryClient.invalidateQueries({ queryKey: ['ks3-documents'] });
      toast.success(t('forms.ks3.updateSuccess'));
      navigate(`/ks3/${id}`);
    },
    onError: () => {
      toast.error(t('forms.ks3.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<Ks3FormData> = (raw) => {
    const parsed = ks3Schema.parse(raw) as Ks3FormParsed;
    if (isEdit) {
      updateMutation.mutate(parsed);
    } else {
      createMutation.mutate(parsed);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.ks3.editTitle') : t('forms.ks3.createTitle')}
        subtitle={
          isEdit
            ? existingKs3?.name ?? t('forms.ks3.editSubtitle')
            : t('forms.ks3.createSubtitle')
        }
        backTo={isEdit ? `/ks3/${id}` : '/ks3'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.ks3.breadcrumbKs3'), href: '/ks3' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* ---------------------------------------------------------------- */}
        {/* Section: Основные данные                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.ks3.sectionBasic')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.ks3.labelNumber')}
              error={errors.number?.message}
              required
            >
              <Input
                placeholder={t('forms.ks3.placeholderNumber')}
                hasError={!!errors.number}
                {...register('number')}
              />
            </FormField>

            <FormField
              label={t('forms.ks3.labelDocumentDate')}
              error={errors.documentDate?.message}
              required
            >
              <Input
                type="date"
                hasError={!!errors.documentDate}
                {...register('documentDate')}
              />
            </FormField>

            <FormField
              label={t('forms.ks3.labelName')}
              error={errors.name?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                placeholder={t('forms.ks3.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section: Период                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.ks3.sectionPeriod')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.ks3.labelPeriodFrom')}
              error={errors.periodFrom?.message}
              required
            >
              <Input
                type="date"
                hasError={!!errors.periodFrom}
                {...register('periodFrom')}
              />
            </FormField>

            <FormField
              label={t('forms.ks3.labelPeriodTo')}
              error={errors.periodTo?.message}
              required
            >
              <Input
                type="date"
                hasError={!!errors.periodTo}
                {...register('periodTo')}
              />
            </FormField>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section: Привязка                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.ks3.sectionBinding')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.ks3.labelProject')}
              error={errors.projectId?.message}
              required
            >
              <Select
                options={projectOptions}
                placeholder={
                  projectsLoading
                    ? t('common.loading')
                    : t('forms.ks3.placeholderProject')
                }
                disabled={projectsLoading}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>

            <FormField
              label={t('forms.ks3.labelContract')}
              error={errors.contractId?.message}
              required
            >
              <Select
                options={contractOptions}
                placeholder={
                  contractsLoading
                    ? t('common.loading')
                    : t('forms.ks3.placeholderContract')
                }
                disabled={contractsLoading}
                hasError={!!errors.contractId}
                {...register('contractId')}
              />
            </FormField>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section: Удержание и примечания                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.ks3.sectionRetention')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.ks3.labelRetentionPercent')}
              error={
                errors.retentionPercent
                  ? String(errors.retentionPercent.message)
                  : undefined
              }
              hint={t('forms.ks3.hintRetentionPercent')}
            >
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                placeholder="5"
                hasError={!!errors.retentionPercent}
                {...register('retentionPercent')}
              />
            </FormField>
          </div>

          <div className="mt-5">
            <FormField
              label={t('forms.ks3.labelNotes')}
              error={errors.notes?.message}
            >
              <Textarea
                placeholder={t('forms.ks3.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Footer actions                                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.ks3.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/ks3/${id}` : '/ks3')}
          >
            {t('common.cancel')}
          </Button>
          {!isEdit && draft && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                clearDraft();
                window.location.reload();
              }}
              className="ml-auto text-xs text-neutral-500"
            >
              {t('forms.clearDraft')}
              {draftAge && (
                <span className="ml-1 opacity-60">
                  ({t('forms.draftSavedAt', { age: draftAge })})
                </span>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Ks3FormPage;
