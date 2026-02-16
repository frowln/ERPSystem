import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { submittalsApi } from '@/api/submittals';
import { t } from '@/i18n';
import type { CreateSubmittalRequest } from './types';
import toast from 'react-hot-toast';

interface SubmittalCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getTypeOptions = () => [
  { value: 'SHOP_DRAWING', label: t('submittals.modalTypeShopDrawing') },
  { value: 'PRODUCT_DATA', label: t('submittals.modalTypeProductData') },
  { value: 'SAMPLE', label: t('submittals.modalTypeSample') },
  { value: 'DESIGN_DATA', label: t('submittals.modalTypeDesignData') },
  { value: 'TEST_REPORT', label: t('submittals.modalTypeTestReport') },
  { value: 'CERTIFICATE', label: t('submittals.modalTypeCertificate') },
  { value: 'OTHER', label: t('submittals.modalTypeOther') },
];

// Mock data -- will be replaced by API data
const reviewerOptions = [
  { value: 'u1', label: 'Иванов А.С.' },
  { value: 'u2', label: 'Петров В.К.' },
  { value: 'u3', label: 'Сидоров М.Н.' },
];

// Mock data -- will be replaced by API data
const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

export const SubmittalCreateModal: React.FC<SubmittalCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('SHOP_DRAWING');
  const [specSection, setSpecSection] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [projectId, setProjectId] = useState('1');

  const createMutation = useMutation({
    mutationFn: (payload: CreateSubmittalRequest) => submittalsApi.createSubmittal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
      toast.success(t('submittals.modalCreateSuccess'));
      setTitle('');
      setDescription('');
      setType('SHOP_DRAWING');
      setSpecSection('');
      setDueDate('');
      setRequiredDate('');
      setReviewerId('');
      setProjectId('1');
      onClose();
    },
    onError: () => {
      toast.error(t('submittals.modalCreateError'));
    },
  });

  const handleSubmit = () => {
    const payload: CreateSubmittalRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      type: type as CreateSubmittalRequest['type'],
      specSection: specSection.trim() || undefined,
      dueDate: dueDate || undefined,
      requiredDate: requiredDate || undefined,
      reviewerId: reviewerId || undefined,
      projectId,
    };
    createMutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('submittals.modalTitle')}
      description={t('submittals.modalDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('submittals.modalCancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!title} loading={createMutation.isPending}>
            {t('submittals.modalCreate')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={t('submittals.modalLabelTitle')} required>
          <Input
            placeholder={t('submittals.modalPlaceholderTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField label={t('submittals.modalLabelDescription')}>
          <Textarea
            placeholder={t('submittals.modalPlaceholderDescription')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('submittals.modalLabelProject')} required>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </FormField>

          <FormField label={t('submittals.modalLabelType')} required>
            <Select
              options={getTypeOptions()}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </FormField>

          <FormField label={t('submittals.modalLabelSpecSection')}>
            <Input
              placeholder={t('submittals.modalPlaceholderSpecSection')}
              value={specSection}
              onChange={(e) => setSpecSection(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('submittals.modalLabelDueDate')}>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>

          <FormField label={t('submittals.modalLabelRequiredDate')}>
            <Input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
          </FormField>
        </div>

        <FormField label={t('submittals.modalLabelReviewer')}>
          <Select
            options={reviewerOptions}
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
            placeholder={t('submittals.modalPlaceholderReviewer')}
          />
        </FormField>
      </div>
    </Modal>
  );
};
