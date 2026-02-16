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
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { ProjectType, ProjectPriority } from '@/types';

const projectSchema = z.object({
  code: z
    .string()
    .min(1, t('forms.project.validation.codeRequired'))
    .max(20, t('forms.common.maxChars', { count: '20' }))
    .regex(/^[А-Яа-яA-Za-z0-9-]+$/, t('forms.project.validation.codeFormat')),
  name: z.string().min(1, t('forms.project.validation.nameRequired')).max(200, t('forms.common.maxChars', { count: '200' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'RENOVATION'], {
    required_error: t('forms.project.validation.typeRequired'),
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required_error: t('forms.project.validation.priorityRequired'),
  }),
  plannedStartDate: z.string().min(1, t('forms.project.validation.startDateRequired')),
  plannedEndDate: z.string().min(1, t('forms.project.validation.endDateRequired')),
  budget: z
    .string()
    .min(1, t('forms.project.validation.budgetRequired'))
    .transform((val) => Number(val.replace(/\s/g, '')))
    .refine((val) => val > 0, t('forms.project.validation.budgetPositive')),
  contractAmount: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val.replace(/\s/g, '')) : undefined)),
  customerName: z.string().min(1, t('forms.project.validation.customerRequired')),
});

type ProjectFormData = z.input<typeof projectSchema>;

const typeOptions = [
  { value: 'RESIDENTIAL', label: t('forms.project.projectTypes.residential') },
  { value: 'COMMERCIAL', label: t('forms.project.projectTypes.commercial') },
  { value: 'INDUSTRIAL', label: t('forms.project.projectTypes.industrial') },
  { value: 'INFRASTRUCTURE', label: t('forms.project.projectTypes.infrastructure') },
  { value: 'RENOVATION', label: t('forms.project.projectTypes.renovation') },
];

const priorityOptions = [
  { value: 'LOW', label: t('forms.project.priorities.low') },
  { value: 'MEDIUM', label: t('forms.project.priorities.medium') },
  { value: 'HIGH', label: t('forms.project.priorities.high') },
  { value: 'CRITICAL', label: t('forms.project.priorities.critical') },
];

const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingProject } = useQuery({
    queryKey: ['PROJECT', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: (existingProject
      ? {
          code: existingProject.code,
          name: existingProject.name,
          description: existingProject.description ?? '',
          type: existingProject.type as ProjectType,
          priority: existingProject.priority as ProjectPriority,
          plannedStartDate: existingProject.plannedStartDate,
          plannedEndDate: existingProject.plannedEndDate,
          budget: String(existingProject.budget),
          contractAmount: existingProject.contractAmount
            ? String(existingProject.contractAmount)
            : '',
          customerName: existingProject.customerName,
        }
      : {
          code: '',
          name: '',
          description: '',
          type: '' as unknown as ProjectType,
          priority: 'MEDIUM' as unknown as ProjectPriority,
          plannedStartDate: '',
          plannedEndDate: '',
          budget: '',
          contractAmount: '',
          customerName: '',
        }) as any,
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) => {
      const parsed = projectSchema.parse(data);
      return projectsApi.createProject({
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        type: parsed.type as ProjectType,
        priority: parsed.priority as ProjectPriority,
        plannedStartDate: parsed.plannedStartDate,
        plannedEndDate: parsed.plannedEndDate,
        budget: parsed.budget as number,
        contractAmount: parsed.contractAmount as number | undefined,
        customerName: parsed.customerName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('forms.project.createSuccess'));
      navigate('/projects');
    },
    onError: () => {
      toast.error(t('forms.project.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProjectFormData) => {
      const parsed = projectSchema.parse(data);
      return projectsApi.updateProject(id!, {
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        type: parsed.type as ProjectType,
        priority: parsed.priority as ProjectPriority,
        plannedStartDate: parsed.plannedStartDate,
        plannedEndDate: parsed.plannedEndDate,
        budget: parsed.budget as number,
        contractAmount: parsed.contractAmount as number | undefined,
        customerName: parsed.customerName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['PROJECT', id] });
      toast.success(t('forms.project.updateSuccess'));
      navigate(`/projects/${id}`);
    },
    onError: () => {
      toast.error(t('forms.project.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.project.editTitle') : t('forms.project.createTitle')}
        subtitle={isEdit ? existingProject?.name : t('forms.project.createSubtitle')}
        backTo={isEdit ? `/projects/${id}` : '/projects'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.project.breadcrumbProjects'), href: '/projects' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.project.labelCode')} error={errors.code?.message} required>
              <Input
                placeholder={t('forms.project.placeholderCode')}
                hasError={!!errors.code}
                {...register('code')}
              />
            </FormField>
            <FormField label={t('forms.project.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.project.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
            <FormField label={t('forms.project.labelType')} error={errors.type?.message} required>
              <Select
                options={typeOptions}
                placeholder={t('forms.project.placeholderType')}
                hasError={!!errors.type}
                {...register('type')}
              />
            </FormField>
            <FormField label={t('forms.project.labelPriority')} error={errors.priority?.message} required>
              <Select
                options={priorityOptions}
                placeholder={t('forms.project.placeholderPriority')}
                hasError={!!errors.priority}
                {...register('priority')}
              />
            </FormField>
            <FormField
              label={t('common.description')}
              error={errors.description?.message}
              className="sm:col-span-2"
            >
              <Textarea
                placeholder={t('forms.project.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.project.sectionDates')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.project.labelPlannedStart')} error={errors.plannedStartDate?.message} required>
              <Input
                type="date"
                hasError={!!errors.plannedStartDate}
                {...register('plannedStartDate')}
              />
            </FormField>
            <FormField label={t('forms.project.labelPlannedEnd')} error={errors.plannedEndDate?.message} required>
              <Input
                type="date"
                hasError={!!errors.plannedEndDate}
                {...register('plannedEndDate')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('forms.project.sectionCost')}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
            {t('forms.project.sectionCostHint')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.project.labelBudget')}
              error={errors.budget?.message}
              required
              hint={t('forms.project.hintBudget')}
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1000000"
                hasError={!!errors.budget}
                {...register('budget')}
              />
            </FormField>
            <FormField
              label={t('forms.project.labelContractAmount')}
              error={errors.contractAmount?.message}
              hint={t('forms.project.hintContractAmount')}
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1200000"
                hasError={!!errors.contractAmount}
                {...register('contractAmount')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.project.sectionParticipants')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.project.labelCustomer')} error={errors.customerName?.message} required>
              <Input
                placeholder={t('forms.project.placeholderCustomer')}
                hasError={!!errors.customerName}
                {...register('customerName')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.project.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectFormPage;
