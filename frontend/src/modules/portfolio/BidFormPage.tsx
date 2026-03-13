import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select, Checkbox } from '@/design-system/components/FormField';
import { portfolioApi } from '@/api/portfolio';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { BidPackage, Opportunity } from './types';
import type { PaginatedResponse } from '@/types';

const bidSchema = z.object({
  projectName: z.string().min(1, t('forms.bid.validation.projectNameRequired')).max(500, t('forms.common.maxChars', { count: '500' })),
  bidNumber: z.string().max(100, t('forms.common.maxChars', { count: '100' })).optional().or(z.literal('')),
  clientOrganization: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional().or(z.literal('')),
  opportunityId: z.string().optional().or(z.literal('')),
  bidAmount: z.string().optional().or(z.literal('')),
  estimatedCost: z.string().optional().or(z.literal('')),
  bondRequired: z.boolean().optional(),
  bondAmount: z.string().optional().or(z.literal('')),
  submissionDeadline: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional().or(z.literal('')),
  competitorInfo: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional().or(z.literal('')),
  bidManagerId: z.string().optional().or(z.literal('')),
  technicalLeadId: z.string().optional().or(z.literal('')),
});

type BidFormData = z.infer<typeof bidSchema>;

const BidFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingBid } = useQuery<BidPackage>({
    queryKey: ['bidPackage', id],
    queryFn: () => portfolioApi.getBidPackage(id!),
    enabled: isEdit,
  });

  const { data: opportunitiesPage } = useQuery<PaginatedResponse<Opportunity>>({
    queryKey: ['opportunities'],
    queryFn: () => portfolioApi.getOpportunities(),
  });

  const opportunities = opportunitiesPage?.content ?? [];

  const opportunityOptions = opportunities.map((o) => ({
    value: o.id,
    label: o.name,
  }));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    values: existingBid
      ? {
          projectName: existingBid.projectName ?? '',
          bidNumber: existingBid.bidNumber ?? '',
          clientOrganization: existingBid.clientOrganization ?? '',
          opportunityId: existingBid.opportunityId ?? '',
          bidAmount: existingBid.bidAmount?.toString() ?? '',
          estimatedCost: existingBid.estimatedCost?.toString() ?? '',
          bondRequired: existingBid.bondRequired ?? false,
          bondAmount: existingBid.bondAmount?.toString() ?? '',
          submissionDeadline: existingBid.submissionDeadline
            ? existingBid.submissionDeadline.slice(0, 16)
            : '',
          notes: existingBid.notes ?? '',
          competitorInfo: Array.isArray(existingBid.competitorInfo) ? JSON.stringify(existingBid.competitorInfo) : (existingBid.competitorInfo as string ?? ''),
          bidManagerId: existingBid.bidManagerId ?? '',
          technicalLeadId: existingBid.technicalLeadId ?? '',
        }
      : undefined,
  });

  const bidAmountWatch = useWatch({ control, name: 'bidAmount' });
  const estimatedCostWatch = useWatch({ control, name: 'estimatedCost' });
  const bondRequiredWatch = useWatch({ control, name: 'bondRequired' });
  const bondAmountWatch = useWatch({ control, name: 'bondAmount' });

  const bidAmountNum = bidAmountWatch ? Number(bidAmountWatch) : 0;
  const estimatedCostNum = estimatedCostWatch ? Number(estimatedCostWatch) : 0;
  const calculatedMargin =
    bidAmountNum > 0 && estimatedCostNum > 0
      ? ((bidAmountNum - estimatedCostNum) / bidAmountNum) * 100
      : null;

  const createMutation = useMutation({
    mutationFn: (data: BidFormData) => {
      return portfolioApi.createBidPackage({
        projectName: data.projectName,
        bidNumber: data.bidNumber || undefined,
        clientOrganization: data.clientOrganization || undefined,
        opportunityId: data.opportunityId || undefined,
        bidAmount: data.bidAmount ? Number(data.bidAmount) : undefined,
        estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
        estimatedMargin: calculatedMargin ?? undefined,
        bondRequired: data.bondRequired ?? false,
        bondAmount: data.bondAmount ? Number(data.bondAmount) : undefined,
        submissionDeadline: data.submissionDeadline || undefined,
        notes: data.notes || undefined,
        competitorInfo: data.competitorInfo || undefined,
        bidManagerId: data.bidManagerId || undefined,
        technicalLeadId: data.technicalLeadId || undefined,
      } as Partial<BidPackage>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidPackages'] });
      toast.success(t('forms.bid.createSuccess'));
      navigate('/portfolio/tenders');
    },
    onError: () => {
      toast.error(t('forms.bid.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BidFormData) => {
      return portfolioApi.updateBidPackage(id!, {
        projectName: data.projectName,
        bidNumber: data.bidNumber || undefined,
        clientOrganization: data.clientOrganization || undefined,
        opportunityId: data.opportunityId || undefined,
        bidAmount: data.bidAmount ? Number(data.bidAmount) : undefined,
        estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
        estimatedMargin: calculatedMargin ?? undefined,
        bondRequired: data.bondRequired ?? false,
        bondAmount: data.bondAmount ? Number(data.bondAmount) : undefined,
        submissionDeadline: data.submissionDeadline || undefined,
        notes: data.notes || undefined,
        competitorInfo: data.competitorInfo || undefined,
        bidManagerId: data.bidManagerId || undefined,
        technicalLeadId: data.technicalLeadId || undefined,
      } as Partial<BidPackage>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidPackages'] });
      queryClient.invalidateQueries({ queryKey: ['bidPackage', id] });
      toast.success(t('forms.bid.updateSuccess'));
      navigate(`/portfolio/tenders/${id}`);
    },
    onError: () => {
      toast.error(t('forms.bid.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<BidFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.bid.editTitle') : t('forms.bid.createTitle')}
        subtitle={isEdit ? existingBid?.projectName : t('forms.bid.createSubtitle')}
        backTo={isEdit ? `/portfolio/tenders/${id}` : '/portfolio/tenders'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.bid.breadcrumbPortfolio'), href: '/portfolio/tenders' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Basic Info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.common.basicInfo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.bid.labelProjectName')}
              error={errors.projectName?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                placeholder={t('forms.bid.placeholderProjectName')}
                hasError={!!errors.projectName}
                {...register('projectName')}
              />
            </FormField>
            <FormField label={t('forms.bid.labelBidNumber')} error={errors.bidNumber?.message}>
              <Input
                placeholder={t('forms.bid.placeholderBidNumber')}
                hasError={!!errors.bidNumber}
                {...register('bidNumber')}
              />
            </FormField>
            <FormField
              label={t('forms.bid.labelClientOrganization')}
              error={errors.clientOrganization?.message}
            >
              <Input
                placeholder={t('forms.bid.placeholderClientOrganization')}
                hasError={!!errors.clientOrganization}
                {...register('clientOrganization')}
              />
            </FormField>
            <FormField
              label={t('forms.bid.labelOpportunity')}
              error={errors.opportunityId?.message}
              className="sm:col-span-2"
            >
              <Select
                options={opportunityOptions}
                placeholder={t('forms.bid.placeholderOpportunity')}
                hasError={!!errors.opportunityId}
                {...register('opportunityId')}
              />
            </FormField>
          </div>
        </section>

        {/* Financial */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.bid.sectionFinancial')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.bid.labelBidAmount')} error={errors.bidAmount?.message}>
              <Input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                hasError={!!errors.bidAmount}
                {...register('bidAmount')}
              />
              {bidAmountNum > 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {formatMoney(bidAmountNum)}
                </p>
              )}
            </FormField>
            <FormField
              label={t('forms.bid.labelEstimatedCost')}
              error={errors.estimatedCost?.message}
            >
              <Input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                hasError={!!errors.estimatedCost}
                {...register('estimatedCost')}
              />
              {estimatedCostNum > 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {formatMoney(estimatedCostNum)}
                </p>
              )}
            </FormField>
            <FormField label={t('forms.bid.labelEstimatedMargin')} className="sm:col-span-2">
              <div className="h-9 px-3 flex items-center text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300">
                {calculatedMargin !== null ? (
                  <span className={calculatedMargin >= 0 ? 'text-success-600' : 'text-danger-600'}>
                    {calculatedMargin.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-neutral-400 dark:text-neutral-500">
                    {t('forms.bid.marginAutoCalc')}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {t('forms.bid.marginHint')}
              </p>
            </FormField>
            <div className="sm:col-span-2">
              <Checkbox
                label={t('forms.bid.labelBondRequired')}
                {...register('bondRequired')}
              />
            </div>
            {bondRequiredWatch && (
              <FormField label={t('forms.bid.labelBondAmount')} error={errors.bondAmount?.message}>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  hasError={!!errors.bondAmount}
                  {...register('bondAmount')}
                />
                {bondAmountWatch && Number(bondAmountWatch) > 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {formatMoney(Number(bondAmountWatch))}
                  </p>
                )}
              </FormField>
            )}
          </div>
        </section>

        {/* Deadline */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.bid.sectionDeadline')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.bid.labelSubmissionDeadline')}
              error={errors.submissionDeadline?.message}
            >
              <Input
                type="datetime-local"
                hasError={!!errors.submissionDeadline}
                {...register('submissionDeadline')}
              />
            </FormField>
          </div>
        </section>

        {/* Details */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.bid.sectionDetails')}
          </h2>
          <div className="mt-0">
            <FormField label={t('forms.bid.labelNotes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.bid.placeholderNotes')}
                rows={4}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField
              label={t('forms.bid.labelCompetitorInfo')}
              error={errors.competitorInfo?.message}
            >
              <Textarea
                placeholder={t('forms.bid.placeholderCompetitorInfo')}
                rows={3}
                hasError={!!errors.competitorInfo}
                {...register('competitorInfo')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.bid.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              navigate(isEdit ? `/portfolio/tenders/${id}` : '/portfolio/tenders')
            }
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BidFormPage;
