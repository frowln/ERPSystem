import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { submittalsApi } from '@/api/submittals';
import type { CreateSubmittalRequest } from './types';
import toast from 'react-hot-toast';

interface SubmittalCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const typeOptions = [
  { value: 'SHOP_DRAWING', label: 'Рабочий чертёж' },
  { value: 'PRODUCT_DATA', label: 'Данные продукта' },
  { value: 'SAMPLE', label: 'Образец' },
  { value: 'DESIGN_DATA', label: 'Проектные данные' },
  { value: 'TEST_REPORT', label: 'Протокол испытаний' },
  { value: 'CERTIFICATE', label: 'Сертификат' },
  { value: 'OTHER', label: 'Прочее' },
];

const reviewerOptions = [
  { value: 'u1', label: 'Иванов А.С.' },
  { value: 'u2', label: 'Петров В.К.' },
  { value: 'u3', label: 'Сидоров М.Н.' },
];

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
      toast.success('Субмиттал создан');
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
      toast.error('Не удалось создать субмиттал');
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
      title="Новый субмиттел"
      description="Заполните информацию для создания нового субмиттела"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!title} loading={createMutation.isPending}>
            Создать
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Название" required>
          <Input
            placeholder="Название субмиттела"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField label="Описание">
          <Textarea
            placeholder="Описание..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Проект" required>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </FormField>

          <FormField label="Тип" required>
            <Select
              options={typeOptions}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </FormField>

          <FormField label="Раздел спецификации">
            <Input
              placeholder="Напр. Раздел КР"
              value={specSection}
              onChange={(e) => setSpecSection(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Срок рассмотрения">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>

          <FormField label="Требуемая дата">
            <Input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Рецензент">
          <Select
            options={reviewerOptions}
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
            placeholder="Выберите рецензента"
          />
        </FormField>
      </div>
    </Modal>
  );
};
