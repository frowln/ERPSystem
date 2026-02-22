import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';

const schema = z.object({
  budgetId: z.string().min(1, t('commercialProposal.validationBudgetRequired')),
  name: z
    .string()
    .min(1, t('commercialProposal.validationNameRequired'))
    .max(500, t('forms.common.maxChars', { count: '500' })),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type FormData = z.input<typeof schema>;

const CommercialProposalCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedBudgetId = searchParams.get('budgetId') ?? '';

  const { data: budgetsData } = useQuery({
    queryKey: ['budgets', 'for-cp-create'],
    queryFn: () => financeApi.getBudgets({ size: 500 }),
  });

  const budgetOptions = useMemo(() => {
    return (budgetsData?.content ?? []).map((budget) => ({
      value: budget.id,
      label: budget.projectName ? `${budget.projectName} — ${budget.name}` : budget.name,
    }));
  }, [budgetsData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      budgetId: preselectedBudgetId,
      name: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => {
      const parsed = schema.parse(payload);
      return financeApi.createCommercialProposal({
        budgetId: parsed.budgetId,
        name: parsed.name.trim(),
        notes: parsed.notes?.trim() || undefined,
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['COMMERCIAL_PROPOSALS'] });
      toast.success(t('commercialProposal.createSuccess'));
      navigate(`/commercial-proposals/${created.id}`);
    },
    onError: () => {
      toast.error(t('commercialProposal.createError'));
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('commercialProposal.createPageTitle')}
        subtitle={t('commercialProposal.createPageSubtitle')}
        backTo="/commercial-proposals"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('commercialProposal.breadcrumbFinance') },
          { label: t('commercialProposal.listTitle'), href: '/commercial-proposals' },
          { label: t('commercialProposal.create') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.common.basicInfo')}
          </h2>

          <div className="grid grid-cols-1 gap-5">
            <FormField
              label={t('commercialProposal.fieldBudget')}
              error={errors.budgetId?.message}
              required
            >
              <Select
                options={budgetOptions}
                placeholder={t('commercialProposal.fieldBudgetPlaceholder')}
                hasError={!!errors.budgetId}
                {...register('budgetId')}
              />
            </FormField>

            <FormField
              label={t('commercialProposal.fieldName')}
              error={errors.name?.message}
              required
            >
              <Input
                placeholder={t('commercialProposal.fieldNamePlaceholder')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>

            <FormField
              label={t('commercialProposal.fieldNotes')}
              error={errors.notes?.message}
            >
              <Textarea
                rows={4}
                placeholder={t('commercialProposal.fieldNotesPlaceholder')}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('commercialProposal.submitCreate')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/commercial-proposals')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommercialProposalCreatePage;
