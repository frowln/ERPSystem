import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { selfEmployedApi } from './api';
import { t } from '@/i18n';

const schema = z.object({
  workerId: z.string().min(1),
  projectId: z.string().min(1),
  actNumber: z.string().max(50).optional().or(z.literal('')),
  description: z.string().min(1).max(2000),
  amount: z.coerce.number().min(0.01),
  period: z.string().min(1),
});

type FormData = z.input<typeof schema>;

const CompletionActFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedWorkerId = searchParams.get('workerId') ?? '';

  const { data: contractorsData } = useQuery({
    queryKey: ['self-employed-contractors'],
    queryFn: () => selfEmployedApi.getContractors(),
  });

  const contractors = (contractorsData?.content && contractorsData.content.length > 0)
    ? contractorsData.content
    : [];

  const workerOptions = useMemo(
    () => [
      { value: '', label: t('selfEmployed.actForm.selectWorker') },
      ...contractors.map((c) => ({ value: c.id, label: `${c.fullName} (${c.inn})` })),
    ],
    [contractors],
  );

  // Generate current month as default period
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      workerId: preselectedWorkerId,
      projectId: '',
      actNumber: '',
      description: '',
      amount: '' as unknown as number,
      period: defaultPeriod,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => selfEmployedApi.createAct({
      workerId: data.workerId,
      projectId: data.projectId,
      actNumber: data.actNumber || undefined,
      description: data.description,
      amount: Number(data.amount),
      period: data.period,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-acts'] });
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractor', variables.workerId] });
      toast.success(t('selfEmployed.actForm.createSuccess'));
      if (preselectedWorkerId) {
        navigate(`/self-employed/${preselectedWorkerId}`);
      } else {
        navigate('/self-employed');
      }
    },
    onError: () => toast.error(t('selfEmployed.actForm.createError')),
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('selfEmployed.actForm.title')}
        subtitle={t('selfEmployed.actForm.subtitle')}
        backTo={preselectedWorkerId ? `/self-employed/${preselectedWorkerId}` : '/self-employed'}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('selfEmployed.contractors.breadcrumbSelfEmployed'), href: '/self-employed' },
          { label: t('selfEmployed.actForm.breadcrumbAct') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('selfEmployed.actForm.sectionMain')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('selfEmployed.actForm.labelWorker')} error={errors.workerId?.message} required>
              <Select
                options={workerOptions}
                hasError={!!errors.workerId}
                {...register('workerId')}
              />
            </FormField>
            <FormField label={t('selfEmployed.actForm.labelProject')} error={errors.projectId?.message} required>
              <Input placeholder={t('selfEmployed.actForm.placeholderProjectId')} hasError={!!errors.projectId} {...register('projectId')} />
            </FormField>
            <FormField label={t('selfEmployed.actForm.labelActNumber')} error={errors.actNumber?.message}>
              <Input placeholder={t('selfEmployed.actForm.placeholderActNumber')} hasError={!!errors.actNumber} {...register('actNumber')} />
            </FormField>
            <FormField label={t('selfEmployed.actForm.labelPeriod')} error={errors.period?.message} required>
              <Input type="month" hasError={!!errors.period} {...register('period')} />
            </FormField>
            <FormField label={t('selfEmployed.actForm.labelAmount')} error={errors.amount?.message} required>
              <Input type="number" min={0} step="0.01" placeholder="50000" hasError={!!errors.amount} {...register('amount')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('selfEmployed.actForm.sectionDescription')}
          </h2>
          <FormField label={t('selfEmployed.actForm.labelDescription')} error={errors.description?.message} required>
            <Textarea
              placeholder={t('selfEmployed.actForm.placeholderDescription')}
              rows={5}
              hasError={!!errors.description}
              {...register('description')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('selfEmployed.actForm.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(preselectedWorkerId ? `/self-employed/${preselectedWorkerId}` : '/self-employed')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompletionActFormPage;
