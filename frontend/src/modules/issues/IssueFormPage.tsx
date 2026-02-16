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
import { issuesApi } from '@/api/issues';
import { t } from '@/i18n';

const issueSchema = z.object({
  title: z.string().min(1, t('forms.issue.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  type: z.enum([ 'DEFECT', 'SAFETY', 'COORDINATION', 'DESIGN', 'SCHEDULE'], {
    required_error: t('forms.issue.validation.typeRequired'),
  }),
  priority: z.enum([ 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required_error: t('forms.issue.validation.priorityRequired'),
  }),
  projectId: z.string().min(1, t('forms.issue.validation.projectRequired')),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type IssueFormData = z.input<typeof issueSchema>;

const typeOptions = [
  { value: 'DEFECT', label: t('forms.issue.issueTypes.defect') },
  { value: 'SAFETY', label: t('forms.issue.issueTypes.safety') },
  { value: 'COORDINATION', label: t('forms.issue.issueTypes.coordination') },
  { value: 'DESIGN', label: t('forms.issue.issueTypes.design') },
  { value: 'SCHEDULE', label: t('forms.issue.issueTypes.schedule') },
];

const priorityOptions = [
  { value: 'LOW', label: t('forms.issue.priorities.low') },
  { value: 'MEDIUM', label: t('forms.issue.priorities.medium') },
  { value: 'HIGH', label: t('forms.issue.priorities.high') },
  { value: 'CRITICAL', label: t('forms.issue.priorities.critical') },
];

// Mock data — will be replaced by API data
const getProjectOptions = () => [
  { value: '1', label: t('mockData.projectSolnechny') },
  { value: '2', label: t('mockData.projectGorizont') },
  { value: '3', label: t('mockData.projectBridgeVyatka') },
  { value: '6', label: t('mockData.projectTsCentralny') },
];

// Mock data — will be replaced by API data
const getAssigneeOptions = () => [
  { value: '', label: t('forms.issue.unassigned') },
  { value: 'u1', label: t('mockData.personIvanov') },
  { value: 'u2', label: t('mockData.personPetrov') },
  { value: 'u3', label: t('mockData.personSidorov') },
  { value: 'u4', label: t('mockData.personKozlov') },
];

const IssueFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingIssue } = useQuery({
    queryKey: [ 'ISSUE', id],
    queryFn: () => issuesApi.getIssue(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: existingIssue
      ? {
          title: existingIssue.title,
          description: existingIssue.description ?? '',
          type: existingIssue.type,
          priority: existingIssue.priority,
          projectId: existingIssue.projectId,
          assignedToId: existingIssue.assignedToId ?? '',
          dueDate: existingIssue.dueDate ?? '',
        }
      : {
          title: '',
          description: '',
          type: '' as any,
          priority: '' as any,
          projectId: '',
          assignedToId: '',
          dueDate: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: IssueFormData) => {
      return issuesApi.createIssue({
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        priority: data.priority,
        projectId: data.projectId,
        assignedToId: data.assignedToId || undefined,
        dueDate: data.dueDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success(t('forms.issue.createSuccess'));
      navigate('/issues');
    },
    onError: () => {
      toast.error(t('forms.issue.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: IssueFormData) => {
      return issuesApi.updateIssue(id!, {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        priority: data.priority,
        projectId: data.projectId,
        assignedToId: data.assignedToId || undefined,
        dueDate: data.dueDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: [ 'ISSUE', id] });
      toast.success(t('forms.issue.updateSuccess'));
      navigate(`/issues/${id}`);
    },
    onError: () => {
      toast.error(t('forms.issue.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: IssueFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.issue.editTitle') : t('forms.issue.createTitle')}
        subtitle={isEdit ? existingIssue?.title : t('forms.issue.createSubtitle')}
        backTo={isEdit ? `/issues/${id}` : '/issues'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.issue.breadcrumbIssues'), href: '/issues' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Section: Basic info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.issue.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.issue.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.issue.labelType')} error={errors.type?.message} required>
              <Select
                options={typeOptions}
                hasError={!!errors.type}
                {...register('type')}
              />
            </FormField>
            <FormField label={t('forms.issue.labelPriority')} error={errors.priority?.message} required>
              <Select
                options={priorityOptions}
                hasError={!!errors.priority}
                {...register('priority')}
              />
            </FormField>
            <FormField label={t('forms.issue.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={getProjectOptions()}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.issue.labelAssignee')} error={errors.assignedToId?.message}>
              <Select
                options={getAssigneeOptions()}
                placeholder={t('forms.issue.selectAssignee')}
                hasError={!!errors.assignedToId}
                {...register('assignedToId')}
              />
            </FormField>
          </div>
        </section>

        {/* Section: Details */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.issue.sectionDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.issue.labelDueDate')} error={errors.dueDate?.message}>
              <Input type="date" hasError={!!errors.dueDate} {...register('dueDate')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.description')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.issue.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.issue.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/issues/${id}` : '/issues')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IssueFormPage;
