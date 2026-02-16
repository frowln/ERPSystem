import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { rfiApi } from '@/api/rfi';
import type { CreateRfiRequest } from './types';
import toast from 'react-hot-toast';

interface RfiCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const priorityOptions = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'CRITICAL', label: 'Критический' },
];

const assigneeOptions = [
  { value: 'u1', label: 'Иванов А.С.' },
  { value: 'u2', label: 'Петров В.К.' },
  { value: 'u3', label: 'Сидоров М.Н.' },
  { value: 'u4', label: 'Козлов Д.А.' },
];

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

export const RfiCreateModal: React.FC<RfiCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [specSection, setSpecSection] = useState('');
  const [projectId, setProjectId] = useState('1');

  const createMutation = useMutation({
    mutationFn: (payload: CreateRfiRequest) => rfiApi.createRfi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfis'] });
      toast.success('RFI создан');
      setSubject('');
      setQuestion('');
      setPriority('MEDIUM');
      setAssigneeId('');
      setDueDate('');
      setSpecSection('');
      setProjectId('1');
      onClose();
    },
    onError: () => {
      toast.error('Не удалось создать RFI');
    },
  });

  const handleSubmit = () => {
    const payload: CreateRfiRequest = {
      subject: subject.trim(),
      question: question.trim(),
      priority: priority as CreateRfiRequest['priority'],
      assignedToId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      specSection: specSection.trim() || undefined,
      distributionList: [],
      projectId,
    };
    createMutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новый запрос информации (RFI)"
      description="Заполните информацию для создания нового RFI"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!subject || !question} loading={createMutation.isPending}>
            Создать RFI
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Тема" required>
          <Input
            placeholder="Краткое описание запроса"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormField>

        <FormField label="Вопрос" required>
          <Textarea
            placeholder="Подробно опишите ваш вопрос..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
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

          <FormField label="Приоритет" required>
            <Select
              options={priorityOptions}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </FormField>

          <FormField label="Ответственный">
            <Select
              options={assigneeOptions}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder="Выберите ответственного"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Срок ответа">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
      </div>
    </Modal>
  );
};
