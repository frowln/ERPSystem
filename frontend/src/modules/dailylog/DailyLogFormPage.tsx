import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { PhotoAttachments } from '@/components/PhotoAttachments';
import { dailyLogApi } from '@/api/dailylog';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import VoiceInput from '@/components/VoiceInput';

const dailyLogSchema = z.object({
  date: z.string().min(1, t('forms.dailyLog.validation.dateRequired')),
  projectId: z.string().min(1, t('forms.dailyLog.validation.projectRequired')),
  weatherCondition: z.enum(['CLEAR', 'CLOUDY', 'RAIN', 'SNOW', 'FOG', 'WIND'], {
    required_error: t('forms.dailyLog.validation.weatherRequired'),
  }),
  temperature: z
    .string()
    .min(1, t('forms.dailyLog.validation.temperatureRequired'))
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= -60 && val <= 60, t('forms.dailyLog.validation.temperatureRange')),
  windSpeed: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 0))
    .refine((val) => val >= 0 && val <= 100, t('forms.dailyLog.validation.windSpeedRange')),
  workDescription: z.string().min(1, t('forms.dailyLog.validation.workDescriptionRequired')).max(5000, t('forms.common.maxChars', { count: '5000' })),
  crewCount: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || val > 0, t('forms.dailyLog.validation.crewCountPositive')),
  hoursWorked: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || (val > 0 && val <= 24), t('forms.dailyLog.validation.hoursRange')),
  safetyNotes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  delayDescription: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type DailyLogFormData = z.input<typeof dailyLogSchema>;

const weatherOptions = [
  { value: 'CLEAR', label: t('forms.dailyLog.weatherTypes.clear') },
  { value: 'CLOUDY', label: t('forms.dailyLog.weatherTypes.cloudy') },
  { value: 'RAIN', label: t('forms.dailyLog.weatherTypes.rain') },
  { value: 'SNOW', label: t('forms.dailyLog.weatherTypes.snow') },
  { value: 'FOG', label: t('forms.dailyLog.weatherTypes.fog') },
  { value: 'WIND', label: t('forms.dailyLog.weatherTypes.wind') },
];

const DailyLogFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [isCopyingYesterday, setIsCopyingYesterday] = useState(false);

  const { data: existingLog } = useQuery({
    queryKey: ['daily-log', id],
    queryFn: () => dailyLogApi.getDailyLog(id!),
    enabled: isEdit,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });
  const projectOptions = (projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name }));

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: existingLog
      ? {
          date: existingLog.date,
          projectId: existingLog.projectId,
          weatherCondition: existingLog.weather.condition,
          temperature: String(existingLog.weather.temperature),
          windSpeed: String(existingLog.weather.windSpeed),
          workDescription:
            existingLog.entries
              .filter((e) => e.type === 'WORK')
              .map((e) => e.description)
              .join('\n') || '',
          crewCount: existingLog.entries[0]?.workerCount ? String(existingLog.entries[0].workerCount) : '',
          hoursWorked: '',
          safetyNotes: existingLog.notes ?? '',
          delayDescription: '',
        }
      : {
          date: new Date().toISOString().split('T')[0],
          projectId: '',
          weatherCondition: '' as any,
          temperature: '',
          windSpeed: '',
          workDescription: '',
          crewCount: '',
          hoursWorked: '',
          safetyNotes: '',
          delayDescription: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: DailyLogFormData) => {
      const parsed = dailyLogSchema.parse(data);
      return dailyLogApi.createDailyLog({
        date: data.date,
        projectId: data.projectId,
        weather: {
          condition: parsed.weatherCondition,
          temperature: parsed.temperature as number,
          windSpeed: parsed.windSpeed as number,
          humidity: 0,
        },
        notes:
          [
            data.workDescription,
            data.safetyNotes ? `${t('forms.dailyLog.notesSafetyPrefix')} ${data.safetyNotes}` : '',
            data.delayDescription ? `${t('forms.dailyLog.notesDelayPrefix')} ${data.delayDescription}` : '',
          ]
            .filter(Boolean)
            .join('\n\n') || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      toast.success(t('forms.dailyLog.createSuccess'));
      navigate('/daily-log');
    },
    onError: () => {
      toast.error(t('forms.dailyLog.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DailyLogFormData) => {
      const parsed = dailyLogSchema.parse(data);
      return dailyLogApi.updateDailyLog(id!, {
        date: data.date,
        projectId: data.projectId,
        weather: {
          condition: parsed.weatherCondition,
          temperature: parsed.temperature as number,
          windSpeed: parsed.windSpeed as number,
          humidity: 0,
        },
        notes:
          [
            data.workDescription,
            data.safetyNotes ? `${t('forms.dailyLog.notesSafetyPrefix')} ${data.safetyNotes}` : '',
            data.delayDescription ? `${t('forms.dailyLog.notesDelayPrefix')} ${data.delayDescription}` : '',
          ]
            .filter(Boolean)
            .join('\n\n') || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-log', id] });
      toast.success(t('forms.dailyLog.updateSuccess'));
      navigate('/daily-log');
    },
    onError: () => {
      toast.error(t('forms.dailyLog.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleCopyYesterday = useCallback(async () => {
    const projectId = getValues('projectId');
    if (!projectId) {
      toast.error(t('forms.dailyLog.validation.projectRequired'));
      return;
    }

    setIsCopyingYesterday(true);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayLog = await dailyLogApi.getDailyLogByDate(yesterdayStr, projectId);

      if (!yesterdayLog) {
        toast.error(t('dailyLog.copyYesterdayEmpty'));
        return;
      }

      if (yesterdayLog.weather?.condition) {
        setValue('weatherCondition', yesterdayLog.weather.condition);
      }
      if (yesterdayLog.weather?.temperature != null) {
        setValue('temperature', String(yesterdayLog.weather.temperature));
      }
      if (yesterdayLog.weather?.windSpeed != null) {
        setValue('windSpeed', String(yesterdayLog.weather.windSpeed));
      }

      const workEntries = yesterdayLog.entries
        ?.filter((e) => e.type === 'WORK')
        .map((e) => e.description)
        .join('\n');
      if (workEntries) {
        setValue('workDescription', workEntries);
      }

      const crewCount = yesterdayLog.entries?.[0]?.workerCount;
      if (crewCount) {
        setValue('crewCount', String(crewCount));
      }

      if (yesterdayLog.notes) {
        setValue('safetyNotes', yesterdayLog.notes);
      }

      toast.success(t('dailyLog.copyYesterdaySuccess'));
    } catch {
      toast.error(t('dailyLog.copyYesterdayEmpty'));
    } finally {
      setIsCopyingYesterday(false);
    }
  }, [getValues, setValue]);

  const onSubmit = (data: DailyLogFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.dailyLog.editTitle') : t('forms.dailyLog.createTitle')}
        subtitle={
          isEdit
            ? t('forms.dailyLog.editSubtitle', { date: existingLog?.date ?? '' })
            : t('forms.dailyLog.createSubtitle')
        }
        backTo="/daily-log"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.dailyLog.breadcrumbDailyLog'), href: '/daily-log' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
        actions={
          !isEdit ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isCopyingYesterday}
              iconLeft={<Copy className="h-4 w-4" />}
              onClick={handleCopyYesterday}
            >
              {t('dailyLog.copyYesterday')}
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Section: Date & Project */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.dailyLog.sectionDateProject')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.dailyLog.labelDate')} error={errors.date?.message} required>
              <Input type="date" hasError={!!errors.date} {...register('date')} />
            </FormField>
            <FormField label={t('forms.dailyLog.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.dailyLog.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
          </div>
        </section>

        {/* Section: Weather */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.dailyLog.sectionWeather')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField
              label={t('forms.dailyLog.labelWeatherCondition')}
              error={errors.weatherCondition?.message}
              required
            >
              <Select
                options={weatherOptions}
                placeholder={t('forms.dailyLog.placeholderWeather')}
                hasError={!!errors.weatherCondition}
                {...register('weatherCondition')}
              />
            </FormField>
            <FormField label={t('forms.dailyLog.labelTemperature')} error={errors.temperature?.message} required>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="-5"
                hasError={!!errors.temperature}
                {...register('temperature')}
              />
            </FormField>
            <FormField label={t('forms.dailyLog.labelWindSpeed')} error={errors.windSpeed?.message}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="3"
                hasError={!!errors.windSpeed}
                {...register('windSpeed')}
              />
            </FormField>
          </div>
        </section>

        {/* Section: Work details */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.dailyLog.sectionWork')}
          </h2>
          <div className="grid grid-cols-1 gap-5">
            <FormField
              label={t('forms.dailyLog.labelWorkDescription')}
              error={errors.workDescription?.message}
              required
            >
              <Textarea
                placeholder={t('forms.dailyLog.placeholderWorkDescription')}
                rows={5}
                hasError={!!errors.workDescription}
                {...register('workDescription')}
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label={t('forms.dailyLog.labelCrewCount')} error={errors.crewCount?.message}>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="25"
                  hasError={!!errors.crewCount}
                  {...register('crewCount')}
                />
              </FormField>
              <FormField label={t('forms.dailyLog.labelHoursWorked')} error={errors.hoursWorked?.message}>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="8"
                  hasError={!!errors.hoursWorked}
                  {...register('hoursWorked')}
                />
              </FormField>
            </div>
          </div>
        </section>

        {/* Section: Safety & Delays */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.dailyLog.sectionSafety')}
          </h2>
          <div className="grid grid-cols-1 gap-5">
            <FormField label={t('forms.dailyLog.labelSafetyNotes')} error={errors.safetyNotes?.message}>
              <Textarea
                placeholder={t('forms.dailyLog.placeholderSafetyNotes')}
                rows={3}
                hasError={!!errors.safetyNotes}
                {...register('safetyNotes')}
              />
            </FormField>
            <FormField label={t('forms.dailyLog.labelDelayDescription')} error={errors.delayDescription?.message}>
              <Textarea
                placeholder={t('forms.dailyLog.placeholderDelayNotes')}
                rows={3}
                hasError={!!errors.delayDescription}
                {...register('delayDescription')}
              />
            </FormField>
          </div>
        </section>

        {/* Photo attachments (only available in edit mode, after entity exists) */}
        {isEdit && id && (
          <div className="mb-8">
            <PhotoAttachments entityType="DAILY_LOG" entityId={id} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.dailyLog.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/daily-log')}>
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DailyLogFormPage;
