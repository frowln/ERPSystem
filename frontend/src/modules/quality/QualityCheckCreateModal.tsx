import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { t } from '@/i18n';

const getQualityCheckSchema = () => z.object({
  projectId: z.string().min(1, t('quality.checkCreate.validationSelectProject')),
  type: z.enum(['INCOMING', 'IN_PROCESS', 'FINAL', 'AUDIT'], {
    required_error: t('quality.checkCreate.validationSelectType'),
  }),
  inspectorName: z.string().min(1, t('quality.checkCreate.validationSpecifyInspector')),
  scheduledDate: z.string().min(1, t('quality.checkCreate.validationSpecifyDate')),
  area: z.string().min(1, t('quality.checkCreate.validationSpecifyArea')).max(200, t('quality.checkCreate.validationMaxChars200')),
  description: z.string().max(2000, t('quality.checkCreate.validationMaxChars2000')).optional(),
});

type QualityCheckFormData = z.input<ReturnType<typeof getQualityCheckSchema>>;

interface QualityCheckCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getProjectOptions = () => [
  { value: '1', label: t('mockData.projectSolnechny') },
  { value: '2', label: t('mockData.projectHorizon') },
  { value: '3', label: t('mockData.projectBridge') },
  { value: '6', label: t('mockData.projectCentral') },
];

const getTypeOptions = () => [
  { value: 'INCOMING', label: t('quality.checkCreate.typeIncoming') },
  { value: 'IN_PROCESS', label: t('quality.checkCreate.typeHiddenWorks') },
  { value: 'final', label: t('quality.checkCreate.typeLaboratory') },
  { value: 'AUDIT', label: t('quality.checkCreate.typeAudit') },
];

const getInspectorOptions = () => [
  { value: t('mockData.personIvanovAS'), label: t('mockData.personIvanovAS') },
  { value: t('mockData.personPetrovVK'), label: t('mockData.personPetrovVK') },
  { value: t('mockData.personSidorovMN'), label: t('mockData.personSidorovMN') },
  { value: t('mockData.personKozlovDA'), label: t('mockData.personKozlovDA') },
  { value: t('mockData.personNovikovaEI'), label: t('mockData.personNovikovaEI') },
];

export const QualityCheckCreateModal: React.FC<QualityCheckCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QualityCheckFormData>({
    resolver: zodResolver(getQualityCheckSchema()),
    defaultValues: {
      projectId: '',
      type: '' as any,
      inspectorName: '',
      scheduledDate: '',
      area: '',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: QualityCheckFormData) => {
      return qualityApi.createCheck({
        projectId: data.projectId,
        type: data.type,
        inspectorName: data.inspectorName,
        scheduledDate: data.scheduledDate,
        name: `${t('quality.checkCreate.checkNamePrefix')}: ${data.area}`,
        description: data.description || '',
        status: 'PLANNED',
        result: 'PENDING',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast.success(t('quality.checkCreate.toastCreated'));
      reset();
      onClose();
    },
    onError: () => {
      toast.error(t('quality.checkCreate.toastCreateError'));
    },
  });

  const onSubmit = (data: QualityCheckFormData) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const typeOptions = getTypeOptions();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('quality.checkCreate.modalTitle')}
      description={t('quality.checkCreate.modalDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('quality.checkCreate.btnCancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
            {t('quality.checkCreate.btnCreate')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('quality.checkCreate.labelProject')} error={errors.projectId?.message} required>
            <Select
              options={getProjectOptions()}
              placeholder={t('quality.checkCreate.placeholderProject')}
              hasError={!!errors.projectId}
              {...register('projectId')}
            />
          </FormField>
          <FormField label={t('quality.checkCreate.labelCheckType')} error={errors.type?.message} required>
            <Select
              options={typeOptions}
              placeholder={t('quality.checkCreate.placeholderType')}
              hasError={!!errors.type}
              {...register('type')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('quality.checkCreate.labelInspector')} error={errors.inspectorName?.message} required>
            <Select
              options={getInspectorOptions()}
              placeholder={t('quality.checkCreate.placeholderInspector')}
              hasError={!!errors.inspectorName}
              {...register('inspectorName')}
            />
          </FormField>
          <FormField label={t('quality.checkCreate.labelCheckDate')} error={errors.scheduledDate?.message} required>
            <Input type="date" hasError={!!errors.scheduledDate} {...register('scheduledDate')} />
          </FormField>
        </div>

        <FormField label={t('quality.checkCreate.labelArea')} error={errors.area?.message} required>
          <Input
            placeholder={t('quality.checkCreate.placeholderArea')}
            hasError={!!errors.area}
            {...register('area')}
          />
        </FormField>

        <FormField label={t('quality.checkCreate.labelDescription')} error={errors.description?.message}>
          <Textarea
            placeholder={t('quality.checkCreate.placeholderDescription')}
            rows={4}
            hasError={!!errors.description}
            {...register('description')}
          />
        </FormField>
      </div>
    </Modal>
  );
};
