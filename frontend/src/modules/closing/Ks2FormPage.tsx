import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { closingApi } from '@/api/closing';
import { t } from '@/i18n';
import { useProjectOptions, useContractOptions } from '@/hooks/useSelectOptions';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ks2Schema = z.object({
  number: z.string().min(1, t('closing.ks2Form.validationNumber')),
  name: z.string().min(1, t('closing.ks2Form.validationName')),
  documentDate: z.string().min(1, t('closing.ks2Form.validationDate')),
  projectId: z.string().min(1, t('closing.ks2Form.validationProject')),
  contractId: z.string().min(1, t('closing.ks2Form.validationContract')),
  notes: z.string().optional(),
});

type Ks2FormData = z.infer<typeof ks2Schema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Ks2FormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load existing data when editing
  const { data: existingKs2, isLoading: isLoadingKs2 } = useQuery({
    queryKey: ['ks2', id],
    queryFn: () => closingApi.getKs2(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Ks2FormData>({
    resolver: zodResolver(ks2Schema),
    values: isEdit && existingKs2
      ? {
          number: (existingKs2 as { number?: string }).number ?? '',
          name: (existingKs2 as { name?: string }).name ?? '',
          documentDate: (existingKs2 as { documentDate?: string }).documentDate ?? '',
          projectId: (existingKs2 as { projectId?: string }).projectId ?? '',
          contractId: (existingKs2 as { contractId?: string }).contractId ?? '',
          notes: (existingKs2 as { notes?: string }).notes ?? '',
        }
      : undefined,
    defaultValues: {
      number: '',
      name: '',
      documentDate: '',
      projectId: '',
      contractId: '',
      notes: '',
    },
  });

  const selectedProjectId = watch('projectId');

  // Select options
  const { options: projectOptions, isLoading: projectsLoading } = useProjectOptions();
  const { options: contractOptions, isLoading: contractsLoading } = useContractOptions(
    selectedProjectId || undefined,
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Ks2FormData) =>
      closingApi.createKs2({
        number: data.number,
        name: data.name,
        documentDate: data.documentDate,
        projectId: data.projectId,
        contractId: data.contractId,
        notes: data.notes || undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ks2-documents'] });
      toast.success(t('closing.ks2Form.toastCreated'));
      navigate(`/ks2/${(result as { data: { id: string } }).data.id}`);
    },
    onError: () => {
      toast.error(t('closing.ks2Form.toastCreateError'));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Ks2FormData) =>
      closingApi.updateKs2(id!, {
        number: data.number,
        name: data.name,
        documentDate: data.documentDate,
        projectId: data.projectId,
        contractId: data.contractId,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', id] });
      queryClient.invalidateQueries({ queryKey: ['ks2-documents'] });
      toast.success(t('closing.ks2Form.toastUpdated'));
      navigate(`/ks2/${id}`);
    },
    onError: () => {
      toast.error(t('closing.ks2Form.toastUpdateError'));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: Ks2FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Show loading skeleton when editing and data hasn't loaded yet
  if (isEdit && isLoadingKs2) {
    return (
      <div className="animate-fade-in">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('closing.ks2Form.titleEdit') : t('closing.ks2Form.titleCreate')}
        subtitle={
          isEdit
            ? t('closing.ks2Form.subtitleEdit')
            : t('closing.ks2Form.subtitleCreate')
        }
        backTo={isEdit ? `/ks2/${id}` : '/ks2'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('closing.ks2.breadcrumbKs2'), href: '/ks2' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        {/* Section 1: Basic data */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('closing.ks2Form.sectionBasicData')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('closing.ks2Form.labelNumber')} error={errors.number?.message} required>
              <Input
                placeholder="КС-2-001"
                hasError={!!errors.number}
                {...register('number')}
              />
            </FormField>

            <FormField label={t('closing.ks2Form.labelDocDate')} error={errors.documentDate?.message} required>
              <Input
                type="date"
                hasError={!!errors.documentDate}
                {...register('documentDate')}
              />
            </FormField>

            <FormField
              label={t('closing.ks2Form.labelName')}
              error={errors.name?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                placeholder={t('closing.ks2Form.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
          </div>
        </section>

        {/* Section 2: Binding */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('closing.ks2Form.sectionBinding')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('closing.ks2Form.labelProject')} error={errors.projectId?.message} required>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={projectOptions}
                    placeholder={projectsLoading ? t('common.loading') : t('closing.ks2Form.placeholderProject')}
                    hasError={!!errors.projectId}
                    disabled={projectsLoading}
                    {...field}
                  />
                )}
              />
            </FormField>

            <FormField label={t('closing.ks2Form.labelContract')} error={errors.contractId?.message} required>
              <Controller
                name="contractId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={contractOptions}
                    placeholder={
                      contractsLoading
                        ? t('common.loading')
                        : !selectedProjectId
                        ? t('closing.ks2Form.placeholderSelectProjectFirst')
                        : t('closing.ks2Form.placeholderContract')
                    }
                    hasError={!!errors.contractId}
                    disabled={contractsLoading || !selectedProjectId}
                    {...field}
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        {/* Section 3: Notes */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('common.notes')}
          </h2>
          <FormField label={t('closing.ks2Form.labelNotes')} error={errors.notes?.message}>
            <Textarea
              placeholder={t('closing.ks2Form.placeholderNotes')}
              rows={3}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap pb-8">
          <Button type="submit" loading={isPending}>
            {isEdit ? t('forms.common.saveChanges') : t('closing.ks2Form.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/ks2/${id}` : '/ks2')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Ks2FormPage;
