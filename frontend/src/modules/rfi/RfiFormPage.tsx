import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { rfiApi } from '@/api/rfi';
import { projectsApi } from '@/api/projects';
import { permissionsApi } from '@/api/permissions';
import { t } from '@/i18n';
import type { Rfi, RfiPriority } from './types';
import type { Project, PaginatedResponse } from '@/types';

const rfiSchema = z.object({
  subject: z.string().min(1, t('forms.rfi.validation.subjectRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  question: z.string().min(1, t('forms.rfi.validation.questionRequired')).max(2000, t('forms.common.maxChars', { count: '2000' })),
  projectId: z.string().min(1, t('forms.rfi.validation.projectRequired')),
  assignedToId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required_error: t('forms.rfi.validation.priorityRequired'),
  }),
  dueDate: z.string().optional(),
  category: z.enum(['DESIGN', 'CONSTRUCTION', 'MATERIAL', 'SCHEDULE', 'COST', 'OTHER'], {
    required_error: t('forms.rfi.validation.categoryRequired'),
  }),
  attachmentNote: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional(),
});

type RfiFormData = z.infer<typeof rfiSchema>;

const priorityOptions = [
  { value: 'LOW', label: t('forms.rfi.priorities.low') },
  { value: 'MEDIUM', label: t('forms.rfi.priorities.medium') },
  { value: 'HIGH', label: t('forms.rfi.priorities.high') },
  { value: 'CRITICAL', label: t('forms.rfi.priorities.critical') },
];

const categoryOptions = [
  { value: 'DESIGN', label: t('forms.rfi.categories.design') },
  { value: 'CONSTRUCTION', label: t('forms.rfi.categories.construction') },
  { value: 'MATERIAL', label: t('forms.rfi.categories.material') },
  { value: 'SCHEDULE', label: t('forms.rfi.categories.schedule') },
  { value: 'COST', label: t('forms.rfi.categories.cost') },
  { value: 'OTHER', label: t('forms.rfi.categories.other') },
];

const RfiFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => permissionsApi.getUsers({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name }));
  const assigneeOptions = [
    { value: '', label: t('forms.rfi.unassigned') },
    ...(usersData?.content ?? []).map((u) => ({ value: u.id, label: `${u.lastName} ${u.firstName[0]}.` })),
  ];

  const { data: existingRfi } = useQuery<Rfi>({
    queryKey: ['RFI', id],
    queryFn: () => rfiApi.getRfi(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RfiFormData>({
    resolver: zodResolver(rfiSchema),
    defaultValues: existingRfi
      ? {
          subject: existingRfi.subject ?? '',
          question: existingRfi.question ?? '',
          projectId: existingRfi.projectId,
          assignedToId: existingRfi.assignedToId ?? '',
          priority: existingRfi.priority as RfiPriority,
          dueDate: existingRfi.dueDate ?? '',
          category: (existingRfi.specSection as RfiFormData['category']) ?? 'OTHER',
          attachmentNote: existingRfi.distributionList.join(', '),
        }
      : {
          subject: '',
          question: '',
          projectId: '',
          assignedToId: '',
          priority: 'MEDIUM',
          dueDate: '',
          category: 'OTHER',
          attachmentNote: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: RfiFormData) => {
      return rfiApi.createRfi({
        subject: data.subject,
        question: data.question,
        projectId: data.projectId,
        assignedToId: data.assignedToId || undefined,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        specSection: data.category,
        distributionList: data.attachmentNote
          ? data.attachmentNote.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfis'] });
      toast.success(t('forms.rfi.createSuccess'));
      navigate('/rfi');
    },
    onError: () => {
      toast.error(t('forms.rfi.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RfiFormData) => {
      return rfiApi.updateRfi(id!, {
        subject: data.subject,
        question: data.question,
        projectId: data.projectId,
        assignedToId: data.assignedToId || undefined,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        specSection: data.category,
        distributionList: data.attachmentNote
          ? data.attachmentNote.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfis'] });
      queryClient.invalidateQueries({ queryKey: ['RFI', id] });
      toast.success(t('forms.rfi.updateSuccess'));
      navigate(`/rfi/${id}`);
    },
    onError: () => {
      toast.error(t('forms.rfi.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<RfiFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.rfi.editTitle') : t('forms.rfi.createTitle')}
        subtitle={isEdit ? existingRfi?.subject : t('forms.rfi.createSubtitle')}
        backTo={isEdit ? `/rfi/${id}` : '/rfi'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.rfi.breadcrumbRfi'), href: '/rfi' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Section: Basic info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.rfi.labelSubject')} error={errors.subject?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.rfi.placeholderSubject')}
                hasError={!!errors.subject}
                {...register('subject')}
              />
            </FormField>
            <FormField label={t('forms.rfi.labelCategory')} error={errors.category?.message} required>
              <Select
                options={categoryOptions}
                placeholder={t('forms.rfi.placeholderCategory')}
                hasError={!!errors.category}
                {...register('category')}
              />
            </FormField>
            <FormField label={t('forms.rfi.labelPriority')} error={errors.priority?.message} required>
              <Select
                options={priorityOptions}
                hasError={!!errors.priority}
                {...register('priority')}
              />
            </FormField>
            <FormField label={t('forms.rfi.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.rfi.labelAssignee')} error={errors.assignedToId?.message}>
              <Select
                options={assigneeOptions}
                placeholder={t('forms.rfi.selectAssignee')}
                hasError={!!errors.assignedToId}
                {...register('assignedToId')}
              />
            </FormField>
          </div>
        </section>

        {/* Section: Details */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.rfi.sectionDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.rfi.labelDueDate')} error={errors.dueDate?.message}>
              <Input type="date" hasError={!!errors.dueDate} {...register('dueDate')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.rfi.labelQuestion')} error={errors.question?.message} required>
              <Textarea
                placeholder={t('forms.rfi.placeholderQuestion')}
                rows={5}
                hasError={!!errors.question}
                {...register('question')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.rfi.labelAttachmentNote')} error={errors.attachmentNote?.message}>
              <Input
                placeholder={t('forms.rfi.placeholderAttachmentNote')}
                hasError={!!errors.attachmentNote}
                {...register('attachmentNote')}
              />
            </FormField>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.rfi.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/rfi/${id}` : '/rfi')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RfiFormPage;
