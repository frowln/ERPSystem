import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { costManagementApi } from '@/api/costManagement';
import { t } from '@/i18n';

const getCommitmentSchema = () => z.object({
  title: z.string().min(1, t('costManagement.commitmentCreate.validationTitle')).max(300, t('costManagement.commitmentCreate.validationMaxChars')),
  type: z.enum([ 'SUBCONTRACT', 'PURCHASE_ORDER', 'SERVICE_AGREEMENT', 'RENTAL'], {
    required_error: t('costManagement.commitmentCreate.validationType'),
  }),
  vendorName: z.string().min(1, t('costManagement.commitmentCreate.validationVendor')),
  contractId: z.string().optional(),
  amount: z
    .string()
    .min(1, t('costManagement.commitmentCreate.validationAmount'))
    .transform((val) => Number(val.replace(/\s/g, '')))
    .refine((val) => val > 0, t('costManagement.commitmentCreate.validationAmountPositive')),
  startDate: z.string().min(1, t('costManagement.commitmentCreate.validationStartDate')),
  endDate: z.string().min(1, t('costManagement.commitmentCreate.validationEndDate')),
  retentionPercent: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 0)),
});

type CommitmentFormData = z.input<ReturnType<typeof getCommitmentSchema>>;

interface CommitmentCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getTypeOptions = () => [
  { value: 'SUBCONTRACT', label: t('costManagement.commitmentCreate.typeSubcontract') },
  { value: 'PURCHASE_ORDER', label: t('costManagement.commitmentCreate.typePurchaseOrder') },
  { value: 'SERVICE_AGREEMENT', label: t('costManagement.commitmentCreate.typeServiceAgreement') },
  { value: 'RENTAL', label: t('costManagement.commitmentCreate.typeRental') },
];

const vendorOptions = [
  { value: 'ООО "СтройМонтаж"', label: 'ООО "СтройМонтаж"' },
  { value: 'АО "ЭлектроСтрой"', label: 'АО "ЭлектроСтрой"' },
  { value: 'ООО "БетонСервис"', label: 'ООО "БетонСервис"' },
  { value: 'ООО "ПроектГрупп"', label: 'ООО "ПроектГрупп"' },
  { value: 'АО "ДорСтрой"', label: 'АО "ДорСтрой"' },
  { value: 'ПАО "МеталлТрейд"', label: 'ПАО "МеталлТрейд"' },
];

const getContractOptions = () => [
  { value: '', label: t('costManagement.commitmentCreate.noContract') },
  { value: 'c1', label: 'ДГ-2025-001' },
  { value: 'c2', label: 'ДГ-2025-002' },
  { value: 'c3', label: 'ДГ-2025-003' },
  { value: 'c4', label: 'ДГ-2025-004' },
];

export const CommitmentCreateModal: React.FC<CommitmentCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommitmentFormData>({
    resolver: zodResolver(getCommitmentSchema()),
    defaultValues: {
      title: '',
      type: '' as any,
      vendorName: '',
      contractId: '',
      amount: '',
      startDate: '',
      endDate: '',
      retentionPercent: '5',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CommitmentFormData) => {
      const parsed = getCommitmentSchema().parse(data);
      return costManagementApi.createCommitment({
        title: parsed.title,
        type: parsed.type,
        vendorName: parsed.vendorName,
        originalAmount: parsed.amount as number,
        revisedAmount: parsed.amount as number,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        status: 'DRAFT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      toast.success(t('costManagement.commitmentCreate.createSuccess'));
      reset();
      onClose();
    },
    onError: () => {
      toast.error(t('costManagement.commitmentCreate.createError'));
    },
  });

  const onSubmit = (data: CommitmentFormData) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('costManagement.commitmentCreate.modalTitle')}
      description={t('costManagement.commitmentCreate.modalDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('costManagement.commitmentCreate.cancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
            {t('costManagement.commitmentCreate.createButton')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={t('costManagement.commitmentCreate.labelTitle')} error={errors.title?.message} required>
          <Input placeholder={t('costManagement.commitmentCreate.placeholderTitle')} hasError={!!errors.title} {...register('title')} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('costManagement.commitmentCreate.labelType')} error={errors.type?.message} required>
            <Select
              options={getTypeOptions()}
              placeholder={t('costManagement.commitmentCreate.placeholderType')}
              hasError={!!errors.type}
              {...register('type')}
            />
          </FormField>
          <FormField label={t('costManagement.commitmentCreate.labelVendor')} error={errors.vendorName?.message} required>
            <Select
              options={vendorOptions}
              placeholder={t('costManagement.commitmentCreate.placeholderVendor')}
              hasError={!!errors.vendorName}
              {...register('vendorName')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('costManagement.commitmentCreate.labelContract')} error={errors.contractId?.message}>
            <Select
              options={getContractOptions()}
              placeholder={t('costManagement.commitmentCreate.placeholderContract')}
              hasError={!!errors.contractId}
              {...register('contractId')}
            />
          </FormField>
          <FormField label={t('costManagement.commitmentCreate.labelAmount')} error={errors.amount?.message} required>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="15000000"
              hasError={!!errors.amount}
              {...register('amount')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label={t('costManagement.commitmentCreate.labelStartDate')} error={errors.startDate?.message} required>
            <Input type="date" hasError={!!errors.startDate} {...register('startDate')} />
          </FormField>
          <FormField label={t('costManagement.commitmentCreate.labelEndDate')} error={errors.endDate?.message} required>
            <Input type="date" hasError={!!errors.endDate} {...register('endDate')} />
          </FormField>
          <FormField label={t('costManagement.commitmentCreate.labelRetention')} error={errors.retentionPercent?.message}>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="5"
              hasError={!!errors.retentionPercent}
              {...register('retentionPercent')}
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
};
