import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';

const budgetSchema = z.object({
  projectId: z.string().min(1, t('forms.budget.validation.projectRequired')),
  name: z.string().min(1, t('forms.budget.validation.nameRequired')).max(200, t('forms.common.maxChars', { count: '200' })),
  period: z.string().min(1, t('forms.budget.validation.periodRequired')),
  costCode: z.string().max(50, t('forms.common.maxChars', { count: '50' })).optional(),
  originalAmount: z
    .string()
    .min(1, t('forms.budget.validation.amountRequired'))
    .transform((val) => Number(val.replace(/\s/g, '')))
    .refine((val) => val > 0, t('forms.budget.validation.amountPositive')),
  revisedAmount: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val.replace(/\s/g, '')) : undefined)),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type BudgetFormData = z.input<typeof budgetSchema>;

const periodOptions = [
  { value: '2025-Q1', label: t('forms.budget.periods.q1_2025') },
  { value: '2025-Q2', label: t('forms.budget.periods.q2_2025') },
  { value: '2025-Q3', label: t('forms.budget.periods.q3_2025') },
  { value: '2025-Q4', label: t('forms.budget.periods.q4_2025') },
  { value: '2026-Q1', label: t('forms.budget.periods.q1_2026') },
  { value: '2026-Q2', label: t('forms.budget.periods.q2_2026') },
  { value: '2026-annual', label: t('forms.budget.periods.annual_2026') },
];

const BudgetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ['projects-for-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 } as any),
  });

  const projectOptions = useMemo(() => {
    const projects = projectsData?.content ?? [];
    return projects.map((p) => ({
      value: p.id,
      label: `${p.code} - ${p.name}`,
    }));
  }, [projectsData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      projectId: '',
      name: '',
      period: '',
      costCode: '',
      originalAmount: '',
      revisedAmount: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BudgetFormData) => {
      const parsed = budgetSchema.parse(data);
      return financeApi.createBudget({
        name: parsed.name,
        projectId: parsed.projectId,
        plannedCost: parsed.originalAmount as number,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success(t('forms.budget.createSuccess'));
      navigate('/budgets');
    },
    onError: () => {
      toast.error(t('forms.budget.createError'));
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('forms.budget.createTitle')}
        subtitle={t('forms.budget.createSubtitle')}
        backTo="/budgets"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.budget.breadcrumbBudgets'), href: '/budgets' },
          { label: t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.budget.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.budget.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.budget.labelPeriod')} error={errors.period?.message} required>
              <Select
                options={periodOptions}
                placeholder={t('forms.budget.placeholderPeriod')}
                hasError={!!errors.period}
                {...register('period')}
              />
            </FormField>
            <FormField label={t('forms.budget.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.budget.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label={t('forms.budget.labelCostCode')} error={errors.costCode?.message}>
              <Input placeholder="01.02.03" hasError={!!errors.costCode} {...register('costCode')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.budget.sectionAmounts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.budget.labelOriginalAmount')} error={errors.originalAmount?.message} required>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="5000000"
                hasError={!!errors.originalAmount}
                {...register('originalAmount')}
              />
            </FormField>
            <FormField label={t('forms.budget.labelRevisedAmount')} error={errors.revisedAmount?.message}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="5500000"
                hasError={!!errors.revisedAmount}
                {...register('revisedAmount')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.budget.sectionAdditional')}</h2>
          <FormField label={t('common.notes')} error={errors.notes?.message}>
            <Textarea
              placeholder={t('forms.budget.placeholderNotes')}
              rows={4}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('forms.budget.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/budgets')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BudgetFormPage;
