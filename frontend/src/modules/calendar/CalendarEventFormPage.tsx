import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select, Checkbox } from '@/design-system/components/FormField';
import { calendarApi, type CalendarEventType } from '@/api/calendar';
import { projectsApi } from '@/api/projects';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';

const calendarEventSchema = z.object({
  title: z.string().min(1, t('forms.calendarEvent.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  eventType: z.enum(['MEETING', 'DEADLINE', 'INSPECTION', 'DELIVERY', 'MILESTONE', 'HOLIDAY', 'TRAINING', 'OTHER'], {
    required_error: t('forms.calendarEvent.validation.eventTypeRequired'),
  }),
  startDate: z.string().min(1, t('forms.calendarEvent.validation.startDateRequired')),
  startTime: z.string().optional(),
  endDate: z.string().min(1, t('forms.calendarEvent.validation.endDateRequired')),
  endTime: z.string().optional(),
  isAllDay: z.boolean().default(false),
  organizerId: z.string().min(1, t('forms.calendarEvent.validation.organizerIdRequired')),
  organizerName: z.string().min(1, t('forms.calendarEvent.validation.organizerNameRequired')),
  location: z.string().max(300, t('forms.common.maxChars', { count: '300' })).optional(),
  projectId: z.string().optional(),
  isOnline: z.boolean().default(false),
  meetingUrl: z.string().url(t('forms.calendarEvent.validation.invalidUrl')).optional().or(z.literal('')),
});

type CalendarEventFormData = z.infer<typeof calendarEventSchema>;

const eventTypeOptions = [
  { value: 'MEETING', label: t('forms.calendarEvent.eventTypes.meeting') },
  { value: 'DEADLINE', label: t('forms.calendarEvent.eventTypes.deadline') },
  { value: 'INSPECTION', label: t('forms.calendarEvent.eventTypes.inspection') },
  { value: 'DELIVERY', label: t('forms.calendarEvent.eventTypes.delivery') },
  { value: 'MILESTONE', label: t('forms.calendarEvent.eventTypes.milestone') },
  { value: 'HOLIDAY', label: t('forms.calendarEvent.eventTypes.holiday') },
  { value: 'TRAINING', label: t('forms.calendarEvent.eventTypes.training') },
  { value: 'OTHER', label: t('forms.calendarEvent.eventTypes.other') },
];

const mapFormTypeToApiType = (eventType: CalendarEventFormData['eventType']): CalendarEventType => {
  switch (eventType) {
    case 'MEETING':
      return 'MEETING';
    case 'DEADLINE':
      return 'DEADLINE';
    case 'INSPECTION':
      return 'INSPECTION';
    case 'DELIVERY':
      return 'DELIVERY';
    case 'MILESTONE':
      return 'MILESTONE';
    case 'HOLIDAY':
      return 'HOLIDAY';
    case 'TRAINING':
      return 'OTHER';
    default:
      return 'OTHER';
  }
};

const mapApiTypeToFormType = (eventType?: string): CalendarEventFormData['eventType'] => {
  switch (eventType) {
    case 'MEETING':
      return 'MEETING';
    case 'DEADLINE':
      return 'DEADLINE';
    case 'INSPECTION':
      return 'INSPECTION';
    case 'DELIVERY':
      return 'DELIVERY';
    case 'MILESTONE':
      return 'MILESTONE';
    case 'HOLIDAY':
      return 'HOLIDAY';
    default:
      return 'OTHER';
  }
};

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const CalendarEventFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const currentUser = useAuthStore((state) => state.user);

  const organizerFullName = `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim();
  const organizerName = currentUser?.fullName ?? (organizerFullName || currentUser?.email || '');
  const organizerId = currentUser?.id ?? '';
  const today = getTodayIsoDate();

  const { data: existingEvent, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['calendar-event', id],
    queryFn: () => calendarApi.getEvent(id!),
    enabled: isEdit,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'calendar-form'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 300 }),
  });

  const projectOptions = useMemo(() => [
    { value: '', label: t('forms.calendarEvent.noProject') },
    ...(projectsData?.content ?? []).map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ], [projectsData]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CalendarEventFormData>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: {
      title: '',
      description: '',
      eventType: '' as never,
      startDate: today,
      startTime: '',
      endDate: today,
      endTime: '',
      isAllDay: false,
      organizerId,
      organizerName,
      location: '',
      projectId: '',
      isOnline: false,
      meetingUrl: '',
    },
  });

  useEffect(() => {
    if (isEdit && existingEvent) {
      reset({
        title: existingEvent.title,
        description: existingEvent.description ?? '',
        eventType: mapApiTypeToFormType(existingEvent.eventType),
        startDate: existingEvent.startDate,
        startTime: existingEvent.startTime ?? '',
        endDate: existingEvent.endDate,
        endTime: existingEvent.endTime ?? '',
        isAllDay: existingEvent.isAllDay,
        organizerId: existingEvent.organizerId ?? organizerId,
        organizerName: existingEvent.organizerName ?? organizerName,
        location: existingEvent.location ?? '',
        projectId: existingEvent.projectId ?? '',
        isOnline: existingEvent.isOnline,
        meetingUrl: existingEvent.meetingUrl ?? '',
      });
      return;
    }

    if (!isEdit) {
      reset({
        title: '',
        description: '',
        eventType: '' as never,
        startDate: today,
        startTime: '',
        endDate: today,
        endTime: '',
        isAllDay: false,
        organizerId,
        organizerName,
        location: '',
        projectId: '',
        isOnline: false,
        meetingUrl: '',
      });
    }
  }, [existingEvent, isEdit, organizerId, organizerName, reset, today]);

  const isAllDay = useWatch({ control, name: 'isAllDay' });
  const isOnline = useWatch({ control, name: 'isOnline' });

  const createMutation = useMutation({
    mutationFn: (data: CalendarEventFormData) => {
      if (!data.organizerId || !data.organizerName) {
        throw new Error('Organizer is required');
      }

      return calendarApi.createEvent({
        title: data.title,
        description: data.description || undefined,
        eventType: mapFormTypeToApiType(data.eventType),
        startDate: data.startDate,
        startTime: data.isAllDay ? undefined : data.startTime || undefined,
        endDate: data.endDate,
        endTime: data.isAllDay ? undefined : data.endTime || undefined,
        isAllDay: data.isAllDay,
        organizerId: data.organizerId,
        organizerName: data.organizerName,
        location: data.isOnline ? undefined : data.location || undefined,
        isOnline: data.isOnline,
        meetingUrl: data.isOnline ? data.meetingUrl || undefined : undefined,
        projectId: data.projectId || undefined,
        recurrenceRule: 'NONE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success(t('forms.calendarEvent.createSuccess'));
      navigate('/calendar');
    },
    onError: () => {
      toast.error(t('forms.calendarEvent.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CalendarEventFormData) =>
      calendarApi.updateEvent(id!, {
        title: data.title,
        description: data.description || undefined,
        eventType: mapFormTypeToApiType(data.eventType),
        startDate: data.startDate,
        startTime: data.isAllDay ? undefined : data.startTime || undefined,
        endDate: data.endDate,
        endTime: data.isAllDay ? undefined : data.endTime || undefined,
        isAllDay: data.isAllDay,
        location: data.isOnline ? undefined : data.location || undefined,
        isOnline: data.isOnline,
        meetingUrl: data.isOnline ? data.meetingUrl || undefined : undefined,
        projectId: data.projectId || undefined,
        recurrenceRule: 'NONE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-event', id] });
      toast.success(t('forms.calendarEvent.updateSuccess'));
      navigate('/calendar');
    },
    onError: () => {
      toast.error(t('forms.calendarEvent.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isOrganizerMissing = !organizerId || !organizerName;

  const onSubmit = (data: CalendarEventFormData) => {
    if (isOrganizerMissing) {
      toast.error(t('errors.forbiddenAction'));
      return;
    }

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.calendarEvent.editTitle') : t('forms.calendarEvent.createTitle')}
        subtitle={isEdit ? existingEvent?.title : t('forms.calendarEvent.createSubtitle')}
        backTo="/calendar"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.calendarEvent.breadcrumbCalendar'), href: '/calendar' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      {isEdit && isLoadingEvent ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-sm text-neutral-500 dark:text-neutral-400">
          {t('common.loading')}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label={t('forms.calendarEvent.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
                <Input
                  placeholder={t('forms.calendarEvent.placeholderTitle')}
                  hasError={!!errors.title}
                  {...register('title')}
                />
              </FormField>
              <FormField label={t('forms.calendarEvent.labelEventType')} error={errors.eventType?.message} required>
                <Select
                  options={eventTypeOptions}
                  placeholder={t('forms.calendarEvent.placeholderEventType')}
                  hasError={!!errors.eventType}
                  {...register('eventType')}
                />
              </FormField>
              <FormField label={t('forms.calendarEvent.labelProject')} error={errors.projectId?.message}>
                <Select
                  options={projectOptions}
                  hasError={!!errors.projectId}
                  {...register('projectId')}
                />
              </FormField>
              <FormField label={t('forms.calendarEvent.labelOrganizer')}>
                <Input value={organizerName} readOnly disabled />
              </FormField>
              <input type="hidden" {...register('organizerId')} />
              <input type="hidden" {...register('organizerName')} />
              <div className="flex items-end pb-1">
                <Checkbox
                  id="isAllDay"
                  label={t('forms.calendarEvent.labelAllDay')}
                  {...register('isAllDay')}
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.calendarEvent.sectionDateTime')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label={t('forms.calendarEvent.labelStartDate')} error={errors.startDate?.message} required>
                <Input type="date" hasError={!!errors.startDate} {...register('startDate')} />
              </FormField>
              {!isAllDay && (
                <FormField label={t('forms.calendarEvent.labelStartTime')} error={errors.startTime?.message}>
                  <Input type="time" hasError={!!errors.startTime} {...register('startTime')} />
                </FormField>
              )}
              <FormField label={t('forms.calendarEvent.labelEndDate')} error={errors.endDate?.message} required>
                <Input type="date" hasError={!!errors.endDate} {...register('endDate')} />
              </FormField>
              {!isAllDay && (
                <FormField label={t('forms.calendarEvent.labelEndTime')} error={errors.endTime?.message}>
                  <Input type="time" hasError={!!errors.endTime} {...register('endTime')} />
                </FormField>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.calendarEvent.sectionLocation')}</h2>
            <div className="grid grid-cols-1 gap-5">
              <Checkbox
                id="isOnline"
                label={t('forms.calendarEvent.labelOnlineMeeting')}
                {...register('isOnline')}
              />
              {isOnline ? (
                <FormField label={t('forms.calendarEvent.labelMeetingUrl')} error={errors.meetingUrl?.message}>
                  <Input
                    placeholder="https://meet.google.com/abc-defg-hij"
                    hasError={!!errors.meetingUrl}
                    {...register('meetingUrl')}
                  />
                </FormField>
              ) : (
                <FormField label={t('forms.calendarEvent.labelLocation')} error={errors.location?.message}>
                  <Input
                    placeholder={t('forms.calendarEvent.placeholderLocation')}
                    hasError={!!errors.location}
                    {...register('location')}
                  />
                </FormField>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('common.description')}</h2>
            <FormField label={t('forms.calendarEvent.labelDescription')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.calendarEvent.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </section>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={isSubmitting} disabled={isOrganizerMissing}>
              {isEdit ? t('forms.common.saveChanges') : t('forms.calendarEvent.createButton')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/calendar')}
            >
              {t('common.back')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CalendarEventFormPage;
