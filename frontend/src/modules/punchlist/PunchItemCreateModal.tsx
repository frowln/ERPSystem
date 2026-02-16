import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { punchlistApi } from '@/api/punchlist';

interface PunchItemCreateModalProps {
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
  { value: 'STRUCTURAL', label: 'Конструктивные' },
  { value: 'ARCHITECTURAL', label: 'Архитектурные' },
  { value: 'MECHANICAL', label: 'Механические' },
  { value: 'ELECTRICAL', label: 'Электрика' },
  { value: 'PLUMBING', label: 'Водоснабжение' },
  { value: 'FINISHING', label: 'Отделочные' },
  { value: 'FIRE_SAFETY', label: 'Пожарная безопасность' },
  { value: 'LANDSCAPING', label: 'Благоустройство' },
  { value: 'OTHER', label: 'Прочее' },
];

const punchListOptions = [
  { value: 'pl1', label: 'Замечания по секции А' },
  { value: 'pl2', label: 'Замечания по паркингу' },
  { value: 'pl3', label: 'Замечания по благоустройству' },
];

const assigneeOptions = [
  { value: 'u1', label: 'Иванов А.С.' },
  { value: 'u2', label: 'Петров В.К.' },
  { value: 'u3', label: 'Сидоров М.Н.' },
  { value: 'u4', label: 'Козлов Д.А.' },
];

export const PunchItemCreateModal: React.FC<PunchItemCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [punchListId, setPunchListId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => punchlistApi.createPunchItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punch-items'] });
      queryClient.invalidateQueries({ queryKey: ['punch-lists'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      title, description, punchListId, priority: priority as any, category: category as any,
      location, floor, room, assignedToId: assigneeId, dueDate,
    } as any);
    onClose();
    setTitle('');
    setDescription('');
    setPunchListId('');
    setPriority('MEDIUM');
    setCategory('');
    setLocation('');
    setFloor('');
    setRoom('');
    setAssigneeId('');
    setDueDate('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новое замечание"
      description="Добавьте замечание в перечень (Punch List)"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!title || !description || !category || !location}>
            Создать замечание
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Punch List" required>
          <Select
            options={punchListOptions}
            value={punchListId}
            onChange={(e) => setPunchListId(e.target.value)}
            placeholder="Выберите перечень"
          />
        </FormField>

        <FormField label="Название замечания" required>
          <Input
            placeholder="Краткое описание дефекта"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField label="Подробное описание" required>
          <Textarea
            placeholder="Опишите замечание, укажите размеры, характер дефекта..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Категория" required>
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Выберите категорию"
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

        <FormField label="Расположение" required>
          <Input
            placeholder="Секция, этаж, помещение"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Этаж">
            <Input
              placeholder="Номер этажа"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </FormField>
          <FormField label="Помещение / Квартира">
            <Input
              placeholder="Номер помещения"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Исполнитель">
            <Select
              options={assigneeOptions}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder="Выберите исполнителя"
            />
          </FormField>
          <FormField label="Срок устранения">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
};
