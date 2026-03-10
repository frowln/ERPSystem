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
import { designApi } from '@/api/design';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';

const designVersionSchema = z.object({
  name: z.string().min(1, t('forms.designVersion.validation.nameRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  designPackageId: z.string().min(1, t('forms.designVersion.validation.designSectionRequired')),
  version: z.string().min(1, t('forms.designVersion.validation.versionRequired')).max(20, t('forms.common.maxChars', { count: '20' })),
  fileUrl: z.string().url(t('forms.designVersion.validation.fileUrlInvalid')).optional().or(z.literal('')),
  status: z.enum([ 'DRAFT', 'REVIEW', 'APPROVED', 'SUPERSEDED'], {
    required_error: t('forms.designVersion.validation.statusRequired'),
  }),
  projectId: z.string().min(1, t('forms.designVersion.validation.projectRequired')),
});

type DesignVersionFormData = z.input<typeof designVersionSchema>;

const sectionOptions = [
  { value: 'sec1', label: t('forms.designVersion.sections.ar') },
  { value: 'sec2', label: t('forms.designVersion.sections.kr') },
  { value: 'sec3', label: t('forms.designVersion.sections.ios') },
  { value: 'sec4', label: t('forms.designVersion.sections.eo') },
  { value: 'sec5', label: t('forms.designVersion.sections.vk') },
  { value: 'sec6', label: t('forms.designVersion.sections.ov') },
  { value: 'sec7', label: t('forms.designVersion.sections.pos') },
];

const statusOptions = [
  { value: 'DRAFT', label: t('forms.designVersion.statuses.draft') },
  { value: 'REVIEW', label: t('forms.designVersion.statuses.review') },
  { value: 'APPROVED', label: t('forms.designVersion.statuses.approved') },
  { value: 'SUPERSEDED', label: t('forms.designVersion.statuses.superseded') },
];

const DesignVersionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const { options: projectOptions } = useProjectOptions();

  const { data: existingVersion } = useQuery({
    queryKey: ['design-version', id],
    queryFn: () => designApi.getVersion(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DesignVersionFormData>({
    resolver: zodResolver(designVersionSchema),
    defaultValues: existingVersion
      ? {
          name: existingVersion.title,
          description: existingVersion.description ?? '',
          designPackageId: existingVersion.sectionId,
          version: existingVersion.version,
          fileUrl: existingVersion.fileUrl ?? '',
          status: (existingVersion.status === 'IN_REVIEW' ? 'REVIEW' : existingVersion.status) as any,
          projectId: existingVersion.projectId,
        }
      : {
          name: '',
          description: '',
          designPackageId: '',
          version: '',
          fileUrl: '',
          status: 'DRAFT',
          projectId: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: DesignVersionFormData) => {
      return designApi.createVersion({
        title: data.name,
        description: data.description || undefined,
        sectionId: data.designPackageId,
        version: data.version,
        projectId: data.projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-versions'] });
      toast.success(t('forms.designVersion.createSuccess'));
      navigate('/design/versions');
    },
    onError: () => {
      toast.error(t('forms.designVersion.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DesignVersionFormData) => {
      const apiStatus = data.status === 'REVIEW' ? 'IN_REVIEW' : data.status;
      return designApi.updateVersionStatus(id!, apiStatus as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-versions'] });
      queryClient.invalidateQueries({ queryKey: ['design-version', id] });
      toast.success(t('forms.designVersion.updateSuccess'));
      navigate('/design/versions');
    },
    onError: () => {
      toast.error(t('forms.designVersion.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: DesignVersionFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.designVersion.editTitle') : t('forms.designVersion.createTitle')}
        subtitle={isEdit ? existingVersion?.title : t('forms.designVersion.createSubtitle')}
        backTo="/design/versions"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.designVersion.breadcrumbDesign'), href: '/design' },
          { label: t('forms.designVersion.breadcrumbVersions'), href: '/design/versions' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.designVersion.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('design.placeholderVersionName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
            <FormField label={t('forms.designVersion.labelDesignSection')} error={errors.designPackageId?.message} required>
              <Select
                options={sectionOptions}
                placeholder={t('forms.designVersion.placeholderDesignSection')}
                hasError={!!errors.designPackageId}
                {...register('designPackageId')}
              />
            </FormField>
            <FormField label={t('forms.designVersion.labelVersion')} error={errors.version?.message} required>
              <Input
                placeholder="1.0"
                hasError={!!errors.version}
                {...register('version')}
              />
            </FormField>
            <FormField label={t('forms.designVersion.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.designVersion.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.designVersion.labelStatus')} error={errors.status?.message} required>
              <Select
                options={statusOptions}
                hasError={!!errors.status}
                {...register('status')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.designVersion.sectionFileDescription')}</h2>
          <div className="grid grid-cols-1 gap-5">
            <FormField label={t('forms.designVersion.labelFileUrl')} error={errors.fileUrl?.message}>
              <Input
                placeholder="https://storage.example.com/design/file.pdf"
                hasError={!!errors.fileUrl}
                {...register('fileUrl')}
              />
            </FormField>
            <FormField label={t('forms.designVersion.labelDescription')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.designVersion.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.designVersion.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/design/versions')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DesignVersionFormPage;
