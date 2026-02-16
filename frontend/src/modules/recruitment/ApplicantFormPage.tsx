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
import { recruitmentApi } from '@/api/recruitment';
import { t } from '@/i18n';

const applicantSchema = z.object({
  firstName: z.string().min(1, t('forms.applicant.validation.firstNameRequired')).max(100, t('forms.common.maxChars', { count: '100' })),
  lastName: z.string().min(1, t('forms.applicant.validation.lastNameRequired')).max(100, t('forms.common.maxChars', { count: '100' })),
  email: z
    .string()
    .min(1, t('forms.applicant.validation.emailRequired'))
    .refine(
      (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      t('forms.applicant.validation.emailInvalid'),
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d+\-() ]+$/.test(val),
      t('forms.applicant.validation.phoneInvalid'),
    ),
  positionId: z.string().min(1, t('forms.applicant.validation.positionRequired')),
  resumeUrl: z.string().url(t('forms.applicant.validation.resumeUrlInvalid')).optional().or(z.literal('')),
  status: z.enum([ 'NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'], {
    required_error: t('forms.applicant.validation.statusRequired'),
  }),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type ApplicantFormData = z.input<typeof applicantSchema>;

const positionOptions = [
  { value: 'pos1', label: 'Инженер-строитель' },
  { value: 'pos2', label: 'Прораб' },
  { value: 'pos3', label: 'Архитектор' },
  { value: 'pos4', label: 'Сметчик' },
  { value: 'pos5', label: 'Инженер ПТО' },
  { value: 'pos6', label: 'Менеджер по снабжению' },
  { value: 'pos7', label: 'Бухгалтер' },
];

const statusOptions = [
  { value: 'NEW', label: t('forms.applicant.statuses.new') },
  { value: 'SCREENING', label: t('forms.applicant.statuses.screening') },
  { value: 'INTERVIEW', label: t('forms.applicant.statuses.interview') },
  { value: 'OFFER', label: t('forms.applicant.statuses.offer') },
  { value: 'HIRED', label: t('forms.applicant.statuses.hired') },
  { value: 'REJECTED', label: t('forms.applicant.statuses.rejected') },
  { value: 'WITHDRAWN', label: t('forms.applicant.statuses.withdrawn') },
];

const ApplicantFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingApplicant } = useQuery({
    queryKey: ['applicant', id],
    queryFn: () => recruitmentApi.getApplicant(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicantFormData>({
    resolver: zodResolver(applicantSchema),
    defaultValues: existingApplicant
      ? {
          firstName: existingApplicant.fullName.split(' ')[1] ?? '',
          lastName: existingApplicant.fullName.split(' ')[0] ?? '',
          email: existingApplicant.email,
          phone: existingApplicant.phone ?? '',
          positionId: existingApplicant.positionId,
          resumeUrl: existingApplicant.resumeUrl ?? '',
          status: existingApplicant.status,
          notes: existingApplicant.notes ?? '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          positionId: '',
          resumeUrl: '',
          status: 'NEW',
          notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => {
      return recruitmentApi.createApplicant({
        fullName: `${data.lastName} ${data.firstName}`,
        email: data.email,
        phone: data.phone || undefined,
        positionId: data.positionId,
        resumeUrl: data.resumeUrl || undefined,
        status: data.status,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      toast.success(t('forms.applicant.createSuccess'));
      navigate('/recruitment/applicants');
    },
    onError: () => {
      toast.error(t('forms.applicant.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => {
      return recruitmentApi.updateApplicant(id!, {
        fullName: `${data.lastName} ${data.firstName}`,
        email: data.email,
        phone: data.phone || undefined,
        positionId: data.positionId,
        resumeUrl: data.resumeUrl || undefined,
        status: data.status,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      toast.success(t('forms.applicant.updateSuccess'));
      navigate(`/recruitment/applicants/${id}`);
    },
    onError: () => {
      toast.error(t('forms.applicant.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: ApplicantFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.applicant.editTitle') : t('forms.applicant.createTitle')}
        subtitle={isEdit ? existingApplicant?.fullName : t('forms.applicant.createSubtitle')}
        backTo={isEdit ? `/recruitment/applicants/${id}` : '/recruitment/applicants'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.applicant.breadcrumbRecruitment'), href: '/recruitment/applicants' },
          { label: isEdit ? t('forms.common.editing') : t('forms.applicant.breadcrumbAdding') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.applicant.sectionPersonal')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.applicant.labelLastName')} error={errors.lastName?.message} required>
              <Input
                placeholder="Иванов"
                hasError={!!errors.lastName}
                {...register('lastName')}
              />
            </FormField>
            <FormField label={t('forms.applicant.labelFirstName')} error={errors.firstName?.message} required>
              <Input
                placeholder="Иван"
                hasError={!!errors.firstName}
                {...register('firstName')}
              />
            </FormField>
            <FormField label={t('forms.applicant.labelEmail')} error={errors.email?.message} required>
              <Input
                type="email"
                placeholder="ivanov@example.com"
                hasError={!!errors.email}
                {...register('email')}
              />
            </FormField>
            <FormField label={t('forms.applicant.labelPhone')} error={errors.phone?.message}>
              <Input
                placeholder="+7 (999) 123-45-67"
                hasError={!!errors.phone}
                {...register('phone')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.applicant.sectionPosition')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.applicant.labelPosition')} error={errors.positionId?.message} required>
              <Select
                options={positionOptions}
                placeholder={t('forms.applicant.placeholderPosition')}
                hasError={!!errors.positionId}
                {...register('positionId')}
              />
            </FormField>
            <FormField label={t('forms.applicant.labelStatus')} error={errors.status?.message} required>
              <Select
                options={statusOptions}
                placeholder={t('forms.applicant.placeholderStatus')}
                hasError={!!errors.status}
                {...register('status')}
              />
            </FormField>
            <FormField label={t('forms.applicant.labelResumeUrl')} error={errors.resumeUrl?.message} className="sm:col-span-2">
              <Input
                placeholder="https://hh.ru/resume/..."
                hasError={!!errors.resumeUrl}
                {...register('resumeUrl')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.applicant.sectionAdditional')}</h2>
          <FormField label={t('forms.applicant.labelNotes')} error={errors.notes?.message}>
            <Textarea
              placeholder={t('forms.applicant.placeholderNotes')}
              rows={4}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.applicant.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/recruitment/applicants/${id}` : '/recruitment/applicants')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantFormPage;
