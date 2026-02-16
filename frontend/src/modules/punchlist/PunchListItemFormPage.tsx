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
import { punchlistApi } from '@/api/punchlist';
import { t } from '@/i18n';
import type { CreatePunchItemRequest, PunchCategory, PunchItem } from './types';

const punchListItemSchema = z.object({
  title: z.string().min(1, t('forms.punchListItem.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().min(1, t('forms.punchListItem.validation.descriptionRequired')).max(2000, t('forms.common.maxChars', { count: '2000' })),
  projectId: z.string().min(1, t('forms.punchListItem.validation.projectRequired')),
  location: z.string().max(300, t('forms.common.maxChars', { count: '300' })).optional(),
  category: z.enum(['DEFICIENCY', 'INCOMPLETE_WORK', 'DAMAGE', 'SAFETY'], {
    required_error: t('forms.punchListItem.validation.categoryRequired'),
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required_error: t('forms.punchListItem.validation.priorityRequired'),
  }),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  photoNote: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional(),
});

type PunchListItemFormData = z.infer<typeof punchListItemSchema>;
type UiPunchCategory = PunchListItemFormData['category'];

const categoryOptions = [
  { value: 'DEFICIENCY', label: t('forms.punchListItem.categories.deficiency') },
  { value: 'INCOMPLETE_WORK', label: t('forms.punchListItem.categories.incompleteWork') },
  { value: 'DAMAGE', label: t('forms.punchListItem.categories.damage') },
  { value: 'SAFETY', label: t('forms.punchListItem.categories.safety') },
];

const priorityOptions = [
  { value: 'LOW', label: t('forms.punchListItem.priorities.low') },
  { value: 'MEDIUM', label: t('forms.punchListItem.priorities.medium') },
  { value: 'HIGH', label: t('forms.punchListItem.priorities.high') },
  { value: 'CRITICAL', label: t('forms.punchListItem.priorities.critical') },
];

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '2', label: 'БЦ "Горизонт"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const assigneeOptions = [
  { value: '', label: t('forms.punchListItem.assigneeNotAssigned') },
  { value: 'u1', label: 'Иванов И.И.' },
  { value: 'u2', label: 'Петров П.П.' },
  { value: 'u3', label: 'Сидоров С.С.' },
  { value: 'u4', label: 'Козлов К.К.' },
];

const mapUiCategoryToApiCategory: Record<UiPunchCategory, PunchCategory> = {
  DEFICIENCY: 'STRUCTURAL',
  INCOMPLETE_WORK: 'ARCHITECTURAL',
  DAMAGE: 'FINISHING',
  SAFETY: 'FIRE_SAFETY',
};

const mapApiCategoryToUiCategory = (category: PunchCategory): UiPunchCategory => {
  switch (category) {
    case 'STRUCTURAL':
      return 'DEFICIENCY';
    case 'ARCHITECTURAL':
      return 'INCOMPLETE_WORK';
    case 'FINISHING':
      return 'DAMAGE';
    case 'FIRE_SAFETY':
      return 'SAFETY';
    default:
      return 'DEFICIENCY';
  }
};


const PunchListItemFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingItem } = useQuery<PunchItem>({
    queryKey: ['punchItem', id],
    queryFn: () => punchlistApi.getPunchItem(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PunchListItemFormData>({
    resolver: zodResolver(punchListItemSchema),
    defaultValues: existingItem
      ? {
          title: existingItem.title ?? '',
          description: existingItem.description ?? '',
          projectId: existingItem.projectId,
          location: existingItem.location ?? '',
          category: mapApiCategoryToUiCategory(existingItem.category),
          priority: existingItem.priority,
          assignedToId: existingItem.assignedToId ?? '',
          dueDate: existingItem.dueDate ?? '',
          photoNote: existingItem.notes ?? '',
        }
      : {
          title: '',
          description: '',
          projectId: '',
          location: '',
          category: '' as any,
          priority: '' as any,
          assignedToId: '',
          dueDate: '',
          photoNote: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: PunchListItemFormData) => {
      const payload: CreatePunchItemRequest = {
        title: data.title,
        description: data.description,
        punchListId: existingItem?.punchListId ?? 'pl1',
        priority: data.priority,
        category: mapUiCategoryToApiCategory[data.category],
        projectId: data.projectId,
        location: data.location?.trim() || t('forms.punchListItem.locationNotSpecified'),
        assignedToId: data.assignedToId || 'u1',
        dueDate: data.dueDate || undefined,
        notes: data.photoNote || undefined,
      };
      return punchlistApi.createPunchItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punchItems'] });
      toast.success(t('forms.punchListItem.createSuccess'));
      navigate('/punch-list');
    },
    onError: () => {
      toast.error(t('forms.punchListItem.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PunchListItemFormData) => {
      return punchlistApi.updatePunchItem(id!, {
        title: data.title,
        description: data.description || undefined,
        projectId: data.projectId,
        location: data.location?.trim() || t('forms.punchListItem.locationNotSpecified'),
        category: mapUiCategoryToApiCategory[data.category],
        priority: data.priority,
        assignedToId: data.assignedToId || 'u1',
        dueDate: data.dueDate || undefined,
        notes: data.photoNote || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punchItems'] });
      queryClient.invalidateQueries({ queryKey: ['punchItem', id] });
      toast.success(t('forms.punchListItem.updateSuccess'));
      navigate(`/punch-list/${id}`);
    },
    onError: () => {
      toast.error(t('forms.punchListItem.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<PunchListItemFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.punchListItem.editTitle') : t('forms.punchListItem.createTitle')}
        subtitle={isEdit ? existingItem?.title : t('forms.punchListItem.createSubtitle')}
        backTo={isEdit ? `/punch-list/${id}` : '/punch-list'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.punchListItem.breadcrumbPunchList'), href: '/punch-list' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.punchListItem.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.punchListItem.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.punchListItem.labelCategory')} error={errors.category?.message} required>
              <Select
                options={categoryOptions}
                placeholder={t('forms.punchListItem.placeholderCategory')}
                hasError={!!errors.category}
                {...register('category')}
              />
            </FormField>
            <FormField label={t('forms.punchListItem.labelPriority')} error={errors.priority?.message} required>
              <Select
                options={priorityOptions}
                placeholder={t('forms.punchListItem.placeholderPriority')}
                hasError={!!errors.priority}
                {...register('priority')}
              />
            </FormField>
            <FormField label={t('forms.punchListItem.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.punchListItem.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.punchListItem.labelAssignee')} error={errors.assignedToId?.message}>
              <Select
                options={assigneeOptions}
                placeholder={t('forms.punchListItem.placeholderAssignee')}
                hasError={!!errors.assignedToId}
                {...register('assignedToId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.punchListItem.sectionDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.punchListItem.labelLocation')} error={errors.location?.message}>
              <Input
                placeholder={t('forms.punchListItem.placeholderLocation')}
                hasError={!!errors.location}
                {...register('location')}
              />
            </FormField>
            <FormField label={t('forms.punchListItem.labelDueDate')} error={errors.dueDate?.message}>
              <Input type="date" hasError={!!errors.dueDate} {...register('dueDate')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.description')} error={errors.description?.message} required>
              <Textarea
                placeholder={t('forms.punchListItem.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.punchListItem.labelPhotoNote')} error={errors.photoNote?.message}>
              <Input
                placeholder={t('forms.punchListItem.placeholderPhotoNote')}
                hasError={!!errors.photoNote}
                {...register('photoNote')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.punchListItem.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/punch-list/${id}` : '/punch-list')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PunchListItemFormPage;
