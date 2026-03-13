import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { useEmployeeOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';
import type { DefectOnPlanSeverity } from '@/modules/quality/types';

const getSchema = () =>
  z.object({
    title: z.string().min(1, t('quality.planView.validationTitle')),
    description: z.string().max(2000).optional(),
    severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL'] as const),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
  });

type FormData = z.input<ReturnType<typeof getSchema>>;

interface DefectPinCreateModalProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  coords: { x: number; y: number };
}

const getSeverityOptions = (): { value: string; label: string }[] => [
  { value: 'MINOR', label: t('quality.planView.severityMinor') },
  { value: 'MAJOR', label: t('quality.planView.severityMajor') },
  { value: 'CRITICAL', label: t('quality.planView.severityCritical') },
];

export const DefectPinCreateModal: React.FC<DefectPinCreateModalProps> = ({
  open,
  onClose,
  planId,
  coords,
}) => {
  const queryClient = useQueryClient();
  const { options: employeeOptions } = useEmployeeOptions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      title: '',
      description: '',
      severity: 'MAJOR' as DefectOnPlanSeverity,
      assigneeId: '',
      dueDate: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      qualityApi.createDefectOnPlan(planId, {
        title: data.title,
        description: data.description || undefined,
        severity: data.severity as DefectOnPlanSeverity,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate || undefined,
        x: coords.x,
        y: coords.y,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-defects', planId] });
      toast.success(t('quality.planView.toastDefectCreated'));
      handleClose();
    },
    onError: () => {
      toast.error(t('quality.planView.toastDefectCreateError'));
    },
  });

  const onSubmit = (data: FormData) => {
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
      title={t('quality.planView.addDefect')}
      description={`${t('quality.planView.coordsLabel')}: (${coords.x.toFixed(1)}%, ${coords.y.toFixed(1)}%)`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('quality.planView.btnCancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
            {t('quality.planView.btnCreateDefect')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label={t('quality.planView.fieldTitle')}
          error={errors.title?.message}
          required
        >
          <Input
            placeholder={t('quality.planView.fieldTitlePlaceholder')}
            hasError={!!errors.title}
            {...register('title')}
          />
        </FormField>

        <FormField
          label={t('quality.planView.fieldDescription')}
          error={errors.description?.message}
        >
          <Textarea
            placeholder={t('quality.planView.fieldDescriptionPlaceholder')}
            rows={3}
            hasError={!!errors.description}
            {...register('description')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={t('quality.planView.fieldSeverity')}
            error={errors.severity?.message}
            required
          >
            <Select
              options={getSeverityOptions()}
              hasError={!!errors.severity}
              {...register('severity')}
            />
          </FormField>

          <FormField label={t('quality.planView.fieldAssignee')}>
            <Select
              options={[
                { value: '', label: t('quality.planView.fieldAssigneePlaceholder') },
                ...employeeOptions,
              ]}
              {...register('assigneeId')}
            />
          </FormField>
        </div>

        <FormField label={t('quality.planView.fieldDueDate')}>
          <Input type="date" {...register('dueDate')} />
        </FormField>
      </div>
    </Modal>
  );
};

export default DefectPinCreateModal;
