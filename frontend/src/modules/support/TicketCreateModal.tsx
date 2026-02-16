import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { supportApi } from '@/api/support';
import type { CreateTicketRequest } from './types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

interface TicketCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const priorityOptions = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'CRITICAL', label: 'Критический' },
];

const categoryOptions = [
  { value: 'TECHNICAL', label: 'Техническая' },
  { value: 'ACCESS', label: 'Доступ' },
  { value: 'DOCUMENTS', label: 'Документы' },
  { value: 'EQUIPMENT', label: 'Оборудование' },
  { value: 'SAFETY', label: 'Безопасность' },
  { value: 'SCHEDULE', label: 'График' },
  { value: 'OTHER', label: 'Прочее' },
];

const fallbackCategoryOptions = [
  { value: 'TECHNICAL', label: 'Техническая' },
  { value: 'ACCESS', label: 'Доступ' },
  { value: 'DOCUMENTS', label: 'Документы' },
  { value: 'EQUIPMENT', label: 'Оборудование' },
  { value: 'SAFETY', label: 'Безопасность' },
  { value: 'SCHEDULE', label: 'График' },
  { value: 'OTHER', label: 'Прочее' },
];

export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const fallbackReporterName = `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim();
  const reporterName = (currentUser?.fullName ?? fallbackReporterName) || currentUser?.email || 'Текущий пользователь';

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('TECHNICAL');
  const [dueDate, setDueDate] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['support-ticket-categories'],
    queryFn: () => supportApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions = useMemo(
    () => (
      categories && categories.length > 0
        ? categories.map((categoryRow) => ({
          value: categoryRow.code,
          label: categoryRow.name,
        }))
        : fallbackCategoryOptions
    ),
    [categories],
  );

  useEffect(() => {
    if (categoryOptions.length === 0) return;
    const hasCurrentValue = categoryOptions.some((option) => option.value === category);
    if (!hasCurrentValue) {
      setCategory(categoryOptions[0]?.value ?? 'OTHER');
    }
  }, [category, categoryOptions]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateTicketRequest) => supportApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Заявка поддержки создана');
      resetForm();
      onClose();
    },
    onError: () => {
      toast.error('Не удалось создать заявку поддержки');
    },
  });

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setPriority('MEDIUM');
    setCategory('TECHNICAL');
    setDueDate('');
  };

  const handleSubmit = () => {
    const normalizedSubject = subject.trim();
    const normalizedDescription = description.trim();

    if (!normalizedSubject || !normalizedDescription) {
      toast.error('Тема и описание обязательны');
      return;
    }

    const payload: CreateTicketRequest = {
      subject: normalizedSubject,
      description: normalizedDescription,
      priority: priority as CreateTicketRequest['priority'],
      category,
      reporterId: currentUser?.id,
      dueDate: dueDate || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новая заявка поддержки"
      description="Опишите вашу проблему или запрос"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!subject || !description} loading={createMutation.isPending}>
            Создать заявку
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Заявитель">
          <Input
            value={reporterName}
            readOnly
          />
        </FormField>

        <FormField label="Тема заявки" required>
          <Input
            placeholder="Краткое описание проблемы"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormField>

        <FormField label="Описание" required>
          <Textarea
            placeholder="Подробно опишите проблему или запрос..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Категория" required>
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </FormField>

          <FormField label="Приоритет" required>
            <Select
              options={priorityOptions}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Желаемый срок решения">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
};
