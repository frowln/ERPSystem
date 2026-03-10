import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { changeManagementApi } from '@/api/changeManagement';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';

const changeEventSchema = z.object({
  title: z.string().min(1, t('changeManagement.eventCreate.validationTitleRequired')).max(300, t('changeManagement.eventCreate.validationTitleMax')),
  projectId: z.string().min(1, t('changeManagement.eventCreate.validationProjectRequired')),
  source: z.enum([ 'RFI', 'ISSUE', 'DESIGN_CHANGE', 'OWNER_REQUEST', 'FIELD_CONDITION', 'REGULATORY', 'OTHER'], {
    required_error: t('changeManagement.eventCreate.validationSourceRequired'),
  }),
  description: z.string().max(2000, t('changeManagement.eventCreate.validationDescriptionMax')).optional(),
  costImpact: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val.replace(/\s/g, '')) : 0)),
  scheduleImpactDays: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 0)),
});

type ChangeEventFormData = z.input<typeof changeEventSchema>;

interface ChangeEventCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getSourceOptions = () => [
  { value: 'RFI', label: t('changeManagement.eventCreate.sourceRfi') },
  { value: 'ISSUE', label: t('changeManagement.eventCreate.sourceIssue') },
  { value: 'DESIGN_CHANGE', label: t('changeManagement.eventCreate.sourceDesignChange') },
  { value: 'OWNER_REQUEST', label: t('changeManagement.eventCreate.sourceOwnerRequest') },
  { value: 'FIELD_CONDITION', label: t('changeManagement.eventCreate.sourceFieldCondition') },
  { value: 'REGULATORY', label: t('changeManagement.eventCreate.sourceRegulatory') },
  { value: 'OTHER', label: t('changeManagement.eventCreate.sourceOther') },
];

export const ChangeEventCreateModal: React.FC<ChangeEventCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { options: projectOptions } = useProjectOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeEventFormData>({
    resolver: zodResolver(changeEventSchema),
    defaultValues: {
      title: '',
      projectId: '',
      source: '' as any,
      description: '',
      costImpact: '',
      scheduleImpactDays: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ChangeEventFormData) => {
      const parsed = changeEventSchema.parse(data);
      return changeManagementApi.createChangeEvent({
        title: parsed.title,
        projectId: parsed.projectId,
        source: parsed.source,
        description: parsed.description,
        costImpact: parsed.costImpact as number,
        scheduleImpactDays: parsed.scheduleImpactDays as number,
        status: 'IDENTIFIED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeEvents'] });
      toast.success(t('changeManagement.eventCreate.toastSuccess'));
      reset();
      onClose();
    },
    onError: () => {
      toast.error(t('changeManagement.eventCreate.toastError'));
    },
  });

  const onSubmit = (data: ChangeEventFormData) => {
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
      title={t('changeManagement.eventCreate.modalTitle')}
      description={t('changeManagement.eventCreate.modalDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('changeManagement.eventCreate.cancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
            {t('changeManagement.eventCreate.createButton')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={t('changeManagement.eventCreate.labelTitle')} error={errors.title?.message} required>
          <Input placeholder={t('changeManagement.eventCreate.placeholderTitle')} hasError={!!errors.title} {...register('title')} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('changeManagement.eventCreate.labelProject')} error={errors.projectId?.message} required>
            <Select
              options={projectOptions}
              placeholder={t('changeManagement.eventCreate.placeholderProject')}
              hasError={!!errors.projectId}
              {...register('projectId')}
            />
          </FormField>
          <FormField label={t('changeManagement.eventCreate.labelSource')} error={errors.source?.message} required>
            <Select
              options={getSourceOptions()}
              placeholder={t('changeManagement.eventCreate.placeholderSource')}
              hasError={!!errors.source}
              {...register('source')}
            />
          </FormField>
        </div>

        <FormField label={t('changeManagement.eventCreate.labelDescription')} error={errors.description?.message}>
          <Textarea
            placeholder={t('changeManagement.eventCreate.placeholderDescription')}
            rows={4}
            hasError={!!errors.description}
            {...register('description')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={t('changeManagement.eventCreate.labelCostImpact')}
            error={errors.costImpact?.message}
            hint={t('changeManagement.eventCreate.hintCostImpact')}
          >
            <Input
              type="text"
              inputMode="numeric"
              placeholder="500000"
              hasError={!!errors.costImpact}
              {...register('costImpact')}
            />
          </FormField>
          <FormField
            label={t('changeManagement.eventCreate.labelScheduleImpact')}
            error={errors.scheduleImpactDays?.message}
            hint={t('changeManagement.eventCreate.hintScheduleImpact')}
          >
            <Input
              type="text"
              inputMode="numeric"
              placeholder="14"
              hasError={!!errors.scheduleImpactDays}
              {...register('scheduleImpactDays')}
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
};
